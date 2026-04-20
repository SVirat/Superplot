import { getSupabase } from './supabase.js';
import { useState, useEffect, useCallback, useRef } from 'react';

// Active account ID — set by the account switcher
let _activeAccountId = localStorage.getItem('activeAccountId') || null;
export function setActiveAccountId(id) {
  _activeAccountId = id;
  if (id) localStorage.setItem('activeAccountId', id);
  else localStorage.removeItem('activeAccountId');
  // Clear all caches when switching accounts
  _cache.clear();
  _listeners.clear();
}
export function getActiveAccountId() { return _activeAccountId; }

// ── In-memory cache with stale-while-revalidate ──────────────────────
const _cache = new Map();     // key → { data, ts }
const _listeners = new Map(); // key → Set<callback>
const STALE_MS = 30_000;      // consider stale after 30s

function cacheGet(key) { return _cache.get(key)?.data ?? null; }
function cacheSet(key, data) {
  _cache.set(key, { data, ts: Date.now() });
  // notify all subscribers
  const subs = _listeners.get(key);
  if (subs) subs.forEach(fn => fn(data));
}
function cacheInvalidate(key) { _cache.delete(key); }
function cacheIsStale(key) {
  const entry = _cache.get(key);
  return !entry || (Date.now() - entry.ts > STALE_MS);
}
function cacheSubscribe(key, fn) {
  if (!_listeners.has(key)) _listeners.set(key, new Set());
  _listeners.get(key).add(fn);
  return () => _listeners.get(key)?.delete(fn);
}

/** Hook: returns [data, loading, refresh] with stale-while-revalidate */
export function useCachedData(key, fetcher) {
  const cached = cacheGet(key);
  const [data, setData] = useState(cached);
  const [loading, setLoading] = useState(!cached);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const refresh = useCallback(() => {
    const p = fetcherRef.current();
    p.then(d => { cacheSet(key, d); setData(d); })
     .catch(console.error)
     .finally(() => setLoading(false));
    return p;
  }, [key]);

  useEffect(() => {
    // Subscribe to cache updates from mutations
    const unsub = cacheSubscribe(key, setData);
    // Fetch if no cache or stale
    if (cacheIsStale(key)) refresh();
    return unsub;
  }, [key, refresh]);

  return [data, loading, refresh];
}

async function authHeaders() {
  const sb = getSupabase();
  if (!sb) return {};
  const { data: { session } } = await sb.auth.getSession();
  const hdrs = {};
  if (session?.access_token) {
    hdrs.Authorization = `Bearer ${session.access_token}`;
  }
  if (_activeAccountId) {
    hdrs['X-Account-Id'] = _activeAccountId;
  }
  return hdrs;
}

export async function apiFetch(path, opts = {}) {
  const headers = { ...opts.headers, ...(await authHeaders()) };
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(path, { ...opts, headers, signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || `Request failed: ${res.status}`);
    }
    return res.json();
  } catch (err) {
    clearTimeout(timeout);
    if (err.name === 'AbortError') {
      // Retry once on timeout (covers serverless cold starts)
      const controller2 = new AbortController();
      const timeout2 = setTimeout(() => controller2.abort(), 30000);
      try {
        const res = await fetch(path, { ...opts, headers, signal: controller2.signal });
        clearTimeout(timeout2);
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || `Request failed: ${res.status}`);
        }
        return res.json();
      } catch (retryErr) {
        clearTimeout(timeout2);
        throw retryErr;
      }
    }
    throw err;
  }
}

export const api = {
  getUser: () => apiFetch('/api/user'),
  saveTokens: (provider_token, provider_refresh_token) =>
    apiFetch('/api/auth/tokens', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider_token, provider_refresh_token }),
    }),

  // Members (RBAC)
  getMembers: () => apiFetch('/api/members'),
  addMember: (email, role) =>
    apiFetch('/api/members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, role }),
    }),
  updateMemberRole: (id, role) =>
    apiFetch(`/api/members/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    }),
  removeMember: (id) =>
    apiFetch(`/api/members/${id}`, { method: 'DELETE' }),

  getProperties: () => apiFetch('/api/properties'),
  getProperty: (id) => apiFetch(`/api/properties/${id}`),
  createProperty: (data) =>
    apiFetch('/api/properties', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
  updateProperty: (id, data) =>
    apiFetch(`/api/properties/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
  deleteProperty: (id) =>
    apiFetch(`/api/properties/${id}`, { method: 'DELETE' }),

  uploadDocument: (formData, { onProgress, onServerProcessing } = {}) => {
    // Use XHR for upload progress tracking
    return new Promise(async (resolve, reject) => {
      try {
        const hdrs = await authHeaders();
        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/api/documents/upload');
        for (const [k, v] of Object.entries(hdrs)) xhr.setRequestHeader(k, v);

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable && onProgress) {
            onProgress(Math.round((e.loaded / e.total) * 100));
          }
        };
        // Fires when file has been sent to the server — server now uploads to Google Drive
        xhr.upload.onloadend = () => {
          if (onProgress) onProgress(100);
          if (onServerProcessing) onServerProcessing();
        };
        xhr.onload = () => {
          try {
            const body = JSON.parse(xhr.responseText);
            if (xhr.status >= 200 && xhr.status < 300) resolve(body);
            else reject(new Error(body.error || `Upload failed (${xhr.status})`));
          } catch {
            reject(new Error(`Upload failed (${xhr.status})`));
          }
        };
        xhr.onerror = () => reject(new Error('Network error — check your connection'));
        xhr.ontimeout = () => reject(new Error('Upload timed out — file may be too large'));
        xhr.timeout = 300000; // 5 min
        xhr.send(formData);
      } catch (e) {
        reject(e);
      }
    });
  },
  deleteDocument: (id) =>
    apiFetch(`/api/documents/${id}`, { method: 'DELETE' }),

  search: (q, missing) => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (missing) params.set('missing', missing);
    return apiFetch(`/api/search?${params}`);
  },

  createSubscription: (planId) =>
    apiFetch('/api/subscription/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planId }),
    }),

  cancelSubscription: () =>
    apiFetch('/api/subscription/cancel', { method: 'POST' }),

  // AI
  askAI: async (question, propertyId, onProgress) => {
    const supabase = getSupabase();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const res = await fetch('/api/ai/ask', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ question, propertyId }),
    });

    if (!res.ok && res.headers.get('content-type')?.includes('application/json')) {
      const err = await res.json();
      throw new Error(err.error || 'AI request failed');
    }

    // Read SSE stream
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let result = null;
    let streamError = null;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      // Parse SSE lines
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        try {
          const event = JSON.parse(line.slice(6));
          if (event.type === 'progress' && onProgress) {
            onProgress(event.message);
          } else if (event.type === 'done') {
            result = { answer: event.answer, chunksUsed: event.chunksUsed };
          } else if (event.type === 'error') {
            streamError = new Error(event.error);
          }
        } catch (_) { /* ignore JSON parse errors */ }
      }

      if (streamError) break;
    }

    if (streamError) throw streamError;
    if (!result) throw new Error('No response from AI');
    return result;
  },
  getAIStatus: () => apiFetch('/api/ai/status'),
  reprocessAI: () => apiFetch('/api/ai/reprocess', { method: 'POST' }),
};

// ── Cache keys ───────────────────────────────────────────────────────
export const CacheKeys = {
  properties: 'properties',
  property: (id) => `property:${id}`,
  members: 'members',
};

// ── Cache-aware mutation helpers ─────────────────────────────────────
export function invalidateProperties() {
  cacheInvalidate(CacheKeys.properties);
}
export function invalidateProperty(id) {
  cacheInvalidate(CacheKeys.property(id));
}
export function updateCachedProperty(id, updater) {
  const cached = cacheGet(CacheKeys.property(id));
  if (cached) cacheSet(CacheKeys.property(id), updater(cached));
}
export function invalidateMembers() {
  cacheInvalidate(CacheKeys.members);
}

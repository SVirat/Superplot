import { getSupabase } from './supabase.js';

// Active account ID — set by the account switcher
let _activeAccountId = localStorage.getItem('activeAccountId') || null;
export function setActiveAccountId(id) {
  _activeAccountId = id;
  if (id) localStorage.setItem('activeAccountId', id);
  else localStorage.removeItem('activeAccountId');
}
export function getActiveAccountId() { return _activeAccountId; }

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
  const res = await fetch(path, { ...opts, headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  return res.json();
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
};

import { useState, useEffect } from 'react';
import { Eye, EyeOff, Check, Trash2, Loader2 } from 'lucide-react';
import { useAuth } from '../lib/auth.jsx';
import { apiFetch } from '../lib/api.js';
import { ROLE_LABELS } from '../lib/constants.js';

const PROVIDER_LABELS = { openai: 'OpenAI', gemini: 'Google Gemini', claude: 'Anthropic Claude' };
const PROVIDER_COLORS = { openai: '#10a37f', gemini: '#4285f4', claude: '#d97706' };

function BYOKSection() {
  const [keyInfo, setKeyInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    apiFetch('/api/settings/api-key').then(data => {
      setKeyInfo(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  async function handleSave() {
    if (!newKey.trim()) return;
    setError(''); setSuccess(''); setSaving(true);
    try {
      const data = await apiFetch('/api/settings/api-key', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: newKey.trim() }),
      });
      setKeyInfo({ hasKey: true, provider: data.provider, maskedKey: newKey.slice(0, 8) + '•'.repeat(Math.max(0, newKey.length - 12)) + newKey.slice(-4) });
      setNewKey('');
      setSuccess(`${PROVIDER_LABELS[data.provider]} key saved successfully`);
    } catch (err) {
      setError(err.message);
    }
    setSaving(false);
  }

  async function handleDelete() {
    setError(''); setSuccess(''); setDeleting(true);
    try {
      await apiFetch('/api/settings/api-key', { method: 'DELETE' });
      setKeyInfo({ hasKey: false, provider: null, maskedKey: '' });
      setSuccess('API key removed');
    } catch (err) {
      setError(err.message);
    }
    setDeleting(false);
  }

  if (loading) return <div style={{ padding: 16, color: 'var(--text-muted)' }}>Loading…</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <p className="text-sm text-muted">
        Use your own AI API key for document processing and chat. Your key is encrypted and used only for your requests.
      </p>

      {keyInfo?.hasKey && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
          background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)',
        }}>
          <span style={{
            padding: '2px 8px', borderRadius: 12, fontSize: '0.7rem', fontWeight: 600,
            background: PROVIDER_COLORS[keyInfo.provider] + '18', color: PROVIDER_COLORS[keyInfo.provider],
          }}>
            {PROVIDER_LABELS[keyInfo.provider]}
          </span>
          <code style={{ fontSize: '0.85rem', flex: 1, color: 'var(--text-secondary)' }}>{keyInfo.maskedKey}</code>
          <button
            className="btn btn-sm"
            style={{ color: '#ff6b6b', padding: '4px 8px' }}
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? <Loader2 size={14} className="spin" /> : <Trash2 size={14} />}
          </button>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <input
            type={showKey ? 'text' : 'password'}
            className="form-input"
            placeholder={keyInfo?.hasKey ? 'Replace with a new key…' : 'Paste your API key (sk-..., sk-ant-..., or AIza...)'}
            value={newKey}
            onChange={e => { setNewKey(e.target.value); setError(''); setSuccess(''); }}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
            style={{ paddingRight: 36 }}
          />
          <button
            onClick={() => setShowKey(!showKey)}
            style={{
              position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4,
            }}
          >
            {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving || !newKey.trim()}>
          {saving ? <Loader2 size={14} className="spin" /> : <Check size={14} />}
          {' '}Save
        </button>
      </div>

      {error && <p className="text-sm" style={{ color: '#ff6b6b' }}>{error}</p>}
      {success && <p className="text-sm" style={{ color: 'var(--success)' }}>{success}</p>}
    </div>
  );
}

export default function Settings() {
  const { user } = useAuth();

  return (
    <div>
      <div className="page-header">
        <div className="page-header-info">
          <h1>Settings</h1>
          <p>Application configuration</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header"><h3 className="card-title">Google Drive</h3></div>
        <div className="card-body">
          <p className="text-sm text-muted" style={{ marginBottom: 12 }}>
            Superplot uses the <code>drive.file</code> scope — it can only access files it creates in your Google Drive, inside a folder called "Superplot". No other files in your Drive can be accessed.
          </p>
          <div className="kv-grid">
            <div className="kv-row">
              <span className="kv-label">Connected as</span>
              <span className="kv-value">{user?.email || '—'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header">
          <h3 className="card-title">🔑 Bring Your Own Key (BYOK) for AI</h3>
        </div>
        <div className="card-body">
          <BYOKSection />
        </div>
      </div>

      <div className="card">
        <div className="card-header"><h3 className="card-title">Account</h3></div>
        <div className="card-body">
          <div className="kv-grid">
            <div className="kv-row">
              <span className="kv-label">Name</span>
              <span className="kv-value">{user?.name || '—'}</span>
            </div>
            <div className="kv-row">
              <span className="kv-label">Email</span>
              <span className="kv-value">{user?.email || '—'}</span>
            </div>
            <div className="kv-row">
              <span className="kv-label">Role</span>
              <span className="kv-value">{ROLE_LABELS[user?.role] || user?.role || '—'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

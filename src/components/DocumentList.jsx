import { useState } from 'react';
import { CircleCheck, CircleAlert, ChevronDown, ChevronRight, Upload, Eye, Trash2, AlertTriangle, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { DOC_TYPES, docLabel, docTip } from '../lib/constants.js';
import UploadDialog from './UploadDialog.jsx';

export function DeleteConfirmDialog({ fileName, onConfirm, onCancel }) {
  const [deleting, setDeleting] = useState(false);
  const [result, setResult] = useState(null); // 'success' | 'error'
  const [errorMsg, setErrorMsg] = useState('');

  async function handleDelete() {
    setDeleting(true);
    setResult(null);
    // Force reload if delete takes too long
    const reloadTimer = setTimeout(() => window.location.reload(), 5000);
    try {
      await onConfirm();
      clearTimeout(reloadTimer);
      setResult('success');
      setTimeout(() => onCancel(), 800);
    } catch (err) {
      clearTimeout(reloadTimer);
      setResult('error');
      setErrorMsg(err?.message || 'Failed to delete document');
      setDeleting(false);
    }
  }

  return (
    <div className="dialog-overlay" onClick={!deleting ? onCancel : undefined}>
      <div className="dialog" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
        <div className="dialog-header">
          <h3 className="dialog-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={18} style={{ color: 'var(--warning)' }} />
            Delete Document
          </h3>
        </div>
        <div className="dialog-body">
          {result === 'success' ? (
            <div style={{ textAlign: 'center', padding: '12px 0' }}>
              <CheckCircle size={32} style={{ color: 'var(--success, #22c55e)' }} />
              <p className="confirm-text" style={{ marginTop: 8, fontWeight: 500 }}>Deleted successfully</p>
            </div>
          ) : deleting ? (
            <div style={{ textAlign: 'center', padding: '12px 0' }}>
              <Loader2 size={28} className="spin" style={{ color: 'var(--primary)' }} />
              <p className="confirm-text" style={{ marginTop: 8 }}>Deleting <strong>{fileName}</strong>...</p>
              <p className="text-xs text-lighter" style={{ marginTop: 4 }}>Removing from Google Drive and database</p>
            </div>
          ) : (
            <>
              <p className="confirm-text">
                Are you sure you want to delete <strong>{fileName}</strong>?
              </p>
              <p className="confirm-text" style={{ color: 'var(--danger-text)', fontSize: '0.8125rem' }}>
                This will permanently remove the file from your Google Drive. This action cannot be undone.
              </p>
              {result === 'error' && (
                <div className="upload-error-banner" style={{ marginTop: 8 }}>
                  <XCircle size={16} />
                  <span>{errorMsg}</span>
                </div>
              )}
            </>
          )}
        </div>
        <div className="dialog-footer">
          {!deleting && result !== 'success' && (
            <>
              <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDelete}>
                <Trash2 size={14} /> Delete Permanently
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function DocumentSlot({ type, files, canUpload, canDelete, onDelete, propertyId, onUploadSuccess }) {
  const [expanded, setExpanded] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const hasFiles = files.length > 0;

  return (
    <div className="doc-slot">
      <div className="doc-slot-header">
        <div className="doc-slot-status" data-tooltip={docTip(type)}>
          {hasFiles ? <CircleCheck size={18} className="has" /> : <CircleAlert size={18} className="missing" />}
        </div>
        <button
          className="doc-slot-label"
          style={{ background: 'none', border: 'none', textAlign: 'left', cursor: files.length ? 'pointer' : 'default', padding: 0 }}
          onClick={() => files.length && setExpanded(!expanded)}
        >
          {files.length > 0 && (expanded ? <ChevronDown size={14} style={{ marginRight: 4, verticalAlign: -2 }} /> : <ChevronRight size={14} style={{ marginRight: 4, verticalAlign: -2 }} />)}
          {docLabel(type)}
        </button>
        {files.length > 1 && <span className="doc-slot-count">{files.length}</span>}
        {canUpload && (
          <button className="btn btn-secondary btn-sm" onClick={() => setShowUpload(true)}>
            <Upload size={14} />
            {hasFiles ? 'Add' : 'Upload'}
          </button>
        )}
      </div>
      {expanded && files.length > 0 && (
        <div className="doc-slot-files">
          {files.map(f => (
            <div key={f.id} className="doc-file-row">
              <span className="doc-file-name">{f.file_name}</span>
              <div className="doc-file-actions">
                <a href={f.view_url} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm" style={{ padding: '4px 8px' }}>
                  <Eye size={14} />
                </a>
                {canDelete && (
                  <button className="btn btn-ghost btn-sm" style={{ padding: '4px 8px', color: 'var(--danger)' }} onClick={() => setDeleteTarget(f)}>
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      {deleteTarget && (
        <DeleteConfirmDialog
          fileName={deleteTarget.file_name}
          onConfirm={() => onDelete(deleteTarget.id)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
      {showUpload && (
        <UploadDialog
          docType={type}
          propertyId={propertyId}
          onClose={() => setShowUpload(false)}
          onSuccess={(docs) => { setShowUpload(false); onUploadSuccess(docs); }}
        />
      )}
    </div>
  );
}

export default function DocumentList({ documents, canUpload, canDelete, propertyId, onDelete, onUploadSuccess }) {
  const docTypes = DOC_TYPES.filter(t => t.key !== 'photos');
  const byType = {};
  for (const d of (documents || [])) {
    if (d.type === 'photos') continue;
    if (!byType[d.type]) byType[d.type] = [];
    byType[d.type].push(d);
  }

  return (
    <div>
      {docTypes.map(t => (
        <DocumentSlot
          key={t.key}
          type={t.key}
          files={byType[t.key] || []}
          canUpload={canUpload}
          canDelete={canDelete}
          propertyId={propertyId}
          onDelete={onDelete}
          onUploadSuccess={onUploadSuccess}
        />
      ))}
    </div>
  );
}

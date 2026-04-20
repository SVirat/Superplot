import { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, CheckCircle, AlertCircle, X, FileText, Image, Loader2 } from 'lucide-react';
import { docLabel } from '../lib/constants.js';
import { api } from '../lib/api.js';

const DOC_ACCEPT = '.pdf,.jpg,.jpeg,.png,.doc,.docx';

const STAGES = {
  IDLE: 'idle',
  PREPARING: 'preparing',
  UPLOADING: 'uploading',
  PROCESSING: 'processing',
  SAVING: 'saving',
  DONE: 'done',
  ERROR: 'error',
};

const STAGE_LABELS = {
  [STAGES.PREPARING]: 'Preparing file...',
  [STAGES.UPLOADING]: 'Sending file...',
  [STAGES.PROCESSING]: 'Uploading to Google Drive...',
  [STAGES.SAVING]: 'Finalizing...',
  [STAGES.DONE]: 'Upload complete!',
  [STAGES.ERROR]: 'Upload failed',
};

const PROCESSING_MESSAGES = [
  'Uploading to Google Drive...',
  'Saving to Drive...',
  'Analyzing document...',
  'Processing content...',
  'Almost done...',
];

function friendlyError(msg) {
  if (!msg) return 'Something went wrong. Please try again.';
  const lower = msg.toLowerCase();
  if (lower.includes('network error') || lower.includes('failed to fetch'))
    return 'Could not connect to the server. Check your internet connection and try again.';
  if (lower.includes('timeout') || lower.includes('timed out'))
    return 'The upload timed out. The file may be too large or your connection too slow.';
  if (lower.includes('storage') || lower.includes('quota') || lower.includes('insufficient'))
    return 'Google Drive storage is full. Free up space and try again.';
  if (lower.includes('401') || lower.includes('unauthorized'))
    return 'Your session expired. Please refresh the page and sign in again.';
  if (lower.includes('403') || lower.includes('forbidden'))
    return 'You don\'t have permission to upload files.';
  if (lower.includes('413') || lower.includes('too large'))
    return 'The file is too large. Maximum size is 50 MB.';
  if (lower.includes('drive'))
    return 'Google Drive upload failed. Please check your Drive connection in Settings.';
  return msg;
}

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export default function UploadDialog({ docType, propertyId, onClose, onSuccess }) {
  const [files, setFiles] = useState([]);
  const [stage, setStage] = useState(STAGES.IDLE);
  const [currentFile, setCurrentFile] = useState(0);
  const [uploadPct, setUploadPct] = useState(0);
  const [completedFiles, setCompletedFiles] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);
  const folderRef = useRef(null);
  const abortRef = useRef(false);
  const isPhotos = docType === 'photos';
  const [processingPct, setProcessingPct] = useState(0);
  const [processingMsg, setProcessingMsg] = useState(0);

  // Simulated progress during server processing
  useEffect(() => {
    if (stage !== STAGES.PROCESSING) {
      setProcessingPct(0);
      setProcessingMsg(0);
      return;
    }
    // Slowly increment progress (never reaches 100)
    const pctTimer = setInterval(() => {
      setProcessingPct(prev => {
        if (prev < 30) return prev + 2;
        if (prev < 60) return prev + 1;
        if (prev < 85) return prev + 0.5;
        return Math.min(prev + 0.2, 95);
      });
    }, 500);
    // Cycle through messages
    const msgTimer = setInterval(() => {
      setProcessingMsg(prev => (prev + 1) % PROCESSING_MESSAGES.length);
    }, 4000);
    return () => { clearInterval(pctTimer); clearInterval(msgTimer); };
  }, [stage]);

  const handleFiles = useCallback((newFiles) => {
    const arr = Array.from(newFiles);
    const filtered = isPhotos ? arr.filter(f => f.type.startsWith('image/')) : arr;
    setFiles(prev => [...prev, ...filtered]);
    setError('');
  }, [isPhotos]);

  function removeFile(idx) {
    setFiles(prev => prev.filter((_, i) => i !== idx));
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
  }

  // Overall progress: combines file index + per-file upload %
  function overallPct(fileIdx, filePct) {
    const total = files.length;
    if (total === 0) return 0;
    return Math.round(((fileIdx + filePct / 100) / total) * 100);
  }

  async function handleUpload() {
    if (!files.length) return;
    abortRef.current = false;
    setError('');
    const uploadedDocs = [];
    let shouldReload = false;
    // Start from completedFiles so retry skips already-uploaded files
    const startIdx = completedFiles;

    for (let i = startIdx; i < files.length; i++) {
      if (abortRef.current) break;
      setCurrentFile(i);
      setUploadPct(0);
      const fileStart = Date.now();

      // Stage: Preparing
      setStage(STAGES.PREPARING);
      await new Promise(r => setTimeout(r, 100)); // brief visual pause

      // Stage: Uploading
      setStage(STAGES.UPLOADING);
      const fd = new FormData();
      fd.append('file', files[i]);
      fd.append('propertyId', propertyId);
      fd.append('docType', docType);

      try {
        const result = await api.uploadDocument(fd, {
          onProgress: (pct) => setUploadPct(pct),
          onServerProcessing: () => setStage(STAGES.PROCESSING),
        });
        if (result) uploadedDocs.push(result);
      } catch (err) {
        setStage(STAGES.ERROR);
        setError(friendlyError(err.message));
        return;
      }

      // Stage: Saving (brief)
      setStage(STAGES.SAVING);
      setUploadPct(100);
      setCompletedFiles(i + 1);
      if (Date.now() - fileStart > 7000) shouldReload = true;
      await new Promise(r => setTimeout(r, 200));
    }

    setStage(STAGES.DONE);
    if (shouldReload) {
      setTimeout(() => window.location.reload(), 600);
    } else {
      setTimeout(() => onSuccess(uploadedDocs), 600);
    }
  }

  const isUploading = stage !== STAGES.IDLE && stage !== STAGES.DONE && stage !== STAGES.ERROR;
  const isProcessing = stage === STAGES.PROCESSING;
  const isSaving = stage === STAGES.SAVING;
  const totalSize = files.reduce((s, f) => s + f.size, 0);
  const overall = isProcessing ? Math.round(processingPct) : overallPct(currentFile, uploadPct);
  const stageLabel = isProcessing ? PROCESSING_MESSAGES[processingMsg] : STAGE_LABELS[stage];

  return (
    <div className="dialog-overlay" onClick={e => !isUploading && e.target === e.currentTarget && onClose()}>
      <div className="dialog" style={{ maxWidth: 500 }}>
        <div className="dialog-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h3 className="dialog-title">Upload {docLabel(docType)}</h3>
            <p className="dialog-desc">Files are appended, not replaced.</p>
          </div>
          {!isUploading && (
            <button className="btn btn-ghost btn-icon" onClick={onClose} style={{ marginTop: -4, marginRight: -8 }}>
              <X size={18} />
            </button>
          )}
        </div>

        <div className="dialog-body">
          {/* Error banner */}
          {error && (
            <div className="upload-error-banner">
              <AlertCircle size={16} />
              <div>
                <div style={{ fontWeight: 500, marginBottom: 2 }}>Upload failed</div>
                <div>{error}</div>
              </div>
            </div>
          )}

          {/* Dropzone — hidden during upload */}
          {!isUploading && stage !== STAGES.DONE && (
            <>
              <div
                className={`dropzone${dragActive ? ' active' : ''}`}
                onDragOver={e => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
              >
                <Upload size={28} />
                <p className="text-sm" style={{ marginTop: 8 }}>Drop files here or click to browse</p>
                <p className="text-xs text-lighter">{isPhotos ? 'Image files only' : 'PDF, JPG, PNG, DOC, DOCX'} · Max 50 MB</p>
              </div>
              <input
                ref={inputRef}
                type="file"
                accept={isPhotos ? 'image/*' : DOC_ACCEPT}
                multiple
                style={{ display: 'none' }}
                onChange={e => { handleFiles(e.target.files); e.target.value = ''; }}
              />
              {isPhotos && (
                <>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ marginTop: 8, width: '100%' }}
                    onClick={() => folderRef.current?.click()}
                  >
                    Select Folder
                  </button>
                  <input
                    ref={folderRef}
                    type="file"
                    webkitdirectory=""
                    style={{ display: 'none' }}
                    onChange={e => { handleFiles(e.target.files); e.target.value = ''; }}
                  />
                </>
              )}
            </>
          )}

          {/* File list */}
          {files.length > 0 && !isUploading && stage !== STAGES.DONE && (
            <div className="upload-file-list">
              {files.map((f, i) => (
                <div key={i} className="upload-file-item">
                  <div className="upload-file-icon">
                    {f.type.startsWith('image/') ? <Image size={16} /> : <FileText size={16} />}
                  </div>
                  <div className="upload-file-info">
                    <span className="upload-file-name">{f.name}</span>
                    <span className="upload-file-size">{formatFileSize(f.size)}</span>
                  </div>
                  <button className="btn btn-ghost btn-icon" style={{ padding: 4 }} onClick={() => removeFile(i)}>
                    <X size={14} />
                  </button>
                </div>
              ))}
              {files.length > 1 && (
                <div className="text-xs text-lighter" style={{ marginTop: 4 }}>
                  {files.length} files · {formatFileSize(totalSize)} total
                </div>
              )}
            </div>
          )}

          {/* Upload progress */}
          {isUploading && (
            <div className="upload-progress-area">
              <div className="upload-progress-ring-wrap">
                <svg className="upload-progress-ring" viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="34" fill="none" stroke="var(--border-light)" strokeWidth="6" />
                  <circle
                    cx="40" cy="40" r="34" fill="none"
                    stroke="var(--primary)" strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 34}`}
                    strokeDashoffset={isSaving ? `${2 * Math.PI * 34 * 0.05}` : `${2 * Math.PI * 34 * (1 - overall / 100)}`}
                    style={{ transition: 'stroke-dashoffset 500ms ease', transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
                  />
                </svg>
                <div className="upload-progress-pct">
                  {isSaving ? <Loader2 size={20} className="spin" /> : `${overall}%`}
                </div>
              </div>
              <div className="upload-progress-info">
                <div className="upload-progress-stage">{stageLabel}</div>
                {files.length > 1 && (
                  <div className="text-xs text-lighter">
                    File {currentFile + 1} of {files.length}: {files[currentFile]?.name}
                  </div>
                )}
                {files.length === 1 && (
                  <div className="text-xs text-lighter">{files[0]?.name}</div>
                )}
                <div className="upload-progress-bar-wrap">
                  <div className="upload-progress-bar">
                    <div className={`upload-progress-bar-fill${isSaving ? ' indeterminate' : ''}`} style={isSaving ? {} : { width: `${overall}%`, transition: 'width 500ms ease' }} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Done */}
          {stage === STAGES.DONE && (
            <div className="upload-done">
              <CheckCircle size={40} />
              <p style={{ fontWeight: 600, marginTop: 8 }}>All files uploaded!</p>
              <p className="text-sm text-lighter">{completedFiles} file{completedFiles > 1 ? 's' : ''} saved to Google Drive</p>
            </div>
          )}
        </div>

        <div className="dialog-footer">
          {stage === STAGES.ERROR && (
            <button className="btn btn-secondary" onClick={() => { setStage(STAGES.IDLE); setError(''); }}>
              Try Again
            </button>
          )}
          {!isUploading && stage !== STAGES.DONE && (
            <>
              <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
              <button className="btn btn-primary" onClick={handleUpload} disabled={!files.length}>
                <Upload size={16} />
                Upload {files.length > 1 ? `${files.length} Files` : 'File'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

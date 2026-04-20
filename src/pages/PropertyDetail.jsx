import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Pencil, Trash2, MapPin, ExternalLink, Image, Upload, Loader2, FolderOpen, Camera } from 'lucide-react';
import { useAuth } from '../lib/auth.jsx';
import { api, invalidateProperties, apiFetch } from '../lib/api.js';
import { getSupabase } from '../lib/supabase.js';
import { docScore, ownershipLabel, slugify } from '../lib/constants.js';
import { formatCurrency, formatDate, formatNumber } from '../lib/format.js';
import DocumentList, { DeleteConfirmDialog } from '../components/DocumentList.jsx';
import UploadDialog from '../components/UploadDialog.jsx';
import MapPreview from '../components/MapPreview.jsx';

// Cache for thumbnail blob URLs to avoid re-fetching
const _thumbCache = new Map();

function PhotoThumbnail({ docId }) {
  const [src, setSrc] = useState(_thumbCache.get(docId) || null);
  const [loading, setLoading] = useState(!_thumbCache.has(docId));
  const [error, setError] = useState(false);

  useEffect(() => {
    if (_thumbCache.has(docId)) return;
    let cancelled = false;
    (async () => {
      try {
        const sb = getSupabase();
        const { data: { session } } = await sb.auth.getSession();
        if (!session?.access_token || cancelled) return;
        const hdrs = { Authorization: `Bearer ${session.access_token}` };
        const accountId = localStorage.getItem('activeAccountId');
        if (accountId) hdrs['X-Account-Id'] = accountId;
        const res = await fetch(`/api/documents/${docId}/thumbnail`, { headers: hdrs });
        if (!res.ok || cancelled) { setError(true); setLoading(false); return; }
        const blob = await res.blob();
        if (cancelled) return;
        const url = URL.createObjectURL(blob);
        _thumbCache.set(docId, url);
        setSrc(url);
      } catch { setError(true); }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [docId]);

  if (error) return <Image size={24} />;
  if (loading) return <Loader2 size={24} className="spin" />;
  return <img src={src} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />;
}

export default function PropertyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // ── Fully local state — no cache subscriptions ──
  const [property, setProperty] = useState(null);
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [photoDeleteTarget, setPhotoDeleteTarget] = useState(null);

  // Fetch property once on mount / when id changes
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.getProperty(id).then(data => {
      if (cancelled) return;
      setProperty(data);
      setDocs(data?.documents || []);
      setLoading(false);
    }).catch(err => {
      console.error('Failed to load property:', err);
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [id]);

  const isAdmin = user?.role === 'admin';
  const canUpload = isAdmin || user?.role === 'family_contributor';
  const canDelete = isAdmin;

  const photos = useMemo(() => docs.filter(d => d.type === 'photos'), [docs]);
  const score = useMemo(() => docScore(docs), [docs]);

  function handleUploadSuccess(newDocs) {
    if (newDocs?.length) {
      setDocs(prev => [...prev, ...newDocs]);
    }
    invalidateProperties();
  }

  async function handleDeleteDoc(docId) {
    await api.deleteDocument(docId);
    setDocs(prev => prev.filter(d => d.id !== docId));
    invalidateProperties();
  }

  function handleDeleteProperty() {
    navigate('/properties', { replace: true });
    api.deleteProperty(id).then(() => invalidateProperties()).catch(console.error);
  }

  if (loading) {
    return (
      <div>
        <div className="skeleton skeleton-heading" style={{ width: 250 }} />
        <div style={{ display: 'flex', gap: 24, marginTop: 24 }}>
          <div className="skeleton" style={{ width: 320, height: 400, borderRadius: 'var(--radius)' }} />
          <div className="skeleton" style={{ flex: 1, height: 400, borderRadius: 'var(--radius)' }} />
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="empty-state">
        <p>Property not found.</p>
        <Link to="/properties" className="btn btn-secondary btn-sm">Back to Properties</Link>
      </div>
    );
  }

  const mapsUrl = property.google_maps_url || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(property.address)}`;
  const barClass = score.pct === 100 ? 'green' : score.pct > 0 ? 'yellow' : 'gray';

  return (
    <div>
      <div className="detail-header">
        <div className="detail-header-info">
          <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)} style={{ marginBottom: 8 }}>
            <ArrowLeft size={16} /> Back
          </button>
          <h1>{property.name}</h1>
          <p className="text-muted" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <MapPin size={14} /> {property.address}
          </p>
        </div>
        <div className="detail-header-actions">
          {isAdmin && (
            <>
              <Link to={`/properties/${id}/edit`} className="btn btn-secondary">
                <Pencil size={16} /> Edit
              </Link>
              <button className="btn btn-danger" onClick={() => setShowDeleteConfirm(true)}>
                <Trash2 size={16} /> Delete
              </button>
            </>
          )}
        </div>
      </div>

      <div className="detail-layout">
        <div className="detail-rail">
          {/* Map */}
          <a href={mapsUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
            <div className="detail-map-wrap">
              <MapPreview lat={property.latitude} lng={property.longitude} name={property.name} />
            </div>
          </a>

          {/* Details */}
          <div className="card">
            <div className="card-header"><h3 className="card-title">Details</h3></div>
            <div className="card-body">
              <div className="detail-kv">
                <div className="detail-kv-row">
                  <span className="detail-kv-label">ZIP Code</span>
                  <span className="detail-kv-value">{property.zip_code}</span>
                </div>
                <div className="detail-kv-row">
                  <span className="detail-kv-label">Ownership</span>
                  <span className="badge badge-default">{ownershipLabel(property.ownership_status)}</span>
                </div>
                {property.size_sq_ft && (
                  <div className="detail-kv-row">
                    <span className="detail-kv-label">Size (sq ft)</span>
                    <span className="detail-kv-value">{formatNumber(property.size_sq_ft)}</span>
                  </div>
                )}
                {property.size_acres && (
                  <div className="detail-kv-row">
                    <span className="detail-kv-label">Area (acres)</span>
                    <span className="detail-kv-value">{property.size_acres}</span>
                  </div>
                )}
                {property.purchase_date && (
                  <div className="detail-kv-row">
                    <span className="detail-kv-label">Purchase Date</span>
                    <span className="detail-kv-value">{formatDate(property.purchase_date)}</span>
                  </div>
                )}
                {property.purchase_price && (
                  <div className="detail-kv-row">
                    <span className="detail-kv-label">Purchase Price</span>
                    <span className="detail-kv-value">{formatCurrency(property.purchase_price)}</span>
                  </div>
                )}
                {property.current_price && (
                  <div className="detail-kv-row">
                    <span className="detail-kv-label">Current Est.</span>
                    <span className="detail-kv-value">{formatCurrency(property.current_price)}</span>
                  </div>
                )}
                {property.is_rented && (
                  <>
                    <div className="detail-kv-row">
                      <span className="detail-kv-label">Rental Status</span>
                      <span className="badge badge-success">Rented</span>
                    </div>
                    {property.monthly_rent && (
                      <div className="detail-kv-row">
                        <span className="detail-kv-label">Monthly Rent</span>
                        <span className="detail-kv-value">{formatCurrency(property.monthly_rent)}</span>
                      </div>
                    )}
                    {property.rentee_contact && (
                      <div className="detail-kv-row">
                        <span className="detail-kv-label">Tenant</span>
                        <span className="detail-kv-value">{property.rentee_contact}</span>
                      </div>
                    )}
                  </>
                )}
                {property.google_maps_url && (
                  <div className="detail-kv-row">
                    <span className="detail-kv-label">Maps</span>
                    <a href={property.google_maps_url} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm" style={{ padding: '2px 8px' }}>
                      <ExternalLink size={14} /> Open
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Score */}
          <div className="card">
            <div className="card-header"><h3 className="card-title">Documentation Score</h3></div>
            <div className="card-body">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span className="text-sm">{score.uploaded}/{score.total} documents</span>
                <span className="text-sm" style={{ fontWeight: 600 }}>{score.pct}%</span>
              </div>
              <div className="progress">
                <div className={`progress-fill ${barClass}`} style={{ width: `${score.pct}%` }} />
              </div>
            </div>
          </div>
        </div>

        <div className="detail-main">
          {/* Documents */}
          <div className="card">
            <div className="card-header"><h3 className="card-title"><FolderOpen size={18} /> Document Vault</h3></div>
            <div className="card-body">
              <DocumentList
                documents={docs}
                canUpload={canUpload}
                canDelete={canDelete}
                propertyId={property.id}
                onDelete={handleDeleteDoc}
                onUploadSuccess={handleUploadSuccess}
              />
            </div>
          </div>

          {/* Photos */}
          <div className="card">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="card-title"><Camera size={18} /> Photos</h3>
              {canUpload && (
                <button className="btn btn-secondary btn-sm" onClick={() => setShowPhotoUpload(true)}>
                  <Upload size={14} /> Upload
                </button>
              )}
            </div>
            <div className="card-body">
              {photos.length === 0 ? (
                <div className="empty-state" style={{ padding: '24px 0' }}>
                  <Image size={36} />
                  <p className="text-sm">No photos uploaded yet</p>
                  {canUpload && (
                    <button className="btn btn-secondary btn-sm" onClick={() => setShowPhotoUpload(true)}>
                      Upload Photos
                    </button>
                  )}
                </div>
              ) : (
                <div className="photo-grid">
                  {photos.map(p => (
                    <div key={p.id} className="photo-thumb">
                      <PhotoThumbnail docId={p.id} />
                      <div className="photo-thumb-overlay">
                        <a href={p.view_url} target="_blank" rel="noopener noreferrer" className="btn btn-sm" style={{ color: '#fff', fontSize: '0.75rem' }}>
                          View in Drive
                        </a>
                        <span>{p.file_name}</span>
                        {canDelete && (
                          <button className="btn btn-sm" style={{ color: '#ff6b6b', fontSize: '0.7rem' }} onClick={() => setPhotoDeleteTarget(p)}>
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="dialog-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="dialog" onClick={e => e.stopPropagation()}>
            <div className="dialog-header">
              <h3 className="dialog-title">Delete Property</h3>
            </div>
            <div className="dialog-body">
              <p className="confirm-text">
                Are you sure you want to delete <strong>{property.name}</strong>? This will remove all associated document records. Files in Google Drive will not be deleted.
              </p>
            </div>
            <div className="dialog-footer">
              <button className="btn btn-secondary" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDeleteProperty}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Photo Upload */}
      {showPhotoUpload && (
        <UploadDialog
          docType="photos"
          propertyId={property.id}
          onClose={() => setShowPhotoUpload(false)}
          onSuccess={(newDocs) => {
            setShowPhotoUpload(false);
            handleUploadSuccess(newDocs);
          }}
        />
      )}

      {/* Photo Delete Confirmation */}
      {photoDeleteTarget && (
        <DeleteConfirmDialog
          fileName={photoDeleteTarget.file_name}
          onConfirm={() => handleDeleteDoc(photoDeleteTarget.id)}
          onCancel={() => setPhotoDeleteTarget(null)}
        />
      )}
    </div>
  );
}

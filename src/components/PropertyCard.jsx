import { Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { docScore, ownershipLabel, SCORED_TYPES, slugify } from '../lib/constants.js';
import MapPreview from './MapPreview.jsx';

export default function PropertyCard({ property }) {
  const docs = property.documents || [];
  const score = docScore(docs);
  const uploadedTypes = new Set(docs.filter(d => d.type !== 'other' && d.type !== 'photos').map(d => d.type));

  const badgeClass = score.pct === 100 ? 'badge-success' : score.pct > 0 ? 'badge-warning' : 'badge-default';
  const barClass = score.pct === 100 ? 'green' : score.pct > 0 ? 'yellow' : 'gray';

  const hasCoords = property.latitude && property.longitude;

  return (
    <Link to={`/properties/${slugify(property.name)}`} className="prop-card">
      <div className="prop-card-map">
        <MapPreview lat={property.latitude} lng={property.longitude} name={property.name} />
        <div className="prop-card-badge">
          <span className={`badge ${badgeClass}`}>
            {score.uploaded}/{score.total}
          </span>
        </div>
      </div>
      <div className="prop-card-body">
        <div className="prop-card-name">{property.name}</div>
        <div className="prop-card-addr">
          <MapPin size={14} />
          {property.address}
        </div>
        <div className="progress" style={{ margin: '4px 0' }}>
          <div className={`progress-fill ${barClass}`} style={{ width: `${score.pct}%` }} />
        </div>
        <div className="prop-card-dots">
          {SCORED_TYPES.map(t => (
            <div key={t.key} className="tooltip-wrap">
              <div className={`prop-card-dot ${uploadedTypes.has(t.key) ? 'filled' : 'empty'}`} />
              <span className="tooltip">{t.label}</span>
            </div>
          ))}
        </div>
        <div className="prop-card-footer">
          <span className="badge badge-default">{ownershipLabel(property.ownership_status)}</span>
          <span className="text-xs text-lighter">{property.zip_code}</span>
        </div>
      </div>
    </Link>
  );
}

import { Link } from 'react-router-dom';
import { Building2 } from 'lucide-react';
import { useAuth } from '../lib/auth.jsx';
import PropertyCard from './PropertyCard.jsx';

export default function PropertyGrid({ properties }) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  if (!properties?.length) {
    return (
      <div className="empty-state">
        <Building2 size={48} />
        <p>No properties yet</p>
        {isAdmin && (
          <Link to="/properties/new" className="btn btn-primary btn-sm">
            Add your first property
          </Link>
        )}
      </div>
    );
  }
  return (
    <div className="property-grid">
      {properties.map(p => (
        <PropertyCard key={p.id} property={p} />
      ))}
    </div>
  );
}

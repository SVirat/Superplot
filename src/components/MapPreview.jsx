import { useState, useEffect } from 'react';
import { MapPin } from 'lucide-react';
import { getConfig } from '../lib/supabase.js';

// Cache the Maps API key after first load
let _mapsKey = null;
let _mapsKeyPromise = null;
function getMapsKey() {
  if (_mapsKey !== null) return Promise.resolve(_mapsKey);
  if (!_mapsKeyPromise) {
    _mapsKeyPromise = getConfig().then(c => { _mapsKey = c.googleMapsApiKey || ''; return _mapsKey; });
  }
  return _mapsKeyPromise;
}

export default function MapPreview({ lat, lng, name, className = '' }) {
  const [mapsKey, setMapsKey] = useState(_mapsKey);
  const [streetViewOk, setStreetViewOk] = useState(null);

  const hasCoords = lat && lng;

  useEffect(() => {
    if (!hasCoords) return;
    let cancelled = false;
    getMapsKey().then(key => {
      if (cancelled) return;
      setMapsKey(key);
      if (!key) { setStreetViewOk(false); return; }
      fetch(`https://maps.googleapis.com/maps/api/streetview/metadata?location=${lat},${lng}&key=${key}`)
        .then(r => r.json())
        .then(d => { if (!cancelled) setStreetViewOk(d.status === 'OK'); })
        .catch(() => { if (!cancelled) setStreetViewOk(false); });
    });
    return () => { cancelled = true; };
  }, [lat, lng, hasCoords]);

  if (!hasCoords) {
    return (
      <div className={`map-preview-empty ${className}`}>
        <MapPin size={32} />
      </div>
    );
  }

  // Still checking
  if (streetViewOk === null) return <div className={`map-preview-empty ${className}`} />;

  // Street View available
  if (streetViewOk && mapsKey) {
    return (
      <img
        className={`map-preview-img ${className}`}
        src={`https://maps.googleapis.com/maps/api/streetview?size=600x300&location=${lat},${lng}&fov=90&key=${mapsKey}`}
        alt={`Street view of ${name}`}
        loading="lazy"
        onError={() => setStreetViewOk(false)}
      />
    );
  }

  // Fallback: Google Maps embed
  return (
    <iframe
      className={`map-preview-iframe ${className}`}
      src={`https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d3000!2d${lng}!3d${lat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e1!3m2!1sen!2sin`}
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
      title={`Map of ${name}`}
    />
  );
}

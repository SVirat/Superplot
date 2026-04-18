import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search as SearchIcon } from 'lucide-react';
import { api } from '../lib/api.js';
import { SCORED_TYPES } from '../lib/constants.js';
import PropertyGrid from '../components/PropertyGrid.jsx';

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [missing, setMissing] = useState(searchParams.get('missing') || '');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = searchParams.get('q') || '';
    const m = searchParams.get('missing') || '';
    if (q || m) {
      setLoading(true);
      api.search(q, m).then(setResults).catch(console.error).finally(() => setLoading(false));
    }
  }, [searchParams]);

  function handleSearch(e) {
    e.preventDefault();
    const params = {};
    if (query.trim()) params.q = query.trim();
    if (missing) params.missing = missing;
    setSearchParams(params);
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-header-info">
          <h1>Search</h1>
          <p>Find properties by name, address, ZIP code, or missing documents</p>
        </div>
      </div>

      <form onSubmit={handleSearch} className="search-bar">
        <input
          className="form-input"
          placeholder="Search by name, address, or ZIP code..."
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        <select className="form-select" value={missing} onChange={e => setMissing(e.target.value)}>
          <option value="">Missing Document</option>
          <option value="any">Any missing document</option>
          {SCORED_TYPES.map(t => (
            <option key={t.key} value={t.key}>{t.label}</option>
          ))}
        </select>
        <button type="submit" className="btn btn-primary">
          <SearchIcon size={16} /> Search
        </button>
      </form>

      {loading && (
        <div className="property-grid">
          {[1,2,3].map(i => <div key={i} className="skeleton skeleton-card" />)}
        </div>
      )}

      {results !== null && !loading && (
        <>
          <p className="text-sm text-muted" style={{ marginBottom: 16 }}>
            {results.length} result{results.length !== 1 ? 's' : ''} found
          </p>
          <PropertyGrid properties={results} />
        </>
      )}
    </div>
  );
}

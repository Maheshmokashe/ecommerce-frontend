import { useState } from 'react';
import { searchProducts } from './api';

export default function Search() {
  const [q, setQ] = useState('');
  const [min, setMin] = useState('');
  const [max, setMax] = useState('');
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!q) return;
    setLoading(true);
    try {
      const res = await searchProducts(q, min, max);
      setResults(res.data.results);
      setSearched(true);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>🔍 Search Products</h2>
      <div style={styles.filters}>
        <input
          style={styles.input}
          placeholder="Search keyword (e.g. dress, ring, shoes)"
          value={q}
          onChange={e => setQ(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <input
          style={styles.inputSmall}
          placeholder="Min Price"
          type="number"
          value={min}
          onChange={e => setMin(e.target.value)}
        />
        <input
          style={styles.inputSmall}
          placeholder="Max Price"
          type="number"
          value={max}
          onChange={e => setMax(e.target.value)}
        />
        <button style={styles.button} onClick={handleSearch}>
          {loading ? '⏳' : 'Search'}
        </button>
      </div>

      {searched && (
        <p style={styles.count}>{results.length} result(s) found</p>
      )}

      <div style={styles.grid}>
        {results.map(p => (
          <div
            key={p.id}
            style={styles.card}
            onClick={() => p.source_url && window.open(p.source_url, '_blank')}
            title={p.source_url ? 'Click to view on Westside' : ''}
          >
            <span style={styles.badge}>{p.category}</span>
            <h3 style={styles.name}>{p.name}</h3>
            <p style={styles.sku}>SKU: {p.sku}</p>
            <div style={styles.footer}>
              <span style={styles.price}>₹{p.price}</span>
              <span style={styles.stock}>Stock: {p.stock}</span>
            </div>
            {p.source_url && (
              <p style={styles.link}>🔗 View on Westside →</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  container: { padding: '24px' },
  heading: { marginBottom: '20px', color: '#333' },
  filters: { display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' },
  input: { padding: '10px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px', flex: 2, minWidth: '200px' },
  inputSmall: { padding: '10px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px', flex: 1, minWidth: '120px' },
  button: { padding: '10px 24px', background: '#1890ff', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' },
  count: { color: '#666', marginBottom: '16px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px' },
  card: { background: 'white', borderRadius: '10px', padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)', cursor: 'pointer', transition: 'box-shadow 0.2s' },
  badge: { background: '#e6f7ff', color: '#1890ff', padding: '2px 10px', borderRadius: '20px', fontSize: '12px' },
  name: { margin: '12px 0 4px', color: '#333', fontSize: '15px' },
  sku: { color: '#999', fontSize: '12px', margin: '0 0 12px' },
  footer: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f0f0f0', paddingTop: '12px' },
  price: { color: '#52c41a', fontWeight: 'bold', fontSize: '18px' },
  stock: { color: '#888', fontSize: '13px' },
  link: { color: '#1890ff', fontSize: '12px', marginTop: '8px', marginBottom: '0' },
};
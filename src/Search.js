import { useState } from 'react';
import { searchProducts } from './api';

export default function Search({ darkMode }) {
  const [q, setQ] = useState('');
  const [min, setMin] = useState('');
  const [max, setMax] = useState('');
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const s = getStyles(darkMode);

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
    <div style={s.container}>
      <h2 style={s.heading}>🔍 Search Products</h2>

      <div style={s.filters}>
        <input style={s.input} placeholder="Search keyword (e.g. dress, ring, shoes)"
          value={q} onChange={e => setQ(e.target.value)} onKeyDown={handleKeyDown} />
        <input style={s.inputSmall} placeholder="Min Price ₹" type="number"
          value={min} onChange={e => setMin(e.target.value)} />
        <input style={s.inputSmall} placeholder="Max Price ₹" type="number"
          value={max} onChange={e => setMax(e.target.value)} />
        <button style={s.button} onClick={handleSearch}>
          {loading ? '⏳' : '🔍 Search'}
        </button>
      </div>

      {searched && (
        <p style={s.count}>{results.length} result(s) found</p>
      )}

      <div style={s.grid}>
        {results.map(p => (
          <div key={p.id} style={s.card} onClick={() => setSelectedProduct(p)}>
            <span style={s.badge}>{p.category}</span>
            <h3 style={s.name}>{p.name}</h3>
            <p style={s.sku}>SKU: {p.sku}</p>
            <div style={s.footer}>
              <span style={s.price}>₹{p.price}</span>
              <span style={p.stock > 0 ? s.inStock : s.outStock}>
                {p.stock > 0 ? '✅ Available' : '❌ Out of Stock'}
              </span>
            </div>
            {p.source_url && <p style={s.link}>🔗 View Product →</p>}
          </div>
        ))}
      </div>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div style={s.overlay} onClick={() => setSelectedProduct(null)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <button style={s.closeBtn} onClick={() => setSelectedProduct(null)}>✕</button>
            <div style={s.modalContent}>
              <div style={s.modalLeft}>
                {selectedProduct.image_url
                  ? <img src={selectedProduct.image_url} alt={selectedProduct.name}
                      style={s.modalImage} onError={e => e.target.style.display = 'none'} />
                  : <div style={s.modalImagePlaceholder}>🖼️ No Image</div>
                }
              </div>
              <div style={s.modalRight}>
                <span style={s.badge}>{selectedProduct.category}</span>
                <h2 style={s.modalName}>{selectedProduct.name}</h2>
                <p style={s.modalSku}>SKU: {selectedProduct.sku}</p>
                <div style={s.modalPriceRow}>
                  <span style={s.modalPrice}>₹{selectedProduct.price}</span>
                  <span style={selectedProduct.stock > 0 ? s.inStock : s.outStock}>
                    {selectedProduct.stock > 0 ? '✅ Available' : '❌ Out of Stock'}
                  </span>
                </div>
                {selectedProduct.source_url && (
                  <button style={s.viewBtn}
                    onClick={() => window.open(selectedProduct.source_url, '_blank')}>
                    🔗 View Product →
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const getStyles = (dark) => ({
  container: { padding: '24px' },
  heading: { color: dark ? '#fff' : '#333', marginBottom: '20px' },
  filters: { display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' },
  input: { padding: '10px', borderRadius: '6px', border: `1px solid ${dark ? '#444' : '#ddd'}`, fontSize: '14px', flex: 2, minWidth: '200px', background: dark ? '#1f1f1f' : 'white', color: dark ? '#fff' : '#333' },
  inputSmall: { padding: '10px', borderRadius: '6px', border: `1px solid ${dark ? '#444' : '#ddd'}`, fontSize: '14px', flex: 1, minWidth: '120px', background: dark ? '#1f1f1f' : 'white', color: dark ? '#fff' : '#333' },
  button: { padding: '10px 24px', background: '#1890ff', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' },
  count: { color: dark ? '#aaa' : '#666', marginBottom: '16px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px' },
  card: { background: dark ? '#1f1f1f' : 'white', borderRadius: '10px', padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)', cursor: 'pointer' },
  badge: { display: 'inline-block', background: '#e6f7ff', color: '#1890ff', padding: '2px 10px', borderRadius: '20px', fontSize: '12px' },
  name: { margin: '12px 0 4px', color: dark ? '#fff' : '#333', fontSize: '15px' },
  sku: { color: '#999', fontSize: '12px', margin: '0 0 12px' },
  footer: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `1px solid ${dark ? '#333' : '#f0f0f0'}`, paddingTop: '12px' },
  price: { color: '#52c41a', fontWeight: 'bold', fontSize: '18px' },
  inStock: { color: '#52c41a', fontSize: '13px', fontWeight: '500' },
  outStock: { color: '#ff4d4f', fontSize: '13px', fontWeight: '500' },
  link: { color: '#1890ff', fontSize: '12px', marginTop: '8px', marginBottom: '0' },
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { background: dark ? '#1f1f1f' : 'white', borderRadius: '16px', width: '800px', maxWidth: '90vw', maxHeight: '90vh', overflow: 'auto', position: 'relative', padding: '32px' },
  closeBtn: { position: 'absolute', top: '16px', right: '16px', background: dark ? '#333' : '#f0f0f0', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', fontSize: '16px', color: dark ? '#fff' : '#333' },
  modalContent: { display: 'flex', gap: '32px', flexWrap: 'wrap' },
  modalLeft: { flex: '0 0 280px' },
  modalImage: { width: '100%', borderRadius: '12px', objectFit: 'cover' },
  modalImagePlaceholder: { width: '100%', height: '280px', background: dark ? '#2a2a2a' : '#f0f2f5', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px', color: '#999' },
  modalRight: { flex: 1, minWidth: '200px' },
  modalName: { color: dark ? '#fff' : '#333', margin: '12px 0 8px', fontSize: '22px' },
  modalSku: { color: '#999', fontSize: '13px', marginBottom: '16px' },
  modalPriceRow: { display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' },
  modalPrice: { color: '#52c41a', fontWeight: 'bold', fontSize: '28px' },
  viewBtn: { width: '100%', padding: '14px', background: 'linear-gradient(135deg, #1890ff, #096dd9)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '15px', cursor: 'pointer', fontWeight: '500' },
});
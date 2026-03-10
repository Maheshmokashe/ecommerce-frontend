import { useState, useEffect, useRef, useCallback } from 'react';
import { searchProducts } from './api';

const PAGE_SIZE = 20;

export default function Search({ darkMode }) {
  const [q, setQ] = useState('');
  const [min, setMin] = useState('');
  const [max, setMax] = useState('');
  const [allResults, setAllResults] = useState([]);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const loaderRef = useRef(null);
  const s = getStyles(darkMode);

  const handleSearch = async () => {
    if (!q) return;
    setLoading(true);
    setVisibleCount(PAGE_SIZE);
    try {
      const res = await searchProducts(q, min, max);
      setAllResults(res.data.results);
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

  // Infinite scroll observer
  const handleObserver = useCallback((entries) => {
    const target = entries[0];
    if (target.isIntersecting && visibleCount < allResults.length) {
      setLoadingMore(true);
      setTimeout(() => {
        setVisibleCount(prev => Math.min(prev + PAGE_SIZE, allResults.length));
        setLoadingMore(false);
      }, 500);
    }
  }, [visibleCount, allResults.length]);

  useEffect(() => {
    const observer = new IntersectionObserver(handleObserver, { threshold: 0.1 });
    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [handleObserver]);

  const visibleResults = allResults.slice(0, visibleCount);

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
        <p style={s.count}>
          Showing <strong>{visibleResults.length}</strong> of <strong>{allResults.length}</strong> result(s) for "<strong>{q}</strong>"
        </p>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div style={s.grid}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} style={s.skeleton}>
              <div style={s.skeletonImage} />
              <div style={s.skeletonBody}>
                <div style={s.skeletonLine} />
                <div style={{ ...s.skeletonLine, width: '60%' }} />
                <div style={{ ...s.skeletonLine, width: '40%' }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Results Grid */}
      {!loading && (
        <div style={s.grid}>
          {visibleResults.map(p => (
            <div key={p.id} style={s.card} onClick={() => setSelectedProduct(p)}>
              {p.image_url
                ? <img src={p.image_url} alt={p.name} style={s.image} onError={e => e.target.style.display = 'none'} />
                : <div style={s.imagePlaceholder}>🖼️ No Image</div>
              }
              <div style={s.cardBody}>
                <span style={s.badge}>{p.category}</span>
                <h3 style={s.name}>{p.name}</h3>
                <p style={s.sku}>SKU: {p.sku}</p>
                {p.retailer && <p style={s.retailerTag}>🏪 {p.retailer}</p>}
                <div style={s.footer}>
                  <span style={s.price}>₹{p.price}</span>
                  <span style={p.stock > 0 ? s.inStock : s.outStock}>
                    {p.stock > 0 ? '✅ Available' : '❌ Out of Stock'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Infinite scroll loader */}
      <div ref={loaderRef} style={s.loaderBox}>
        {loadingMore && (
          <div style={s.loadingMore}>
            <div style={s.spinner} />
            <span style={s.loadingText}>Loading more products...</span>
          </div>
        )}
        {searched && !loading && visibleCount >= allResults.length && allResults.length > 0 && (
          <p style={s.endText}>✅ All {allResults.length} results loaded</p>
        )}
      </div>

      {/* No results */}
      {searched && !loading && allResults.length === 0 && (
        <div style={s.noResults}>
          <p style={{ fontSize: '48px', margin: '0 0 16px' }}>🔍</p>
          <p style={{ color: darkMode ? '#aaa' : '#888', fontSize: '16px' }}>No products found for "{q}"</p>
        </div>
      )}

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
                {selectedProduct.retailer && (
                  <p style={s.retailerTag}>🏪 {selectedProduct.retailer}</p>
                )}
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
  count: { color: dark ? '#aaa' : '#666', marginBottom: '16px', fontSize: '14px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px' },
  card: { background: dark ? '#1f1f1f' : 'white', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.08)', cursor: 'pointer' },
  image: { width: '100%', height: '200px', objectFit: 'cover' },
  imagePlaceholder: { width: '100%', height: '200px', background: dark ? '#2a2a2a' : '#f0f2f5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', fontSize: '14px' },
  cardBody: { padding: '12px' },
  badge: { display: 'inline-block', background: '#e6f7ff', color: '#1890ff', padding: '2px 10px', borderRadius: '20px', fontSize: '12px' },
  name: { margin: '8px 0 4px', color: dark ? '#fff' : '#333', fontSize: '15px' },
  sku: { color: '#999', fontSize: '12px', margin: '0 0 4px' },
  retailerTag: { color: '#1890ff', fontSize: '12px', margin: '0 0 12px' },
  footer: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `1px solid ${dark ? '#333' : '#f0f0f0'}`, paddingTop: '12px' },
  price: { color: '#52c41a', fontWeight: 'bold', fontSize: '18px' },
  inStock: { color: '#52c41a', fontSize: '13px', fontWeight: '500' },
  outStock: { color: '#ff4d4f', fontSize: '13px', fontWeight: '500' },
  // Skeleton
  skeleton: { background: dark ? '#1f1f1f' : 'white', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.08)' },
  skeletonImage: { width: '100%', height: '200px', background: dark ? '#2a2a2a' : '#f0f0f0', animation: 'pulse 1.5s infinite' },
  skeletonBody: { padding: '12px' },
  skeletonLine: { height: '14px', background: dark ? '#2a2a2a' : '#f0f0f0', borderRadius: '4px', marginBottom: '8px', width: '80%' },
  // Loader
  loaderBox: { display: 'flex', justifyContent: 'center', padding: '32px 0' },
  loadingMore: { display: 'flex', alignItems: 'center', gap: '12px' },
  spinner: { width: '24px', height: '24px', border: '3px solid #f0f0f0', borderTop: '3px solid #1890ff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  loadingText: { color: dark ? '#aaa' : '#888', fontSize: '14px' },
  endText: { color: dark ? '#aaa' : '#888', fontSize: '13px', textAlign: 'center' },
  noResults: { textAlign: 'center', padding: '60px 0' },
  // Modal
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { background: dark ? '#1f1f1f' : 'white', borderRadius: '16px', width: '800px', maxWidth: '90vw', maxHeight: '90vh', overflow: 'auto', position: 'relative', padding: '32px' },
  closeBtn: { position: 'absolute', top: '16px', right: '16px', background: dark ? '#333' : '#f0f0f0', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', fontSize: '16px', color: dark ? '#fff' : '#333' },
  modalContent: { display: 'flex', gap: '32px', flexWrap: 'wrap' },
  modalLeft: { flex: '0 0 280px' },
  modalImage: { width: '100%', borderRadius: '12px', objectFit: 'cover' },
  modalImagePlaceholder: { width: '100%', height: '280px', background: dark ? '#2a2a2a' : '#f0f2f5', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px', color: '#999' },
  modalRight: { flex: 1, minWidth: '200px' },
  modalName: { color: dark ? '#fff' : '#333', margin: '12px 0 8px', fontSize: '22px' },
  modalSku: { color: '#999', fontSize: '13px', marginBottom: '8px' },
  modalPriceRow: { display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' },
  modalPrice: { color: '#52c41a', fontWeight: 'bold', fontSize: '28px' },
  viewBtn: { width: '100%', padding: '14px', background: 'linear-gradient(135deg, #1890ff, #096dd9)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '15px', cursor: 'pointer', fontWeight: '500' },
});
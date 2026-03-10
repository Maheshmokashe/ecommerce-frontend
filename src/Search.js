import { useState, useEffect, useRef, useCallback } from 'react';
import { searchProductsAdvanced, getSearchFilters, formatPrice, getDiscount } from './api';

const PAGE_SIZE = 20;

export default function Search({ darkMode }) {
  const [q, setQ] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [selectedRetailer, setSelectedRetailer] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [filters, setFilters] = useState({ retailers: [], brands: [], colors: [], sizes: [] });
  const [allResults, setAllResults] = useState([]);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const loaderRef = useRef(null);
  const s = getStyles(darkMode);

  useEffect(() => {
    getSearchFilters().then(res => setFilters(res.data));
  }, []);

  const handleSearch = async () => {
    if (!q && !selectedRetailer && !selectedBrand && !selectedColor && !selectedSize) return;
    setLoading(true);
    setVisibleCount(PAGE_SIZE);
    try {
      const params = {
        limit: 500,
        ...(q && { q }),
        ...(minPrice && { min_price: minPrice }),
        ...(maxPrice && { max_price: maxPrice }),
        ...(selectedRetailer && { retailer: selectedRetailer }),
        ...(selectedBrand && { brand: selectedBrand }),
        ...(selectedColor && { color: selectedColor }),
        ...(selectedSize && { size: selectedSize }),
        ...(inStockOnly && { in_stock: true }),
      };
      const res = await searchProductsAdvanced(params);
      setAllResults(res.data.results);
      setSearched(true);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setSelectedRetailer(''); setSelectedBrand('');
    setSelectedColor(''); setSelectedSize('');
    setMinPrice(''); setMaxPrice('');
    setInStockOnly(false);
  };

  const activeFilterCount = [selectedRetailer, selectedBrand, selectedColor, selectedSize,
    minPrice, maxPrice, inStockOnly].filter(Boolean).length;

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

  const PriceDisplay = ({ p }) => {
    const disc = getDiscount(p.price, p.sale_price);
    const currency = p.currency || '₹';
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {disc && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={s.originalPrice}>{formatPrice(p.price, currency)}</span>
            <span style={s.discountBadge}>-{disc}%</span>
          </div>
        )}
        <span style={{ ...s.price, color: disc ? '#ff4d4f' : '#52c41a' }}>
          {formatPrice(p.sale_price || p.price, currency)}
        </span>
      </div>
    );
  };

  return (
    <div style={s.container}>
      <h2 style={s.heading}>🔍 Advanced Search</h2>

      {/* Main Search Bar */}
      <div style={s.searchRow}>
        <input style={s.searchInput}
          placeholder="Search keyword (e.g. dress, ring, shoes)..."
          value={q} onChange={e => setQ(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()} />
        <button style={s.filterToggleBtn} onClick={() => setShowFilters(!showFilters)}>
          🎛️ Filters {activeFilterCount > 0 && <span style={s.filterCount}>{activeFilterCount}</span>}
        </button>
        <button style={s.searchBtn} onClick={handleSearch}>
          {loading ? '⏳' : '🔍 Search'}
        </button>
      </div>

      {/* Advanced Filter Panel */}
      {showFilters && (
        <div style={s.filterPanel}>
          <div style={s.filterGrid}>
            <div style={s.filterGroup}>
              <label style={s.filterLabel}>🏪 Retailer</label>
              <select style={s.filterSelect} value={selectedRetailer}
                onChange={e => setSelectedRetailer(e.target.value)}>
                <option value="">All Retailers</option>
                {filters.retailers.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div style={s.filterGroup}>
              <label style={s.filterLabel}>🏷️ Brand</label>
              <select style={s.filterSelect} value={selectedBrand}
                onChange={e => setSelectedBrand(e.target.value)}>
                <option value="">All Brands</option>
                {filters.brands.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div style={s.filterGroup}>
              <label style={s.filterLabel}>🎨 Color</label>
              <select style={s.filterSelect} value={selectedColor}
                onChange={e => setSelectedColor(e.target.value)}>
                <option value="">All Colors</option>
                {filters.colors.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div style={s.filterGroup}>
              <label style={s.filterLabel}>📏 Size</label>
              <select style={s.filterSelect} value={selectedSize}
                onChange={e => setSelectedSize(e.target.value)}>
                <option value="">All Sizes</option>
                {filters.sizes.map(sz => <option key={sz} value={sz}>{sz}</option>)}
              </select>
            </div>
            <div style={s.filterGroup}>
              <label style={s.filterLabel}>💰 Min Price</label>
              <input style={s.filterInput} type="number" placeholder="Min"
                value={minPrice} onChange={e => setMinPrice(e.target.value)} />
            </div>
            <div style={s.filterGroup}>
              <label style={s.filterLabel}>💰 Max Price</label>
              <input style={s.filterInput} type="number" placeholder="Max"
                value={maxPrice} onChange={e => setMaxPrice(e.target.value)} />
            </div>
          </div>
          <div style={s.filterBottom}>
            <label style={s.checkboxLabel}>
              <input type="checkbox" checked={inStockOnly}
                onChange={e => setInStockOnly(e.target.checked)}
                style={{ marginRight: '8px' }} />
              ✅ In Stock Only
            </label>
            {activeFilterCount > 0 && (
              <button style={s.clearBtn} onClick={clearFilters}>✕ Clear All Filters</button>
            )}
          </div>
        </div>
      )}

      {/* Active filter tags */}
      {activeFilterCount > 0 && (
        <div style={s.activeTags}>
          {selectedRetailer && <span style={s.activeTag}>🏪 {selectedRetailer} <button style={s.tagX} onClick={() => setSelectedRetailer('')}>✕</button></span>}
          {selectedBrand && <span style={s.activeTag}>🏷️ {selectedBrand} <button style={s.tagX} onClick={() => setSelectedBrand('')}>✕</button></span>}
          {selectedColor && <span style={s.activeTag}>🎨 {selectedColor} <button style={s.tagX} onClick={() => setSelectedColor('')}>✕</button></span>}
          {selectedSize && <span style={s.activeTag}>📏 {selectedSize} <button style={s.tagX} onClick={() => setSelectedSize('')}>✕</button></span>}
          {minPrice && <span style={s.activeTag}>Min: {minPrice} <button style={s.tagX} onClick={() => setMinPrice('')}>✕</button></span>}
          {maxPrice && <span style={s.activeTag}>Max: {maxPrice} <button style={s.tagX} onClick={() => setMaxPrice('')}>✕</button></span>}
          {inStockOnly && <span style={s.activeTag}>✅ In Stock <button style={s.tagX} onClick={() => setInStockOnly(false)}>✕</button></span>}
        </div>
      )}

      {searched && (
        <p style={s.count}>
          Showing <strong>{visibleResults.length}</strong> of <strong>{allResults.length}</strong> result(s)
          {q && <> for "<strong>{q}</strong>"</>}
        </p>
      )}

      {/* Skeleton loading */}
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
          {visibleResults.map(p => {
            const disc = getDiscount(p.price, p.sale_price);
            return (
              <div key={p.id} style={s.card} onClick={() => setSelectedProduct(p)}>
                <div style={{ position: 'relative' }}>
                  {p.image_url
                    ? <img src={p.image_url} alt={p.name} style={s.image}
                        onError={e => e.target.style.display = 'none'} />
                    : <div style={s.imagePlaceholder}>🖼️ No Image</div>
                  }
                  {disc && <span style={s.saleBadge}>SALE -{disc}%</span>}
                </div>
                <div style={s.cardBody}>
                  <span style={s.badge}>{p.category}</span>
                  <h3 style={s.name}>{p.name}</h3>
                  <p style={s.sku}>SKU: {p.sku}</p>
                  {p.retailer && <p style={s.retailerTag}>🏪 {p.retailer}</p>}
                  {p.brand && <p style={s.brandTag}>🏷️ {p.brand}</p>}
                  <div style={s.footer}>
                    <PriceDisplay p={p} />
                    <span style={p.stock > 0 ? s.inStock : s.outStock}>
                      {p.stock > 0 ? '✅' : '❌'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
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
          <p style={{ color: darkMode ? '#aaa' : '#888', fontSize: '16px' }}>
            No products found. Try adjusting your filters.
          </p>
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
                {selectedProduct.retailer && <p style={s.retailerTag}>🏪 {selectedProduct.retailer}</p>}
                {selectedProduct.brand && <p style={s.brandTag}>🏷️ {selectedProduct.brand}</p>}
                <div style={s.modalPriceRow}>
                  <PriceDisplay p={selectedProduct} />
                  <span style={selectedProduct.stock > 0 ? s.inStock : s.outStock}>
                    {selectedProduct.stock > 0 ? '✅ Available' : '❌ Out of Stock'}
                  </span>
                </div>
                {selectedProduct.colors && (
                  <div style={s.infoBox}>
                    <h4 style={s.infoTitle}>🎨 Colors</h4>
                    <div style={s.tagRow}>
                      {selectedProduct.colors.split(',').filter(Boolean).map((c, i) => (
                        <span key={i} style={s.colorTag}>{c.trim()}</span>
                      ))}
                    </div>
                  </div>
                )}
                {selectedProduct.sizes && (
                  <div style={s.infoBox}>
                    <h4 style={s.infoTitle}>📏 Sizes</h4>
                    <div style={s.tagRow}>
                      {selectedProduct.sizes.split(',').filter(Boolean).map((sz, i) => (
                        <span key={i} style={s.sizeTag}>{sz.trim()}</span>
                      ))}
                    </div>
                  </div>
                )}
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
  searchRow: { display: 'flex', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' },
  searchInput: { flex: 1, minWidth: '200px', padding: '12px 16px', borderRadius: '8px', border: `1px solid ${dark ? '#444' : '#ddd'}`, fontSize: '14px', background: dark ? '#1f1f1f' : 'white', color: dark ? '#fff' : '#333' },
  searchBtn: { padding: '12px 28px', background: '#1890ff', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '500' },
  filterToggleBtn: { padding: '12px 20px', background: dark ? '#2a2a2a' : '#f0f2f5', color: dark ? '#fff' : '#333', border: `1px solid ${dark ? '#444' : '#ddd'}`, borderRadius: '8px', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' },
  filterCount: { background: '#1890ff', color: 'white', borderRadius: '50%', width: '20px', height: '20px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold' },
  filterPanel: { background: dark ? '#1f1f1f' : '#fafafa', border: `1px solid ${dark ? '#333' : '#e8e8e8'}`, borderRadius: '12px', padding: '20px', marginBottom: '16px' },
  filterGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px', marginBottom: '16px' },
  filterGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  filterLabel: { fontSize: '12px', fontWeight: '600', color: dark ? '#aaa' : '#666' },
  filterSelect: { padding: '8px 12px', borderRadius: '6px', border: `1px solid ${dark ? '#444' : '#ddd'}`, fontSize: '13px', background: dark ? '#2a2a2a' : 'white', color: dark ? '#fff' : '#333', cursor: 'pointer' },
  filterInput: { padding: '8px 12px', borderRadius: '6px', border: `1px solid ${dark ? '#444' : '#ddd'}`, fontSize: '13px', background: dark ? '#2a2a2a' : 'white', color: dark ? '#fff' : '#333' },
  filterBottom: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' },
  checkboxLabel: { display: 'flex', alignItems: 'center', fontSize: '14px', color: dark ? '#ddd' : '#555', cursor: 'pointer' },
  clearBtn: { padding: '8px 16px', background: '#ff4d4f', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' },
  activeTags: { display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' },
  activeTag: { background: '#e6f7ff', color: '#1890ff', padding: '4px 10px', borderRadius: '20px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' },
  tagX: { background: 'none', border: 'none', color: '#1890ff', cursor: 'pointer', fontSize: '12px', padding: 0 },
  count: { color: dark ? '#aaa' : '#666', marginBottom: '16px', fontSize: '14px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px' },
  card: { background: dark ? '#1f1f1f' : 'white', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.08)', cursor: 'pointer' },
  image: { width: '100%', height: '200px', objectFit: 'cover' },
  imagePlaceholder: { width: '100%', height: '200px', background: dark ? '#2a2a2a' : '#f0f2f5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' },
  saleBadge: { position: 'absolute', top: '10px', left: '10px', background: '#ff4d4f', color: 'white', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' },
  cardBody: { padding: '12px' },
  badge: { display: 'inline-block', background: '#e6f7ff', color: '#1890ff', padding: '2px 10px', borderRadius: '20px', fontSize: '12px' },
  name: { margin: '8px 0 4px', color: dark ? '#fff' : '#333', fontSize: '14px' },
  sku: { color: '#999', fontSize: '11px', margin: '0 0 4px' },
  retailerTag: { color: '#1890ff', fontSize: '12px', margin: '0 0 2px' },
  brandTag: { color: dark ? '#ddd' : '#555', fontSize: '12px', margin: '0 0 8px' },
  footer: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `1px solid ${dark ? '#333' : '#f0f0f0'}`, paddingTop: '10px' },
  price: { fontWeight: 'bold', fontSize: '18px' },
  originalPrice: { textDecoration: 'line-through', color: '#999', fontSize: '13px' },
  discountBadge: { background: '#ff4d4f', color: 'white', padding: '1px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold' },
  inStock: { color: '#52c41a', fontSize: '12px', fontWeight: '500' },
  outStock: { color: '#ff4d4f', fontSize: '12px', fontWeight: '500' },
  skeleton: { background: dark ? '#1f1f1f' : 'white', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.08)' },
  skeletonImage: { width: '100%', height: '200px', background: dark ? '#2a2a2a' : '#f0f0f0' },
  skeletonBody: { padding: '12px' },
  skeletonLine: { height: '14px', background: dark ? '#2a2a2a' : '#f0f0f0', borderRadius: '4px', marginBottom: '8px', width: '80%' },
  loaderBox: { display: 'flex', justifyContent: 'center', padding: '32px 0' },
  loadingMore: { display: 'flex', alignItems: 'center', gap: '12px' },
  spinner: { width: '24px', height: '24px', border: '3px solid #f0f0f0', borderTop: '3px solid #1890ff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  loadingText: { color: dark ? '#aaa' : '#888', fontSize: '14px' },
  endText: { color: dark ? '#aaa' : '#888', fontSize: '13px' },
  noResults: { textAlign: 'center', padding: '60px 0' },
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
  modalPriceRow: { display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' },
  infoBox: { background: dark ? '#2a2a2a' : '#f9f9f9', padding: '12px', borderRadius: '8px', marginBottom: '12px' },
  infoTitle: { color: dark ? '#fff' : '#333', margin: '0 0 8px', fontSize: '14px' },
  tagRow: { display: 'flex', flexWrap: 'wrap', gap: '6px' },
  colorTag: { background: '#fff0f6', color: '#eb2f96', padding: '3px 10px', borderRadius: '20px', fontSize: '12px' },
  sizeTag: { background: '#f0f5ff', color: '#2f54eb', padding: '3px 10px', borderRadius: '20px', fontSize: '12px' },
  viewBtn: { width: '100%', padding: '14px', background: 'linear-gradient(135deg, #1890ff, #096dd9)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '15px', cursor: 'pointer', fontWeight: '500' },
});
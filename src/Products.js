import { useEffect, useState } from 'react';
import { getProducts, getCategories, formatPrice, getDiscount } from './api';

const PAGE_SIZE = 20;

export default function Products({ darkMode }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedBrand, setSelectedBrand] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState('default');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [activeImage, setActiveImage] = useState('');
  const [compareList, setCompareList] = useState([]);
  const [showCompare, setShowCompare] = useState(false);

  const retailerParam = new URLSearchParams(window.location.search).get('retailer') || 'All';
  const [selectedRetailer] = useState(retailerParam);
  const s = getStyles(darkMode);

  useEffect(() => {
    getProducts().then(res => setProducts(res.data));
    getCategories().then(res => setCategories(res.data));
  }, []);

  const brands = ['All', ...new Set(products.map(p => p.brand).filter(Boolean).sort())];

  const effectivePrice = (p) => p.sale_price ? parseFloat(p.sale_price) : parseFloat(p.price);

  const filtered = products
    .filter(p => selectedRetailer === 'All' || p.retailer_name === selectedRetailer)
    .filter(p => selectedCategory === 'All' || p.category_name === selectedCategory)
    .filter(p => selectedBrand === 'All' || p.brand === selectedBrand)
    .filter(p => !minPrice || effectivePrice(p) >= parseFloat(minPrice))
    .filter(p => !maxPrice || effectivePrice(p) <= parseFloat(maxPrice))
    .sort((a, b) => {
      if (sortBy === 'price_asc') return effectivePrice(a) - effectivePrice(b);
      if (sortBy === 'price_desc') return effectivePrice(b) - effectivePrice(a);
      if (sortBy === 'name_asc') return a.name.localeCompare(b.name);
      if (sortBy === 'newest') return new Date(b.created_at) - new Date(a.created_at);
      return 0;
    });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const clearFilters = () => {
    setSelectedCategory('All'); setSelectedBrand('All');
    setMinPrice(''); setMaxPrice(''); setSortBy('default'); setCurrentPage(1);
  };

  const openModal = (p) => { setSelectedProduct(p); setActiveImage(p.image_url); };

  const toggleCompare = (e, p) => {
    e.stopPropagation();
    setCompareList(prev => {
      if (prev.find(x => x.id === p.id)) return prev.filter(x => x.id !== p.id);
      if (prev.length >= 3) return [...prev.slice(1), p];
      return [...prev, p];
    });
  };

  const exportCSV = () => {
    const headers = ['SKU', 'Name', 'Brand', 'Category', 'Retailer', 'Currency', 'Price', 'Sale Price', 'Discount %', 'Availability', 'Colors', 'Sizes', 'URL'];
    const rows = filtered.map(p => {
      const disc = getDiscount(p.price, p.sale_price);
      return [
        p.sku, `"${p.name}"`, p.brand, p.category_name, p.retailer_name,
        p.currency, p.price, p.sale_price || '', disc ? `${disc}%` : '',
        p.stock === 1 ? 'Available' : 'Out of Stock',
        `"${p.colors}"`, `"${p.sizes}"`, p.source_url
      ];
    });
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `products_export.csv`;
    a.click();
  };

  const getGalleryImages = (p) => {
    if (!p) return [];
    const imgs = [p.image_url].filter(Boolean);
    if (p.additional_images) {
      p.additional_images.split(',').filter(Boolean).forEach(img => {
        if (!imgs.includes(img)) imgs.push(img);
      });
    }
    return imgs.slice(0, 6);
  };

  const PriceDisplay = ({ p, large = false }) => {
    const disc = getDiscount(p.price, p.sale_price);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {disc && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ ...s.originalPrice, fontSize: large ? '16px' : '12px' }}>
              {formatPrice(p.price, p.currency)}
            </span>
            <span style={s.discountBadge}>-{disc}%</span>
          </div>
        )}
        <span style={{ ...s.price, fontSize: large ? '28px' : '18px', color: disc ? '#ff4d4f' : '#52c41a' }}>
          {formatPrice(p.sale_price || p.price, p.currency)}
        </span>
      </div>
    );
  };

  return (
    <div style={s.container}>
      <div style={s.headerRow}>
        <div>
          <h2 style={s.heading}>📦 All Products</h2>
          {selectedRetailer !== 'All' && (
            <p style={s.retailerFilter}>🏪 Filtering by: {selectedRetailer}</p>
          )}
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {compareList.length >= 2 && (
            <button style={s.compareBtn} onClick={() => setShowCompare(true)}>
              ⚖️ Compare ({compareList.length})
            </button>
          )}
          <button style={s.exportBtn} onClick={exportCSV}>⬇️ Export CSV</button>
        </div>
      </div>

      <div style={s.filterRow}>
        <select style={s.select} value={selectedCategory} onChange={e => { setSelectedCategory(e.target.value); setCurrentPage(1); }}>
          <option value="All">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
        </select>
        <select style={s.select} value={selectedBrand} onChange={e => { setSelectedBrand(e.target.value); setCurrentPage(1); }}>
          <option value="All">All Brands</option>
          {brands.filter(b => b !== 'All').map(b => <option key={b} value={b}>{b}</option>)}
        </select>
        <input style={s.priceInput} type="number" placeholder="Min Price"
          value={minPrice} onChange={e => { setMinPrice(e.target.value); setCurrentPage(1); }} />
        <input style={s.priceInput} type="number" placeholder="Max Price"
          value={maxPrice} onChange={e => { setMaxPrice(e.target.value); setCurrentPage(1); }} />
        <select style={s.sortSelect} value={sortBy} onChange={e => { setSortBy(e.target.value); setCurrentPage(1); }}>
          <option value="default">Sort: Default</option>
          <option value="price_asc">Price: Low → High</option>
          <option value="price_desc">Price: High → Low</option>
          <option value="name_asc">Name: A → Z</option>
          <option value="newest">Newest First</option>
        </select>
        <button style={s.clearBtn} onClick={clearFilters}>✕ Clear</button>
      </div>

      <p style={s.count}>
        Showing {Math.min((currentPage - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length} products
        {compareList.length > 0 && <span style={s.compareHint}> · {compareList.length} selected for compare</span>}
      </p>

      <div style={s.grid}>
        {paginated.map(p => {
          const isCompared = compareList.find(x => x.id === p.id);
          const disc = getDiscount(p.price, p.sale_price);
          return (
            <div key={p.id} style={{ ...s.card, ...(isCompared ? s.cardSelected : {}) }}
              onClick={() => openModal(p)}>
              <div style={{ position: 'relative' }}>
                {p.image_url
                  ? <img src={p.image_url} alt={p.name} style={s.image} onError={e => e.target.style.display = 'none'} />
                  : <div style={s.imagePlaceholder}>🖼️ No Image</div>
                }
                {disc && <span style={s.saleBadge}>SALE -{disc}%</span>}
              </div>
              <div style={s.cardBody}>
                <span style={s.badge}>{p.category_name}</span>
                <h3 style={s.name}>{p.name}</h3>
                <p style={s.sku}>SKU: {p.sku}</p>
                {p.brand && <p style={s.brandTag}>🏷️ {p.brand}</p>}
                {p.colors && <p style={s.colorTag}>🎨 {p.colors.split(',').slice(0, 2).join(', ')}</p>}
                <div style={s.footer}>
                  <PriceDisplay p={p} />
                  <span style={p.stock === 1 ? s.inStock : s.outStock}>
                    {p.stock === 1 ? '✅' : '❌'}
                  </span>
                </div>
                <button style={isCompared ? s.compareBtnActive : s.compareBtnSmall}
                  onClick={e => toggleCompare(e, p)}>
                  {isCompared ? '✓ Added to Compare' : '+ Compare'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      <div style={s.pagination}>
        <button style={s.pageBtn} onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>«</button>
        <button style={s.pageBtn} onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}>‹</button>
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          let page;
          if (totalPages <= 5) page = i + 1;
          else if (currentPage <= 3) page = i + 1;
          else if (currentPage >= totalPages - 2) page = totalPages - 4 + i;
          else page = currentPage - 2 + i;
          return (
            <button key={page} style={{ ...s.pageBtn, ...(currentPage === page ? s.activePage : {}) }}
              onClick={() => setCurrentPage(page)}>{page}</button>
          );
        })}
        <button style={s.pageBtn} onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages}>›</button>
        <button style={s.pageBtn} onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}>»</button>
      </div>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div style={s.overlay} onClick={() => setSelectedProduct(null)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <button style={s.closeBtn} onClick={() => setSelectedProduct(null)}>✕</button>
            <div style={s.modalContent}>
              <div style={s.modalLeft}>
                <img src={activeImage || selectedProduct.image_url} alt={selectedProduct.name}
                  style={s.modalImage} onError={e => e.target.style.display = 'none'} />
                {getGalleryImages(selectedProduct).length > 1 && (
                  <div style={s.thumbnails}>
                    {getGalleryImages(selectedProduct).map((img, i) => (
                      <img key={i} src={img} alt={`view-${i}`}
                        style={{ ...s.thumb, ...(activeImage === img ? s.thumbActive : {}) }}
                        onClick={() => setActiveImage(img)}
                        onError={e => e.target.style.display = 'none'} />
                    ))}
                  </div>
                )}
              </div>
              <div style={s.modalRight}>
                <span style={s.badge}>{selectedProduct.category_name}</span>
                <h2 style={s.modalName}>{selectedProduct.name}</h2>
                <p style={s.modalSku}>SKU: {selectedProduct.sku}</p>
                {selectedProduct.retailer_name && <p style={s.retailerTag}>🏪 {selectedProduct.retailer_name}</p>}
                {selectedProduct.brand && <p style={s.brandTag}>🏷️ Brand: <strong>{selectedProduct.brand}</strong></p>}

                <div style={s.modalPriceRow}>
                  <PriceDisplay p={selectedProduct} large={true} />
                  <span style={selectedProduct.stock === 1 ? s.inStock : s.outStock}>
                    {selectedProduct.stock === 1 ? '✅ Available' : '❌ Out of Stock'}
                  </span>
                </div>

                {selectedProduct.colors && (
                  <div style={s.infoBox}>
                    <h4 style={s.infoTitle}>🎨 Colors</h4>
                    <div style={s.tagRow}>
                      {selectedProduct.colors.split(',').filter(Boolean).map((c, i) => (
                        <span key={i} style={s.tag}>{c.trim()}</span>
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

                {selectedProduct.description && (
                  <div style={s.descBox}>
                    <h4 style={s.descTitle}>📝 Description</h4>
                    <p style={s.descText}>{selectedProduct.description.slice(0, 300)}...</p>
                  </div>
                )}

                {selectedProduct.source_url && (
                  <button style={s.viewBtn} onClick={() => window.open(selectedProduct.source_url, '_blank')}>
                    🔗 View Product →
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Compare Modal */}
      {showCompare && (
        <div style={s.overlay} onClick={() => setShowCompare(false)}>
          <div style={{ ...s.modal, width: '95vw', maxWidth: '1100px' }} onClick={e => e.stopPropagation()}>
            <button style={s.closeBtn} onClick={() => setShowCompare(false)}>✕</button>
            <h2 style={{ ...s.modalName, marginBottom: '24px' }}>⚖️ Compare Products</h2>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${compareList.length}, 1fr)`, gap: '20px' }}>
              {compareList.map(p => (
                <div key={p.id} style={s.compareCard}>
                  {p.image_url
                    ? <img src={p.image_url} alt={p.name} style={s.compareImage} onError={e => e.target.style.display = 'none'} />
                    : <div style={{ ...s.imagePlaceholder, height: '160px' }}>🖼️</div>
                  }
                  <h3 style={{ ...s.modalName, fontSize: '15px' }}>{p.name}</h3>
                  <table style={s.compareTable}>
                    <tbody>
                      <tr><td style={s.compareLabel}>SKU</td><td style={s.compareVal}>{p.sku}</td></tr>
                      <tr><td style={s.compareLabel}>Brand</td><td style={s.compareVal}>{p.brand || '—'}</td></tr>
                      <tr><td style={s.compareLabel}>Category</td><td style={s.compareVal}>{p.category_name}</td></tr>
                      <tr><td style={s.compareLabel}>Retailer</td><td style={s.compareVal}>{p.retailer_name}</td></tr>
                      <tr>
                        <td style={s.compareLabel}>Price</td>
                        <td style={s.compareVal}>
                          {p.sale_price ? (
                            <span>
                              <span style={{ textDecoration: 'line-through', color: '#999', marginRight: '6px' }}>
                                {formatPrice(p.price, p.currency)}
                              </span>
                              <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>
                                {formatPrice(p.sale_price, p.currency)}
                              </span>
                            </span>
                          ) : (
                            <span style={{ color: '#52c41a', fontWeight: 'bold' }}>
                              {formatPrice(p.price, p.currency)}
                            </span>
                          )}
                        </td>
                      </tr>
                      <tr><td style={s.compareLabel}>Discount</td>
                        <td style={{ ...s.compareVal, color: '#ff4d4f', fontWeight: 'bold' }}>
                          {getDiscount(p.price, p.sale_price) ? `${getDiscount(p.price, p.sale_price)}% OFF` : '—'}
                        </td>
                      </tr>
                      <tr><td style={s.compareLabel}>Colors</td><td style={s.compareVal}>{p.colors || '—'}</td></tr>
                      <tr><td style={s.compareLabel}>Sizes</td><td style={s.compareVal}>{p.sizes || '—'}</td></tr>
                      <tr><td style={s.compareLabel}>Status</td>
                        <td style={p.stock === 1 ? s.inStock : s.outStock}>
                          {p.stock === 1 ? '✅ Available' : '❌ Out of Stock'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  {p.source_url && (
                    <button style={{ ...s.viewBtn, marginTop: '12px', padding: '10px' }}
                      onClick={() => window.open(p.source_url, '_blank')}>
                      🔗 View →
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const getStyles = (dark) => ({
  container: { padding: '24px' },
  headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' },
  heading: { color: dark ? '#fff' : '#333', margin: 0 },
  retailerFilter: { color: '#1890ff', fontSize: '14px', margin: '4px 0 0' },
  exportBtn: { padding: '10px 16px', background: '#52c41a', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' },
  compareBtn: { padding: '10px 16px', background: '#722ed1', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' },
  filterRow: { display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' },
  select: { padding: '10px 12px', borderRadius: '6px', border: `1px solid ${dark ? '#444' : '#ddd'}`, fontSize: '13px', cursor: 'pointer', minWidth: '150px', background: dark ? '#1f1f1f' : 'white', color: dark ? '#fff' : '#333' },
  sortSelect: { padding: '10px 12px', borderRadius: '6px', border: `1px solid ${dark ? '#444' : '#ddd'}`, fontSize: '13px', cursor: 'pointer', background: dark ? '#1f1f1f' : 'white', color: dark ? '#fff' : '#333' },
  priceInput: { padding: '10px', borderRadius: '6px', border: `1px solid ${dark ? '#444' : '#ddd'}`, fontSize: '13px', width: '110px', background: dark ? '#1f1f1f' : 'white', color: dark ? '#fff' : '#333' },
  clearBtn: { padding: '10px 16px', background: '#ff4d4f', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' },
  count: { color: dark ? '#aaa' : '#888', fontSize: '13px', marginBottom: '20px' },
  compareHint: { color: '#722ed1', fontWeight: '500' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px' },
  card: { background: dark ? '#1f1f1f' : 'white', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.08)', cursor: 'pointer', border: '2px solid transparent' },
  cardSelected: { border: '2px solid #722ed1', boxShadow: '0 0 0 3px rgba(114,46,209,0.15)' },
  image: { width: '100%', height: '200px', objectFit: 'cover' },
  imagePlaceholder: { width: '100%', height: '200px', background: dark ? '#2a2a2a' : '#f0f2f5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' },
  saleBadge: { position: 'absolute', top: '10px', left: '10px', background: '#ff4d4f', color: 'white', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' },
  cardBody: { padding: '12px' },
  badge: { display: 'inline-block', background: '#e6f7ff', color: '#1890ff', padding: '2px 10px', borderRadius: '20px', fontSize: '12px' },
  name: { margin: '8px 0 4px', color: dark ? '#fff' : '#333', fontSize: '14px' },
  sku: { color: '#999', fontSize: '11px', margin: '0 0 4px' },
  brandTag: { color: dark ? '#ddd' : '#555', fontSize: '12px', margin: '0 0 4px' },
  colorTag: { color: dark ? '#aaa' : '#888', fontSize: '11px', margin: '0 0 8px' },
  footer: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `1px solid ${dark ? '#333' : '#f0f0f0'}`, paddingTop: '10px', marginBottom: '10px' },
  price: { fontWeight: 'bold' },
  originalPrice: { textDecoration: 'line-through', color: '#999' },
  discountBadge: { background: '#ff4d4f', color: 'white', padding: '1px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold' },
  inStock: { color: '#52c41a', fontSize: '12px', fontWeight: '500' },
  outStock: { color: '#ff4d4f', fontSize: '12px', fontWeight: '500' },
  compareBtnSmall: { width: '100%', padding: '6px', background: 'transparent', border: `1px solid ${dark ? '#444' : '#ddd'}`, borderRadius: '6px', cursor: 'pointer', fontSize: '12px', color: dark ? '#aaa' : '#666' },
  compareBtnActive: { width: '100%', padding: '6px', background: '#f9f0ff', border: '1px solid #722ed1', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', color: '#722ed1', fontWeight: '500' },
  pagination: { display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '32px', flexWrap: 'wrap' },
  pageBtn: { padding: '8px 14px', borderRadius: '6px', border: `1px solid ${dark ? '#444' : '#ddd'}`, background: dark ? '#1f1f1f' : 'white', color: dark ? '#fff' : '#333', cursor: 'pointer', fontSize: '14px' },
  activePage: { background: '#1890ff', color: 'white', border: '1px solid #1890ff' },
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { background: dark ? '#1f1f1f' : 'white', borderRadius: '16px', width: '860px', maxWidth: '95vw', maxHeight: '90vh', overflow: 'auto', position: 'relative', padding: '32px' },
  closeBtn: { position: 'absolute', top: '16px', right: '16px', background: dark ? '#333' : '#f0f0f0', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', fontSize: '16px', color: dark ? '#fff' : '#333' },
  modalContent: { display: 'flex', gap: '32px', flexWrap: 'wrap' },
  modalLeft: { flex: '0 0 300px' },
  modalImage: { width: '100%', borderRadius: '12px', objectFit: 'cover', marginBottom: '12px' },
  thumbnails: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  thumb: { width: '56px', height: '56px', objectFit: 'cover', borderRadius: '8px', cursor: 'pointer', border: '2px solid transparent', opacity: 0.7 },
  thumbActive: { border: '2px solid #1890ff', opacity: 1 },
  modalRight: { flex: 1, minWidth: '200px' },
  modalName: { color: dark ? '#fff' : '#333', margin: '12px 0 8px', fontSize: '20px' },
  modalSku: { color: '#999', fontSize: '13px', marginBottom: '8px' },
  retailerTag: { color: '#1890ff', fontSize: '13px', marginBottom: '8px' },
  modalPriceRow: { display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' },
  infoBox: { background: dark ? '#2a2a2a' : '#f9f9f9', padding: '12px', borderRadius: '8px', marginBottom: '12px' },
  infoTitle: { color: dark ? '#fff' : '#333', margin: '0 0 8px', fontSize: '14px' },
  tagRow: { display: 'flex', flexWrap: 'wrap', gap: '6px' },
  tag: { background: '#fff0f6', color: '#eb2f96', padding: '3px 10px', borderRadius: '20px', fontSize: '12px' },
  sizeTag: { background: '#f0f5ff', color: '#2f54eb', padding: '3px 10px', borderRadius: '20px', fontSize: '12px' },
  descBox: { background: dark ? '#2a2a2a' : '#f9f9f9', padding: '12px', borderRadius: '8px', marginBottom: '16px' },
  descTitle: { color: dark ? '#fff' : '#333', margin: '0 0 8px', fontSize: '14px' },
  descText: { color: dark ? '#aaa' : '#666', fontSize: '13px', lineHeight: '1.6', margin: 0 },
  viewBtn: { width: '100%', padding: '14px', background: 'linear-gradient(135deg, #1890ff, #096dd9)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '15px', cursor: 'pointer', fontWeight: '500' },
  compareCard: { background: dark ? '#2a2a2a' : '#f9f9f9', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column' },
  compareImage: { width: '100%', height: '160px', objectFit: 'cover', borderRadius: '8px', marginBottom: '12px' },
  compareTable: { width: '100%', borderCollapse: 'collapse', marginTop: '12px' },
  compareLabel: { color: dark ? '#aaa' : '#888', fontSize: '12px', padding: '5px 0', width: '40%' },
  compareVal: { color: dark ? '#fff' : '#333', fontSize: '12px', padding: '5px 0' },
});
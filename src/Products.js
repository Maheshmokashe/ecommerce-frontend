import { useEffect, useState } from 'react';
import { getProducts, getCategories } from './api';

const PAGE_SIZE = 20;

export default function Products({ darkMode }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Read retailer from URL query param
  const retailerParam = new URLSearchParams(window.location.search).get('retailer') || 'All';
  const [selectedRetailer] = useState(retailerParam);

  const s = getStyles(darkMode);

  useEffect(() => {
    getProducts().then(res => setProducts(res.data));
    getCategories().then(res => setCategories(res.data));
  }, []);

  const filtered = products
    .filter(p => selectedRetailer === 'All' || p.retailer_name === selectedRetailer)
    .filter(p => selectedCategory === 'All' || p.category_name === selectedCategory)
    .filter(p => !minPrice || parseFloat(p.price) >= parseFloat(minPrice))
    .filter(p => !maxPrice || parseFloat(p.price) <= parseFloat(maxPrice));

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleCategory = (cat) => { setSelectedCategory(cat); setCurrentPage(1); };
  const handleMinPrice = (val) => { setMinPrice(val); setCurrentPage(1); };
  const handleMaxPrice = (val) => { setMaxPrice(val); setCurrentPage(1); };
  const clearFilters = () => { setSelectedCategory('All'); setMinPrice(''); setMaxPrice(''); setCurrentPage(1); };

  const exportCSV = () => {
    const headers = ['SKU', 'Name', 'Category', 'Retailer', 'Price', 'Availability', 'URL'];
    const rows = filtered.map(p => [
      p.sku, `"${p.name}"`, p.category_name, p.retailer_name, p.price,
      p.stock === 1 ? 'Available' : 'Out of Stock', p.source_url
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `products_${selectedRetailer}_${selectedCategory}.csv`;
    a.click();
  };

  return (
    <div style={s.container}>

      {/* Header */}
      <div style={s.headerRow}>
        <div>
          <h2 style={s.heading}>📦 All Products</h2>
          {selectedRetailer !== 'All' && (
            <p style={s.retailerFilter}>🏪 Filtering by: {selectedRetailer}</p>
          )}
        </div>
        <button style={s.exportBtn} onClick={exportCSV}>⬇️ Export CSV</button>
      </div>

      {/* Filters */}
      <div style={s.filterRow}>
        <select style={s.select} value={selectedCategory} onChange={e => handleCategory(e.target.value)}>
          <option value="All">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
        </select>
        <input style={s.priceInput} type="number" placeholder="Min Price ₹"
          value={minPrice} onChange={e => handleMinPrice(e.target.value)} />
        <input style={s.priceInput} type="number" placeholder="Max Price ₹"
          value={maxPrice} onChange={e => handleMaxPrice(e.target.value)} />
        <button style={s.clearBtn} onClick={clearFilters}>✕ Clear</button>
      </div>

      <p style={s.count}>
        Showing {Math.min((currentPage - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length} products
      </p>

      {/* Product Grid */}
      <div style={s.grid}>
        {paginated.map(p => (
          <div key={p.id} style={s.card} onClick={() => setSelectedProduct(p)}>
            {p.image_url
              ? <img src={p.image_url} alt={p.name} style={s.image} onError={e => e.target.style.display = 'none'} />
              : <div style={s.imagePlaceholder}>🖼️ No Image</div>
            }
            <div style={s.cardBody}>
              <span style={s.badge}>{p.category_name}</span>
              <h3 style={s.name}>{p.name}</h3>
              <p style={s.sku}>SKU: {p.sku}</p>
              <div style={s.footer}>
                <span style={s.price}>₹{p.price}</span>
                <span style={p.stock === 1 ? s.inStock : s.outStock}>
                  {p.stock === 1 ? '✅ Available' : '❌ Out of Stock'}
                </span>
              </div>
            </div>
          </div>
        ))}
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
            <button key={page}
              style={{ ...s.pageBtn, ...(currentPage === page ? s.activePage : {}) }}
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
                {selectedProduct.image_url
                  ? <img src={selectedProduct.image_url} alt={selectedProduct.name} style={s.modalImage} onError={e => e.target.style.display = 'none'} />
                  : <div style={s.modalImagePlaceholder}>🖼️ No Image</div>
                }
              </div>
              <div style={s.modalRight}>
                <span style={s.badge}>{selectedProduct.category_name}</span>
                <h2 style={s.modalName}>{selectedProduct.name}</h2>
                <p style={s.modalSku}>SKU: {selectedProduct.sku}</p>
                {selectedProduct.retailer_name && (
                  <p style={s.retailerTag}>🏪 {selectedProduct.retailer_name}</p>
                )}
                <div style={s.modalPriceRow}>
                  <span style={s.modalPrice}>₹{selectedProduct.price}</span>
                  <span style={selectedProduct.stock === 1 ? s.inStock : s.outStock}>
                    {selectedProduct.stock === 1 ? '✅ Available' : '❌ Out of Stock'}
                  </span>
                </div>
                {selectedProduct.description && (
                  <div style={s.descBox}>
                    <h4 style={s.descTitle}>Description</h4>
                    <p style={s.descText}>{selectedProduct.description.slice(0, 300)}...</p>
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
  container: { padding: '24px', position: 'relative' },
  headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' },
  heading: { color: dark ? '#fff' : '#333', margin: 0 },
  retailerFilter: { color: '#1890ff', fontSize: '14px', margin: '4px 0 0' },
  exportBtn: { padding: '10px 16px', background: '#52c41a', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' },
  filterRow: { display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' },
  select: { padding: '10px 16px', borderRadius: '6px', border: `1px solid ${dark ? '#444' : '#ddd'}`, fontSize: '14px', cursor: 'pointer', minWidth: '200px', background: dark ? '#1f1f1f' : 'white', color: dark ? '#fff' : '#333' },
  priceInput: { padding: '10px', borderRadius: '6px', border: `1px solid ${dark ? '#444' : '#ddd'}`, fontSize: '14px', width: '130px', background: dark ? '#1f1f1f' : 'white', color: dark ? '#fff' : '#333' },
  clearBtn: { padding: '10px 16px', background: '#ff4d4f', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' },
  count: { color: dark ? '#aaa' : '#888', fontSize: '13px', marginBottom: '20px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px' },
  card: { background: dark ? '#1f1f1f' : 'white', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.08)', cursor: 'pointer' },
  image: { width: '100%', height: '200px', objectFit: 'cover' },
  imagePlaceholder: { width: '100%', height: '200px', background: dark ? '#2a2a2a' : '#f0f2f5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' },
  cardBody: { padding: '12px' },
  badge: { display: 'inline-block', background: '#e6f7ff', color: '#1890ff', padding: '2px 10px', borderRadius: '20px', fontSize: '12px' },
  name: { margin: '8px 0 4px', color: dark ? '#fff' : '#333', fontSize: '15px' },
  sku: { color: '#999', fontSize: '12px', margin: '0 0 12px' },
  footer: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `1px solid ${dark ? '#333' : '#f0f0f0'}`, paddingTop: '12px' },
  price: { color: '#52c41a', fontWeight: 'bold', fontSize: '18px' },
  inStock: { color: '#52c41a', fontSize: '13px', fontWeight: '500' },
  outStock: { color: '#ff4d4f', fontSize: '13px', fontWeight: '500' },
  pagination: { display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '32px', flexWrap: 'wrap' },
  pageBtn: { padding: '8px 14px', borderRadius: '6px', border: `1px solid ${dark ? '#444' : '#ddd'}`, background: dark ? '#1f1f1f' : 'white', color: dark ? '#fff' : '#333', cursor: 'pointer', fontSize: '14px' },
  activePage: { background: '#1890ff', color: 'white', border: '1px solid #1890ff' },
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { background: dark ? '#1f1f1f' : 'white', borderRadius: '16px', width: '800px', maxWidth: '90vw', maxHeight: '90vh', overflow: 'auto', position: 'relative', padding: '32px' },
  closeBtn: { position: 'absolute', top: '16px', right: '16px', background: dark ? '#333' : '#f0f0f0', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', fontSize: '16px', color: dark ? '#fff' : '#333' },
  modalContent: { display: 'flex', gap: '32px', flexWrap: 'wrap' },
  modalLeft: { flex: '0 0 280px' },
  modalImage: { width: '100%', borderRadius: '12px', objectFit: 'cover' },
  modalImagePlaceholder: { width: '100%', height: '280px', background: dark ? '#2a2a2a' : '#f0f2f5', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px', color: '#999', fontSize: '16px' },
  modalRight: { flex: 1, minWidth: '200px' },
  modalName: { color: dark ? '#fff' : '#333', margin: '12px 0 8px', fontSize: '22px' },
  modalSku: { color: '#999', fontSize: '13px', marginBottom: '8px' },
  retailerTag: { color: '#1890ff', fontSize: '13px', marginBottom: '16px' },
  modalPriceRow: { display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' },
  modalPrice: { color: '#52c41a', fontWeight: 'bold', fontSize: '28px' },
  descBox: { background: dark ? '#2a2a2a' : '#f9f9f9', padding: '16px', borderRadius: '8px', marginBottom: '20px' },
  descTitle: { color: dark ? '#fff' : '#333', margin: '0 0 8px' },
  descText: { color: dark ? '#aaa' : '#666', fontSize: '14px', lineHeight: '1.6', margin: 0 },
  viewBtn: { width: '100%', padding: '14px', background: 'linear-gradient(135deg, #1890ff, #096dd9)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '15px', cursor: 'pointer', fontWeight: '500' },
});
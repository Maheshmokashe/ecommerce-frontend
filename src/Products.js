import { useEffect, useState } from 'react';
import { getProducts, getCategories } from './api';

const PAGE_SIZE = 20;

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    getProducts().then(res => setProducts(res.data));
    getCategories().then(res => setCategories(res.data));
  }, []);

  const filtered = selectedCategory === 'All'
    ? products
    : products.filter(p => p.category_name === selectedCategory);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleCategory = (cat) => {
    setSelectedCategory(cat);
    setCurrentPage(1);
  };

  const exportCSV = () => {
    const headers = ['SKU', 'Name', 'Category', 'Price', 'Stock', 'URL'];
    const rows = filtered.map(p => [
      p.sku, `"${p.name}"`, p.category_name, p.price, p.stock, p.source_url
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `products_${selectedCategory}.csv`;
    a.click();
  };

  return (
    <div style={styles.container}>
      <div style={styles.headerRow}>
        <h2 style={styles.heading}>📦 All Products</h2>
        <div style={styles.controls}>
          <select style={styles.select} value={selectedCategory}
            onChange={e => handleCategory(e.target.value)}>
            <option value="All">All Categories</option>
            {categories.map(c => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>
          <button style={styles.exportBtn} onClick={exportCSV}>⬇️ Export CSV</button>
        </div>
      </div>

      <p style={styles.count}>
        Showing {((currentPage - 1) * PAGE_SIZE) + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length} products
      </p>

      <div style={styles.grid}>
        {paginated.map(p => (
          <div key={p.id} style={styles.card}
            onClick={() => p.source_url && window.open(p.source_url, '_blank')}>
            {p.image_url ? (
              <img
                src={p.image_url}
                alt={p.name}
                style={styles.image}
                onError={e => e.target.style.display = 'none'}
              />
            ) : (
              <div style={styles.imagePlaceholder}>🖼️ No Image</div>
            )}
            <span style={styles.badge}>{p.category_name}</span>
            <h3 style={styles.name}>{p.name}</h3>
            <p style={styles.sku}>SKU: {p.sku}</p>
            <div style={styles.footer}>
              <span style={styles.price}>₹{p.price}</span>
              <span style={styles.stock}>Stock: {p.stock}</span>
            </div>
            {p.source_url && <p style={styles.link}>🔗 View on Westside →</p>}
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div style={styles.pagination}>
        <button style={styles.pageBtn} onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>«</button>
        <button style={styles.pageBtn} onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}>‹</button>
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          let page;
          if (totalPages <= 5) page = i + 1;
          else if (currentPage <= 3) page = i + 1;
          else if (currentPage >= totalPages - 2) page = totalPages - 4 + i;
          else page = currentPage - 2 + i;
          return (
            <button key={page}
              style={{ ...styles.pageBtn, ...(currentPage === page ? styles.activePage : {}) }}
              onClick={() => setCurrentPage(page)}>
              {page}
            </button>
          );
        })}
        <button style={styles.pageBtn} onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages}>›</button>
        <button style={styles.pageBtn} onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}>»</button>
      </div>
    </div>
  );
}

const styles = {
  container: { padding: '24px' },
  headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '12px' },
  heading: { color: '#333', margin: 0 },
  controls: { display: 'flex', gap: '12px', alignItems: 'center' },
  select: { padding: '10px 16px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px', cursor: 'pointer', minWidth: '200px' },
  exportBtn: { padding: '10px 16px', background: '#52c41a', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' },
  count: { color: '#888', fontSize: '13px', marginBottom: '20px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px' },
  card: { background: 'white', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.08)', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' },
  image: { width: '100%', height: '200px', objectFit: 'cover' },
  imagePlaceholder: { width: '100%', height: '200px', background: '#f0f2f5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', fontSize: '14px' },
  badge: { display: 'inline-block', background: '#e6f7ff', color: '#1890ff', padding: '2px 10px', borderRadius: '20px', fontSize: '12px', margin: '12px 12px 0' },
  name: { margin: '8px 12px 4px', color: '#333', fontSize: '15px' },
  sku: { color: '#999', fontSize: '12px', margin: '0 12px 12px' },
  footer: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f0f0f0', padding: '12px' },
  price: { color: '#52c41a', fontWeight: 'bold', fontSize: '18px' },
  stock: { color: '#888', fontSize: '13px' },
  link: { color: '#1890ff', fontSize: '12px', margin: '0 12px 12px' },
  pagination: { display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '32px', flexWrap: 'wrap' },
  pageBtn: { padding: '8px 14px', borderRadius: '6px', border: '1px solid #ddd', background: 'white', cursor: 'pointer', fontSize: '14px' },
  activePage: { background: '#1890ff', color: 'white', border: '1px solid #1890ff' },
};
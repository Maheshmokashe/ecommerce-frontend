import { useEffect, useState } from 'react';
import { getProducts, getCategories, getRetailers } from './api';
import axios from 'axios';

export default function Dashboard({ darkMode }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [retailers, setRetailers] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState('');
  const [uploadError, setUploadError] = useState('');
  const s = getStyles(darkMode);

  const loadData = () => {
    getProducts().then(res => setProducts(res.data));
    getCategories().then(res => setCategories(res.data));
    getRetailers().then(res => setRetailers(res.data));
  };

  useEffect(() => { loadData(); }, []);

  const retailerStats = retailers.map(r => {
    const rProducts = products.filter(p => p.retailer_name === r.name);
    const available = rProducts.filter(p => p.stock === 1).length;
    const avgP = rProducts.length
      ? (rProducts.reduce((sum, p) => sum + parseFloat(p.price), 0) / rProducts.length).toFixed(0)
      : 0;
    const currency = rProducts.length > 0 ? (rProducts[0].currency || '₹') : '₹';
    return { ...r, count: rProducts.length, available, avgPrice: avgP, currency };
  });

  const newArrivals = [...products]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 8);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setUploadMsg('');
    setUploadError('');
    const formData = new FormData();
    formData.append('file', file);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('http://127.0.0.1:8000/api/upload-xml/', formData, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      });
      setUploadMsg(res.data.message);
      loadData();
    } catch {
      setUploadError('Upload failed. Please check the XML format.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={s.container}>
      <div style={s.headerRow}>
        <h2 style={s.heading}>📊 Dashboard</h2>
        <div style={s.uploadBox}>
          <label style={s.uploadBtn}>
            {uploading ? '⏳ Uploading...' : '📂 Upload XML Feed'}
            <input type="file" accept=".xml" onChange={handleUpload} style={{ display: 'none' }} />
          </label>
          {uploadMsg && <span style={s.success}>✅ {uploadMsg}</span>}
          {uploadError && <span style={s.error}>❌ {uploadError}</span>}
        </div>
      </div>

      {/* Overall Stats — 3 cards only */}
      <div style={s.statsGrid}>
        <div style={s.stat}>
          <h1 style={s.statNum}>{products.length}</h1>
          <p style={s.statLabel}>Total Products</p>
        </div>
        <div style={s.stat}>
          <h1 style={s.statNum}>{categories.length}</h1>
          <p style={s.statLabel}>Categories</p>
        </div>
        <div style={s.stat}>
          <h1 style={s.statNum}>{retailers.length}</h1>
          <p style={s.statLabel}>Retailers</p>
        </div>
      </div>

      {/* Retailer Wise Stats */}
      <h3 style={s.sectionTitle}>🏪 Retailer wise Stats</h3>
      <div style={s.retailerGrid}>
        {retailerStats.map(r => (
          <div key={r.id} style={s.retailerCard}>
            <div style={s.retailerHeader}>
              <span style={s.retailerIcon}>🏬</span>
              <div>
                <h3 style={s.retailerName}>{r.name}</h3>
                <span style={s.activeTag}>● Active</span>
              </div>
            </div>
            <div style={s.retailerStats}>
              <div style={s.rStat}>
                <span style={s.rStatNum}>{r.count}</span>
                <span style={s.rStatLabel}>Products</span>
              </div>
              <div style={s.rStat}>
                <span style={{ ...s.rStatNum, color: '#52c41a' }}>{r.available}</span>
                <span style={s.rStatLabel}>Available</span>
              </div>
              <div style={s.rStat}>
                <span style={{ ...s.rStatNum, color: '#1890ff' }}>{r.currency}{r.avgPrice}</span>
                <span style={s.rStatLabel}>Avg Price</span>
              </div>
            </div>
            <button style={s.viewProductsBtn}
              onClick={() => window.location.href = `/products?retailer=${encodeURIComponent(r.name)}`}>
              📦 View Products →
            </button>
          </div>
        ))}
      </div>

      {/* New Arrivals */}
      <h3 style={s.sectionTitle}>🆕 New Arrivals</h3>
      <div style={s.newArrivalsGrid}>
        {newArrivals.map(p => (
          <div key={p.id} style={s.arrivalCard}
            onClick={() => p.source_url && window.open(p.source_url, '_blank')}>
            {p.image_url
              ? <img src={p.image_url} alt={p.name} style={s.arrivalImage}
                  onError={e => e.target.style.display = 'none'} />
              : <div style={s.arrivalPlaceholder}>🖼️</div>
            }
            <div style={s.arrivalBody}>
              <p style={s.arrivalName}>
                {p.name.slice(0, 40)}{p.name.length > 40 ? '...' : ''}
              </p>
              <div style={s.arrivalFooter}>
                <span style={s.arrivalPrice}>
                  {p.currency || '₹'}{parseFloat(p.price).toFixed(2)}
                </span>
                <span style={s.arrivalRetailer}>{p.retailer_name}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Products Table */}
      <h3 style={s.sectionTitle}>Recent Products</h3>
      <table style={s.table}>
        <thead>
          <tr style={s.th}>
            <th>SKU</th><th>Name</th><th>Brand</th><th>Category</th>
            <th>Retailer</th><th>Price</th><th>Status</th>
          </tr>
        </thead>
        <tbody>
          {products.slice(0, 10).map(p => (
            <tr key={p.id} style={s.tr}
              onClick={() => p.source_url && window.open(p.source_url, '_blank')}
              onMouseEnter={e => e.currentTarget.style.background = darkMode ? '#2a2a2a' : '#f5f5f5'}
              onMouseLeave={e => e.currentTarget.style.background = darkMode ? '#1f1f1f' : 'white'}>
              <td style={s.td}>{p.sku}</td>
              <td style={s.td}>{p.name.slice(0, 40)}...</td>
              <td style={s.td}>{p.brand || '—'}</td>
              <td style={s.td}>{p.category_name}</td>
              <td style={s.td}>{p.retailer_name}</td>
              <td style={s.td}>{p.currency || '₹'}{parseFloat(p.price).toFixed(2)}</td>
              <td style={p.stock === 1 ? s.inStock : s.outStock}>
                {p.stock === 1 ? '✅ Available' : '❌ Out of Stock'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const getStyles = (dark) => ({
  container: { padding: '24px' },
  headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' },
  heading: { color: dark ? '#fff' : '#333', margin: 0 },
  uploadBox: { display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' },
  uploadBtn: { padding: '10px 20px', background: '#1890ff', color: 'white', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' },
  success: { color: '#52c41a', fontSize: '13px' },
  error: { color: '#ff4d4f', fontSize: '13px' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' },
  stat: { background: dark ? '#1f1f1f' : 'white', padding: '24px', borderRadius: '10px', textAlign: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.08)' },
  statNum: { color: dark ? '#fff' : '#333', margin: '0 0 8px' },
  statLabel: { color: dark ? '#aaa' : '#888', margin: 0 },
  sectionTitle: { color: dark ? '#fff' : '#333', margin: '0 0 16px' },
  retailerGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px', marginBottom: '32px' },
  retailerCard: { background: dark ? '#1f1f1f' : 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)', border: `1px solid ${dark ? '#333' : '#f0f0f0'}` },
  retailerHeader: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' },
  retailerIcon: { fontSize: '32px' },
  retailerName: { color: dark ? '#fff' : '#333', margin: '0 0 4px', fontSize: '16px' },
  activeTag: { color: '#52c41a', fontSize: '12px' },
  retailerStats: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', borderTop: `1px solid ${dark ? '#333' : '#f0f0f0'}`, paddingTop: '16px' },
  rStat: { textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '4px' },
  rStatNum: { fontSize: '20px', fontWeight: 'bold', color: dark ? '#fff' : '#333' },
  rStatLabel: { fontSize: '11px', color: dark ? '#aaa' : '#888' },
  viewProductsBtn: { width: '100%', marginTop: '16px', padding: '10px', background: 'linear-gradient(135deg, #1890ff, #096dd9)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' },
  newArrivalsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px', marginBottom: '32px' },
  arrivalCard: { background: dark ? '#1f1f1f' : 'white', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.08)', cursor: 'pointer' },
  arrivalImage: { width: '100%', height: '150px', objectFit: 'cover' },
  arrivalPlaceholder: { width: '100%', height: '150px', background: dark ? '#2a2a2a' : '#f0f2f5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' },
  arrivalBody: { padding: '10px' },
  arrivalName: { color: dark ? '#fff' : '#333', fontSize: '13px', margin: '0 0 8px', lineHeight: '1.4' },
  arrivalFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  arrivalPrice: { color: '#52c41a', fontWeight: 'bold', fontSize: '14px' },
  arrivalRetailer: { color: '#1890ff', fontSize: '11px' },
  table: { width: '100%', borderCollapse: 'collapse', background: dark ? '#1f1f1f' : 'white', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.08)', cursor: 'pointer' },
  th: { background: '#1890ff', color: 'white', padding: '12px 16px', textAlign: 'left' },
  tr: { borderBottom: `1px solid ${dark ? '#333' : '#f0f0f0'}`, background: dark ? '#1f1f1f' : 'white' },
  td: { padding: '12px 16px', color: dark ? '#ddd' : '#555', fontSize: '14px' },
  inStock: { padding: '12px 16px', color: '#52c41a', fontSize: '13px', fontWeight: '500' },
  outStock: { padding: '12px 16px', color: '#ff4d4f', fontSize: '13px', fontWeight: '500' },
});
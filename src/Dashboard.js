import { useEffect, useState } from 'react';
import { getProducts, getCategories } from './api';
import axios from 'axios';

export default function Dashboard({ darkMode }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState('');
  const [uploadError, setUploadError] = useState('');
  const s = getStyles(darkMode);

  const loadData = () => {
    getProducts().then(res => setProducts(res.data));
    getCategories().then(res => setCategories(res.data));
  };

  useEffect(() => { loadData(); }, []);

  const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
  const avgPrice = products.length
    ? (products.reduce((sum, p) => sum + parseFloat(p.price), 0) / products.length).toFixed(2)
    : 0;

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
      <div style={s.statsGrid}>
        <div style={s.stat}><h1 style={s.statNum}>{products.length}</h1><p style={s.statLabel}>Total Products</p></div>
        <div style={s.stat}><h1 style={s.statNum}>{categories.length}</h1><p style={s.statLabel}>Categories</p></div>
        <div style={s.stat}><h1 style={s.statNum}>{totalStock}</h1><p style={s.statLabel}>Total Stock</p></div>
        <div style={s.stat}><h1 style={s.statNum}>₹{avgPrice}</h1><p style={s.statLabel}>Avg Price</p></div>
      </div>
      <h3 style={s.heading}>Recent Products</h3>
      <table style={s.table}>
        <thead>
          <tr style={s.th}>
            <th>SKU</th><th>Name</th><th>Category</th><th>Price</th><th>Stock</th>
          </tr>
        </thead>
        <tbody>
          {products.slice(0, 10).map(p => (
            <tr key={p.id} style={s.tr}
              onClick={() => p.source_url && window.open(p.source_url, '_blank')}
              onMouseEnter={e => e.currentTarget.style.background = darkMode ? '#2a2a2a' : '#f5f5f5'}
              onMouseLeave={e => e.currentTarget.style.background = darkMode ? '#1f1f1f' : 'white'}>
              <td style={s.td}>{p.sku}</td>
              <td style={s.td}>{p.name}</td>
              <td style={s.td}>{p.category_name}</td>
              <td style={s.td}>₹{p.price}</td>
              <td style={s.td}>{p.stock}</td>
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
  heading: { color: dark ? '#fff' : '#333', margin: '0 0 16px' },
  uploadBox: { display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' },
  uploadBtn: { padding: '10px 20px', background: '#1890ff', color: 'white', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' },
  success: { color: '#52c41a', fontSize: '13px' },
  error: { color: '#ff4d4f', fontSize: '13px' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' },
  stat: { background: dark ? '#1f1f1f' : 'white', padding: '24px', borderRadius: '10px', textAlign: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.08)' },
  statNum: { color: dark ? '#fff' : '#333', margin: '0 0 8px' },
  statLabel: { color: dark ? '#aaa' : '#888', margin: 0 },
  table: { width: '100%', borderCollapse: 'collapse', background: dark ? '#1f1f1f' : 'white', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.08)', cursor: 'pointer' },
  th: { background: '#1890ff', color: 'white', padding: '12px 16px', textAlign: 'left' },
  tr: { borderBottom: `1px solid ${dark ? '#333' : '#f0f0f0'}`, background: dark ? '#1f1f1f' : 'white' },
  td: { padding: '12px 16px', color: dark ? '#ddd' : '#555', fontSize: '14px' },
});
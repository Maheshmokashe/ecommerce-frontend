import { useEffect, useState } from 'react';
import { getProducts, getCategories } from './api';
import axios from 'axios';

export default function Dashboard() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState('');
  const [uploadError, setUploadError] = useState('');

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
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        }
      });
      setUploadMsg(res.data.message);
      loadData();
    } catch (err) {
      setUploadError('Upload failed. Please check the XML format.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.headerRow}>
        <h2 style={styles.heading}>📊 Dashboard</h2>
        <div style={styles.uploadBox}>
          <label style={styles.uploadBtn}>
            {uploading ? '⏳ Uploading...' : '📂 Upload XML Feed'}
            <input type="file" accept=".xml" onChange={handleUpload} style={{ display: 'none' }} />
          </label>
          {uploadMsg && <span style={styles.success}>✅ {uploadMsg}</span>}
          {uploadError && <span style={styles.error}>❌ {uploadError}</span>}
        </div>
      </div>
      <div style={styles.statsGrid}>
        <div style={styles.stat}><h1>{products.length}</h1><p>Total Products</p></div>
        <div style={styles.stat}><h1>{categories.length}</h1><p>Categories</p></div>
        <div style={styles.stat}><h1>{totalStock}</h1><p>Total Stock</p></div>
        <div style={styles.stat}><h1>₹{avgPrice}</h1><p>Avg Price</p></div>
      </div>
      <h3 style={{ marginBottom: '16px' }}>Recent Products</h3>
      <table style={styles.table}>
        <thead>
          <tr style={styles.th}>
            <th>SKU</th><th>Name</th><th>Category</th><th>Price</th><th>Stock</th>
          </tr>
        </thead>
        <tbody>
          {products.slice(0, 10).map(p => (
            <tr key={p.id} style={styles.tr}
              onClick={() => p.source_url && window.open(p.source_url, '_blank')}
              onMouseEnter={e => e.currentTarget.style.background = '#f5f5f5'}
              onMouseLeave={e => e.currentTarget.style.background = 'white'}>
              <td style={styles.td}>{p.sku}</td>
              <td style={styles.td}>{p.name}</td>
              <td style={styles.td}>{p.category_name}</td>
              <td style={styles.td}>₹{p.price}</td>
              <td style={styles.td}>{p.stock}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const styles = {
  container: { padding: '24px' },
  headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' },
  heading: { color: '#333', margin: 0 },
  uploadBox: { display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' },
  uploadBtn: { padding: '10px 20px', background: '#1890ff', color: 'white', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' },
  success: { color: '#52c41a', fontSize: '13px' },
  error: { color: '#ff4d4f', fontSize: '13px' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' },
  stat: { background: 'white', padding: '24px', borderRadius: '10px', textAlign: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.08)' },
  table: { width: '100%', borderCollapse: 'collapse', background: 'white', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.08)', cursor: 'pointer' },
  th: { background: '#1890ff', color: 'white', padding: '12px 16px', textAlign: 'left' },
  tr: { borderBottom: '1px solid #f0f0f0' },
  td: { padding: '12px 16px', color: '#555', fontSize: '14px' },
};
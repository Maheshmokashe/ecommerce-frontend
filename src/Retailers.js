import { useEffect, useState } from 'react';
import { getRetailers, getProducts } from './api';

export default function Retailers({ darkMode, onSelectRetailer }) {
  const [retailers, setRetailers] = useState([]);
  const [productCounts, setProductCounts] = useState({});
  const s = getStyles(darkMode);

  useEffect(() => {
    getRetailers().then(res => setRetailers(res.data));
    getProducts().then(res => {
      const counts = {};
      res.data.forEach(p => {
        if (p.retailer_name) {
          counts[p.retailer_name] = (counts[p.retailer_name] || 0) + 1;
        }
      });
      setProductCounts(counts);
    });
  }, []);

  return (
    <div style={s.container}>
      <h2 style={s.heading}>🏪 Retailers</h2>
      <p style={s.sub}>{retailers.length} retailer(s) uploaded</p>
      <div style={s.grid}>
        {retailers.map(r => (
          <div key={r.id} style={s.card} onClick={() => onSelectRetailer(r.name)}>
            <div style={s.iconBox}>🏬</div>
            <h3 style={s.name}>{r.name}</h3>
            <p style={s.count}>{productCounts[r.name] || 0} products</p>
            <div style={s.footer}>
              <span style={s.activeTag}>● Active</span>
              <span style={s.viewBtn}>View Products →</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const getStyles = (dark) => ({
  container: { padding: '24px' },
  heading: { color: dark ? '#fff' : '#333', margin: '0 0 8px' },
  sub: { color: dark ? '#aaa' : '#888', fontSize: '14px', marginBottom: '24px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px' },
  card: { background: dark ? '#1f1f1f' : 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)', cursor: 'pointer', border: `1px solid ${dark ? '#333' : '#f0f0f0'}` },
  iconBox: { fontSize: '40px', marginBottom: '16px' },
  name: { color: dark ? '#fff' : '#333', margin: '0 0 8px', fontSize: '18px' },
  count: { color: '#1890ff', fontSize: '14px', margin: '0 0 16px', fontWeight: '500' },
  footer: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `1px solid ${dark ? '#333' : '#f0f0f0'}`, paddingTop: '12px' },
  activeTag: { color: '#52c41a', fontSize: '13px' },
  viewBtn: { color: '#1890ff', fontSize: '13px', fontWeight: '500' },
});
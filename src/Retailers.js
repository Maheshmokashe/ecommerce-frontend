import { useEffect, useState } from 'react';
import { getRetailers, getProducts } from './api';

export default function Retailers({ darkMode, onSelectRetailer }) {
  const [retailers, setRetailers] = useState([]);
  const [productCounts, setProductCounts] = useState({});
  const [availableCounts, setAvailableCounts] = useState({});
  const [avgPrices, setAvgPrices] = useState({});
  const s = getStyles(darkMode);

  useEffect(() => {
    getRetailers().then(res => setRetailers(res.data));
    getProducts().then(res => {
      const counts = {};
      const available = {};
      const prices = {};
      res.data.forEach(p => {
        if (p.retailer_name) {
          counts[p.retailer_name] = (counts[p.retailer_name] || 0) + 1;
          if (p.stock === 1) available[p.retailer_name] = (available[p.retailer_name] || 0) + 1;
          prices[p.retailer_name] = prices[p.retailer_name] || [];
          prices[p.retailer_name].push(parseFloat(p.price));
        }
      });
      const avgP = {};
      Object.keys(prices).forEach(k => {
        avgP[k] = (prices[k].reduce((a, b) => a + b, 0) / prices[k].length).toFixed(0);
      });
      setProductCounts(counts);
      setAvailableCounts(available);
      setAvgPrices(avgP);
    });
  }, []);

  return (
    <div style={s.container}>
      <h2 style={s.heading}>🏪 Retailers</h2>
      <p style={s.sub}>{retailers.length} retailer(s) uploaded</p>
      <div style={s.grid}>
        {retailers.map(r => (
          <div key={r.id} style={s.card}>
            <div style={s.cardTop}>
              <div style={s.iconBox}>🏬</div>
              <div style={s.headerInfo}>
                <h3 style={s.name}>{r.name}</h3>
                <span style={s.activeTag}>● Active</span>
              </div>
            </div>

            {r.website && (
              <a href={r.website} target="_blank" rel="noreferrer" style={s.website}
                onClick={e => e.stopPropagation()}>
                🌐 {r.website.replace('https://', '').replace('www.', '')}
              </a>
            )}

            <div style={s.statsRow}>
              <div style={s.stat}>
                <span style={s.statNum}>{productCounts[r.name] || 0}</span>
                <span style={s.statLabel}>Products</span>
              </div>
              <div style={s.stat}>
                <span style={{ ...s.statNum, color: '#52c41a' }}>{availableCounts[r.name] || 0}</span>
                <span style={s.statLabel}>Available</span>
              </div>
              <div style={s.stat}>
                <span style={{ ...s.statNum, color: '#1890ff' }}>₹{avgPrices[r.name] || 0}</span>
                <span style={s.statLabel}>Avg Price</span>
              </div>
            </div>

            <div style={s.footer}>
              <button style={s.viewBtn} onClick={() => onSelectRetailer(r.name)}>
                📦 View Products →
              </button>
              {r.website && (
                <button style={s.siteBtn} onClick={() => window.open(r.website, '_blank')}>
                  🌐 Visit Site
                </button>
              )}
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
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' },
  card: { background: dark ? '#1f1f1f' : 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)', border: `1px solid ${dark ? '#333' : '#f0f0f0'}` },
  cardTop: { display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' },
  iconBox: { fontSize: '40px' },
  headerInfo: { flex: 1 },
  name: { color: dark ? '#fff' : '#333', margin: '0 0 4px', fontSize: '18px' },
  activeTag: { color: '#52c41a', fontSize: '12px' },
  website: { display: 'block', color: '#1890ff', fontSize: '13px', marginBottom: '16px', textDecoration: 'none' },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', borderTop: `1px solid ${dark ? '#333' : '#f0f0f0'}`, borderBottom: `1px solid ${dark ? '#333' : '#f0f0f0'}`, padding: '16px 0', marginBottom: '16px' },
  stat: { textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '4px' },
  statNum: { fontSize: '20px', fontWeight: 'bold', color: dark ? '#fff' : '#333' },
  statLabel: { fontSize: '11px', color: dark ? '#aaa' : '#888' },
  footer: { display: 'flex', gap: '8px' },
  viewBtn: { flex: 1, padding: '10px', background: 'linear-gradient(135deg, #1890ff, #096dd9)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' },
  siteBtn: { padding: '10px 14px', background: dark ? '#2a2a2a' : '#f0f2f5', color: dark ? '#fff' : '#333', border: `1px solid ${dark ? '#444' : '#ddd'}`, borderRadius: '8px', cursor: 'pointer', fontSize: '13px' },
});
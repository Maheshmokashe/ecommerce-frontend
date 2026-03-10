import { useEffect, useState } from 'react';
import { getCategoryStats } from './api';

export default function Categories({ darkMode, onSelectCategory }) {
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('total');
  const [loading, setLoading] = useState(true);
  const s = getStyles(darkMode);

  useEffect(() => {
    getCategoryStats().then(res => {
      setCategories(res.data);
      setLoading(false);
    });
  }, []);

  const filtered = categories
    .filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'total') return b.total - a.total;
      if (sortBy === 'available') return b.available - a.available;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'price') return b.avg_price - a.avg_price;
      return 0;
    });

  const totalProducts = categories.reduce((sum, c) => sum + c.total, 0);
  const totalAvailable = categories.reduce((sum, c) => sum + c.available, 0);

  const getCategoryEmoji = (name) => {
    const n = name.toLowerCase();
    if (n.includes('dress') || n.includes('wear') || n.includes('cloth')) return '👗';
    if (n.includes('shoe') || n.includes('footwear') || n.includes('boot')) return '👠';
    if (n.includes('jewel') || n.includes('ring') || n.includes('necklace') || n.includes('joyería')) return '💍';
    if (n.includes('bag') || n.includes('handbag') || n.includes('purse')) return '👜';
    if (n.includes('top') || n.includes('shirt') || n.includes('blouse')) return '👕';
    if (n.includes('pant') || n.includes('trouser') || n.includes('jean')) return '👖';
    if (n.includes('sport') || n.includes('active') || n.includes('gym')) return '🏋️';
    if (n.includes('beauty') || n.includes('cosmetic') || n.includes('makeup')) return '💄';
    if (n.includes('lingerie') || n.includes('bra') || n.includes('underwear')) return '👙';
    if (n.includes('watch') || n.includes('accessory') || n.includes('accessories')) return '⌚';
    if (n.includes('kids') || n.includes('children') || n.includes('boy') || n.includes('girl')) return '🧒';
    if (n.includes('men') || n.includes('man')) return '👔';
    if (n.includes('woman') || n.includes('women') || n.includes('lady')) return '👩';
    if (n.includes('ethnic') || n.includes('kurta') || n.includes('saree')) return '🥻';
    if (n.includes('western')) return '🌟';
    return '🏷️';
  };

  const getAvailabilityColor = (available, total) => {
    if (!total) return '#999';
    const pct = (available / total) * 100;
    if (pct >= 80) return '#52c41a';
    if (pct >= 50) return '#faad14';
    return '#ff4d4f';
  };

  return (
    <div style={s.container}>
      <h2 style={s.heading}>🗂️ Categories</h2>
      <p style={s.sub}>{categories.length} categories across {totalProducts.toLocaleString()} products</p>

      {/* Summary Stats */}
      <div style={s.statsGrid}>
        <div style={s.stat}>
          <h2 style={s.statNum}>{categories.length}</h2>
          <p style={s.statLabel}>Total Categories</p>
        </div>
        <div style={s.stat}>
          <h2 style={{ ...s.statNum, color: '#1890ff' }}>{totalProducts.toLocaleString()}</h2>
          <p style={s.statLabel}>Total Products</p>
        </div>
        <div style={s.stat}>
          <h2 style={{ ...s.statNum, color: '#52c41a' }}>{totalAvailable.toLocaleString()}</h2>
          <p style={s.statLabel}>Available Products</p>
        </div>
        <div style={s.stat}>
          <h2 style={{ ...s.statNum, color: '#722ed1' }}>
            {categories.length > 0 ? Math.round(totalProducts / categories.length) : 0}
          </h2>
          <p style={s.statLabel}>Avg Products / Category</p>
        </div>
      </div>

      {/* Search + Sort */}
      <div style={s.filterRow}>
        <input style={s.searchInput} placeholder="🔍 Search categories..."
          value={search} onChange={e => setSearch(e.target.value)} />
        <select style={s.sortSelect} value={sortBy} onChange={e => setSortBy(e.target.value)}>
          <option value="total">Sort: Most Products</option>
          <option value="available">Sort: Most Available</option>
          <option value="name">Sort: Name A-Z</option>
          <option value="price">Sort: Highest Avg Price</option>
        </select>
      </div>

      {loading ? (
        <div style={s.loadingBox}>⏳ Loading categories...</div>
      ) : (
        <div style={s.grid}>
          {filtered.map(c => {
            const availPct = c.total ? Math.round((c.available / c.total) * 100) : 0;
            const availColor = getAvailabilityColor(c.available, c.total);
            return (
              <div key={c.id} style={s.card}
                onClick={() => onSelectCategory(c.name)}>
                <div style={s.cardTop}>
                  <span style={s.emoji}>{getCategoryEmoji(c.name)}</span>
                  <div style={s.cardInfo}>
                    <h3 style={s.name}>{c.name}</h3>
                    <span style={s.slug}>/{c.slug}</span>
                  </div>
                </div>

                <div style={s.statsRow}>
                  <div style={s.stat2}>
                    <span style={s.statNum2}>{c.total.toLocaleString()}</span>
                    <span style={s.statLabel2}>Products</span>
                  </div>
                  <div style={s.stat2}>
                    <span style={{ ...s.statNum2, color: availColor }}>
                      {c.available.toLocaleString()}
                    </span>
                    <span style={s.statLabel2}>Available</span>
                  </div>
                  <div style={s.stat2}>
                    <span style={{ ...s.statNum2, color: '#1890ff' }}>
                      {c.avg_price > 0 ? `${c.avg_price.toFixed(0)}` : '—'}
                    </span>
                    <span style={s.statLabel2}>Avg Price</span>
                  </div>
                </div>

                {/* Availability bar */}
                <div style={s.barRow}>
                  <div style={s.barBg}>
                    <div style={{ ...s.barFill, width: `${availPct}%`, background: availColor }} />
                  </div>
                  <span style={{ ...s.barPct, color: availColor }}>{availPct}%</span>
                </div>

                <button style={s.viewBtn}>
                  📦 View Products →
                </button>
              </div>
            );
          })}
        </div>
      )}

      {filtered.length === 0 && !loading && (
        <div style={s.empty}>
          <p style={{ fontSize: '48px' }}>🗂️</p>
          <p style={{ color: darkMode ? '#aaa' : '#888' }}>No categories found for "{search}"</p>
        </div>
      )}
    </div>
  );
}

const getStyles = (dark) => ({
  container: { padding: '24px' },
  heading: { color: dark ? '#fff' : '#333', margin: '0 0 8px' },
  sub: { color: dark ? '#aaa' : '#888', fontSize: '14px', marginBottom: '24px' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' },
  stat: { background: dark ? '#1f1f1f' : 'white', padding: '20px', borderRadius: '10px', textAlign: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.08)' },
  statNum: { color: dark ? '#fff' : '#333', margin: '0 0 8px', fontSize: '28px' },
  statLabel: { color: dark ? '#aaa' : '#888', margin: 0, fontSize: '13px' },
  filterRow: { display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' },
  searchInput: { flex: 1, minWidth: '200px', padding: '10px 16px', borderRadius: '8px', border: `1px solid ${dark ? '#444' : '#ddd'}`, fontSize: '14px', background: dark ? '#1f1f1f' : 'white', color: dark ? '#fff' : '#333' },
  sortSelect: { padding: '10px 16px', borderRadius: '8px', border: `1px solid ${dark ? '#444' : '#ddd'}`, fontSize: '14px', background: dark ? '#1f1f1f' : 'white', color: dark ? '#fff' : '#333', cursor: 'pointer' },
  loadingBox: { textAlign: 'center', padding: '60px', color: dark ? '#aaa' : '#888' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' },
  card: { background: dark ? '#1f1f1f' : 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)', border: `1px solid ${dark ? '#333' : '#f0f0f0'}`, cursor: 'pointer', transition: 'transform 0.2s' },
  cardTop: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' },
  emoji: { fontSize: '36px' },
  cardInfo: { flex: 1 },
  name: { color: dark ? '#fff' : '#333', margin: '0 0 4px', fontSize: '15px' },
  slug: { color: dark ? '#555' : '#bbb', fontSize: '11px' },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', borderTop: `1px solid ${dark ? '#333' : '#f0f0f0'}`, borderBottom: `1px solid ${dark ? '#333' : '#f0f0f0'}`, padding: '12px 0', marginBottom: '12px', gap: '8px' },
  stat2: { textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '2px' },
  statNum2: { fontSize: '18px', fontWeight: 'bold', color: dark ? '#fff' : '#333' },
  statLabel2: { fontSize: '11px', color: dark ? '#aaa' : '#888' },
  barRow: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' },
  barBg: { flex: 1, height: '6px', background: dark ? '#333' : '#f0f0f0', borderRadius: '3px', overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: '3px', transition: 'width 0.5s' },
  barPct: { fontSize: '12px', fontWeight: '600', minWidth: '32px', textAlign: 'right' },
  viewBtn: { width: '100%', padding: '10px', background: 'linear-gradient(135deg, #1890ff, #096dd9)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' },
  empty: { textAlign: 'center', padding: '60px' },
});
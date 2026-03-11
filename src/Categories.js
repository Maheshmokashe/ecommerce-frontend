import { useEffect, useState } from 'react';
import { getCategoryStats } from './api';

export default function Categories({ darkMode, onSelectCategory }) {
  const [tree, setTree] = useState([]);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState({});
  const [loading, setLoading] = useState(true);
  const s = getStyles(darkMode);

  useEffect(() => {
    getCategoryStats().then(res => {
      setTree(res.data);
      const exp = {};
      res.data.forEach(c => { exp[c.id] = true; });
      setExpanded(exp);
      setLoading(false);
    });
  }, []);

  const toggleExpand = (id) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const totalProducts = tree.reduce((sum, c) => sum + c.total, 0);

  const totalCategories = (nodes) => {
    let count = nodes.length;
    nodes.forEach(n => { count += totalCategories(n.children || []); });
    return count;
  };

  const getCategoryEmoji = (name, level) => {
    const n = name.toLowerCase();
    if (n.includes('women') || n.includes('woman')) return '👩';
    if (n.includes('men') || n.includes('man')) return '👔';
    if (n.includes('kids') || n.includes('children') || n.includes('boys') || n.includes('girls')) return '🧒';
    if (n.includes('dress')) return '👗';
    if (n.includes('shoe') || n.includes('footwear') || n.includes('boot')) return '👠';
    if (n.includes('bag') || n.includes('handbag')) return '👜';
    if (n.includes('jewel') || n.includes('joyería') || n.includes('necklace')) return '💍';
    if (n.includes('top') || n.includes('shirt') || n.includes('blouse') || n.includes('western')) return '👕';
    if (n.includes('pant') || n.includes('trouser') || n.includes('bottom')) return '👖';
    if (n.includes('sport') || n.includes('active')) return '🏋️';
    if (n.includes('ethnic') || n.includes('kurta') || n.includes('saree')) return '🥻';
    if (n.includes('lingerie') || n.includes('innerwear') || n.includes('bra')) return '👙';
    if (n.includes('watch') || n.includes('accessory') || n.includes('acc')) return '⌚';
    if (n.includes('beauty') || n.includes('cosmetic')) return '💄';
    if (level === 0) return '🗂️';
    if (level === 1) return '📁';
    return '📄';
  };

  const filterTree = (nodes, query) => {
    if (!query) return nodes;
    return nodes.reduce((acc, node) => {
      const filteredChildren = filterTree(node.children || [], query);
      if (node.name.toLowerCase().includes(query.toLowerCase()) || filteredChildren.length > 0) {
        acc.push({ ...node, children: filteredChildren });
      }
      return acc;
    }, []);
  };

  const displayTree = search ? filterTree(tree, search) : tree;

  const renderNode = (node, depth = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expanded[node.id];
    const availPct = node.total ? Math.round((node.available / node.total) * 100) : 0;
    const availColor = availPct >= 80 ? '#52c41a' : availPct >= 50 ? '#faad14' : '#ff4d4f';

    return (
      <div key={node.id} style={{ marginLeft: depth * 24 }}>
        <div style={{
          ...s.node,
          background: depth === 0 ? (darkMode ? '#1a2a3a' : '#e6f7ff') :
                      depth === 1 ? (darkMode ? '#1f1f1f' : 'white') :
                      depth === 2 ? (darkMode ? '#252525' : '#fafafa') :
                      (darkMode ? '#2a2a2a' : '#f5f5f5'),
          borderLeft: `3px solid ${
            depth === 0 ? '#1890ff' :
            depth === 1 ? '#52c41a' :
            depth === 2 ? '#faad14' : '#eb2f96'
          }`,
        }}>
          {/* Left side */}
          <div style={s.nodeLeft}>
            {hasChildren ? (
              <button style={s.expandBtn} onClick={() => toggleExpand(node.id)}>
                {isExpanded ? '▼' : '▶'}
              </button>
            ) : (
              <span style={s.leafDot}>•</span>
            )}
            <span style={s.nodeEmoji}>{getCategoryEmoji(node.name, depth)}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                ...s.nodeName,
                fontSize: depth === 0 ? '15px' : depth === 1 ? '14px' : '13px',
                fontWeight: depth === 0 ? '700' : depth === 1 ? '600' : '400',
                color: depth === 0
                  ? (darkMode ? '#91d5ff' : '#1890ff')
                  : depth === 1
                  ? (darkMode ? '#fff' : '#333')
                  : (darkMode ? '#ccc' : '#555'),
              }}>
                {node.name}
              </span>
              <span style={{
                ...s.levelBadge,
                background: depth === 0 ? '#1890ff22' :
                            depth === 1 ? '#52c41a22' :
                            depth === 2 ? '#faad1422' : '#eb2f9622',
                color: depth === 0 ? '#1890ff' :
                       depth === 1 ? '#52c41a' :
                       depth === 2 ? '#faad14' : '#eb2f96',
              }}>
                {depth === 0 ? 'Top' : depth === 1 ? 'Mid' : depth === 2 ? 'Sub' : 'Leaf'}
              </span>
            </div>
          </div>

          {/* Right side */}
          <div style={s.nodeRight}>
            <div style={s.statPill}>
              <span style={s.statPillNum}>{node.total.toLocaleString()}</span>
              <span style={s.statPillLabel}>products</span>
            </div>
            <div style={s.statPill}>
              <span style={{ ...s.statPillNum, color: availColor }}>
                {node.available.toLocaleString()}
              </span>
              <span style={s.statPillLabel}>available</span>
            </div>
            <div style={s.availBar}>
              <div style={{ ...s.availFill, width: `${availPct}%`, background: availColor }} />
            </div>
            <span style={{ ...s.availPct, color: availColor }}>{availPct}%</span>
            <button style={s.viewBtn} onClick={() => onSelectCategory(node.name)}>
              View →
            </button>
          </div>
        </div>

        {/* Render children */}
        {hasChildren && isExpanded && (
          <div style={{ marginTop: '2px' }}>
            {node.children.map(child => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={s.container}>
      <h2 style={s.heading}>🗂️ Categories</h2>
      <p style={s.sub}>
        Hierarchical category tree — {totalCategories(tree)} categories across {totalProducts.toLocaleString()} products
      </p>

      {/* Summary Stats */}
      <div style={s.statsGrid}>
        <div style={s.stat}>
          <h2 style={s.statNum}>{tree.length}</h2>
          <p style={s.statLabel}>Top Level</p>
        </div>
        <div style={s.stat}>
          <h2 style={{ ...s.statNum, color: '#52c41a' }}>
            {tree.reduce((sum, c) => sum + (c.children?.length || 0), 0)}
          </h2>
          <p style={s.statLabel}>Mid Level</p>
        </div>
        <div style={s.stat}>
          <h2 style={{ ...s.statNum, color: '#faad14' }}>{totalCategories(tree)}</h2>
          <p style={s.statLabel}>Total Categories</p>
        </div>
        <div style={s.stat}>
          <h2 style={{ ...s.statNum, color: '#1890ff' }}>{totalProducts.toLocaleString()}</h2>
          <p style={s.statLabel}>Total Products</p>
        </div>
      </div>

      {/* Controls */}
      <div style={s.filterRow}>
        <input
          style={s.searchInput}
          placeholder="🔍 Search categories..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <button style={s.expandAllBtn} onClick={() => {
          const all = {};
          const collectIds = (nodes) => nodes.forEach(n => {
            all[n.id] = true;
            if (n.children) collectIds(n.children);
          });
          collectIds(tree);
          setExpanded(all);
        }}>
          ▼ Expand All
        </button>
        <button style={s.collapseAllBtn} onClick={() => setExpanded({})}>
          ▶ Collapse All
        </button>
      </div>

      {/* Legend */}
      <div style={s.legend}>
        <span style={{ ...s.legendItem, borderLeft: '3px solid #1890ff', color: '#1890ff' }}>🗂️ Top Level</span>
        <span style={{ ...s.legendItem, borderLeft: '3px solid #52c41a', color: '#52c41a' }}>📁 Mid Level</span>
        <span style={{ ...s.legendItem, borderLeft: '3px solid #faad14', color: '#faad14' }}>📄 Sub Level</span>
        <span style={{ ...s.legendItem, borderLeft: '3px solid #eb2f96', color: '#eb2f96' }}>🔖 Leaf</span>
      </div>

      {loading ? (
        <div style={s.loadingBox}>⏳ Loading category tree...</div>
      ) : (
        <div style={s.tree}>
          {displayTree.map(node => renderNode(node, 0))}
          {displayTree.length === 0 && (
            <div style={s.empty}>No categories found for "{search}"</div>
          )}
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
  filterRow: { display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' },
  searchInput: { flex: 1, minWidth: '200px', padding: '10px 16px', borderRadius: '8px', border: `1px solid ${dark ? '#444' : '#ddd'}`, fontSize: '14px', background: dark ? '#1f1f1f' : 'white', color: dark ? '#fff' : '#333' },
  expandAllBtn: { padding: '10px 16px', background: '#1890ff', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' },
  collapseAllBtn: { padding: '10px 16px', background: dark ? '#333' : '#f0f2f5', color: dark ? '#fff' : '#333', border: `1px solid ${dark ? '#444' : '#ddd'}`, borderRadius: '8px', cursor: 'pointer', fontSize: '13px' },
  legend: { display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' },
  legendItem: { padding: '4px 12px', background: dark ? '#2a2a2a' : '#f9f9f9', borderRadius: '4px', fontSize: '12px', paddingLeft: '10px' },
  loadingBox: { textAlign: 'center', padding: '60px', color: dark ? '#aaa' : '#888' },
  tree: { display: 'flex', flexDirection: 'column', gap: '4px' },
  node: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', borderRadius: '8px', marginBottom: '3px', flexWrap: 'wrap', gap: '8px', transition: 'all 0.2s' },
  nodeLeft: { display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '200px' },
  nodeRight: { display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' },
  expandBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '10px', color: dark ? '#aaa' : '#888', padding: '2px 6px', minWidth: '22px', borderRadius: '4px' },
  leafDot: { color: dark ? '#555' : '#ccc', fontSize: '18px', minWidth: '22px', textAlign: 'center' },
  nodeEmoji: { fontSize: '18px' },
  nodeName: { marginRight: '4px' },
  levelBadge: { fontSize: '10px', padding: '1px 8px', borderRadius: '10px', fontWeight: '500' },
  statPill: { display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '50px' },
  statPillNum: { fontSize: '13px', fontWeight: '700', color: dark ? '#fff' : '#333' },
  statPillLabel: { fontSize: '10px', color: dark ? '#666' : '#aaa' },
  availBar: { width: '60px', height: '5px', background: dark ? '#333' : '#f0f0f0', borderRadius: '3px', overflow: 'hidden' },
  availFill: { height: '100%', borderRadius: '3px' },
  availPct: { fontSize: '12px', fontWeight: '600', minWidth: '35px', textAlign: 'right' },
  viewBtn: { padding: '5px 12px', background: 'linear-gradient(135deg, #1890ff, #096dd9)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', whiteSpace: 'nowrap' },
  empty: { textAlign: 'center', padding: '40px', color: dark ? '#aaa' : '#888' },
});
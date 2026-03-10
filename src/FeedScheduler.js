import { useEffect, useState } from 'react';
import { getRetailers, updateFeedUrl, refreshFeed } from './api';

export default function FeedScheduler({ darkMode }) {
  const [retailers, setRetailers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedUrls, setFeedUrls] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [refreshing, setRefreshing] = useState({});
  const [results, setResults] = useState({});
  const s = getStyles(darkMode);

  useEffect(() => {
    getRetailers().then(res => {
      setRetailers(res.data);
      const urls = {};
      res.data.forEach(r => { urls[r.id] = r.feed_url || ''; });
      setFeedUrls(urls);
      setLoading(false);
    });
  }, []);

  const handleSaveFeedUrl = async (retailer) => {
    try {
      await updateFeedUrl(retailer.id, feedUrls[retailer.id]);
      setEditingId(null);
      setResults(prev => ({ ...prev, [retailer.id]: { type: 'success', msg: '✅ Feed URL saved!' } }));
      setTimeout(() => setResults(prev => ({ ...prev, [retailer.id]: null })), 3000);
    } catch {
      setResults(prev => ({ ...prev, [retailer.id]: { type: 'error', msg: '❌ Failed to save URL' } }));
    }
  };

  const handleRefresh = async (retailer) => {
    if (!feedUrls[retailer.id]) {
      setResults(prev => ({ ...prev, [retailer.id]: { type: 'error', msg: '❌ Set a feed URL first!' } }));
      setTimeout(() => setResults(prev => ({ ...prev, [retailer.id]: null })), 3000);
      return;
    }
    setRefreshing(prev => ({ ...prev, [retailer.id]: true }));
    setResults(prev => ({ ...prev, [retailer.id]: { type: 'loading', msg: '⏳ Fetching feed...' } }));
    try {
      const res = await refreshFeed(retailer.id);
      const d = res.data;
      setResults(prev => ({
        ...prev,
        [retailer.id]: {
          type: 'success',
          msg: `✅ Done! Loaded: ${d.loaded} | Skipped: ${d.skipped} | Total: ${d.total_found}`
        }
      }));
      // update last_fetched_at in UI
      setRetailers(prev => prev.map(r =>
        r.id === retailer.id ? { ...r, last_fetched_at: d.last_fetched_at } : r
      ));
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Failed to refresh feed';
      setResults(prev => ({ ...prev, [retailer.id]: { type: 'error', msg: `❌ ${errMsg}` } }));
    } finally {
      setRefreshing(prev => ({ ...prev, [retailer.id]: false }));
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Never';
    return new Date(dateStr).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const totalWithFeed = retailers.filter(r => r.feed_url).length;

  return (
    <div style={s.container}>
      <h2 style={s.heading}>⏰ Feed Scheduler</h2>
      <p style={s.sub}>Manage XML feed URLs and refresh product data per retailer</p>

      {/* Summary */}
      <div style={s.statsGrid}>
        <div style={s.stat}>
          <h2 style={s.statNum}>{retailers.length}</h2>
          <p style={s.statLabel}>Total Retailers</p>
        </div>
        <div style={s.stat}>
          <h2 style={{ ...s.statNum, color: '#52c41a' }}>{totalWithFeed}</h2>
          <p style={s.statLabel}>Feeds Configured</p>
        </div>
        <div style={s.stat}>
          <h2 style={{ ...s.statNum, color: '#faad14' }}>{retailers.length - totalWithFeed}</h2>
          <p style={s.statLabel}>No Feed URL</p>
        </div>
      </div>

      {/* Info banner */}
      <div style={s.infoBanner}>
        <span style={{ fontSize: '20px' }}>💡</span>
        <span style={s.infoText}>
          Set a direct XML feed URL for each retailer. Click <strong>🔄 Refresh</strong> to
          re-fetch and update all products automatically using <strong>update_or_create</strong> — existing
          products update, new ones get added, nothing gets duplicated.
        </span>
      </div>

      {loading ? (
        <div style={s.loadingBox}>⏳ Loading retailers...</div>
      ) : (
        <div style={s.cards}>
          {retailers.map(retailer => {
            const result = results[retailer.id];
            const isRefreshing = refreshing[retailer.id];
            const hasFeed = !!feedUrls[retailer.id];
            const isEditing = editingId === retailer.id;

            return (
              <div key={retailer.id} style={s.card}>
                {/* Card Header */}
                <div style={s.cardHeader}>
                  <div style={s.retailerInfo}>
                    <span style={s.retailerIcon}>🏪</span>
                    <div>
                      <h3 style={s.retailerName}>{retailer.name}</h3>
                      {retailer.website && (
                        <a href={retailer.website} target="_blank" rel="noreferrer" style={s.website}>
                          🌐 {retailer.website}
                        </a>
                      )}
                    </div>
                  </div>
                  <span style={hasFeed ? s.activeBadge : s.noBadge}>
                    {hasFeed ? '✅ Feed Set' : '⚠️ No Feed'}
                  </span>
                </div>

                {/* Last Fetched */}
                <div style={s.lastFetched}>
                  <span style={s.lastFetchedLabel}>🕐 Last refreshed:</span>
                  <span style={s.lastFetchedVal}>{formatDate(retailer.last_fetched_at)}</span>
                </div>

                {/* Feed URL input */}
                <div style={s.urlRow}>
                  {isEditing ? (
                    <>
                      <input
                        style={s.urlInput}
                        value={feedUrls[retailer.id] || ''}
                        onChange={e => setFeedUrls(prev => ({ ...prev, [retailer.id]: e.target.value }))}
                        placeholder="https://example.com/feed.xml"
                        autoFocus
                      />
                      <button style={s.saveBtn} onClick={() => handleSaveFeedUrl(retailer)}>
                        💾 Save
                      </button>
                      <button style={s.cancelBtn} onClick={() => setEditingId(null)}>
                        ✕
                      </button>
                    </>
                  ) : (
                    <>
                      <div style={s.urlDisplay}>
                        {feedUrls[retailer.id]
                          ? <span style={s.urlText}>🔗 {feedUrls[retailer.id]}</span>
                          : <span style={s.urlEmpty}>No feed URL set</span>
                        }
                      </div>
                      <button style={s.editBtn} onClick={() => setEditingId(retailer.id)}>
                        ✏️ {hasFeed ? 'Edit' : 'Set URL'}
                      </button>
                    </>
                  )}
                </div>

                {/* Result message */}
                {result && (
                  <div style={result.type === 'success' ? s.successMsg :
                              result.type === 'error' ? s.errorMsg : s.loadingMsg}>
                    {result.msg}
                  </div>
                )}

                {/* Refresh Button */}
                <button
                  style={isRefreshing ? s.refreshingBtn : hasFeed ? s.refreshBtn : s.refreshDisabledBtn}
                  onClick={() => handleRefresh(retailer)}
                  disabled={isRefreshing}>
                  {isRefreshing
                    ? <span style={s.spinner}>⟳</span>
                    : '🔄'} {isRefreshing ? ' Refreshing...' : ' Refresh Feed Now'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const getStyles = (dark) => ({
  container: { padding: '24px' },
  heading: { color: dark ? '#fff' : '#333', margin: '0 0 8px' },
  sub: { color: dark ? '#aaa' : '#888', fontSize: '14px', marginBottom: '24px' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' },
  stat: { background: dark ? '#1f1f1f' : 'white', padding: '20px', borderRadius: '10px', textAlign: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.08)' },
  statNum: { color: dark ? '#fff' : '#333', margin: '0 0 8px', fontSize: '28px' },
  statLabel: { color: dark ? '#aaa' : '#888', margin: 0, fontSize: '13px' },
  infoBanner: { background: dark ? '#1a2a1a' : '#f6ffed', border: `1px solid ${dark ? '#2a4a2a' : '#b7eb8f'}`, borderRadius: '10px', padding: '16px', marginBottom: '24px', display: 'flex', gap: '12px', alignItems: 'flex-start' },
  infoText: { color: dark ? '#aaa' : '#555', fontSize: '14px', lineHeight: '1.6' },
  loadingBox: { textAlign: 'center', padding: '60px', color: dark ? '#aaa' : '#888' },
  cards: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: '20px' },
  card: { background: dark ? '#1f1f1f' : 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)', border: `1px solid ${dark ? '#333' : '#f0f0f0'}` },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' },
  retailerInfo: { display: 'flex', gap: '12px', alignItems: 'flex-start' },
  retailerIcon: { fontSize: '28px' },
  retailerName: { color: dark ? '#fff' : '#333', margin: '0 0 4px', fontSize: '16px' },
  website: { color: '#1890ff', fontSize: '12px', textDecoration: 'none' },
  activeBadge: { background: '#f6ffed', color: '#52c41a', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '500', whiteSpace: 'nowrap' },
  noBadge: { background: '#fffbe6', color: '#faad14', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '500', whiteSpace: 'nowrap' },
  lastFetched: { display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '16px', padding: '8px 12px', background: dark ? '#2a2a2a' : '#f9f9f9', borderRadius: '8px' },
  lastFetchedLabel: { color: dark ? '#aaa' : '#888', fontSize: '13px' },
  lastFetchedVal: { color: dark ? '#fff' : '#333', fontSize: '13px', fontWeight: '500' },
  urlRow: { display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '12px' },
  urlInput: { flex: 1, padding: '10px 12px', borderRadius: '8px', border: `1px solid #1890ff`, fontSize: '13px', background: dark ? '#2a2a2a' : 'white', color: dark ? '#fff' : '#333', outline: 'none' },
  urlDisplay: { flex: 1, padding: '10px 12px', borderRadius: '8px', border: `1px solid ${dark ? '#333' : '#f0f0f0'}`, background: dark ? '#2a2a2a' : '#f9f9f9', overflow: 'hidden' },
  urlText: { color: '#1890ff', fontSize: '12px', wordBreak: 'break-all' },
  urlEmpty: { color: dark ? '#555' : '#bbb', fontSize: '13px', fontStyle: 'italic' },
  editBtn: { padding: '8px 14px', background: dark ? '#2a2a2a' : '#f0f2f5', color: dark ? '#fff' : '#333', border: `1px solid ${dark ? '#444' : '#ddd'}`, borderRadius: '8px', cursor: 'pointer', fontSize: '13px', whiteSpace: 'nowrap' },
  saveBtn: { padding: '8px 14px', background: '#52c41a', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', whiteSpace: 'nowrap' },
  cancelBtn: { padding: '8px 12px', background: dark ? '#333' : '#f0f0f0', color: dark ? '#fff' : '#333', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' },
  successMsg: { background: '#f6ffed', border: '1px solid #b7eb8f', color: '#52c41a', padding: '10px 14px', borderRadius: '8px', marginBottom: '12px', fontSize: '13px' },
  errorMsg: { background: '#fff2f0', border: '1px solid #ffccc7', color: '#ff4d4f', padding: '10px 14px', borderRadius: '8px', marginBottom: '12px', fontSize: '13px' },
  loadingMsg: { background: dark ? '#1a1a2e' : '#e6f7ff', border: '1px solid #91d5ff', color: '#1890ff', padding: '10px 14px', borderRadius: '8px', marginBottom: '12px', fontSize: '13px' },
  refreshBtn: { width: '100%', padding: '12px', background: 'linear-gradient(135deg, #1890ff, #096dd9)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },
  refreshingBtn: { width: '100%', padding: '12px', background: '#faad14', color: 'white', border: 'none', borderRadius: '8px', cursor: 'not-allowed', fontSize: '14px', fontWeight: '600' },
  refreshDisabledBtn: { width: '100%', padding: '12px', background: dark ? '#333' : '#f0f0f0', color: dark ? '#555' : '#bbb', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },
  spinner: { display: 'inline-block', animation: 'spin 1s linear infinite' },
});
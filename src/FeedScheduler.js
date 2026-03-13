import { useState, useEffect, useRef } from 'react';
import { djangoApi } from './api';

export default function FeedScheduler({ darkMode }) {
  const dark = darkMode;
  const s = getStyles(dark);

  const [retailers,    setRetailers]    = useState([]);
  const [loading,      setLoading]      = useState(true);

  // per-retailer state maps  { retailerId: value }
  const [urlInputs,    setUrlInputs]    = useState({});   // text input values
  const [editingId,    setEditingId]    = useState(null); // which card is in "set URL" mode
  const [saving,       setSaving]       = useState({});   // saving URL
  const [refreshing,   setRefreshing]   = useState({});   // refreshing feed
  const [uploading,    setUploading]    = useState({});   // uploading XML file
  const [results,      setResults]      = useState({});   // success/error messages

  // hidden file input refs per retailer
  const fileRefs = useRef({});

  // ── Load all retailers ──────────────────────────────────────────
  useEffect(() => {
    djangoApi.get('/retailers/')
      .then(r => {
        setRetailers(r.data);
        const init = {};
        r.data.forEach(rt => { init[rt.id] = rt.feed_url || ''; });
        setUrlInputs(init);
      })
      .catch(() => setResults(p => ({ ...p, global: 'Failed to load retailers' })))
      .finally(() => setLoading(false));
  }, []);

  // ── Set Feed URL ────────────────────────────────────────────────
  const saveUrl = async (retailer) => {
    const url = urlInputs[retailer.id] || '';
    setSaving(p => ({ ...p, [retailer.id]: true }));
    setResults(p => ({ ...p, [retailer.id]: null }));
    try {
      await djangoApi.post(`/retailers/${retailer.id}/update-feed/`, { feed_url: url });
      setRetailers(prev => prev.map(r =>
        r.id === retailer.id ? { ...r, feed_url: url } : r
      ));
      setEditingId(null);
      setResults(p => ({ ...p, [retailer.id]: { type: 'success', msg: '✅ Feed URL saved!' } }));
    } catch (e) {
      setResults(p => ({ ...p, [retailer.id]: { type: 'error', msg: '❌ Failed to save URL' } }));
    }
    setSaving(p => ({ ...p, [retailer.id]: false }));
  };

  // ── Refresh Feed from URL ───────────────────────────────────────
  const refreshFeed = async (retailer) => {
    if (!retailer.feed_url) {
      setResults(p => ({ ...p, [retailer.id]: { type: 'error', msg: '❌ No feed URL set' } }));
      return;
    }
    setRefreshing(p => ({ ...p, [retailer.id]: true }));
    setResults(p => ({ ...p, [retailer.id]: null }));
    try {
      const r = await djangoApi.post(`/retailers/${retailer.id}/refresh-feed/`);
      const d = r.data;
      setRetailers(prev => prev.map(rt =>
        rt.id === retailer.id
          ? { ...rt, last_fetched_at: d.last_fetched_at || new Date().toISOString() }
          : rt
      ));
      setResults(p => ({
        ...p,
        [retailer.id]: {
          type: 'success',
          msg: `✅ Done! Loaded: ${d.loaded} | Skipped: ${d.skipped} | Total: ${d.total_found}`,
        },
      }));
    } catch (e) {
      const msg = e.response?.data?.error || e.response?.data?.detail || 'Failed to refresh feed';
      setResults(p => ({ ...p, [retailer.id]: { type: 'error', msg: `❌ ${msg}` } }));
    }
    setRefreshing(p => ({ ...p, [retailer.id]: false }));
  };

  // ── Upload XML file directly for this retailer ──────────────────
  const handleFileSelect = async (retailer, file) => {
    if (!file) return;
    setUploading(p => ({ ...p, [retailer.id]: true }));
    setResults(p => ({ ...p, [retailer.id]: { type: 'info', msg: `⏳ Uploading ${file.name}...` } }));

    const form = new FormData();
    form.append('file', file);

    try {
      const r = await djangoApi.post('/upload-xml/', form);
      const d = r.data;
      // update last_fetched_at timestamp on the card
      setRetailers(prev => prev.map(rt =>
        rt.id === retailer.id
          ? { ...rt, last_fetched_at: new Date().toISOString() }
          : rt
      ));
      setResults(p => ({
        ...p,
        [retailer.id]: {
          type: 'success',
          msg: `✅ Uploaded! Loaded: ${d.loaded} | Skipped: ${d.skipped} | Total: ${d.total_found}`,
        },
      }));
    } catch (e) {
      const msg = e.response?.data?.error || e.response?.data?.detail || 'Upload failed';
      setResults(p => ({ ...p, [retailer.id]: { type: 'error', msg: `❌ ${msg}` } }));
    }

    // reset the file input so the same file can be re-selected
    if (fileRefs.current[retailer.id]) fileRefs.current[retailer.id].value = '';
    setUploading(p => ({ ...p, [retailer.id]: false }));
  };

  // ── Helpers ─────────────────────────────────────────────────────
  const fmtDate = (iso) => {
    if (!iso) return 'Never';
    return new Date(iso).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const hasFeed = (rt) => rt.feed_url && rt.feed_url.trim() !== '';

  // ── Render ──────────────────────────────────────────────────────
  if (loading) return (
    <div style={s.page}>
      <div style={s.loadBox}>⏳ Loading retailers...</div>
    </div>
  );

  return (
    <div style={s.page}>
      <h2 style={s.heading}>📅 Feed Scheduler</h2>
      <p style={s.sub}>
        Manage XML feed URLs and upload product data for each retailer.
        Set a URL to refresh automatically, or upload a file directly.
      </p>

      {results.global && (
        <div style={s.errorBox}>{results.global}</div>
      )}

      <div style={s.grid}>
        {retailers.map(rt => {
          const res        = results[rt.id];
          const isEditing  = editingId === rt.id;
          const isSaving   = saving[rt.id];
          const isRefresh  = refreshing[rt.id];
          const isUpload   = uploading[rt.id];
          const busy       = isSaving || isRefresh || isUpload;

          return (
            <div key={rt.id} style={s.card}>
              {/* ── Card header ── */}
              <div style={s.cardHeader}>
                <span style={s.storeName}>🏪</span>
                <div>
                  <div style={s.retailerName}>{rt.name}</div>
                  {rt.website && (
                    <a href={rt.website} target="_blank" rel="noreferrer" style={s.website}>
                      🌐 {rt.website}
                    </a>
                  )}
                </div>
              </div>

              {/* ── Feed status badge ── */}
              <div style={s.statusRow}>
                {hasFeed(rt)
                  ? <span style={{ ...s.badge, background: '#e6f4ff', color: '#0958d9', border: '1px solid #91caff' }}>✅ Feed Set</span>
                  : <span style={{ ...s.badge, background: '#fff7e6', color: '#d46b08', border: '1px solid #ffd591' }}>⚠️ No Feed</span>
                }
                <span style={s.lastFetched}>🕐 Last refreshed: {fmtDate(rt.last_fetched_at)}</span>
              </div>

              {/* ── Current feed URL ── */}
              {hasFeed(rt) && !isEditing && (
                <div style={s.feedUrlBox}>
                  <span style={s.feedUrlLabel}>Feed URL:</span>
                  <span style={s.feedUrlText}>{rt.feed_url}</span>
                </div>
              )}
              {!hasFeed(rt) && !isEditing && (
                <div style={s.noFeedMsg}>No feed URL set</div>
              )}

              {/* ── Set URL input (shown when editing) ── */}
              {isEditing && (
                <div style={{ marginBottom: 12 }}>
                  <input
                    style={s.input}
                    placeholder="https://example.com/feed.xml"
                    value={urlInputs[rt.id] || ''}
                    onChange={e => setUrlInputs(p => ({ ...p, [rt.id]: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && saveUrl(rt)}
                    autoFocus
                  />
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <button style={s.btnPrimary} onClick={() => saveUrl(rt)} disabled={isSaving}>
                      {isSaving ? '⏳ Saving...' : '💾 Save URL'}
                    </button>
                    <button style={s.btnGhost} onClick={() => setEditingId(null)}>Cancel</button>
                  </div>
                </div>
              )}

              {/* ── Result message ── */}
              {res && (
                <div style={{
                  ...s.resultMsg,
                  background: res.type === 'success' ? (dark ? '#162312' : '#f6ffed')
                            : res.type === 'error'   ? (dark ? '#2a1215' : '#fff2f0')
                            : (dark ? '#111a2c' : '#e6f4ff'),
                  color:      res.type === 'success' ? '#52c41a'
                            : res.type === 'error'   ? '#ff4d4f'
                            : '#1890ff',
                  border:     `1px solid ${
                              res.type === 'success' ? '#b7eb8f'
                            : res.type === 'error'   ? '#ffccc7'
                            : '#91caff'}`,
                }}>
                  {res.msg}
                </div>
              )}

              {/* ── Action buttons row ── */}
              <div style={s.actions}>
                {/* Edit / Set URL */}
                {!isEditing && (
                  <button style={s.btnGhost} onClick={() => setEditingId(rt.id)} disabled={busy}>
                    ✏️ {hasFeed(rt) ? 'Edit URL' : 'Set URL'}
                  </button>
                )}

                {/* Refresh from URL */}
                <button
                  style={{ ...s.btnPrimary, opacity: hasFeed(rt) ? 1 : 0.5 }}
                  onClick={() => refreshFeed(rt)}
                  disabled={busy || !hasFeed(rt)}
                  title={hasFeed(rt) ? 'Fetch products from feed URL' : 'Set a feed URL first'}
                >
                  {isRefresh ? '⏳ Refreshing...' : '🔄 Refresh Feed'}
                </button>

                {/* ── NEW: Upload XML file directly ── */}
                <button
                  style={s.btnUpload}
                  onClick={() => fileRefs.current[rt.id]?.click()}
                  disabled={busy}
                  title="Upload XML file directly for this retailer"
                >
                  {isUpload ? '⏳ Uploading...' : '📁 Upload XML'}
                </button>

                {/* hidden file input */}
                <input
                  type="file"
                  accept=".xml"
                  style={{ display: 'none' }}
                  ref={el => fileRefs.current[rt.id] = el}
                  onChange={e => handleFileSelect(rt, e.target.files[0])}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Styles ─────────────────────────────────────────────────────────
const getStyles = (dark) => ({
  page: {
    padding: 24,
    background: dark ? '#141414' : '#f5f5f5',
    minHeight: '100vh',
  },
  heading: {
    color: dark ? '#fff' : '#1f2937',
    margin: '0 0 8px',
    fontSize: 22,
    fontWeight: 700,
  },
  sub: {
    color: dark ? '#9ca3af' : '#6b7280',
    fontSize: 14,
    marginBottom: 24,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
    gap: 20,
  },
  card: {
    background: dark ? '#1f1f1f' : '#fff',
    borderRadius: 12,
    padding: 20,
    boxShadow: dark ? '0 2px 12px rgba(0,0,0,0.4)' : '0 2px 12px rgba(0,0,0,0.08)',
    border: `1px solid ${dark ? '#303030' : '#e5e7eb'}`,
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 14,
  },
  storeName: {
    fontSize: 28,
  },
  retailerName: {
    fontWeight: 700,
    fontSize: 16,
    color: dark ? '#fff' : '#1f2937',
    marginBottom: 2,
  },
  website: {
    fontSize: 12,
    color: '#1890ff',
    textDecoration: 'none',
  },
  statusRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  badge: {
    padding: '2px 10px',
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 600,
  },
  lastFetched: {
    fontSize: 12,
    color: dark ? '#6b7280' : '#9ca3af',
  },
  feedUrlBox: {
    background: dark ? '#141414' : '#f9fafb',
    border: `1px solid ${dark ? '#303030' : '#e5e7eb'}`,
    borderRadius: 8,
    padding: '8px 12px',
    marginBottom: 12,
    wordBreak: 'break-all',
  },
  feedUrlLabel: {
    fontSize: 11,
    color: dark ? '#6b7280' : '#9ca3af',
    display: 'block',
    marginBottom: 2,
  },
  feedUrlText: {
    fontSize: 12,
    color: '#1890ff',
  },
  noFeedMsg: {
    fontSize: 13,
    color: dark ? '#6b7280' : '#9ca3af',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  input: {
    width: '100%',
    padding: '9px 12px',
    border: `1px solid ${dark ? '#444' : '#d1d5db'}`,
    borderRadius: 8,
    background: dark ? '#141414' : '#fff',
    color: dark ? '#fff' : '#1f2937',
    fontSize: 13,
    boxSizing: 'border-box',
    outline: 'none',
  },
  actions: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
    marginTop: 4,
  },
  btnPrimary: {
    padding: '8px 16px',
    background: '#1890ff',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 500,
    whiteSpace: 'nowrap',
  },
  btnGhost: {
    padding: '8px 16px',
    background: 'transparent',
    color: dark ? '#9ca3af' : '#6b7280',
    border: `1px solid ${dark ? '#444' : '#d1d5db'}`,
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 13,
    whiteSpace: 'nowrap',
  },
  btnUpload: {
    padding: '8px 16px',
    background: dark ? '#162312' : '#f6ffed',
    color: '#52c41a',
    border: '1px solid #b7eb8f',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 500,
    whiteSpace: 'nowrap',
  },
  resultMsg: {
    fontSize: 13,
    padding: '8px 12px',
    borderRadius: 8,
    marginBottom: 12,
    fontWeight: 500,
  },
  loadBox: {
    padding: 40,
    textAlign: 'center',
    color: dark ? '#6b7280' : '#9ca3af',
    fontSize: 15,
  },
  errorBox: {
    background: '#fff2f0',
    border: '1px solid #ffccc7',
    color: '#cf1322',
    padding: '12px 16px',
    borderRadius: 8,
    marginBottom: 16,
    fontSize: 14,
  },
});
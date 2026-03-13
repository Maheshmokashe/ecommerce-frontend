import { useState, useEffect } from 'react';
import { djangoApi } from './api';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function ScrapeHealth({ darkMode }) {
  const dark = darkMode;
  const s = getStyles(dark);

  const [data,       setData]       = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [days,       setDays]       = useState(30);
  const [activeTab,  setActiveTab]  = useState('overview');
  const [expanded,   setExpanded]   = useState({});  // retailer name → bool

  const fetchData = (d = days) => {
    setLoading(true);
    setError(null);
    djangoApi.get('/scrape-health/', { params: { days: d } })
      .then(r => setData(r.data))
      .catch(() => setError('Failed to load scrape health data'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const toggleExpand = (name) =>
    setExpanded(p => ({ ...p, [name]: !p[name] }));

  const healthColor = (h) => ({
    healthy:  { bg: dark ? '#162312' : '#f6ffed', border: '#b7eb8f', text: '#52c41a', dot: '#52c41a' },
    watch:    { bg: dark ? '#2b2111' : '#fffbe6', border: '#ffe58f', text: '#faad14', dot: '#faad14' },
    warning:  { bg: dark ? '#2b1d11' : '#fff7e6', border: '#ffd591', text: '#fa8c16', dot: '#fa8c16' },
    critical: { bg: dark ? '#2a1215' : '#fff2f0', border: '#ffccc7', text: '#ff4d4f', dot: '#ff4d4f' },
  }[h] || { bg: '#f5f5f5', border: '#d9d9d9', text: '#666', dot: '#999' });

  const alertColor = (t) => ({
    critical: '#ff4d4f',
    high:     '#fa8c16',
    medium:   '#faad14',
  }[t] || '#1890ff');

  const tabs = [
    { key: 'overview', label: '🏥 Overview' },
    { key: 'alerts',   label: `🚨 Alerts ${data ? `(${data.total_alerts})` : ''}` },
    { key: 'quality',  label: '📉 Quality Scores' },
    { key: 'trends',   label: '📈 Trends' },
  ];

  if (loading) return <div style={s.page}><div style={s.center}>⏳ Loading scrape health...</div></div>;
  if (error)   return <div style={s.page}><div style={s.errorBox}>{error}</div></div>;
  if (!data)   return null;

  return (
    <div style={s.page}>

      {/* ── Header ── */}
      <div style={s.header}>
        <div>
          <h2 style={s.heading}>📊 Scrape Health Dashboard</h2>
          <p style={s.sub}>Monitor scraper status, auto-alerts, and data quality per retailer</p>
        </div>
        <div style={s.headerRight}>
          <select
            style={s.select}
            value={days}
            onChange={e => { setDays(+e.target.value); fetchData(+e.target.value); }}
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
          <button style={s.refreshBtn} onClick={() => fetchData()}>🔄 Refresh</button>
        </div>
      </div>

      {/* ── Summary stat cards ── */}
      <div style={s.statsRow}>
        {[
          { label: 'Total Retailers', value: data.retailers.length, color: '#1890ff' },
          { label: 'Healthy',         value: data.retailers.filter(r => r.health === 'healthy').length,  color: '#52c41a' },
          { label: 'Warning / Watch', value: data.retailers.filter(r => r.health === 'warning' || r.health === 'watch').length, color: '#fa8c16' },
          { label: 'Critical',        value: data.retailers.filter(r => r.health === 'critical').length, color: '#ff4d4f' },
          { label: 'Total Alerts',    value: data.total_alerts,   color: '#ff4d4f' },
          { label: 'Critical Alerts', value: data.critical_count, color: '#cf1322' },
        ].map(c => (
          <div key={c.label} style={s.statCard}>
            <div style={{ ...s.statValue, color: c.color }}>{c.value}</div>
            <div style={s.statLabel}>{c.label}</div>
          </div>
        ))}
      </div>

      {/* ── Tabs ── */}
      <div style={s.tabBar}>
        {tabs.map(t => (
          <div
            key={t.key}
            style={{ ...s.tab, ...(activeTab === t.key ? s.tabActive : {}) }}
            onClick={() => setActiveTab(t.key)}
          >
            {t.label}
          </div>
        ))}
      </div>

      {/* ══════════════════════════════════════════
          TAB 1 — Overview
      ══════════════════════════════════════════ */}
      {activeTab === 'overview' && (
        <div style={s.tabContent}>
          {data.retailers.length === 0 ? (
            <div style={s.empty}>No upload data found. Run a scrape first to see health data.</div>
          ) : (
            data.retailers.map(rt => {
              const hc = healthColor(rt.health);
              const isOpen = expanded[rt.retailer];
              return (
                <div key={rt.retailer} style={{ ...s.retailerCard, background: hc.bg, border: `1px solid ${hc.border}` }}>
                  {/* Card header row */}
                  <div style={s.rtHeader} onClick={() => toggleExpand(rt.retailer)}>
                    <div style={s.rtLeft}>
                      <span style={{ ...s.healthDot, background: hc.dot }} />
                      <span style={s.rtName}>{rt.retailer}</span>
                      <span style={{ ...s.healthBadge, color: hc.text, border: `1px solid ${hc.border}` }}>
                        {rt.health.toUpperCase()}
                      </span>
                      {rt.alert_count > 0 && (
                        <span style={s.alertCount}>🚨 {rt.alert_count} alert{rt.alert_count > 1 ? 's' : ''}</span>
                      )}
                    </div>
                    <div style={s.rtRight}>
                      <span style={s.rtStat}>✅ {rt.success_rate}% success</span>
                      <span style={s.rtStat}>📦 {rt.last_loaded} loaded</span>
                      <span style={s.rtStat}>🕐 {rt.last_run?.slice(0, 16)}</span>
                      <span style={s.chevron}>{isOpen ? '▲' : '▼'}</span>
                    </div>
                  </div>

                  {/* Expanded detail */}
                  {isOpen && (
                    <div style={s.rtDetail}>
                      <div style={s.rtGrid}>
                        {[
                          ['Total Runs',       rt.total_runs],
                          ['Success Rate',     rt.success_rate + '%'],
                          ['Failed Runs',      rt.failed_runs],
                          ['Last Loaded',      rt.last_loaded],
                          ['Last Skipped',     rt.last_skipped],
                          ['Last Total Found', rt.last_total],
                          ['Avg Duration',     rt.avg_duration ? rt.avg_duration + 's' : 'N/A'],
                          ['Max Duration',     rt.max_duration ? rt.max_duration + 's' : 'N/A'],
                        ].map(([label, val]) => (
                          <div key={label} style={s.rtGridCell}>
                            <div style={s.rtGridLabel}>{label}</div>
                            <div style={s.rtGridVal}>{val}</div>
                          </div>
                        ))}
                      </div>

                      {/* Inline alerts */}
                      {rt.alerts.length > 0 && (
                        <div style={{ marginTop: 14 }}>
                          {rt.alerts.map((a, i) => (
                            <div key={i} style={{ ...s.alertRow, borderLeft: `3px solid ${alertColor(a.type)}` }}>
                              <span style={{ fontSize: 16 }}>{a.icon}</span>
                              <div>
                                <div style={{ ...s.alertMsg, color: alertColor(a.type) }}>{a.message}</div>
                                <div style={s.alertDetail}>{a.detail}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════
          TAB 2 — Alerts
      ══════════════════════════════════════════ */}
      {activeTab === 'alerts' && (
        <div style={s.tabContent}>
          {data.all_alerts.length === 0 ? (
            <div style={s.empty}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
              <div style={{ fontSize: 18, fontWeight: 600, color: '#52c41a' }}>All scrapers healthy!</div>
              <div style={{ fontSize: 14, color: dark ? '#6b7280' : '#9ca3af', marginTop: 6 }}>
                No alerts detected in the last {days} days
              </div>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: 16, fontSize: 14, color: dark ? '#9ca3af' : '#6b7280' }}>
                {data.total_alerts} alert{data.total_alerts !== 1 ? 's' : ''} detected across {data.retailers.filter(r => r.alert_count > 0).length} retailer{data.retailers.filter(r => r.alert_count > 0).length !== 1 ? 's' : ''}
              </div>
              {data.all_alerts.map((a, i) => (
                <div key={i} style={{ ...s.alertCard, borderLeft: `4px solid ${alertColor(a.type)}` }}>
                  <div style={s.alertCardHeader}>
                    <span style={{ fontSize: 20 }}>{a.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                        <span style={{ ...s.alertTypeBadge, background: alertColor(a.type) }}>
                          {a.type.toUpperCase()}
                        </span>
                        <span style={{ fontWeight: 600, color: dark ? '#fff' : '#1f2937', fontSize: 14 }}>
                          {a.retailer}
                        </span>
                        <span style={{ fontSize: 12, color: dark ? '#6b7280' : '#9ca3af' }}>
                          {a.detected_at?.slice(0, 16)}
                        </span>
                      </div>
                      <div style={{ ...s.alertMsg, color: alertColor(a.type), marginTop: 4 }}>{a.message}</div>
                      <div style={s.alertDetail}>{a.detail}</div>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════
          TAB 3 — Quality Scores
      ══════════════════════════════════════════ */}
      {activeTab === 'quality' && (
        <div style={s.tabContent}>
          <p style={{ fontSize: 13, color: dark ? '#9ca3af' : '#6b7280', marginBottom: 20 }}>
            Quality score = % of products in the XML feed that were successfully loaded. 
            <strong style={{ color: dark ? '#d1d5db' : '#374151' }}> Note: "Skipped" includes both existing products (already in DB) and parse errors — a high skip rate on refresh runs is normal.</strong>
          </p>
          {data.retailers.map(rt => (
            <div key={rt.retailer} style={s.qualityCard}>
              <div style={s.qualityHeader}>
                <span style={s.rtName}>{rt.retailer}</span>
                {rt.quality_scores.length > 0 && (
                  <span style={{
                    ...s.qualityScore,
                    color: rt.quality_scores.slice(-1)[0].score >= 80 ? '#52c41a'
                         : rt.quality_scores.slice(-1)[0].score >= 60 ? '#fa8c16' : '#ff4d4f'
                  }}>
                    Latest: {rt.quality_scores.slice(-1)[0].score}%
                  </span>
                )}
              </div>
              {rt.quality_scores.length === 0 ? (
                <div style={{ fontSize: 13, color: dark ? '#6b7280' : '#9ca3af' }}>No data</div>
              ) : (
                <div style={s.qualityTable}>
                  <div style={s.qualityTableHeader}>
                    {['Date', 'Loaded', 'Skipped', 'Total Found', 'Quality %', 'Status'].map(h => (
                      <div key={h} style={s.qualityTH}>{h}</div>
                    ))}
                  </div>
                  {[...rt.quality_scores].reverse().map((q, i) => (
                    <div key={i} style={{ ...s.qualityRow, background: i % 2 === 0 ? 'transparent' : (dark ? '#ffffff08' : '#f9fafb') }}>
                      <div style={s.qualityTD}>{q.date}</div>
                      <div style={s.qualityTD}>{q.loaded}</div>
                      <div style={{ ...s.qualityTD, color: dark ? '#9ca3af' : '#6b7280' }}>{q.skipped}</div>
                      <div style={s.qualityTD}>{q.total_found}</div>
                      <div style={{
                        ...s.qualityTD, fontWeight: 700,
                        color: q.score >= 80 ? '#52c41a' : q.score >= 60 ? '#fa8c16' : '#ff4d4f'
                      }}>
                        {q.score}%
                        <div style={{ ...s.qualityBar, width: '100%', background: dark ? '#303030' : '#e5e7eb', marginTop: 3 }}>
                          <div style={{
                            ...s.qualityBarFill,
                            width: `${q.score}%`,
                            background: q.score >= 80 ? '#52c41a' : q.score >= 60 ? '#fa8c16' : '#ff4d4f'
                          }} />
                        </div>
                      </div>
                      <div style={s.qualityTD}>
                        <span style={{
                          padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600,
                          background: q.status === 'success' ? '#f6ffed' : '#fff2f0',
                          color:      q.status === 'success' ? '#52c41a'  : '#ff4d4f',
                          border:     `1px solid ${q.status === 'success' ? '#b7eb8f' : '#ffccc7'}`,
                        }}>
                          {q.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ══════════════════════════════════════════
          TAB 4 — Trends
      ══════════════════════════════════════════ */}
      {activeTab === 'trends' && (
        <div style={s.tabContent}>
          <p style={{ fontSize: 13, color: dark ? '#9ca3af' : '#6b7280', marginBottom: 20 }}>
            Product count per scrape run. A sudden drop could mean the scraper is being blocked or the site structure changed.
          </p>
          {data.retailers.map(rt => (
            <div key={rt.retailer} style={s.trendCard}>
              <div style={s.qualityHeader}>
                <span style={s.rtName}>{rt.retailer}</span>
                <span style={{ fontSize: 12, color: dark ? '#6b7280' : '#9ca3af' }}>
                  Last {rt.trend.length} runs
                </span>
              </div>
              {rt.trend.length < 2 ? (
                <div style={{ fontSize: 13, color: dark ? '#6b7280' : '#9ca3af' }}>
                  Need at least 2 runs to show trend
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={rt.trend} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={dark ? '#303030' : '#e5e7eb'} />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: dark ? '#9ca3af' : '#6b7280' }} />
                    <YAxis tick={{ fontSize: 11, fill: dark ? '#9ca3af' : '#6b7280' }} />
                    <Tooltip
                      contentStyle={{ background: dark ? '#1f1f1f' : '#fff', border: `1px solid ${dark ? '#303030' : '#e5e7eb'}`, borderRadius: 8 }}
                      labelStyle={{ color: dark ? '#fff' : '#1f2937' }}
                    />
                    <Line type="monotone" dataKey="loaded"      stroke="#1890ff" strokeWidth={2} dot={{ r: 4 }} name="Loaded" />
                    <Line type="monotone" dataKey="total_found" stroke="#52c41a" strokeWidth={2} dot={{ r: 4 }} name="Total Found" strokeDasharray="4 2" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Styles ──────────────────────────────────────────────────────────
const getStyles = (dark) => ({
  page:        { padding: 24, background: dark ? '#141414' : '#f5f5f5', minHeight: '100vh' },
  header:      { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 },
  heading:     { color: dark ? '#fff' : '#1f2937', margin: '0 0 4px', fontSize: 22, fontWeight: 700 },
  sub:         { color: dark ? '#9ca3af' : '#6b7280', fontSize: 13, margin: 0 },
  headerRight: { display: 'flex', gap: 10, alignItems: 'center' },
  select:      { padding: '8px 12px', border: `1px solid ${dark ? '#444' : '#d1d5db'}`, borderRadius: 8, background: dark ? '#1f1f1f' : '#fff', color: dark ? '#fff' : '#1f2937', fontSize: 13, cursor: 'pointer' },
  refreshBtn:  { padding: '8px 16px', background: '#1890ff', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 500 },

  statsRow:    { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12, marginBottom: 24 },
  statCard:    { background: dark ? '#1f1f1f' : '#fff', borderRadius: 10, padding: '16px 12px', textAlign: 'center', border: `1px solid ${dark ? '#303030' : '#e5e7eb'}` },
  statValue:   { fontSize: 28, fontWeight: 700, lineHeight: 1 },
  statLabel:   { fontSize: 11, color: dark ? '#6b7280' : '#9ca3af', marginTop: 4 },

  tabBar:      { display: 'flex', gap: 4, marginBottom: 20, borderBottom: `1px solid ${dark ? '#303030' : '#e5e7eb'}`, flexWrap: 'wrap' },
  tab:         { padding: '10px 18px', cursor: 'pointer', fontSize: 13, color: dark ? '#9ca3af' : '#6b7280', borderBottom: '2px solid transparent', whiteSpace: 'nowrap' },
  tabActive:   { color: '#1890ff', borderBottom: '2px solid #1890ff', fontWeight: 600 },
  tabContent:  { },

  retailerCard: { borderRadius: 12, marginBottom: 12, overflow: 'hidden' },
  rtHeader:    { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', cursor: 'pointer', flexWrap: 'wrap', gap: 10 },
  rtLeft:      { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  rtRight:     { display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' },
  healthDot:   { width: 10, height: 10, borderRadius: '50%', flexShrink: 0 },
  rtName:      { fontWeight: 700, fontSize: 15, color: dark ? '#fff' : '#1f2937' },
  healthBadge: { fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 20, background: 'transparent' },
  alertCount:  { fontSize: 12, color: '#ff4d4f', fontWeight: 600 },
  rtStat:      { fontSize: 12, color: dark ? '#9ca3af' : '#6b7280' },
  chevron:     { fontSize: 11, color: dark ? '#6b7280' : '#9ca3af' },

  rtDetail:    { padding: '0 18px 16px' },
  rtGrid:      { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10 },
  rtGridCell:  { background: dark ? '#ffffff08' : '#ffffff88', borderRadius: 8, padding: '10px 12px' },
  rtGridLabel: { fontSize: 11, color: dark ? '#6b7280' : '#9ca3af', marginBottom: 2 },
  rtGridVal:   { fontSize: 15, fontWeight: 700, color: dark ? '#fff' : '#1f2937' },

  alertRow:    { display: 'flex', gap: 10, alignItems: 'flex-start', padding: '10px 12px', borderRadius: 8, marginTop: 8, background: dark ? '#ffffff08' : '#ffffff88' },
  alertCard:   { background: dark ? '#1f1f1f' : '#fff', borderRadius: 10, padding: '14px 16px', marginBottom: 10, boxShadow: dark ? 'none' : '0 1px 4px rgba(0,0,0,0.06)' },
  alertCardHeader: { display: 'flex', gap: 12, alignItems: 'flex-start' },
  alertTypeBadge:  { padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, color: '#fff' },
  alertMsg:    { fontSize: 14, fontWeight: 600 },
  alertDetail: { fontSize: 12, color: dark ? '#9ca3af' : '#6b7280', marginTop: 2 },

  qualityCard:  { background: dark ? '#1f1f1f' : '#fff', borderRadius: 12, padding: 18, marginBottom: 14, border: `1px solid ${dark ? '#303030' : '#e5e7eb'}` },
  qualityHeader:{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  qualityScore: { fontSize: 18, fontWeight: 700 },
  qualityTable: { },
  qualityTableHeader: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1.5fr 1fr', gap: 4, marginBottom: 4 },
  qualityTH:    { fontSize: 11, fontWeight: 700, color: dark ? '#6b7280' : '#9ca3af', padding: '4px 8px' },
  qualityRow:   { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1.5fr 1fr', gap: 4, borderRadius: 6 },
  qualityTD:    { fontSize: 13, color: dark ? '#d1d5db' : '#374151', padding: '8px 8px' },
  qualityBar:   { height: 4, borderRadius: 2, overflow: 'hidden' },
  qualityBarFill: { height: '100%', borderRadius: 2, transition: 'width 0.3s' },

  trendCard:    { background: dark ? '#1f1f1f' : '#fff', borderRadius: 12, padding: 18, marginBottom: 14, border: `1px solid ${dark ? '#303030' : '#e5e7eb'}` },

  center:       { padding: 60, textAlign: 'center', color: dark ? '#6b7280' : '#9ca3af', fontSize: 16 },
  empty:        { padding: 60, textAlign: 'center', color: dark ? '#6b7280' : '#9ca3af' },
  errorBox:     { background: '#fff2f0', border: '1px solid #ffccc7', color: '#cf1322', padding: '12px 16px', borderRadius: 8, margin: 24 },
});
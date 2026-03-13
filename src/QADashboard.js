import { useState, useRef, useEffect } from 'react';
import { djangoApi } from './api';

// ─── API calls ────────────────────────────────────────────
const getQAReport         = (r) => djangoApi.get('/qa/data-quality/',       { params: r ? { retailer: r } : {} });
const getFixSuggestions   = (r) => djangoApi.get('/qa/fix-suggestions/',    { params: r ? { retailer: r } : {} });
const getAdvancedRules    = (r) => djangoApi.get('/qa/advanced-rules/',     { params: r ? { retailer: r } : {} });
const getRetailerComp     = ()  => djangoApi.get('/qa/retailer-comparison/');
const getRetailersList    = ()  => djangoApi.get('/retailers/');
const getPriceChanges     = (p) => djangoApi.get('/qa/price-changes/', { params: p });
const getUploadFlags      = ()  => djangoApi.get('/qa/upload-flags/');
const validateFeed        = (file) => {
  const form = new FormData();
  form.append('file', file);
  return djangoApi.post('/qa/validate-feed/', form);
};

// ─── Helpers ──────────────────────────────────────────────
const ScoreBadge = ({ score }) => {
  const color = score >= 90 ? '#52c41a' : score >= 70 ? '#faad14' : '#ff4d4f';
  const label = score >= 90 ? '✅ Excellent' : score >= 70 ? '⚠️ Fair' : '❌ Poor';
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
      <div style={{ width: 72, height: 72, borderRadius: '50%', border: `5px solid ${color}`,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 18, fontWeight: 700, color }}>{score}%</span>
      </div>
      <span style={{ color, fontWeight: 600, fontSize: 15 }}>{label}</span>
    </div>
  );
};

const Bar = ({ pct, color = '#1890ff', height = 6 }) => (
  <div style={{ background: '#f0f0f0', borderRadius: 4, overflow: 'hidden', height }}>
    <div style={{ width: `${Math.min(pct, 100)}%`, background: color, height: '100%', borderRadius: 4, transition: 'width 0.4s ease' }} />
  </div>
);

const SeverityBadge = ({ sev }) => {
  const map = { critical: ['#ff4d4f','#fff2f0'], high: ['#fa8c16','#fff7e6'], medium: ['#faad14','#fffbe6'], low: ['#52c41a','#f6ffed'] };
  const [color, bg] = map[sev] || ['#666','#f0f0f0'];
  return <span style={{ background: bg, color, border: `1px solid ${color}`, borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>{sev}</span>;
};

const pctColor = (pct, invert = false) => {
  const good = invert ? pct < 5 : pct >= 95;
  const ok   = invert ? pct < 20 : pct >= 70;
  return good ? '#52c41a' : ok ? '#faad14' : '#ff4d4f';
};

// ─── IssueRow — expandable with samples ───────────────────
const IssueRow = ({ label, count, pct, samples, dark }) => {
  const [open, setOpen] = useState(false);
  const color = pct === 0 ? '#52c41a' : pct < 5 ? '#faad14' : '#ff4d4f';
  const s = getStyles(dark);
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: count > 0 ? 'pointer' : 'default' }}
        onClick={() => count > 0 && setOpen(!open)}>
        <span style={{ minWidth: 220, color: dark ? '#ddd' : '#333', fontSize: 14 }}>{label}</span>
        <div style={{ flex: 1 }}><Bar pct={pct} color={color} height={8} /></div>
        <span style={{ minWidth: 80, textAlign: 'right', color, fontWeight: 600, fontSize: 14 }}>
          {count.toLocaleString()} ({pct}%)
        </span>
        {count > 0 && <span style={{ color: '#1890ff', fontSize: 12 }}>{open ? '▲' : '▼ Samples'}</span>}
      </div>
      {open && samples?.length > 0 && (
        <div style={{ marginTop: 8, marginLeft: 232, background: dark ? '#2a2a2a' : '#f9f9f9',
          borderRadius: 6, overflow: 'hidden', border: `1px solid ${dark ? '#333' : '#eee'}` }}>
          <table style={s.table}>
            <thead><tr>{['SKU','Name','Retailer','Price'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr></thead>
            <tbody>
              {samples.map((p, i) => (
                <tr key={i} style={i % 2 === 0 ? s.trEven : {}}>
                  <td style={s.td}><code style={{ fontSize: 11 }}>{p.sku}</code></td>
                  <td style={s.td}>{p.name?.slice(0, 40)}{p.name?.length > 40 ? '…' : ''}</td>
                  <td style={s.td}>{p.retailer__name}</td>
                  <td style={s.td}>{p.price}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ─── Fix Suggestion Card ───────────────────────────────────
const SuggestionCard = ({ item, dark }) => {
  const [open, setOpen] = useState(false);
  const s = getStyles(dark);
  const sevColor = { critical: '#ff4d4f', high: '#fa8c16', medium: '#faad14', low: '#52c41a' }[item.severity];
  return (
    <div style={{ border: `1px solid ${dark ? '#333' : '#f0f0f0'}`, borderLeft: `4px solid ${sevColor}`,
      borderRadius: 8, padding: '14px 16px', marginBottom: 12, background: dark ? '#1a1a1a' : '#fff' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20 }}>{item.icon}</span>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontWeight: 600, color: dark ? '#fff' : '#333', fontSize: 14 }}>{item.title}</span>
              <SeverityBadge sev={item.severity} />
            </div>
            <div style={{ color: dark ? '#aaa' : '#888', fontSize: 12, marginTop: 2 }}>
              {item.affected.toLocaleString()} products affected ({item.pct}%)
            </div>
          </div>
        </div>
        <div style={{ minWidth: 120, textAlign: 'right' }}>
          <Bar pct={item.pct} color={sevColor} height={6} />
        </div>
      </div>

      <div style={{ marginTop: 10, padding: '10px 12px', background: dark ? '#2a2a2a' : '#f6f8fa',
        borderRadius: 6, fontSize: 13, color: dark ? '#ccc' : '#444', lineHeight: 1.5 }}>
        💡 <strong>Suggestion:</strong> {item.suggestion}
      </div>

      {item.samples?.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <button onClick={() => setOpen(!open)}
            style={{ background: 'none', border: 'none', color: '#1890ff', cursor: 'pointer', fontSize: 12, padding: 0 }}>
            {open ? '▲ Hide samples' : `▼ Show ${item.samples.length} sample products`}
          </button>
          {open && (
            <table style={{ ...s.table, marginTop: 8 }}>
              <thead><tr>{['SKU','Name','Retailer','Product URL'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr></thead>
              <tbody>
                {item.samples.map((p, i) => (
                  <tr key={i} style={i % 2 === 0 ? s.trEven : {}}>
                    <td style={s.td}><code style={{ fontSize: 11 }}>{p.sku}</code></td>
                    <td style={s.td}>{p.name?.slice(0, 40)}{p.name?.length > 40 ? '…' : ''}</td>
                    <td style={s.td}>{p.retailer__name}</td>
                    <td style={s.td}>
                      {p.source_url ? (
                        <a href={p.source_url} target="_blank" rel="noreferrer"
                          style={{ color: '#1890ff', fontSize: 12, textDecoration: 'none' }}
                          title={p.source_url}>
                          🔗 View Product
                        </a>
                      ) : (
                        <span style={{ color: '#aaa', fontSize: 12 }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Filter Bar — defined OUTSIDE main component to prevent re-render focus loss ──
const FilterBar = ({ retailer, setRetailer, onRun, btnLabel, loading: isLoading, dark, retailers }) => {
  const s = getStyles(dark);
  return (
    <div style={s.card}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div>
          <label style={s.label}>Filter by Retailer (optional)</label>
          <select
            style={{ ...s.input, cursor: 'pointer', minWidth: 260 }}
            value={retailer}
            onChange={e => setRetailer(e.target.value)}
          >
            <option value="">— All Retailers —</option>
            {retailers.map(r => (
              <option key={r.id} value={r.name}>{r.name}</option>
            ))}
          </select>
        </div>
        <button style={{ ...s.btn, marginTop: 22 }} onClick={onRun} disabled={isLoading}>
          {isLoading ? '⏳ Loading...' : btnLabel}
        </button>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────
export default function QADashboard({ darkMode }) {
  const s = getStyles(darkMode);
  const [activeTab, setActiveTab] = useState('quality');
  const [retailer, setRetailer]   = useState('');

  // Tab states
  const [report,       setReport]       = useState(null);
  const [suggestions,  setSuggestions]  = useState(null);
  const [advanced,     setAdvanced]     = useState(null);
  const [comparison,   setComparison]   = useState(null);
  const [uploadFlags,  setUploadFlags]  = useState(null);
  const [validation,   setValidation]   = useState(null);
  const [priceChanges, setPriceChanges] = useState(null);
  const [priceFilter,  setPriceFilter]  = useState({ days: 30, change_type: '', page: 1 });

  // Loading/error states
  const [loading, setLoading] = useState({});
  const [errors,  setErrors]  = useState({});

  const setLoad = (key, val) => setLoading(p => ({ ...p, [key]: val }));
  const setErr  = (key, val) => setErrors(p => ({ ...p, [key]: val }));

  // Retailers list for dropdown
  const [retailers, setRetailers] = useState([]);
  useEffect(() => {
    getRetailersList().then(r => setRetailers(r.data || [])).catch(() => {});
  }, []);

  const [file,     setFile]     = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef();

  // ── Fetch functions ──────────────────────
  const fetchReport = async () => {
    setLoad('report', true); setErr('report', ''); setReport(null);
    try { const r = await getQAReport(retailer || null); setReport(r.data); }
    catch (e) { setErr('report', e.response?.data?.error || 'Failed to load report'); }
    setLoad('report', false);
  };

  const fetchSuggestions = async () => {
    setLoad('suggestions', true); setErr('suggestions', ''); setSuggestions(null);
    try { const r = await getFixSuggestions(retailer || null); setSuggestions(r.data); }
    catch (e) { setErr('suggestions', e.response?.data?.error || 'Failed to load suggestions'); }
    setLoad('suggestions', false);
  };

  const fetchAdvanced = async () => {
    setLoad('advanced', true); setErr('advanced', ''); setAdvanced(null);
    try { const r = await getAdvancedRules(retailer || null); setAdvanced(r.data); }
    catch (e) { setErr('advanced', e.response?.data?.error || 'Failed to load rules'); }
    setLoad('advanced', false);
  };

  const fetchComparison = async () => {
    setLoad('comparison', true); setErr('comparison', ''); setComparison(null);
    try { const r = await getRetailerComp(); setComparison(r.data); }
    catch (e) { setErr('comparison', e.response?.data?.error || 'Failed to load comparison'); }
    setLoad('comparison', false);
  };

  const fetchUploadFlags = async () => {
    setLoad('uploadFlags', true); setErr('uploadFlags', ''); setUploadFlags(null);
    try { const r = await getUploadFlags(); setUploadFlags(r.data); }
    catch (e) { setErr('uploadFlags', e.response?.data?.error || 'Failed to load flags'); }
    setLoad('uploadFlags', false);
  };

  const fetchPriceChanges = async (overrides = {}) => {
    const params = { ...priceFilter, ...overrides };
    if (retailer) params.retailer = retailer;
    setLoad('prices', true); setErr('prices', ''); setPriceChanges(null);
    try { const r = await getPriceChanges(params); setPriceChanges(r.data); }
    catch (e) { setErr('prices', e.response?.data?.error || 'Failed to load price changes'); }
    setLoad('prices', false);
  };

  const runValidation = async (f) => {
    const target = f || file;
    if (!target) return;
    setLoad('validation', true); setErr('validation', ''); setValidation(null);
    try { const r = await validateFeed(target); setValidation(r.data); }
    catch (e) { setErr('validation', e.response?.data?.error || e.response?.data?.detail || e.message || 'Failed to validate feed'); }
    setLoad('validation', false);
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) { setFile(f); runValidation(f); }
  };

  const tabs = [
    { key: 'quality',    label: '🔍 Data Quality'      },
    { key: 'fixes',      label: '💡 Fix Suggestions'    },
    { key: 'advanced',   label: '🔬 Advanced Rules'     },
    { key: 'comparison', label: '📊 Retailer Comparison'},
    { key: 'flags',      label: '🚨 Upload Flags'       },
    { key: 'prices',     label: '📈 Price Changes'      },
    { key: 'validator',  label: '📋 Feed Validator'     },
  ];

  return (
    <div style={s.container}>
      <h2 style={s.heading}>🧪 QA Dashboard</h2>
      <p style={s.sub}>Data quality checks, fix suggestions, advanced validation rules and feed validator</p>

      {/* Tab Bar */}
      <div style={{ ...s.tabBar, flexWrap: 'wrap' }}>
        {tabs.map(t => (
          <button key={t.key} style={activeTab === t.key ? s.tabActive : s.tab}
            onClick={() => setActiveTab(t.key)}>{t.label}</button>
        ))}
      </div>

      {/* ══════════════════════════════════════
          TAB 1 — DATA QUALITY REPORT
      ══════════════════════════════════════ */}
      {activeTab === 'quality' && (
        <div>
          <FilterBar retailer={retailer} setRetailer={setRetailer} onRun={fetchReport} btnLabel="🔍 Run Quality Check" loading={loading.report} dark={darkMode} retailers={retailers} />
          {errors.report && <div style={s.errorBox}>❌ {errors.report}</div>}
          {report && (
            <>
              <div style={s.statsGrid}>
                {[
                  { label: 'Total Products',  value: report.summary.total_products.toLocaleString(),  color: '#1890ff' },
                  { label: 'Total Issues',    value: report.summary.total_issues.toLocaleString(),    color: '#ff4d4f' },
                  { label: 'Overall Score',   value: report.summary.overall_score + '%',              color: report.summary.overall_score >= 90 ? '#52c41a' : report.summary.overall_score >= 70 ? '#faad14' : '#ff4d4f' },
                  { label: 'Stock Available', value: report.stock_summary.in_stock_pct + '%',         color: '#52c41a' },
                ].map((c, i) => (
                  <div key={i} style={s.statCard}>
                    <div style={{ ...s.statNum, color: c.color }}>{c.value}</div>
                    <div style={s.statLabel}>{c.label}</div>
                  </div>
                ))}
              </div>

              <div style={s.card}>
                <h3 style={s.sectionTitle}>📋 Field Completeness Issues</h3>
                <p style={s.hint}>Click any row to see sample products with that issue ↓</p>
                {Object.entries(report.field_issues).map(([key, val]) => (
                  <IssueRow key={key} dark={darkMode}
                    label={{ missing_image:'🖼️ Missing Image URL', missing_description:'📝 Missing Description',
                             missing_brand:'🏷️ Missing Brand', missing_category:'🗂️ No Category',
                             missing_colors:'🎨 Missing Colors', missing_sizes:'📐 Missing Sizes' }[key]}
                    count={val.count} pct={val.pct} samples={val.samples} />
                ))}
              </div>

              <div style={s.card}>
                <h3 style={s.sectionTitle}>💰 Price Issues</h3>
                {Object.entries(report.price_issues).map(([key, val]) => (
                  <IssueRow key={key} dark={darkMode}
                    label={{ zero_price:'⚠️ Zero Price', negative_price:'❌ Negative Price',
                             sale_exceeds_price:'🔄 Sale Price ≥ Regular', unusually_high:'🚨 Suspiciously High Price' }[key]}
                    count={val.count} pct={val.pct} samples={val.samples} />
                ))}
              </div>

              <div style={s.card}>
                <h3 style={s.sectionTitle}>🏪 Quality Score by Retailer</h3>
                {report.retailer_scores.map((r, i) => {
                  const color = r.score >= 90 ? '#52c41a' : r.score >= 70 ? '#faad14' : '#ff4d4f';
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                      <span style={{ minWidth: 180, color: darkMode ? '#ddd' : '#333', fontSize: 14 }}>{r.retailer}</span>
                      <div style={{ flex: 1 }}><Bar pct={r.score} color={color} height={10} /></div>
                      <span style={{ minWidth: 60, fontWeight: 700, color, fontSize: 15, textAlign: 'right' }}>{r.score}%</span>
                      <span style={{ color: darkMode ? '#aaa' : '#888', fontSize: 12, minWidth: 140 }}>
                        {r.issues} issues / {r.total.toLocaleString()} products
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════
          TAB 2 — FIX SUGGESTIONS
      ══════════════════════════════════════ */}
      {activeTab === 'fixes' && (
        <div>
          <FilterBar retailer={retailer} setRetailer={setRetailer} onRun={fetchSuggestions} btnLabel="💡 Get Fix Suggestions" loading={loading.suggestions} dark={darkMode} retailers={retailers} />
          {errors.suggestions && <div style={s.errorBox}>❌ {errors.suggestions}</div>}
          {suggestions && (
            <>
              <div style={{ ...s.card, display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 28, fontWeight: 700, color: '#1890ff' }}>{suggestions.total_suggestions}</div>
                  <div style={s.statLabel}>Issues Found</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 28, fontWeight: 700, color: '#ff4d4f' }}>
                    {suggestions.suggestions.filter(s => s.severity === 'critical').length}
                  </div>
                  <div style={s.statLabel}>Critical</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 28, fontWeight: 700, color: '#fa8c16' }}>
                    {suggestions.suggestions.filter(s => s.severity === 'high').length}
                  </div>
                  <div style={s.statLabel}>High Priority</div>
                </div>
                <div style={{ flex: 1, color: darkMode ? '#aaa' : '#888', fontSize: 13 }}>
                  Each card below explains the issue, shows affected products, and provides a concrete fix suggestion for the data team.
                </div>
              </div>
              {suggestions.suggestions.length === 0 ? (
                <div style={{ ...s.card, textAlign: 'center', color: '#52c41a', fontSize: 16 }}>
                  ✅ No issues found — all fields look good!
                </div>
              ) : (
                suggestions.suggestions.map((item, i) => (
                  <SuggestionCard key={i} item={item} dark={darkMode} />
                ))
              )}
            </>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════
          TAB 3 — ADVANCED RULES
      ══════════════════════════════════════ */}
      {activeTab === 'advanced' && (
        <div>
          <FilterBar retailer={retailer} setRetailer={setRetailer} onRun={fetchAdvanced} btnLabel="🔬 Run Advanced Rules" loading={loading.advanced} dark={darkMode} retailers={retailers} />
          {errors.advanced && <div style={s.errorBox}>❌ {errors.advanced}</div>}
          {loading.advanced && <div style={s.loadingBox}>⏳ Running checks — image reachability may take a few seconds...</div>}
          {advanced && (
            <>
              {/* Duplicate Names */}
              <div style={s.card}>
                <h3 style={s.sectionTitle}>🔁 Duplicate Product Names</h3>
                <p style={s.hint}>{advanced.rules.duplicate_names.description}</p>
                {advanced.rules.duplicate_names.count === 0 ? (
                  <div style={{ color: '#52c41a', fontSize: 14 }}>✅ No duplicate product names found</div>
                ) : (
                  <table style={s.table}>
                    <thead><tr>{['Product Name','Retailer','Count'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr></thead>
                    <tbody>
                      {advanced.rules.duplicate_names.items.map((d, i) => (
                        <tr key={i} style={i % 2 === 0 ? s.trEven : {}}>
                          <td style={s.td}>{d.name?.slice(0, 60)}</td>
                          <td style={s.td}>{d.retailer__name}</td>
                          <td style={{ ...s.td, fontWeight: 700, color: '#ff4d4f' }}>{d.cnt}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Price Outliers */}
              <div style={s.card}>
                <h3 style={s.sectionTitle}>📈 Price Outliers per Category</h3>
                <p style={s.hint}>{advanced.rules.price_outliers.description}</p>
                {advanced.rules.price_outliers.count === 0 ? (
                  <div style={{ color: '#52c41a', fontSize: 14 }}>✅ No price outliers detected</div>
                ) : (
                  advanced.rules.price_outliers.items.map((cat, i) => (
                    <div key={i} style={{ border: `1px solid ${darkMode ? '#333' : '#f0f0f0'}`, borderRadius: 8,
                      padding: 14, marginBottom: 10, background: darkMode ? '#1a1a1a' : '#fff' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span style={{ fontWeight: 600, color: darkMode ? '#fff' : '#333' }}>🗂️ {cat.category}</span>
                        <span style={{ color: darkMode ? '#aaa' : '#888', fontSize: 12 }}>
                          Avg: ₹{cat.avg_price.toLocaleString()} | {cat.total_products} products
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: 12 }}>
                        {cat.high_outliers > 0 && (
                          <span style={{ background: '#fff2f0', color: '#ff4d4f', border: '1px solid #ffccc7',
                            padding: '3px 10px', borderRadius: 4, fontSize: 13 }}>
                            🚀 {cat.high_outliers} above ₹{cat.high_threshold.toLocaleString()} (3× avg)
                          </span>
                        )}
                        {cat.low_outliers > 0 && (
                          <span style={{ background: '#fff7e6', color: '#fa8c16', border: '1px solid #ffd591',
                            padding: '3px 10px', borderRadius: 4, fontSize: 13 }}>
                            📉 {cat.low_outliers} below ₹{cat.low_threshold.toLocaleString()} (10% of avg)
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* SKU Validation */}
              <div style={s.card}>
                <h3 style={s.sectionTitle}>🔑 SKU Format Validation</h3>
                <p style={s.hint}>Checked {advanced.rules.sku_validation.total_checked.toLocaleString()} SKUs</p>
                {['short_skus', 'long_skus', 'special_chars'].map(key => {
                  const item = advanced.rules.sku_validation[key];
                  const label = { short_skus: '⚠️ Short SKUs (< 4 chars)', long_skus: '📏 Long SKUs (> 30 chars)', special_chars: '⚡ Special Character SKUs' }[key];
                  return (
                    <div key={key} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12,
                      padding: 12, background: darkMode ? '#1a1a1a' : '#fafafa', borderRadius: 8 }}>
                      <div style={{ minWidth: 260, fontSize: 14, color: darkMode ? '#ddd' : '#333' }}>
                        {label}
                        <div style={{ fontSize: 12, color: darkMode ? '#888' : '#aaa', marginTop: 2 }}>{item.description}</div>
                      </div>
                      <span style={{ fontWeight: 700, color: item.count > 0 ? '#ff4d4f' : '#52c41a', fontSize: 18, minWidth: 40 }}>
                        {item.count}
                      </span>
                      {item.count > 0 && item.samples.slice(0, 3).map((s, i) => (
                        <code key={i} style={{ background: darkMode ? '#2a2a2a' : '#f0f0f0', padding: '2px 6px',
                          borderRadius: 4, fontSize: 11, color: darkMode ? '#ddd' : '#333' }}>{s.sku}</code>
                      ))}
                    </div>
                  );
                })}
              </div>

              {/* Image Reachability */}
              <div style={s.card}>
                <h3 style={s.sectionTitle}>🖼️ Image URL Reachability</h3>
                <p style={s.hint}>{advanced.rules.image_reachability.note}</p>
                <div style={{ display: 'flex', gap: 20, marginBottom: 16, flexWrap: 'wrap' }}>
                  {[
                    { label: 'Sampled', value: advanced.rules.image_reachability.sampled, color: '#1890ff' },
                    { label: '✅ Reachable', value: advanced.rules.image_reachability.reachable, color: '#52c41a' },
                    { label: '❌ Unreachable', value: advanced.rules.image_reachability.unreachable, color: '#ff4d4f' },
                    { label: 'Success Rate', value: advanced.rules.image_reachability.reachable_pct + '%', color: pctColor(advanced.rules.image_reachability.reachable_pct) },
                  ].map((c, i) => (
                    <div key={i} style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 22, fontWeight: 700, color: c.color }}>{c.value}</div>
                      <div style={s.statLabel}>{c.label}</div>
                    </div>
                  ))}
                </div>
                {advanced.rules.image_reachability.unreachable_samples?.length > 0 && (
                  <table style={s.table}>
                    <thead><tr>{['SKU','Name','Error / Status'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr></thead>
                    <tbody>
                      {advanced.rules.image_reachability.unreachable_samples.map((u, i) => (
                        <tr key={i} style={i % 2 === 0 ? s.trEven : {}}>
                          <td style={s.td}><code style={{ fontSize: 11 }}>{u.sku}</code></td>
                          <td style={s.td}>{u.name?.slice(0, 40)}</td>
                          <td style={{ ...s.td, color: '#ff4d4f', fontSize: 12 }}>{u.error || `HTTP ${u.status}`}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════
          TAB 4 — RETAILER COMPARISON
      ══════════════════════════════════════ */}
      {activeTab === 'comparison' && (
        <div>
          <div style={s.card}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <button style={s.btn} onClick={fetchComparison} disabled={loading.comparison}>
                {loading.comparison ? '⏳ Loading...' : '📊 Load Comparison'}
              </button>
              <span style={{ color: darkMode ? '#aaa' : '#888', fontSize: 13 }}>
                Side-by-side field coverage across all retailers
              </span>
            </div>
            {errors.comparison && <div style={s.errorBox}>❌ {errors.comparison}</div>}
          </div>

          {comparison && (
            <div style={s.card}>
              <h3 style={s.sectionTitle}>📊 Retailer Quality Comparison</h3>
              <p style={s.hint}>🟢 ≥95% &nbsp; 🟡 ≥70% &nbsp; 🔴 &lt;70% &nbsp;&nbsp; (Zero Price column: lower is better)</p>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ ...s.table, minWidth: 900 }}>
                  <thead>
                    <tr>
                      <th style={{ ...s.th, minWidth: 160 }}>Retailer</th>
                      <th style={{ ...s.th, textAlign: 'center' }}>Score</th>
                      <th style={{ ...s.th, textAlign: 'center' }}>Products</th>
                      <th style={{ ...s.th, textAlign: 'center' }}>🖼️ Image</th>
                      <th style={{ ...s.th, textAlign: 'center' }}>🏷️ Brand</th>
                      <th style={{ ...s.th, textAlign: 'center' }}>📝 Desc</th>
                      <th style={{ ...s.th, textAlign: 'center' }}>🗂️ Category</th>
                      <th style={{ ...s.th, textAlign: 'center' }}>🎨 Colors</th>
                      <th style={{ ...s.th, textAlign: 'center' }}>📐 Sizes</th>
                      <th style={{ ...s.th, textAlign: 'center' }}>💸 Sale</th>
                      <th style={{ ...s.th, textAlign: 'center' }}>📦 Stock</th>
                      <th style={{ ...s.th, textAlign: 'center' }}>⚠️ ₹0 Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparison.retailers.map((r, i) => {
                      const scoreColor = r.score >= 90 ? '#52c41a' : r.score >= 70 ? '#faad14' : '#ff4d4f';
                      const cell = (key, invert = false) => {
                        const f = r.fields[key];
                        const color = pctColor(f.pct, invert);
                        return (
                          <td key={key} style={{ ...s.td, textAlign: 'center' }}>
                            <span style={{ color, fontWeight: 600, fontSize: 13 }}>{f.pct}%</span>
                          </td>
                        );
                      };
                      return (
                        <tr key={i} style={i % 2 === 0 ? s.trEven : {}}>
                          <td style={{ ...s.td, fontWeight: 600 }}>{r.retailer}</td>
                          <td style={{ ...s.td, textAlign: 'center' }}>
                            <span style={{ color: scoreColor, fontWeight: 700 }}>{r.score}%</span>
                          </td>
                          <td style={{ ...s.td, textAlign: 'center', color: darkMode ? '#aaa' : '#888' }}>
                            {r.total.toLocaleString()}
                          </td>
                          {cell('image')}
                          {cell('brand')}
                          {cell('description')}
                          {cell('category')}
                          {cell('colors')}
                          {cell('sizes')}
                          {cell('sale_price')}
                          {cell('in_stock')}
                          {cell('zero_price', true)}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════
          TAB 5 — UPLOAD FLAGS
      ══════════════════════════════════════ */}
      {activeTab === 'flags' && (
        <div>
          <div style={s.card}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <button style={s.btn} onClick={fetchUploadFlags} disabled={loading.uploadFlags}>
                {loading.uploadFlags ? '⏳ Loading...' : '🚨 Check Upload Flags'}
              </button>
              <span style={{ color: darkMode ? '#aaa' : '#888', fontSize: 13 }}>
                Auto-scans last 20 uploads for critical data issues
              </span>
            </div>
            {errors.uploadFlags && <div style={s.errorBox}>❌ {errors.uploadFlags}</div>}
          </div>

          {uploadFlags && (
            <div style={s.card}>
              <h3 style={s.sectionTitle}>🚨 Upload Quality Flags</h3>
              <p style={s.hint}>Each upload is scanned for critical issues — zero prices, missing images, bad sale prices</p>
              {uploadFlags.upload_flags.map((log, i) => (
                <div key={i} style={{ border: `1px solid ${log.has_critical ? '#ffccc7' : log.flag_count > 0 ? '#ffd591' : (darkMode ? '#333' : '#f0f0f0')}`,
                  borderLeft: `4px solid ${log.has_critical ? '#ff4d4f' : log.flag_count > 0 ? '#faad14' : '#52c41a'}`,
                  borderRadius: 8, padding: '12px 16px', marginBottom: 10,
                  background: darkMode ? '#1a1a1a' : '#fff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                    <div>
                      <span style={{ fontWeight: 600, color: darkMode ? '#fff' : '#333', fontSize: 14 }}>{log.retailer}</span>
                      <span style={{ color: darkMode ? '#aaa' : '#888', fontSize: 12, marginLeft: 10 }}>
                        {log.uploaded_at} · {log.loaded.toLocaleString()} products loaded
                      </span>
                    </div>
                    {log.flag_count === 0 ? (
                      <span style={{ color: '#52c41a', fontWeight: 600, fontSize: 13 }}>✅ No issues</span>
                    ) : (
                      <span style={{ color: log.has_critical ? '#ff4d4f' : '#faad14', fontWeight: 600, fontSize: 13 }}>
                        {log.has_critical ? '🔴' : '🟡'} {log.flag_count} issue{log.flag_count > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  {log.flags.length > 0 && (
                    <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {log.flags.map((f, j) => {
                        const flagColor = f.type === 'critical' ? ['#ff4d4f','#fff2f0','#ffccc7'] : f.type === 'high' ? ['#fa8c16','#fff7e6','#ffd591'] : ['#faad14','#fffbe6','#ffe58f'];
                        return (
                          <span key={j} style={{ background: flagColor[1], color: flagColor[0],
                            border: `1px solid ${flagColor[2]}`, padding: '3px 10px',
                            borderRadius: 4, fontSize: 12 }}>{f.msg}</span>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════
          TAB 6 — XML FEED VALIDATOR
      ══════════════════════════════════════ */}
      {activeTab === 'validator' && (
        <div>
          <div style={{ ...s.dropZone, ...(dragOver ? s.dropZoneActive : {}) }}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current.click()}>
            <input ref={fileRef} type="file" accept=".xml" style={{ display: 'none' }}
              onChange={e => { const f = e.target.files[0]; if (f) { setFile(f); runValidation(f); } }} />
            <div style={{ fontSize: 40, marginBottom: 12 }}>📂</div>
            <div style={{ color: darkMode ? '#ddd' : '#333', fontSize: 16, fontWeight: 600 }}>
              {file ? `📄 ${file.name}` : 'Drop XML feed here or click to browse'}
            </div>
            <div style={{ color: darkMode ? '#aaa' : '#888', fontSize: 13, marginTop: 6 }}>
              Feed is validated without saving any data to the database
            </div>
          </div>

          {loading.validation && <div style={s.loadingBox}>⏳ Parsing and validating feed...</div>}
          {errors.validation && <div style={s.errorBox}>❌ {errors.validation}</div>}

          {validation && (
            <>
              <div style={{ ...s.card, display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
                <ScoreBadge score={validation.summary.readiness_score} />
                <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                  {[
                    { label: 'Total Products',      value: validation.summary.total_products,      color: '#1890ff' },
                    { label: 'Products with Issues', value: validation.summary.products_with_issues, color: '#ff4d4f' },
                    { label: 'Clean Products',       value: validation.summary.clean_products,       color: '#52c41a' },
                    { label: 'Duplicate SKUs',       value: validation.summary.duplicate_skus,       color: '#faad14' },
                  ].map((c, i) => (
                    <div key={i} style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 22, fontWeight: 700, color: c.color }}>{c.value?.toLocaleString()}</div>
                      <div style={{ color: darkMode ? '#aaa' : '#888', fontSize: 12 }}>{c.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={s.card}>
                <h3 style={s.sectionTitle}>📊 Field Coverage</h3>
                {validation.field_coverage && Object.entries(validation.field_coverage).map(([key, val]) => {
                  const label = { has_sku:'🔑 SKU', has_name:'📝 Name', has_price:'💰 Price', has_image:'🖼️ Image',
                    has_description:'📄 Description', has_brand:'🏷️ Brand', has_category:'🗂️ Category',
                    has_stock:'📦 Stock Indicator', has_colors:'🎨 Colors', has_sizes:'📐 Sizes' }[key];
                  const color = pctColor(val.pct);
                  return (
                    <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                      <span style={{ minWidth: 180, fontSize: 13, color: darkMode ? '#ddd' : '#333' }}>{label}</span>
                      <div style={{ flex: 1 }}><Bar pct={val.pct} color={color} height={8} /></div>
                      <span style={{ minWidth: 100, textAlign: 'right', color, fontWeight: 600, fontSize: 13 }}>
                        {val.count?.toLocaleString()} ({val.pct}%)
                      </span>
                    </div>
                  );
                })}
              </div>

              {(validation.summary.zero_price_count > 0 || validation.summary.sale_exceeds_count > 0 || validation.summary.price_format_issues > 0) && (
                <div style={s.card}>
                  <h3 style={s.sectionTitle}>💰 Price Anomalies</h3>
                  {[
                    { label: '⚠️ Zero price products',        value: validation.summary.zero_price_count },
                    { label: '🔄 Sale price ≥ regular price', value: validation.summary.sale_exceeds_count },
                    { label: '❓ Unrecognized price format',   value: validation.summary.price_format_issues },
                  ].map((a, i) => a.value > 0 && (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0',
                      borderBottom: `1px solid ${darkMode ? '#2a2a2a' : '#f0f0f0'}` }}>
                      <span style={{ color: darkMode ? '#ddd' : '#333', fontSize: 14 }}>{a.label}</span>
                      <span style={{ color: '#ff4d4f', fontWeight: 700 }}>{a.value}</span>
                    </div>
                  ))}
                </div>
              )}

              {validation.duplicate_sku_list?.length > 0 && (
                <div style={s.card}>
                  <h3 style={s.sectionTitle}>🔁 Duplicate SKUs</h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {validation.duplicate_sku_list.map(([sku, count], i) => (
                      <span key={i} style={{ background: '#fff2f0', border: '1px solid #ffccc7',
                        color: '#cf1322', padding: '3px 10px', borderRadius: 4, fontSize: 13 }}>
                        {sku} × {count}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {validation.issues?.length > 0 && (
                <div style={s.card}>
                  <h3 style={s.sectionTitle}>❌ Products with Issues <span style={{ color: '#888', fontWeight: 400, fontSize: 13, marginLeft: 8 }}>(showing first 50)</span></h3>
                  <table style={s.table}>
                    <thead><tr>{['#','SKU','Name','Issues'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr></thead>
                    <tbody>
                      {validation.issues.map((item, i) => (
                        <tr key={i} style={i % 2 === 0 ? s.trEven : {}}>
                          <td style={{ ...s.td, color: '#888', width: 40 }}>{item.index}</td>
                          <td style={s.td}><code style={{ fontSize: 11 }}>{item.sku}</code></td>
                          <td style={s.td}>{item.name?.slice(0, 45)}{item.name?.length > 45 ? '…' : ''}</td>
                          <td style={s.td}>
                            {item.issues.map((iss, j) => (
                              <span key={j} style={{ background: '#fff2f0', border: '1px solid #ffccc7', color: '#cf1322',
                                padding: '2px 8px', borderRadius: 4, fontSize: 12, marginRight: 4, display: 'inline-block', marginBottom: 2 }}>
                                {iss}
                              </span>
                            ))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {validation.parsed_samples?.length > 0 && (
                <div style={s.card}>
                  <h3 style={s.sectionTitle}>👁️ First 5 Products Preview</h3>
                  <p style={s.hint}>How the feed parser reads your products</p>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={s.table}>
                      <thead><tr>{['SKU','Name','Price','Brand','Category','Colors','Sizes','Image'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr></thead>
                      <tbody>
                        {validation.parsed_samples.map((p, i) => (
                          <tr key={i} style={i % 2 === 0 ? s.trEven : {}}>
                            <td style={s.td}><code style={{ fontSize: 11 }}>{p.sku || '—'}</code></td>
                            <td style={s.td}>{p.name?.slice(0, 30) || '—'}</td>
                            <td style={s.td}>{p.price || '—'}</td>
                            <td style={s.td}>{p.brand || '—'}</td>
                            <td style={s.td}>{p.category?.slice(0, 30) || '—'}</td>
                            <td style={s.td}>{p.colors || '—'}</td>
                            <td style={s.td}>{p.sizes || '—'}</td>
                            <td style={{ ...s.td, textAlign: 'center' }}>{p.has_image ? '✅' : '❌'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════
          TAB 7 — PRICE CHANGE TRACKER
      ══════════════════════════════════════ */}
      {activeTab === 'prices' && (
        <div>
          {/* Filters row */}
          <div style={s.card}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>

              <div>
                <label style={s.label}>Retailer</label>
                <select style={{ ...s.input, width: 220, cursor: 'pointer' }} value={retailer} onChange={e => setRetailer(e.target.value)}>
                  <option value="">— All Retailers —</option>
                  {retailers.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                </select>
              </div>

              <div>
                <label style={s.label}>Change Type</label>
                <select style={{ ...s.input, width: 200, cursor: 'pointer' }}
                  value={priceFilter.change_type}
                  onChange={e => setPriceFilter(p => ({ ...p, change_type: e.target.value, page: 1 }))}>
                  <option value="">— All Changes —</option>
                  <option value="price_up">📈 Price Increased</option>
                  <option value="price_down">📉 Price Decreased</option>
                  <option value="sale_added">🏷️ Sale Added</option>
                  <option value="sale_removed">❌ Sale Removed</option>
                  <option value="sale_changed">🔄 Sale Changed</option>
                  <option value="new_product">🆕 New Product</option>
                </select>
              </div>

              <div>
                <label style={s.label}>Time Period</label>
                <select style={{ ...s.input, width: 160, cursor: 'pointer' }}
                  value={priceFilter.days}
                  onChange={e => setPriceFilter(p => ({ ...p, days: Number(e.target.value), page: 1 }))}>
                  <option value={7}>Last 7 days</option>
                  <option value={30}>Last 30 days</option>
                  <option value={90}>Last 90 days</option>
                  <option value={365}>Last 1 year</option>
                </select>
              </div>

              <button style={s.btn} onClick={() => fetchPriceChanges({ page: 1 })} disabled={loading.prices}>
                {loading.prices ? '⏳ Loading...' : '📈 Load Price Changes'}
              </button>
            </div>
          </div>

          {errors.prices && <div style={s.errorBox}>❌ {errors.prices}</div>}

          {!priceChanges && !loading.prices && (
            <div style={{ ...s.card, textAlign: 'center', color: darkMode ? '#aaa' : '#888', padding: 40 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📈</div>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>Price Change Tracker</div>
              <div style={{ fontSize: 13 }}>Tracks every price change detected during feed refreshes.<br />Click "Load Price Changes" to see the history.</div>
            </div>
          )}

          {priceChanges && (
            <>
              {/* Summary cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 20 }}>
                {[
                  { label: 'Total Changes',   value: priceChanges.summary.total,        color: '#1890ff' },
                  { label: '📈 Price Up',      value: priceChanges.summary.price_ups,    color: '#ff4d4f' },
                  { label: '📉 Price Down',    value: priceChanges.summary.price_downs,  color: '#52c41a' },
                  { label: '🏷️ Sale Added',   value: priceChanges.summary.sale_added,   color: '#faad14' },
                  { label: '❌ Sale Removed',  value: priceChanges.summary.sale_removed, color: '#d46b08' },
                  { label: '🆕 New Products',  value: priceChanges.summary.new_products, color: '#722ed1' },
                ].map(({ label, value, color }) => (
                  <div key={label} style={s.statCard}>
                    <div style={{ ...s.statNum, color }}>{value.toLocaleString()}</div>
                    <div style={s.statLabel}>{label}</div>
                  </div>
                ))}
              </div>

              {/* Biggest increases & decreases */}
              {(priceChanges.biggest_increases.length > 0 || priceChanges.biggest_decreases.length > 0) && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>

                  <div style={s.card}>
                    <h4 style={{ ...s.sectionTitle, color: '#ff4d4f' }}>🔺 Biggest Price Increases</h4>
                    {priceChanges.biggest_increases.length === 0
                      ? <div style={{ color: darkMode ? '#666' : '#ccc', fontSize: 13 }}>None in this period</div>
                      : priceChanges.biggest_increases.map((r, i) => (
                        <div key={i} style={{ padding: '10px 0', borderBottom: `1px solid ${darkMode ? '#2a2a2a' : '#f0f0f0'}` }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <code style={{ fontSize: 11, color: '#1890ff' }}>{r.sku}</code>
                              <div style={{ fontSize: 12, color: darkMode ? '#ccc' : '#555', marginTop: 2 }}>{r.product_name?.slice(0, 40)}</div>
                              <div style={{ fontSize: 11, color: darkMode ? '#888' : '#aaa' }}>{r.retailer_name}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ color: '#ff4d4f', fontWeight: 700, fontSize: 15 }}>+{r.change_pct}%</div>
                              <div style={{ fontSize: 12, color: darkMode ? '#aaa' : '#888' }}>{r.currency}{r.old_price} → {r.currency}{r.new_price}</div>
                              {r.source_url && <a href={r.source_url} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: '#1890ff' }}>🔗 View</a>}
                            </div>
                          </div>
                        </div>
                      ))
                    }
                  </div>

                  <div style={s.card}>
                    <h4 style={{ ...s.sectionTitle, color: '#52c41a' }}>🔻 Biggest Price Drops</h4>
                    {priceChanges.biggest_decreases.length === 0
                      ? <div style={{ color: darkMode ? '#666' : '#ccc', fontSize: 13 }}>None in this period</div>
                      : priceChanges.biggest_decreases.map((r, i) => (
                        <div key={i} style={{ padding: '10px 0', borderBottom: `1px solid ${darkMode ? '#2a2a2a' : '#f0f0f0'}` }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <code style={{ fontSize: 11, color: '#1890ff' }}>{r.sku}</code>
                              <div style={{ fontSize: 12, color: darkMode ? '#ccc' : '#555', marginTop: 2 }}>{r.product_name?.slice(0, 40)}</div>
                              <div style={{ fontSize: 11, color: darkMode ? '#888' : '#aaa' }}>{r.retailer_name}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ color: '#52c41a', fontWeight: 700, fontSize: 15 }}>{r.change_pct}%</div>
                              <div style={{ fontSize: 12, color: darkMode ? '#aaa' : '#888' }}>{r.currency}{r.old_price} → {r.currency}{r.new_price}</div>
                              {r.source_url && <a href={r.source_url} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: '#1890ff' }}>🔗 View</a>}
                            </div>
                          </div>
                        </div>
                      ))
                    }
                  </div>
                </div>
              )}

              {/* Full records table */}
              <div style={s.card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <h4 style={{ ...s.sectionTitle, margin: 0 }}>All Changes ({priceChanges.total_records.toLocaleString()} total)</h4>
                  <span style={{ fontSize: 12, color: darkMode ? '#888' : '#aaa' }}>Page {priceChanges.page} of {priceChanges.total_pages}</span>
                </div>

                {priceChanges.records.length === 0
                  ? <div style={{ textAlign: 'center', padding: 30, color: darkMode ? '#666' : '#bbb' }}>No price changes found for this period.</div>
                  : <>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={s.table}>
                        <thead>
                          <tr>
                            {['SKU','Product','Retailer','Change','Old Price','New Price','± %','Date','Link'].map(h => (
                              <th key={h} style={s.th}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {priceChanges.records.map((r, i) => {
                            const typeMap = {
                              price_up:     { label: '📈 Up',          color: '#ff4d4f' },
                              price_down:   { label: '📉 Down',        color: '#52c41a' },
                              sale_added:   { label: '🏷️ Sale Added',  color: '#faad14' },
                              sale_removed: { label: '❌ Sale Removed', color: '#d46b08' },
                              sale_changed: { label: '🔄 Sale Changed', color: '#1890ff' },
                              new_product:  { label: '🆕 New',          color: '#722ed1' },
                            };
                            const t = typeMap[r.change_type] || { label: r.change_type, color: '#666' };
                            return (
                              <tr key={i} style={i % 2 === 0 ? s.trEven : {}}>
                                <td style={s.td}><code style={{ fontSize: 11 }}>{r.sku}</code></td>
                                <td style={s.td}>{r.product_name?.slice(0,35)}{r.product_name?.length > 35 ? '…' : ''}</td>
                                <td style={s.td}>{r.retailer_name}</td>
                                <td style={s.td}><span style={{ color: t.color, fontWeight: 600, fontSize: 12 }}>{t.label}</span></td>
                                <td style={s.td}>{r.old_price ? `${r.currency}${r.old_price}` : '—'}</td>
                                <td style={s.td}>{r.currency}{r.new_price}</td>
                                <td style={{ ...s.td, color: r.change_pct > 0 ? '#ff4d4f' : r.change_pct < 0 ? '#52c41a' : '#888', fontWeight: 600 }}>
                                  {r.change_pct != null ? `${r.change_pct > 0 ? '+' : ''}${r.change_pct}%` : '—'}
                                </td>
                                <td style={{ ...s.td, fontSize: 12, color: darkMode ? '#888' : '#aaa' }}>{r.detected_at?.slice(0,10)}</td>
                                <td style={s.td}>
                                  {r.source_url
                                    ? <a href={r.source_url} target="_blank" rel="noreferrer" style={{ color: '#1890ff', fontSize: 12 }}>🔗 View</a>
                                    : <span style={{ color: '#ccc' }}>—</span>}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {priceChanges.total_pages > 1 && (
                      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
                        <button style={s.btnGhost} disabled={priceChanges.page <= 1}
                          onClick={() => fetchPriceChanges({ page: priceChanges.page - 1 })}>← Prev</button>
                        <span style={{ padding: '9px 16px', color: darkMode ? '#aaa' : '#666', fontSize: 14 }}>
                          {priceChanges.page} / {priceChanges.total_pages}
                        </span>
                        <button style={s.btnGhost} disabled={priceChanges.page >= priceChanges.total_pages}
                          onClick={() => fetchPriceChanges({ page: priceChanges.page + 1 })}>Next →</button>
                      </div>
                    )}
                  </>
                }
              </div>
            </>
          )}
        </div>
      )}

    </div>
  );
}

const getStyles = (dark) => ({
  container:      { padding: '24px' },
  heading:        { color: dark ? '#fff' : '#333', margin: '0 0 8px' },
  sub:            { color: dark ? '#aaa' : '#888', fontSize: 14, marginBottom: 24 },
  tabBar:         { display: 'flex', gap: 8, marginBottom: 24 },
  tab:            { padding: '9px 16px', background: dark ? '#1f1f1f' : '#f0f2f5', color: dark ? '#aaa' : '#666', border: `1px solid ${dark ? '#333' : '#ddd'}`, borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 500 },
  tabActive:      { padding: '9px 16px', background: '#1890ff', color: 'white', border: '1px solid #1890ff', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 500 },
  card:           { background: dark ? '#1f1f1f' : 'white', padding: 20, borderRadius: 12, boxShadow: '0 2px 10px rgba(0,0,0,0.08)', marginBottom: 20 },
  statsGrid:      { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 20 },
  statCard:       { background: dark ? '#1f1f1f' : 'white', padding: 20, borderRadius: 10, textAlign: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.08)' },
  statNum:        { fontSize: 24, fontWeight: 700, marginBottom: 6 },
  statLabel:      { color: dark ? '#aaa' : '#888', fontSize: 13 },
  sectionTitle:   { color: dark ? '#fff' : '#333', margin: '0 0 16px', fontSize: 15, fontWeight: 600 },
  hint:           { color: dark ? '#888' : '#aaa', fontSize: 12, marginBottom: 12, marginTop: -10 },
  label:          { display: 'block', color: dark ? '#aaa' : '#666', fontSize: 13, marginBottom: 6 },
  input:          { padding: '8px 12px', border: `1px solid ${dark ? '#444' : '#ddd'}`, borderRadius: 8, background: dark ? '#2a2a2a' : 'white', color: dark ? '#fff' : '#333', fontSize: 14, width: 300 },
  btn:            { padding: '9px 20px', background: '#1890ff', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 500 },
  btnGhost:       { padding: '9px 20px', background: 'transparent', color: '#1890ff', border: '1px solid #1890ff', borderRadius: 8, cursor: 'pointer', fontSize: 14 },
  errorBox:       { background: '#fff2f0', border: '1px solid #ffccc7', color: '#cf1322', padding: '12px 16px', borderRadius: 8, marginTop: 12, fontSize: 14 },
  loadingBox:     { background: dark ? '#1f1f1f' : 'white', padding: 20, borderRadius: 12, textAlign: 'center', color: dark ? '#aaa' : '#888', marginBottom: 20 },
  dropZone:       { border: `2px dashed ${dark ? '#444' : '#d9d9d9'}`, borderRadius: 12, padding: '40px 20px', textAlign: 'center', cursor: 'pointer', background: dark ? '#1a1a1a' : '#fafafa', marginBottom: 20, transition: 'all 0.2s' },
  dropZoneActive: { borderColor: '#1890ff', background: dark ? '#001529' : '#e6f7ff' },
  table:          { width: '100%', borderCollapse: 'collapse' },
  th:             { padding: '10px 14px', textAlign: 'left', background: dark ? '#2a2a2a' : '#f0f2f5', color: dark ? '#aaa' : '#666', fontSize: 13, fontWeight: 600 },
  td:             { padding: '10px 14px', color: dark ? '#ddd' : '#333', fontSize: 13, borderBottom: `1px solid ${dark ? '#2a2a2a' : '#f0f0f0'}` },
  trEven:         { background: dark ? '#252525' : '#fafafa' },
});
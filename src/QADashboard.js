import { useState, useRef } from 'react';
import { djangoApi } from './api';

// ─── API calls ────────────────────────────────────────────
const getQAReport  = (retailer) =>
  djangoApi.get('/qa/data-quality/', { params: retailer ? { retailer } : {} });
const validateFeed = (file) => {
  const form = new FormData();
  form.append('file', file);
  return djangoApi.post('/qa/validate-feed/', form);
};

// ─── Score Badge ──────────────────────────────────────────
const ScoreBadge = ({ score }) => {
  const color = score >= 90 ? '#52c41a' : score >= 70 ? '#faad14' : '#ff4d4f';
  const label = score >= 90 ? '✅ Excellent' : score >= 70 ? '⚠️ Fair' : '❌ Poor';
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
      <div style={{
        width: 72, height: 72, borderRadius: '50%',
        border: `5px solid ${color}`,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontSize: 18, fontWeight: 700, color }}>{score}%</span>
      </div>
      <span style={{ color, fontWeight: 600, fontSize: 15 }}>{label}</span>
    </div>
  );
};

// ─── Progress Bar ─────────────────────────────────────────
const Bar = ({ pct, color = '#1890ff', height = 6 }) => (
  <div style={{ background: '#f0f0f0', borderRadius: 4, overflow: 'hidden', height }}>
    <div style={{ width: `${pct}%`, background: color, height: '100%', borderRadius: 4,
      transition: 'width 0.4s ease' }} />
  </div>
);

// ─── Issue Row ────────────────────────────────────────────
const IssueRow = ({ label, count, pct, total, samples, dark }) => {
  const [open, setOpen] = useState(false);
  const color = pct === 0 ? '#52c41a' : pct < 5 ? '#faad14' : '#ff4d4f';
  const s = getStyles(dark);
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: count > 0 ? 'pointer' : 'default' }}
        onClick={() => count > 0 && setOpen(!open)}>
        <span style={{ minWidth: 200, color: dark ? '#ddd' : '#333', fontSize: 14 }}>{label}</span>
        <div style={{ flex: 1 }}><Bar pct={pct} color={color} height={8} /></div>
        <span style={{ minWidth: 70, textAlign: 'right', color, fontWeight: 600, fontSize: 14 }}>
          {count.toLocaleString()} ({pct}%)
        </span>
        {count > 0 && <span style={{ color: '#1890ff', fontSize: 12 }}>{open ? '▲ Hide' : '▼ Samples'}</span>}
      </div>
      {open && samples?.length > 0 && (
        <div style={{ marginTop: 8, marginLeft: 212, background: dark ? '#2a2a2a' : '#f9f9f9',
          borderRadius: 6, overflow: 'hidden', border: `1px solid ${dark ? '#333' : '#eee'}` }}>
          <table style={s.table}>
            <thead>
              <tr>{['SKU', 'Name', 'Retailer', 'Price'].map(h =>
                <th key={h} style={s.th}>{h}</th>)}</tr>
            </thead>
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


// ─── Main Component ───────────────────────────────────────
export default function QADashboard({ darkMode }) {
  const s = getStyles(darkMode);
  const [activeTab, setActiveTab]   = useState('quality');

  // Data Quality state
  const [retailer, setRetailer]     = useState('');
  const [report, setReport]         = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [reportError, setReportError]     = useState('');

  // Feed Validator state
  const [file, setFile]             = useState(null);
  const [validation, setValidation] = useState(null);
  const [loadingVal, setLoadingVal] = useState(false);
  const [valError, setValError]     = useState('');
  const [dragOver, setDragOver]     = useState(false);
  const fileRef = useRef();

  // ── Fetch data quality report ──
  const fetchReport = async () => {
    setLoadingReport(true);
    setReportError('');
    setReport(null);
    try {
      const res = await getQAReport(retailer || null);
      setReport(res.data);
    } catch (e) {
      setReportError(e.response?.data?.error || 'Failed to load report');
    }
    setLoadingReport(false);
  };

  // ── Validate feed ──
  const runValidation = async (f) => {
    const target = f || file;
    if (!target) return;
    setLoadingVal(true);
    setValError('');
    setValidation(null);
    try {
      const res = await validateFeed(target);
      setValidation(res.data);
    } catch (e) {
      const msg = e.response?.data?.error || e.response?.data?.detail || e.message || 'Failed to validate feed';
      setValError(msg);
    }
    setLoadingVal(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) { setFile(f); runValidation(f); }
  };

  const tabs = [
    { key: 'quality',   label: '🔍 Data Quality Report' },
    { key: 'validator', label: '📋 XML Feed Validator' },
  ];

  return (
    <div style={s.container}>
      <h2 style={s.heading}>🧪 QA Dashboard</h2>
      <p style={s.sub}>Data quality checks and XML feed validation tools for QA team</p>

      {/* Tab Bar */}
      <div style={s.tabBar}>
        {tabs.map(t => (
          <button key={t.key}
            style={activeTab === t.key ? s.tabActive : s.tab}
            onClick={() => setActiveTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════
          TAB 1 — DATA QUALITY REPORT
      ══════════════════════════════════ */}
      {activeTab === 'quality' && (
        <div>
          {/* Controls */}
          <div style={s.card}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <div>
                <label style={s.label}>Filter by Retailer (optional)</label>
                <input
                  style={s.input}
                  placeholder="e.g. Westside IN  (leave blank for all)"
                  value={retailer}
                  onChange={e => setRetailer(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && fetchReport()}
                />
              </div>
              <button style={{ ...s.btn, marginTop: 22 }} onClick={fetchReport} disabled={loadingReport}>
                {loadingReport ? '⏳ Scanning...' : '🔍 Run Quality Check'}
              </button>
              {report && (
                <button style={{ ...s.btnGhost, marginTop: 22 }} onClick={() => {
                  const rows = [['Retailer','Total','Issues','Score'],...(report.retailer_scores||[]).map(r=>[r.retailer,r.total,r.issues,r.score+'%'])];
                  const csv = rows.map(r=>r.join(',')).join('\n');
                  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv],{type:'text/csv'}));
                  a.download = 'qa_report.csv'; a.click();
                }}>⬇️ Export CSV</button>
              )}
            </div>
            {reportError && <div style={s.errorBox}>❌ {reportError}</div>}
          </div>

          {report && (
            <>
              {/* Summary Row */}
              <div style={s.statsGrid}>
                {[
                  { label: 'Total Products',  value: report.summary.total_products.toLocaleString(), color: '#1890ff' },
                  { label: 'Total Issues',    value: report.summary.total_issues.toLocaleString(),   color: '#ff4d4f' },
                  { label: 'Clean Products',  value: (report.summary.total_products - (report.field_issues.missing_image.count + report.field_issues.missing_description.count + report.field_issues.missing_brand.count + report.field_issues.missing_category.count)).toLocaleString(), color: '#52c41a' },
                  { label: 'Out of Stock',    value: report.stock_summary.out_of_stock.toLocaleString() + ` (${report.stock_summary.in_stock_pct}% avail)`, color: '#faad14' },
                ].map((c, i) => (
                  <div key={i} style={s.statCard}>
                    <div style={{ ...s.statNum, color: c.color }}>{c.value}</div>
                    <div style={s.statLabel}>{c.label}</div>
                  </div>
                ))}
              </div>

              {/* Field Issues */}
              <div style={s.card}>
                <h3 style={s.sectionTitle}>📋 Field Completeness Issues</h3>
                <p style={s.hint}>Click any row with issues to see sample products ↓</p>
                {Object.entries(report.field_issues).map(([key, val]) => (
                  <IssueRow key={key}
                    label={{ missing_image: '🖼️ Missing Image URL', missing_description: '📝 Missing Description',
                             missing_brand: '🏷️ Missing Brand', missing_category: '🗂️ Missing Category',
                             missing_colors: '🎨 Missing Colors', missing_sizes: '📐 Missing Sizes' }[key]}
                    count={val.count} pct={val.pct}
                    total={report.summary.total_products}
                    samples={val.samples} dark={darkMode}
                  />
                ))}
              </div>

              {/* Price Issues */}
              <div style={s.card}>
                <h3 style={s.sectionTitle}>💰 Price Issues</h3>
                {Object.entries(report.price_issues).map(([key, val]) => (
                  <IssueRow key={key}
                    label={{ zero_price: '⚠️ Zero Price (₹0)', negative_price: '❌ Negative Price',
                             sale_exceeds_price: '🔄 Sale Price ≥ Regular Price',
                             unusually_high: '🚨 Unusually High Price (>₹5,00,000)' }[key]}
                    count={val.count} pct={val.pct}
                    total={report.summary.total_products}
                    samples={val.samples} dark={darkMode}
                  />
                ))}
              </div>

              {/* Retailer Scores */}
              <div style={s.card}>
                <h3 style={s.sectionTitle}>🏪 Quality Score by Retailer</h3>
                <p style={s.hint}>Score = % of expected fields populated (SKU, Name, Price, Image, Brand, Category)</p>
                {report.retailer_scores.map((r, i) => {
                  const color = r.score >= 90 ? '#52c41a' : r.score >= 70 ? '#faad14' : '#ff4d4f';
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                      <span style={{ minWidth: 180, color: darkMode ? '#ddd' : '#333', fontSize: 14 }}>{r.retailer}</span>
                      <div style={{ flex: 1 }}><Bar pct={r.score} color={color} height={10} /></div>
                      <span style={{ minWidth: 90, textAlign: 'right', fontWeight: 700, color, fontSize: 15 }}>
                        {r.score}%
                      </span>
                      <span style={{ color: darkMode ? '#aaa' : '#888', fontSize: 12 }}>
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

      {/* ══════════════════════════════════
          TAB 2 — XML FEED VALIDATOR
      ══════════════════════════════════ */}
      {activeTab === 'validator' && (
        <div>
          {/* Drop Zone */}
          <div
            style={{
              ...s.dropZone,
              ...(dragOver ? s.dropZoneActive : {}),
            }}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current.click()}
          >
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

          {loadingVal && (
            <div style={s.loadingBox}>⏳ Parsing and validating feed...</div>
          )}
          {valError && <div style={s.errorBox}>❌ {valError}</div>}

          {validation && (
            <>
              {/* Readiness Score */}
              <div style={{ ...s.card, display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
                <ScoreBadge score={validation.summary.readiness_score} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                    {[
                      { label: 'Total Products',     value: validation.summary.total_products, color: '#1890ff' },
                      { label: 'Products with Issues', value: validation.summary.products_with_issues, color: '#ff4d4f' },
                      { label: 'Clean Products',      value: validation.summary.clean_products, color: '#52c41a' },
                      { label: 'Duplicate SKUs',      value: validation.summary.duplicate_skus, color: '#faad14' },
                    ].map((c, i) => (
                      <div key={i} style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 22, fontWeight: 700, color: c.color }}>{c.value}</div>
                        <div style={{ color: darkMode ? '#aaa' : '#888', fontSize: 12 }}>{c.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Field Coverage */}
              <div style={s.card}>
                <h3 style={s.sectionTitle}>📊 Field Coverage</h3>
                {Object.entries(validation.field_coverage).map(([key, val]) => {
                  const color = val.pct >= 95 ? '#52c41a' : val.pct >= 70 ? '#faad14' : '#ff4d4f';
                  const labels = {
                    has_sku: '🔑 SKU', has_name: '📝 Name', has_price: '💰 Price',
                    has_image: '🖼️ Image', has_description: '📄 Description',
                    has_brand: '🏷️ Brand', has_category: '🗂️ Category',
                    has_stock: '📦 Stock Indicator', has_colors: '🎨 Colors', has_sizes: '📐 Sizes',
                  };
                  return (
                    <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                      <span style={{ minWidth: 160, color: darkMode ? '#ddd' : '#333', fontSize: 14 }}>
                        {labels[key] || key}
                      </span>
                      <div style={{ flex: 1 }}><Bar pct={val.pct} color={color} height={8} /></div>
                      <span style={{ minWidth: 90, textAlign: 'right', color, fontWeight: 600, fontSize: 14 }}>
                        {val.count.toLocaleString()} ({val.pct}%)
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Price Anomalies */}
              {(validation.summary.zero_price_count > 0 || validation.summary.sale_exceeds_count > 0 || validation.summary.price_format_issues > 0) && (
                <div style={s.card}>
                  <h3 style={s.sectionTitle}>💰 Price Anomalies</h3>
                  {[
                    { label: '⚠️ Zero price products',         value: validation.summary.zero_price_count },
                    { label: '🔄 Sale price ≥ regular price',  value: validation.summary.sale_exceeds_count },
                    { label: '❓ Unrecognized price format',    value: validation.summary.price_format_issues },
                  ].map((a, i) => a.value > 0 && (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between',
                      padding: '10px 0', borderBottom: `1px solid ${darkMode ? '#2a2a2a' : '#f0f0f0'}` }}>
                      <span style={{ color: darkMode ? '#ddd' : '#333', fontSize: 14 }}>{a.label}</span>
                      <span style={{ color: '#ff4d4f', fontWeight: 700 }}>{a.value}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Duplicate SKUs */}
              {validation.duplicate_sku_list?.length > 0 && (
                <div style={s.card}>
                  <h3 style={s.sectionTitle}>🔁 Duplicate SKUs in Feed</h3>
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

              {/* Issues List */}
              {validation.issues?.length > 0 && (
                <div style={s.card}>
                  <h3 style={s.sectionTitle}>
                    ❌ Products with Issues
                    <span style={{ color: '#888', fontWeight: 400, fontSize: 13, marginLeft: 8 }}>
                      (showing first 50)
                    </span>
                  </h3>
                  <table style={s.table}>
                    <thead>
                      <tr>{['#', 'SKU', 'Name', 'Issues'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr>
                    </thead>
                    <tbody>
                      {validation.issues.map((item, i) => (
                        <tr key={i} style={i % 2 === 0 ? s.trEven : {}}>
                          <td style={{ ...s.td, color: '#888', width: 40 }}>{item.index}</td>
                          <td style={s.td}><code style={{ fontSize: 11 }}>{item.sku}</code></td>
                          <td style={s.td}>{item.name?.slice(0, 45)}{item.name?.length > 45 ? '…' : ''}</td>
                          <td style={s.td}>
                            {item.issues.map((iss, j) => (
                              <span key={j} style={{ background: '#fff2f0', border: '1px solid #ffccc7',
                                color: '#cf1322', padding: '2px 8px', borderRadius: 4,
                                fontSize: 12, marginRight: 4, display: 'inline-block', marginBottom: 2 }}>
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

              {/* Parsed Sample */}
              {validation.parsed_samples?.length > 0 && (
                <div style={s.card}>
                  <h3 style={s.sectionTitle}>👁️ First 5 Products Preview</h3>
                  <p style={s.hint}>How the feed parser reads your products</p>
                  <table style={s.table}>
                    <thead>
                      <tr>{['SKU', 'Name', 'Price', 'Brand', 'Category', 'Colors', 'Sizes', 'Image'].map(h =>
                        <th key={h} style={s.th}>{h}</th>)}</tr>
                    </thead>
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
                          <td style={{ ...s.td, textAlign: 'center' }}>
                            {p.has_image ? '✅' : '❌'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

const getStyles = (dark) => ({
  container:     { padding: '24px' },
  heading:       { color: dark ? '#fff' : '#333', margin: '0 0 8px' },
  sub:           { color: dark ? '#aaa' : '#888', fontSize: 14, marginBottom: 24 },
  tabBar:        { display: 'flex', gap: 8, marginBottom: 24 },
  tab:           { padding: '10px 20px', background: dark ? '#1f1f1f' : '#f0f2f5', color: dark ? '#aaa' : '#666', border: `1px solid ${dark ? '#333' : '#ddd'}`, borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 500 },
  tabActive:     { padding: '10px 20px', background: '#1890ff', color: 'white', border: '1px solid #1890ff', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 500 },
  card:          { background: dark ? '#1f1f1f' : 'white', padding: 20, borderRadius: 12, boxShadow: '0 2px 10px rgba(0,0,0,0.08)', marginBottom: 20 },
  statsGrid:     { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 20 },
  statCard:      { background: dark ? '#1f1f1f' : 'white', padding: 20, borderRadius: 10, textAlign: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.08)' },
  statNum:       { fontSize: 24, fontWeight: 700, marginBottom: 6 },
  statLabel:     { color: dark ? '#aaa' : '#888', fontSize: 13 },
  sectionTitle:  { color: dark ? '#fff' : '#333', margin: '0 0 16px', fontSize: 15, fontWeight: 600 },
  hint:          { color: dark ? '#888' : '#aaa', fontSize: 12, marginBottom: 12, marginTop: -10 },
  label:         { display: 'block', color: dark ? '#aaa' : '#666', fontSize: 13, marginBottom: 6 },
  input:         { padding: '8px 12px', border: `1px solid ${dark ? '#444' : '#ddd'}`, borderRadius: 8, background: dark ? '#2a2a2a' : 'white', color: dark ? '#fff' : '#333', fontSize: 14, width: 280 },
  btn:           { padding: '9px 20px', background: '#1890ff', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 500 },
  btnGhost:      { padding: '9px 20px', background: 'transparent', color: '#1890ff', border: '1px solid #1890ff', borderRadius: 8, cursor: 'pointer', fontSize: 14 },
  errorBox:      { background: '#fff2f0', border: '1px solid #ffccc7', color: '#cf1322', padding: '12px 16px', borderRadius: 8, marginTop: 12, fontSize: 14 },
  loadingBox:    { background: dark ? '#1f1f1f' : 'white', padding: 20, borderRadius: 12, textAlign: 'center', color: dark ? '#aaa' : '#888', marginBottom: 20 },
  dropZone:      { border: `2px dashed ${dark ? '#444' : '#d9d9d9'}`, borderRadius: 12, padding: '40px 20px', textAlign: 'center', cursor: 'pointer', background: dark ? '#1a1a1a' : '#fafafa', marginBottom: 20, transition: 'all 0.2s' },
  dropZoneActive:{ borderColor: '#1890ff', background: dark ? '#001529' : '#e6f7ff' },
  table:         { width: '100%', borderCollapse: 'collapse' },
  th:            { padding: '10px 14px', textAlign: 'left', background: dark ? '#2a2a2a' : '#f0f2f5', color: dark ? '#aaa' : '#666', fontSize: 13, fontWeight: 600 },
  td:            { padding: '10px 14px', color: dark ? '#ddd' : '#333', fontSize: 13, borderBottom: `1px solid ${dark ? '#2a2a2a' : '#f0f0f0'}` },
  trEven:        { background: dark ? '#252525' : '#fafafa' },
});
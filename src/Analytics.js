import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer
} from 'recharts';
import { getAnalytics } from './api';

const COLORS = ['#1890ff', '#52c41a', '#faad14', '#eb2f96', '#722ed1', '#13c2c2', '#fa541c', '#a0d911'];

export default function Analytics({ darkMode }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('products');
  const s = getStyles(darkMode);

  useEffect(() => {
    getAnalytics().then(res => {
      setData(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div style={s.loading}>⏳ Loading analytics...</div>;
  if (!data) return <div style={s.loading}>❌ Failed to load analytics</div>;

  const { product_analytics, price_analytics, category_analytics, upload_analytics } = data;

  const tabs = [
    { key: 'products', label: '📦 Products' },
    { key: 'price',    label: '💰 Price' },
    { key: 'category', label: '🗂️ Categories' },
    { key: 'uploads',  label: '📋 Uploads' },
  ];

  return (
    <div style={s.container}>
      <h2 style={s.heading}>📈 Analytics</h2>
      <p style={s.sub}>Live insights across all retailers and products</p>

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

      {/* ── Products Tab ── */}
      {activeTab === 'products' && (
        <div>
          <div style={s.statsGrid}>
            {[
              { label: 'Total Products', value: product_analytics.total_products.toLocaleString(), color: '#1890ff' },
              { label: 'In Stock',       value: product_analytics.in_stock.toLocaleString(),       color: '#52c41a' },
              { label: 'Out of Stock',   value: product_analytics.out_of_stock.toLocaleString(),   color: '#ff4d4f' },
              { label: 'On Sale',        value: product_analytics.with_sale.toLocaleString(),       color: '#faad14' },
            ].map((c, i) => (
              <div key={i} style={s.statCard}>
                <div style={{ ...s.statNum, color: c.color }}>{c.value}</div>
                <div style={s.statLabel}>{c.label}</div>
              </div>
            ))}
          </div>

          <div style={s.chartsRow}>
            {/* Products per Retailer */}
            <div style={s.chartBox}>
              <h3 style={s.chartTitle}>Products per Retailer</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={product_analytics.products_per_retailer}>
                  <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#333' : '#f0f0f0'} />
                  <XAxis dataKey="retailer__name" tick={{ fill: darkMode ? '#aaa' : '#666', fontSize: 11 }} />
                  <YAxis tick={{ fill: darkMode ? '#aaa' : '#666', fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: darkMode ? '#1f1f1f' : 'white', border: '1px solid #333' }} />
                  <Bar dataKey="count" name="Products" radius={[4, 4, 0, 0]}>
                    {product_analytics.products_per_retailer.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Stock Status Donut */}
            <div style={s.chartBox}>
              <h3 style={s.chartTitle}>Stock Status</h3>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'In Stock',     value: product_analytics.in_stock },
                      { name: 'Out of Stock', value: product_analytics.out_of_stock },
                    ]}
                    cx="50%" cy="50%"
                    innerRadius={70} outerRadius={110}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    <Cell fill="#52c41a" />
                    <Cell fill="#ff4d4f" />
                  </Pie>
                  <Tooltip contentStyle={{ background: darkMode ? '#1f1f1f' : 'white' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={s.chartsRow}>
            {/* Top 10 Brands */}
            <div style={s.chartBox}>
              <h3 style={s.chartTitle}>Top 10 Brands</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={product_analytics.top_brands} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#333' : '#f0f0f0'} />
                  <XAxis type="number" tick={{ fill: darkMode ? '#aaa' : '#666', fontSize: 11 }} />
                  <YAxis dataKey="brand" type="category" width={130} tick={{ fill: darkMode ? '#aaa' : '#666', fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: darkMode ? '#1f1f1f' : 'white' }} />
                  <Bar dataKey="count" name="Products" fill="#722ed1" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Sale vs Full Price */}
            <div style={s.chartBox}>
              <h3 style={s.chartTitle}>Sale vs Full Price</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'On Sale',    value: product_analytics.with_sale },
                      { name: 'Full Price', value: product_analytics.without_sale },
                    ]}
                    cx="50%" cy="50%"
                    innerRadius={70} outerRadius={110}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    <Cell fill="#faad14" />
                    <Cell fill="#1890ff" />
                  </Pie>
                  <Tooltip contentStyle={{ background: darkMode ? '#1f1f1f' : 'white' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Products over time */}
          {product_analytics.products_over_time.length > 1 && (
            <div style={{ ...s.chartBox, marginBottom: '20px' }}>
              <h3 style={s.chartTitle}>Products Uploaded Over Time</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={product_analytics.products_over_time}>
                  <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#333' : '#f0f0f0'} />
                  <XAxis dataKey="date" tick={{ fill: darkMode ? '#aaa' : '#666', fontSize: 11 }} />
                  <YAxis tick={{ fill: darkMode ? '#aaa' : '#666', fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: darkMode ? '#1f1f1f' : 'white' }} />
                  <Line type="monotone" dataKey="count" name="Products" stroke="#1890ff" strokeWidth={2} dot={{ fill: '#1890ff', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* ── Price Tab ── */}
      {activeTab === 'price' && (
        <div>
          <div style={s.chartsRow}>
            {/* Avg/Min/Max per Retailer */}
            <div style={{ ...s.chartBox, flex: 2 }}>
              <h3 style={s.chartTitle}>Avg / Min / Max Price per Retailer</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={price_analytics.avg_price_per_retailer}>
                  <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#333' : '#f0f0f0'} />
                  <XAxis dataKey="retailer__name" tick={{ fill: darkMode ? '#aaa' : '#666', fontSize: 11 }} />
                  <YAxis tick={{ fill: darkMode ? '#aaa' : '#666', fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: darkMode ? '#1f1f1f' : 'white' }} />
                  <Legend />
                  <Bar dataKey="avg_price" name="Avg"  fill="#1890ff" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="min_price" name="Min"  fill="#52c41a" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="max_price" name="Max"  fill="#ff4d4f" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Price Range Distribution */}
            <div style={s.chartBox}>
              <h3 style={s.chartTitle}>Price Range Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={price_analytics.price_distribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#333' : '#f0f0f0'} />
                  <XAxis dataKey="range" tick={{ fill: darkMode ? '#aaa' : '#666', fontSize: 10 }} />
                  <YAxis tick={{ fill: darkMode ? '#aaa' : '#666', fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: darkMode ? '#1f1f1f' : 'white' }} />
                  <Bar dataKey="count" name="Products" radius={[4, 4, 0, 0]}>
                    {price_analytics.price_distribution.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Price Summary Table */}
          <div style={s.chartBox}>
            <h3 style={s.chartTitle}>Price Summary by Retailer</h3>
            <table style={s.table}>
              <thead>
                <tr>
                  {['Retailer', 'Currency', 'Avg Price', 'Min Price', 'Max Price'].map(h => (
                    <th key={h} style={s.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {price_analytics.avg_price_per_retailer.map((r, i) => (
                  <tr key={i} style={i % 2 === 0 ? s.trEven : {}}>
                    <td style={s.td}>{r.retailer__name}</td>
                    <td style={s.td}>{r.currency}</td>
                    <td style={{ ...s.td, color: '#1890ff', fontWeight: 600 }}>
                      {r.currency}{r.avg_price.toLocaleString()}
                    </td>
                    <td style={{ ...s.td, color: '#52c41a' }}>
                      {r.currency}{r.min_price.toLocaleString()}
                    </td>
                    <td style={{ ...s.td, color: '#ff4d4f' }}>
                      {r.currency}{r.max_price.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Category Tab ── */}
      {activeTab === 'category' && (
        <div>
          <div style={s.chartsRow}>
            {/* Top Categories */}
            <div style={s.chartBox}>
              <h3 style={s.chartTitle}>Top 10 Categories by Products</h3>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={category_analytics.top_categories} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#333' : '#f0f0f0'} />
                  <XAxis type="number" tick={{ fill: darkMode ? '#aaa' : '#666', fontSize: 11 }} />
                  <YAxis dataKey="category__name" type="category" width={150}
                    tick={{ fill: darkMode ? '#aaa' : '#666', fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: darkMode ? '#1f1f1f' : 'white' }} />
                  <Bar dataKey="count" name="Products" radius={[0, 4, 4, 0]}>
                    {category_analytics.top_categories.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Availability per Category */}
            <div style={s.chartBox}>
              <h3 style={s.chartTitle}>Availability % by Category</h3>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={category_analytics.category_availability}>
                  <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#333' : '#f0f0f0'} />
                  <XAxis dataKey="category__name" tick={{ fill: darkMode ? '#aaa' : '#666', fontSize: 10 }} />
                  <YAxis domain={[0, 100]} tick={{ fill: darkMode ? '#aaa' : '#666', fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ background: darkMode ? '#1f1f1f' : 'white' }}
                    formatter={(val) => [`${val}%`, 'Availability']}
                  />
                  <Bar dataKey="availability_pct" name="Available %" radius={[4, 4, 0, 0]}>
                    {category_analytics.category_availability.map((c, i) => (
                      <Cell key={i}
                        fill={c.availability_pct >= 80 ? '#52c41a' : c.availability_pct >= 50 ? '#faad14' : '#ff4d4f'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Category Table */}
          <div style={s.chartBox}>
            <h3 style={s.chartTitle}>Category Availability Details</h3>
            <table style={s.table}>
              <thead>
                <tr>
                  {['Category', 'Total', 'Available', 'Availability %'].map(h => (
                    <th key={h} style={s.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {category_analytics.category_availability.map((c, i) => (
                  <tr key={i} style={i % 2 === 0 ? s.trEven : {}}>
                    <td style={s.td}>{c.category__name}</td>
                    <td style={s.td}>{c.total.toLocaleString()}</td>
                    <td style={{ ...s.td, color: '#52c41a' }}>{c.available.toLocaleString()}</td>
                    <td style={s.td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ flex: 1, height: '6px', background: darkMode ? '#333' : '#f0f0f0', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{
                            height: '100%',
                            width: `${c.availability_pct}%`,
                            background: c.availability_pct >= 80 ? '#52c41a' : c.availability_pct >= 50 ? '#faad14' : '#ff4d4f',
                            borderRadius: '3px'
                          }} />
                        </div>
                        <span style={{ color: c.availability_pct >= 80 ? '#52c41a' : c.availability_pct >= 50 ? '#faad14' : '#ff4d4f', fontWeight: 600, minWidth: '40px' }}>
                          {c.availability_pct}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Uploads Tab ── */}
      {activeTab === 'uploads' && (
        <div>
          <div style={s.statsGrid}>
            {[
              { label: 'Total Uploads',  value: upload_analytics.total_uploads,                      color: '#1890ff' },
              { label: 'Successful',     value: upload_analytics.successful_uploads,                  color: '#52c41a' },
              { label: 'Failed',         value: upload_analytics.failed_uploads,                      color: '#ff4d4f' },
              { label: 'Total Loaded',   value: upload_analytics.total_loaded.toLocaleString(),       color: '#faad14' },
            ].map((c, i) => (
              <div key={i} style={s.statCard}>
                <div style={{ ...s.statNum, color: c.color }}>{c.value}</div>
                <div style={s.statLabel}>{c.label}</div>
              </div>
            ))}
          </div>

          <div style={s.chartsRow}>
            {/* Uploads per Retailer */}
            <div style={s.chartBox}>
              <h3 style={s.chartTitle}>Uploads per Retailer</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={upload_analytics.uploads_per_retailer}>
                  <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#333' : '#f0f0f0'} />
                  <XAxis dataKey="retailer_name" tick={{ fill: darkMode ? '#aaa' : '#666', fontSize: 11 }} />
                  <YAxis tick={{ fill: darkMode ? '#aaa' : '#666', fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: darkMode ? '#1f1f1f' : 'white' }} />
                  <Bar dataKey="uploads" name="Uploads" fill="#13c2c2" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Success vs Failed Pie */}
            <div style={s.chartBox}>
              <h3 style={s.chartTitle}>Upload Success Rate</h3>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Successful', value: upload_analytics.successful_uploads },
                      { name: 'Failed',     value: upload_analytics.failed_uploads || 0 },
                    ]}
                    cx="50%" cy="50%"
                    innerRadius={70} outerRadius={110}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    <Cell fill="#52c41a" />
                    <Cell fill="#ff4d4f" />
                  </Pie>
                  <Tooltip contentStyle={{ background: darkMode ? '#1f1f1f' : 'white' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Loaded vs Skipped summary */}
          <div style={s.chartsRow}>
            <div style={s.chartBox}>
              <h3 style={s.chartTitle}>Products Loaded vs Skipped (All Time)</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={[
                  { name: 'Total Loaded',  value: upload_analytics.total_loaded },
                  { name: 'Total Skipped', value: upload_analytics.total_skipped },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#333' : '#f0f0f0'} />
                  <XAxis dataKey="name" tick={{ fill: darkMode ? '#aaa' : '#666', fontSize: 13 }} />
                  <YAxis tick={{ fill: darkMode ? '#aaa' : '#666', fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: darkMode ? '#1f1f1f' : 'white' }} />
                  <Bar dataKey="value" name="Count" radius={[4, 4, 0, 0]}>
                    <Cell fill="#52c41a" />
                    <Cell fill="#faad14" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const getStyles = (dark) => ({
  container: { padding: '24px' },
  heading: { color: dark ? '#fff' : '#333', margin: '0 0 8px' },
  sub: { color: dark ? '#aaa' : '#888', fontSize: '14px', marginBottom: '24px' },
  loading: { padding: '60px', textAlign: 'center', color: dark ? '#aaa' : '#888', fontSize: '16px' },
  tabBar: { display: 'flex', gap: '8px', marginBottom: '28px', flexWrap: 'wrap' },
  tab: { padding: '10px 20px', background: dark ? '#1f1f1f' : '#f0f2f5', color: dark ? '#aaa' : '#666', border: `1px solid ${dark ? '#333' : '#ddd'}`, borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '500' },
  tabActive: { padding: '10px 20px', background: '#1890ff', color: 'white', border: '1px solid #1890ff', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '500' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' },
  statCard: { background: dark ? '#1f1f1f' : 'white', padding: '20px', borderRadius: '10px', textAlign: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.08)' },
  statNum: { fontSize: '28px', fontWeight: '700', marginBottom: '8px' },
  statLabel: { color: dark ? '#aaa' : '#888', fontSize: '13px' },
  chartsRow: { display: 'flex', gap: '20px', marginBottom: '20px', flexWrap: 'wrap' },
  chartBox: { flex: 1, minWidth: '300px', background: dark ? '#1f1f1f' : 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)', marginBottom: '4px' },
  chartTitle: { color: dark ? '#fff' : '#333', margin: '0 0 16px', fontSize: '15px', fontWeight: '600' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '12px 16px', textAlign: 'left', background: dark ? '#2a2a2a' : '#f0f2f5', color: dark ? '#aaa' : '#666', fontSize: '13px', fontWeight: '600' },
  td: { padding: '12px 16px', color: dark ? '#ddd' : '#333', fontSize: '14px', borderBottom: `1px solid ${dark ? '#2a2a2a' : '#f0f0f0'}` },
  trEven: { background: dark ? '#252525' : '#fafafa' },
});
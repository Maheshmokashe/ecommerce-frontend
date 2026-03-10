import { useEffect, useState } from 'react';
import { getUploadLogs } from './api';

export default function ActivityLog({ darkMode }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const s = getStyles(darkMode);

  useEffect(() => {
    getUploadLogs().then(res => {
      setLogs(res.data);
      setLoading(false);
    });
  }, []);

  const totalLoaded = logs.reduce((sum, l) => sum + l.loaded, 0);
  const totalSkipped = logs.reduce((sum, l) => sum + l.skipped, 0);
  const successCount = logs.filter(l => l.status === 'success').length;
  const failedCount = logs.filter(l => l.status === 'failed').length;

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const getSuccessRate = (log) => {
    if (!log.total_found) return 0;
    return Math.round((log.loaded / log.total_found) * 100);
  };

  return (
    <div style={s.container}>
      <h2 style={s.heading}>📋 Activity Log</h2>
      <p style={s.sub}>Track all XML feed uploads and ingestion history</p>

      {/* Summary Stats */}
      <div style={s.statsGrid}>
        <div style={s.stat}>
          <h2 style={s.statNum}>{logs.length}</h2>
          <p style={s.statLabel}>Total Uploads</p>
        </div>
        <div style={s.stat}>
          <h2 style={{ ...s.statNum, color: '#52c41a' }}>{totalLoaded.toLocaleString()}</h2>
          <p style={s.statLabel}>Products Loaded</p>
        </div>
        <div style={s.stat}>
          <h2 style={{ ...s.statNum, color: '#faad14' }}>{totalSkipped.toLocaleString()}</h2>
          <p style={s.statLabel}>Skipped / Duplicates</p>
        </div>
        <div style={s.stat}>
          <h2 style={{ ...s.statNum, color: '#52c41a' }}>{successCount}</h2>
          <p style={s.statLabel}>Successful</p>
        </div>
        <div style={s.stat}>
          <h2 style={{ ...s.statNum, color: '#ff4d4f' }}>{failedCount}</h2>
          <p style={s.statLabel}>Failed</p>
        </div>
      </div>

      {/* Logs Table */}
      {loading ? (
        <div style={s.loadingBox}>⏳ Loading activity log...</div>
      ) : logs.length === 0 ? (
        <div style={s.emptyBox}>
          <p style={{ fontSize: '48px', margin: '0 0 16px' }}>📋</p>
          <p style={{ color: darkMode ? '#aaa' : '#888' }}>No uploads yet. Upload an XML feed to get started!</p>
        </div>
      ) : (
        <div style={s.tableWrapper}>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>#</th>
                <th style={s.th}>Retailer</th>
                <th style={s.th}>Filename</th>
                <th style={s.th}>Total Found</th>
                <th style={s.th}>Loaded</th>
                <th style={s.th}>Skipped</th>
                <th style={s.th}>Success Rate</th>
                <th style={s.th}>Status</th>
                <th style={s.th}>Uploaded By</th>
                <th style={s.th}>Date & Time</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, index) => {
                const rate = getSuccessRate(log);
                return (
                  <tr key={log.id}
                    style={s.tr}
                    onMouseEnter={e => e.currentTarget.style.background = darkMode ? '#2a2a2a' : '#f5f5f5'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={s.td}>{index + 1}</td>
                    <td style={s.td}>
                      <span style={s.retailerTag}>🏪 {log.retailer_name}</span>
                    </td>
                    <td style={s.td}>
                      <span style={s.filename}>📄 {log.filename || 'N/A'}</span>
                    </td>
                    <td style={{ ...s.td, textAlign: 'center' }}>{log.total_found.toLocaleString()}</td>
                    <td style={{ ...s.td, textAlign: 'center' }}>
                      <span style={s.loadedBadge}>{log.loaded.toLocaleString()}</span>
                    </td>
                    <td style={{ ...s.td, textAlign: 'center' }}>
                      <span style={s.skippedBadge}>{log.skipped.toLocaleString()}</span>
                    </td>
                    <td style={{ ...s.td, textAlign: 'center' }}>
                      <div style={s.progressBar}>
                        <div style={{ ...s.progressFill, width: `${rate}%`,
                          background: rate > 80 ? '#52c41a' : rate > 50 ? '#faad14' : '#ff4d4f'
                        }} />
                      </div>
                      <span style={{ fontSize: '12px', color: darkMode ? '#aaa' : '#666' }}>{rate}%</span>
                    </td>
                    <td style={{ ...s.td, textAlign: 'center' }}>
                      <span style={log.status === 'success' ? s.successBadge : s.failedBadge}>
                        {log.status === 'success' ? '✅ Success' : '❌ Failed'}
                      </span>
                    </td>
                    <td style={s.td}>
                      <span style={s.userTag}>👤 {log.uploaded_by || 'admin'}</span>
                    </td>
                    <td style={s.td}>
                      <span style={s.dateText}>{formatDate(log.created_at)}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const getStyles = (dark) => ({
  container: { padding: '24px' },
  heading: { color: dark ? '#fff' : '#333', margin: '0 0 8px' },
  sub: { color: dark ? '#aaa' : '#888', fontSize: '14px', marginBottom: '24px' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', marginBottom: '32px' },
  stat: { background: dark ? '#1f1f1f' : 'white', padding: '20px', borderRadius: '10px', textAlign: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.08)' },
  statNum: { color: dark ? '#fff' : '#333', margin: '0 0 8px', fontSize: '28px' },
  statLabel: { color: dark ? '#aaa' : '#888', margin: 0, fontSize: '13px' },
  loadingBox: { textAlign: 'center', padding: '60px', color: dark ? '#aaa' : '#888' },
  emptyBox: { textAlign: 'center', padding: '60px' },
  tableWrapper: { background: dark ? '#1f1f1f' : 'white', borderRadius: '12px', overflow: 'auto', boxShadow: '0 2px 10px rgba(0,0,0,0.08)' },
  table: { width: '100%', borderCollapse: 'collapse', minWidth: '900px' },
  th: { background: '#1890ff', color: 'white', padding: '14px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', whiteSpace: 'nowrap' },
  tr: { borderBottom: `1px solid ${dark ? '#333' : '#f0f0f0'}` },
  td: { padding: '14px 16px', color: dark ? '#ddd' : '#555', fontSize: '13px', verticalAlign: 'middle' },
  retailerTag: { color: '#1890ff', fontWeight: '500' },
  filename: { color: dark ? '#aaa' : '#888', fontSize: '12px' },
  loadedBadge: { background: '#f6ffed', color: '#52c41a', padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' },
  skippedBadge: { background: '#fffbe6', color: '#faad14', padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' },
  progressBar: { height: '6px', background: dark ? '#333' : '#f0f0f0', borderRadius: '3px', marginBottom: '4px', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: '3px', transition: 'width 0.3s' },
  successBadge: { background: '#f6ffed', color: '#52c41a', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '500' },
  failedBadge: { background: '#fff2f0', color: '#ff4d4f', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '500' },
  userTag: { color: dark ? '#ddd' : '#555', fontSize: '12px' },
  dateText: { color: dark ? '#aaa' : '#888', fontSize: '12px', whiteSpace: 'nowrap' },
});
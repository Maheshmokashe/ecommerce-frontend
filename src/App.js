import { useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Login from './Login';
import Dashboard from './Dashboard';
import Retailers from './Retailers';
import Products from './Products';
import Search from './Search';
import ActivityLog from './ActivityLog';

function Layout({ darkMode, setDarkMode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const s = getStyles(darkMode);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  const handleSelectRetailer = (retailerName) => {
    navigate(`/products?retailer=${encodeURIComponent(retailerName)}`);
  };

  const navItems = [
    { path: '/dashboard', label: '📊 Dashboard' },
    { path: '/retailers', label: '🏪 Retailers' },
    { path: '/products', label: '📦 Products' },
    { path: '/search', label: '🔍 Search' },
    { path: '/activity-log', label: '📋 Activity Log' },
  ];

  return (
    <div style={s.appContainer}>
      {/* Sidebar */}
      <div style={s.sidebar}>
        <div style={s.logo}>
          <span style={s.logoIcon}>🛒</span>
          <span style={s.logoText}>ECommerce</span>
        </div>

        <nav style={s.nav}>
          {navItems.map(item => (
            <div key={item.path}
              style={{
                ...s.navItem,
                ...(location.pathname === item.path ? s.navItemActive : {})
              }}
              onClick={() => navigate(item.path)}>
              {item.label}
            </div>
          ))}
        </nav>

        <div style={s.sidebarBottom}>
          <button style={s.darkModeBtn} onClick={() => setDarkMode(!darkMode)}>
            {darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
          </button>
          <button style={s.logoutBtn} onClick={handleLogout}>
            🚪 Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={s.mainContent}>
        <Routes>
          <Route path="/dashboard" element={<Dashboard darkMode={darkMode} />} />
          <Route path="/retailers" element={<Retailers darkMode={darkMode} onSelectRetailer={handleSelectRetailer} />} />
          <Route path="/products" element={<Products darkMode={darkMode} />} />
          <Route path="/search" element={<Search darkMode={darkMode} />} />
          <Route path="/activity-log" element={<ActivityLog darkMode={darkMode} />} />
        </Routes>
      </div>
    </div>
  );
}

export default function App() {
  const [darkMode, setDarkMode] = useState(false);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/*" element={<Layout darkMode={darkMode} setDarkMode={setDarkMode} />} />
      </Routes>
    </BrowserRouter>
  );
}

const getStyles = (dark) => ({
  appContainer: {
    display: 'flex',
    minHeight: '100vh',
    background: dark ? '#141414' : '#f0f2f5',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  sidebar: {
    width: '220px',
    minWidth: '220px',
    background: dark ? '#0a0a0a' : '#001529',
    display: 'flex',
    flexDirection: 'column',
    position: 'fixed',
    top: 0,
    left: 0,
    height: '100vh',
    zIndex: 100,
    overflowY: 'auto',
  },
  logo: {
    padding: '24px 20px',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  logoIcon: { fontSize: '24px' },
  logoText: {
    color: 'white',
    fontSize: '18px',
    fontWeight: '700',
    letterSpacing: '0.5px',
  },
  nav: {
    flex: 1,
    padding: '16px 0',
  },
  navItem: {
    padding: '12px 20px',
    color: 'rgba(255,255,255,0.65)',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.2s',
    borderLeft: '3px solid transparent',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  navItemActive: {
    background: '#1890ff22',
    color: '#1890ff',
    borderLeft: '3px solid #1890ff',
  },
  sidebarBottom: {
    padding: '16px',
    borderTop: '1px solid rgba(255,255,255,0.08)',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  darkModeBtn: {
    width: '100%',
    padding: '10px',
    background: 'rgba(255,255,255,0.08)',
    color: 'rgba(255,255,255,0.85)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13px',
  },
  logoutBtn: {
    width: '100%',
    padding: '10px',
    background: '#ff4d4f',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500',
  },
  mainContent: {
    marginLeft: '220px',
    flex: 1,
    minHeight: '100vh',
    overflowY: 'auto',
  },
});
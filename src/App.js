import { useState } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';
import Login from './Login';
import Products from './Products';
import Search from './Search';
import Dashboard from './Dashboard';
import Retailers from './Retailers';

function Layout({ onLogout, darkMode, toggleDarkMode }) {
  const navigate = useNavigate();
  const s = getStyles(darkMode);

  const handleSelectRetailer = (retailerName) => {
    navigate(`/products?retailer=${encodeURIComponent(retailerName)}`);
  };

  return (
    <div style={s.layout}>
      <div style={s.sidebar}>
        <h2 style={s.logo}>🛒 ECommerce</h2>
        <nav style={{ flex: 1 }}>
          <Link to="/dashboard" style={s.link}>📊 Dashboard</Link>
          <Link to="/retailers" style={s.link}>🏪 Retailers</Link>
          <Link to="/products" style={s.link}>📦 Products</Link>
          <Link to="/search" style={s.link}>🔍 Search</Link>
        </nav>
        <div style={s.bottomSection}>
          <button style={s.darkToggle} onClick={toggleDarkMode}>
            {darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
          </button>
          <button style={s.logout} onClick={onLogout}>Logout</button>
        </div>
      </div>
      <div style={s.main}>
        <Routes>
          <Route path="/dashboard" element={<Dashboard darkMode={darkMode} />} />
          <Route path="/retailers" element={<Retailers darkMode={darkMode} onSelectRetailer={handleSelectRetailer} />} />
          <Route path="/products" element={<Products darkMode={darkMode} />} />
          <Route path="/search" element={<Search darkMode={darkMode} />} />
          <Route path="*" element={<Dashboard darkMode={darkMode} />} />
        </Routes>
      </div>
    </div>
  );
}

export default function App() {
  const [loggedIn, setLoggedIn] = useState(!!localStorage.getItem('token'));
  const [darkMode, setDarkMode] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setLoggedIn(false);
  };

  return (
    <BrowserRouter>
      {loggedIn
        ? <Layout onLogout={handleLogout} darkMode={darkMode} toggleDarkMode={() => setDarkMode(!darkMode)} />
        : <Login onLogin={() => setLoggedIn(true)} />}
    </BrowserRouter>
  );
}

const getStyles = (dark) => ({
  layout: { display: 'flex', height: '100vh', background: dark ? '#141414' : '#f0f2f5' },
  sidebar: { width: '220px', background: dark ? '#000' : '#001529', padding: '24px 16px', display: 'flex', flexDirection: 'column' },
  logo: { color: 'white', marginBottom: '32px', fontSize: '18px' },
  link: { display: 'block', color: '#ccc', textDecoration: 'none', padding: '10px 12px', borderRadius: '6px', marginBottom: '4px', fontSize: '14px' },
  main: { flex: 1, overflowY: 'auto', background: dark ? '#141414' : '#f0f2f5' },
  bottomSection: { display: 'flex', flexDirection: 'column', gap: '8px' },
  darkToggle: { padding: '10px', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' },
  logout: { padding: '10px', background: '#ff4d4f', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' },
});
import { useState } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';
import Login from './Login';
import Products from './Products';
import Search from './Search';
import Dashboard from './Dashboard';

function Layout({ onLogout }) {
  return (
    <div style={styles.layout}>
      <div style={styles.sidebar}>
        <h2 style={styles.logo}>🛒 ECommerce</h2>
        <nav>
          <Link to="/dashboard" style={styles.link}>📊 Dashboard</Link>
          <Link to="/products" style={styles.link}>📦 Products</Link>
          <Link to="/search" style={styles.link}>🔍 Search</Link>
        </nav>
        <button style={styles.logout} onClick={onLogout}>Logout</button>
      </div>
      <div style={styles.main}>
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/products" element={<Products />} />
          <Route path="/search" element={<Search />} />
          <Route path="*" element={<Dashboard />} />
        </Routes>
      </div>
    </div>
  );
}

export default function App() {
  const [loggedIn, setLoggedIn] = useState(!!localStorage.getItem('token'));

  const handleLogout = () => {
    localStorage.removeItem('token');
    setLoggedIn(false);
  };

  return (
    <BrowserRouter>
      {loggedIn
        ? <Layout onLogout={handleLogout} />
        : <Login onLogin={() => setLoggedIn(true)} />}
    </BrowserRouter>
  );
}

const styles = {
  layout: { display:'flex', height:'100vh', background:'#f0f2f5' },
  sidebar: { width:'220px', background:'#001529', padding:'24px 16px', display:'flex', flexDirection:'column' },
  logo: { color:'white', marginBottom:'32px', fontSize:'18px' },
  link: { display:'block', color:'#ccc', textDecoration:'none', padding:'10px 12px', borderRadius:'6px', marginBottom:'4px', fontSize:'14px' },
  main: { flex:1, overflowY:'auto', background:'#f0f2f5' },
  logout: { marginTop:'auto', padding:'10px', background:'#ff4d4f', color:'white', border:'none', borderRadius:'6px', cursor:'pointer' },
};
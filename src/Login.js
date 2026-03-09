import { useState } from 'react';
import { login } from './api';

export default function Login({ onLogin }) {
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!form.username || !form.password) {
      setError('Please enter username and password');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await login(form);
      localStorage.setItem('token', res.data.access);
      onLogin();
    } catch {
      setError('Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSubmit();
  };

  return (
    <div style={styles.container}>
      <div style={styles.left}>
        <h1 style={styles.brand}>🛒 ECommerce</h1>
        <h2 style={styles.tagline}>Product Catalog Platform</h2>
<p style={styles.desc}>From raw XML feeds to searchable product catalog in seconds — powered by Django REST API, FastAPI microservice, MySQL, and React.</p>        <div style={styles.features}>
          <div style={styles.feature}>⚡ FastAPI Search Microservice</div>
          <div style={styles.feature}>📂 XML Feed Upload</div>
          <div style={styles.feature}>📊 Real-time Dashboard</div>
          <div style={styles.feature}>🔐 JWT Authentication</div>
        </div>
      </div>
      <div style={styles.right}>
        <div style={styles.card}>
          <h2 style={styles.title}>Welcome Back</h2>
          <p style={styles.subtitle}>Sign in to your account</p>
          {error && <div style={styles.error}>⚠️ {error}</div>}
          <div style={styles.field}>
            <label style={styles.label}>Username</label>
            <input
              style={styles.input}
              placeholder="Enter username"
              value={form.username}
              onChange={e => setForm({ ...form, username: e.target.value })}
              onKeyDown={handleKeyDown}
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              style={styles.input}
              placeholder="Enter password"
              type="password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              onKeyDown={handleKeyDown}
            />
          </div>
          <button style={styles.button} onClick={handleSubmit} disabled={loading}>
            {loading ? '⏳ Signing in...' : 'Sign In →'}
          </button>
          <p style={styles.hint}>Use your Django admin credentials</p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { display: 'flex', height: '100vh', fontFamily: 'sans-serif' },
  left: { flex: 1, background: 'linear-gradient(135deg, #001529 0%, #003a8c 100%)', padding: '60px', display: 'flex', flexDirection: 'column', justifyContent: 'center', color: 'white' },
  brand: { fontSize: '32px', margin: '0 0 8px', color: 'white' },
  tagline: { fontSize: '20px', margin: '0 0 24px', color: '#91d5ff', fontWeight: 'normal' },
  desc: { color: '#adc6ff', lineHeight: '1.8', marginBottom: '40px', fontSize: '15px' },
  features: { display: 'flex', flexDirection: 'column', gap: '12px' },
  feature: { background: 'rgba(255,255,255,0.1)', padding: '12px 20px', borderRadius: '8px', fontSize: '14px', borderLeft: '3px solid #1890ff' },
  right: { width: '480px', background: '#f0f2f5', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' },
  card: { background: 'white', padding: '48px', borderRadius: '16px', boxShadow: '0 8px 40px rgba(0,0,0,0.12)', width: '100%' },
  title: { margin: '0 0 8px', color: '#333', fontSize: '24px' },
  subtitle: { margin: '0 0 32px', color: '#888', fontSize: '14px' },
  error: { background: '#fff2f0', border: '1px solid #ffccc7', color: '#ff4d4f', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px' },
  field: { marginBottom: '20px' },
  label: { display: 'block', marginBottom: '6px', color: '#555', fontSize: '14px', fontWeight: '500' },
  input: { width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', boxSizing: 'border-box', outline: 'none' },
  button: { width: '100%', padding: '14px', background: 'linear-gradient(135deg, #1890ff, #096dd9)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', cursor: 'pointer', marginTop: '8px', fontWeight: '500' },
  hint: { textAlign: 'center', color: '#aaa', fontSize: '12px', marginTop: '16px' },
};
import { useState } from 'react';
import { login } from './api';

export default function Login({ onLogin }) {
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await login(form);
      localStorage.setItem('token', res.data.access);
      onLogin();
    } catch {
      setError('Invalid username or password');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>🛒 ECommerce API</h2>
        <h3 style={styles.subtitle}>Login</h3>
        {error && <p style={styles.error}>{error}</p>}
        <input style={styles.input} placeholder="Username"
          onChange={e => setForm({ ...form, username: e.target.value })} />
        <input style={styles.input} placeholder="Password" type="password"
          onChange={e => setForm({ ...form, password: e.target.value })} />
        <button style={styles.button} onClick={handleSubmit}>Login</button>
      </div>
    </div>
  );
}

const styles = {
  container: { display:'flex', justifyContent:'center', alignItems:'center', height:'100vh', background:'#f0f2f5' },
  card: { background:'white', padding:'40px', borderRadius:'12px', boxShadow:'0 4px 20px rgba(0,0,0,0.1)', width:'320px' },
  title: { textAlign:'center', color:'#1890ff', marginBottom:'4px' },
  subtitle: { textAlign:'center', color:'#666', marginBottom:'24px', fontWeight:'normal' },
  input: { width:'100%', padding:'10px', margin:'8px 0', borderRadius:'6px', border:'1px solid #ddd', fontSize:'14px', boxSizing:'border-box' },
  button: { width:'100%', padding:'12px', background:'#1890ff', color:'white', border:'none', borderRadius:'6px', fontSize:'16px', cursor:'pointer', marginTop:'12px' },
  error: { color:'red', textAlign:'center', fontSize:'14px' },
};
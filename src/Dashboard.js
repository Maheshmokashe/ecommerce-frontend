import { useEffect, useState } from 'react';
import { getProducts, getCategories } from './api';

export default function Dashboard() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    getProducts().then(res => setProducts(res.data));
    getCategories().then(res => setCategories(res.data));
  }, []);

  const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
  const avgPrice = products.length
    ? (products.reduce((sum, p) => sum + parseFloat(p.price), 0) / products.length).toFixed(2)
    : 0;

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>📊 Dashboard</h2>
      <div style={styles.statsGrid}>
        <div style={styles.stat}><h1>{products.length}</h1><p>Total Products</p></div>
        <div style={styles.stat}><h1>{categories.length}</h1><p>Categories</p></div>
        <div style={styles.stat}><h1>{totalStock}</h1><p>Total Stock</p></div>
        <div style={styles.stat}><h1>₹{avgPrice}</h1><p>Avg Price</p></div>
      </div>
      <h3 style={{ marginBottom:'16px' }}>Recent Products</h3>
      <table style={styles.table}>
        <thead>
          <tr style={styles.th}>
            <th>SKU</th><th>Name</th><th>Category</th><th>Price</th><th>Stock</th>
          </tr>
        </thead>
        <tbody>
          {products.slice(0, 10).map(p => (
            <tr key={p.id} style={styles.tr}>
              <td style={styles.td}>{p.sku}</td>
              <td style={styles.td}>{p.name}</td>
              <td style={styles.td}>{p.category_name}</td>
              <td style={styles.td}>₹{p.price}</td>
              <td style={styles.td}>{p.stock}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const styles = {
  container: { padding:'24px' },
  heading: { marginBottom:'24px', color:'#333' },
  statsGrid: { display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:'16px', marginBottom:'32px' },
  stat: { background:'white', padding:'24px', borderRadius:'10px', textAlign:'center', boxShadow:'0 2px 10px rgba(0,0,0,0.08)' },
  table: { width:'100%', borderCollapse:'collapse', background:'white', borderRadius:'10px', overflow:'hidden', boxShadow:'0 2px 10px rgba(0,0,0,0.08)' },
  th: { background:'#1890ff', color:'white', padding:'12px 16px', textAlign:'left' },
  tr: { borderBottom:'1px solid #f0f0f0' },
  td: { padding:'12px 16px', color:'#555', fontSize:'14px' },
};
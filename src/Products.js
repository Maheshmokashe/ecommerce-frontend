import { useEffect, useState } from 'react';
import { getProducts } from './api';

export default function Products() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    getProducts().then(res => setProducts(res.data));
  }, []);

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>📦 All Products</h2>
      <div style={styles.grid}>
        {products.map(p => (
          <div key={p.id} style={styles.card}
            onClick={() => p.source_url && window.open(p.source_url, '_blank')}>
            <span style={styles.badge}>{p.category_name}</span>
            <h3 style={styles.name}>{p.name}</h3>
            <p style={styles.sku}>SKU: {p.sku}</p>
            <div style={styles.footer}>
              <span style={styles.price}>₹{p.price}</span>
              <span style={styles.stock}>Stock: {p.stock}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  container: { padding: '24px' },
  heading: { marginBottom: '24px', color: '#333' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px' },
  card: { background: 'white', borderRadius: '10px', padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)', cursor: 'pointer', transition: 'transform 0.2s', },
  badge: { background: '#e6f7ff', color: '#1890ff', padding: '2px 10px', borderRadius: '20px', fontSize: '12px' },
  name: { margin: '12px 0 4px', color: '#333', fontSize: '15px' },
  sku: { color: '#999', fontSize: '12px', margin: '0 0 12px' },
  footer: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f0f0f0', paddingTop: '12px' },
  price: { color: '#52c41a', fontWeight: 'bold', fontSize: '18px' },
  stock: { color: '#888', fontSize: '13px' },
};
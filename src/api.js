import axios from 'axios';

export const djangoApi = axios.create({
  baseURL: 'http://127.0.0.1:8000/api',
});

export const fastapiApi = axios.create({
  baseURL: 'http://127.0.0.1:8001',
});

djangoApi.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const login = (data) => djangoApi.post('/token/', data);
export const getProducts = () => djangoApi.get('/products/');
export const getCategories = () => djangoApi.get('/categories/');
export const getRetailers = () => djangoApi.get('/retailers/');
export const deleteRetailer = (id) => djangoApi.delete(`/retailers/${id}/`);
export const searchProducts = (q, min, max) =>
  fastapiApi.get('/search', {
    params: {
      q,
      min_price: min || undefined,
      max_price: max || undefined,
      limit: 500
    }
  });

// Format price with correct currency symbol
export const formatPrice = (price, currency = '₹') => {
  if (!price) return `${currency}0`;
  const num = parseFloat(price);
  if (currency === '£' || currency === '$' || currency === '€') {
    return `${currency}${num.toFixed(2)}`;
  }
  // Indian rupee formatting with commas (e.g. ₹1,386)
  return `${currency}${Math.round(num).toLocaleString('en-IN')}`;
};

// Calculate discount percentage between original and sale price
export const getDiscount = (price, salePrice) => {
  if (!salePrice || !price) return null;
  const p = parseFloat(price);
  const s = parseFloat(salePrice);
  if (s >= p || s <= 0) return null;
  return Math.round(((p - s) / p) * 100);
};

export const searchProductsAdvanced = (params) =>
  fastapiApi.get('/search', { params: { ...params, limit: 500 } });

export const getSearchFilters = () => fastapiApi.get('/filters');
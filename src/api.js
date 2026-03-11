import axios from 'axios';

export const djangoApi = axios.create({ baseURL: 'http://127.0.0.1:8000/api' });
export const fastapiApi = axios.create({ baseURL: 'http://127.0.0.1:8001' });

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
export const bulkDeleteProducts = (ids) => djangoApi.post('/bulk-delete/', { ids });
export const getUploadLogs = () => djangoApi.get('/upload-logs/');
export const updateFeedUrl = (id, feed_url) => djangoApi.post(`/retailers/${id}/update-feed/`, { feed_url });
export const refreshFeed = (id) => djangoApi.post(`/retailers/${id}/refresh-feed/`);
export const getCategoryStats = (retailer = null) =>
  djangoApi.get('/category-stats/', { params: retailer ? { retailer } : {} });

export const searchProductsAdvanced = (params) =>
  fastapiApi.get('/search', { params: { ...params, limit: 500 } });
export const getSearchFilters = () => fastapiApi.get('/filters');

export const formatPrice = (price, currency = '₹') => {
  if (!price) return `${currency}0`;
  const num = parseFloat(price);
  if (currency === '£' || currency === '$' || currency === '€') return `${currency}${num.toFixed(2)}`;
  return `${currency}${Math.round(num).toLocaleString('en-IN')}`;
};

export const getDiscount = (price, salePrice) => {
  if (!salePrice || !price) return null;
  const p = parseFloat(price);
  const s = parseFloat(salePrice);
  if (s >= p) return null;
  return Math.round(((p - s) / p) * 100);
};
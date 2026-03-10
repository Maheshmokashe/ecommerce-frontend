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
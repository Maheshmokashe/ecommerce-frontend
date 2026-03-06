import axios from 'axios';

const API = axios.create({ baseURL: 'http://127.0.0.1:8000/api' });
const SEARCH_API = axios.create({ baseURL: 'http://127.0.0.1:8001' });

API.interceptors.request.use((req) => {
  const token = localStorage.getItem('token');
  if (token) req.headers.Authorization = `Bearer ${token}`;
  return req;
});

export const login = (data) => API.post('/token/', data);
export const getProducts = () => API.get('/products/');
export const getCategories = () => API.get('/categories/');
export const searchProducts = (q, min, max) =>
  SEARCH_API.get(`/search?q=${q}${min ? `&min_price=${min}` : ''}${max ? `&max_price=${max}` : ''}`);
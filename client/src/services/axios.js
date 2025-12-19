import axios from 'axios';
import store from '../store';
import { logout } from '../slices/authSlice';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor: attach token
api.interceptors.request.use((config) => {
  const state = store.getState();
  const token = state?.auth?.token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response && err.response.status === 401) {
      // Dispatch logout and redirect to login
      try {
        store.dispatch(logout());
      } catch (e) {
        console.error('Logout dispatch error:', e);
      }
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;

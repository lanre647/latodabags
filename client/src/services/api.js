import axios from 'axios';
import { toast } from 'react-toastify';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors globally
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Network error
    if (!error.response) {
      toast.error('Network error. Please check your connection.');
      return Promise.reject(error);
    }

    const { status, data } = error.response;

    // Handle specific error codes
    switch (status) {
      case 400:
        toast.error(data.message || 'Bad request');
        break;
      case 401:
        toast.error('Unauthorized. Please login again.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        break;
      case 403:
        toast.error('Access forbidden');
        break;
      case 404:
        toast.error(data.message || 'Resource not found');
        break;
      case 429:
        toast.error(data.message || 'Too many requests. Please try again later.');
        break;
      case 500:
        toast.error('Server error. Please try again later.');
        break;
      default:
        toast.error(data.message || 'An error occurred');
    }

    return Promise.reject(error);
  }
);

// API methods
export const apiService = {
  // Auth endpoints
  auth: {
    register: (data) => api.post('/auth/register', data),
    login: (data) => api.post('/auth/login', data),
    logout: () => api.get('/auth/logout'),
    getMe: () => api.get('/auth/me'),
    updateProfile: (data) => api.put('/auth/update', data),
    changePassword: (data) => api.put('/auth/password', data),
  },

  // Bags endpoints
  bags: {
    getAll: (params) => api.get('/bags', { params }),
    getById: (id) => api.get(`/bags/${id}`),
    create: (data) => api.post('/bags', data),
    update: (id, data) => api.put(`/bags/${id}`, data),
    delete: (id) => api.delete(`/bags/${id}`),
    uploadImage: (formData) => api.post('/bags/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  },

  // Categories endpoints
  categories: {
    getAll: () => api.get('/categories'),
    getById: (id) => api.get(`/categories/${id}`),
  },

  // Orders endpoints
  orders: {
    getAll: () => api.get('/orders'),
    getById: (id) => api.get(`/orders/${id}`),
    create: (data) => api.post('/orders', data),
    updateStatus: (id, status) => api.put(`/orders/${id}/status`, { status }),
  },

  // Payment endpoints
  payments: {
    initialize: (data) => api.post('/payments/initialize', data),
    verify: (reference) => api.get(`/payments/verify/${reference}`),
  },

  // Reviews endpoints
  reviews: {
    create: (bagId, data) => api.post(`/bags/${bagId}/reviews`, data),
    update: (bagId, reviewId, data) => api.put(`/bags/${bagId}/reviews/${reviewId}`, data),
    delete: (bagId, reviewId) => api.delete(`/bags/${bagId}/reviews/${reviewId}`),
  },
};

export default api;
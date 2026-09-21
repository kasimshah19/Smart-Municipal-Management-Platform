import axios from 'axios';

/**
 * Centralized Axios instance.
 * All API calls throughout the app should use this instance
 * to ensure consistent base URL, headers, and interceptors.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach auth token when available (future phases)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — centralised error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Future: handle 401 (redirect to login), token refresh, etc.
    return Promise.reject(error);
  }
);

export default api;

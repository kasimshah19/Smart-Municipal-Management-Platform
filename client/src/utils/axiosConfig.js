import axios from 'axios';

// Set base URL for all API requests
axios.defaults.baseURL = 'http://localhost:5000/api';

// Add a request interceptor
axios.interceptors.request.use(
  (config) => {
    // Get token from local storage
    const token = localStorage.getItem('token');
    
    // If token exists, add it to the headers
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle 401 Unauthorized globally
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token and user data on 401
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Force reload or redirect to login (handling outside of React Router context)
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axios;

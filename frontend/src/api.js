import axios from 'axios';

const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

/*
 * Attach the latest authentication token
 * to every API request.
 */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('kisanmitra_token');

    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/*
 * Handle authentication errors globally.
 *
 * If the backend says that the token is expired/invalid,
 * remove the old authentication information so the user
 * can log in again with a fresh token.
 */
api.interceptors.response.use(
  (response) => {
    return response;
  },

  (error) => {
    const status = error.response?.status;
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      '';

    if (
      status === 401 &&
      (
        message.toLowerCase().includes('token') ||
        message.toLowerCase().includes('unauthorized') ||
        message.toLowerCase().includes('expired') ||
        message.toLowerCase().includes('invalid')
      )
    ) {
      /*
       * Remove only authentication information.
       * Do not clear the entire localStorage.
       */
      localStorage.removeItem('kisanmitra_token');
      localStorage.removeItem('kisanmitra_user');
    }

    return Promise.reject(error);
  }
);

export default api;
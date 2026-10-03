import axios from 'axios';

const apiService = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
});

apiService.interceptors.request.use((config) => {
  const token = localStorage.getItem('kisanmitra_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiService;

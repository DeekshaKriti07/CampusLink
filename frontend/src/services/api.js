import axios from 'axios';
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api/v1', timeout: 125000 });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      if (payload.exp * 1000 <= Date.now()) throw new Error('Expired');
      config.headers.Authorization = `Bearer ${token}`;
    } catch {
      localStorage.removeItem('token');
      if (!['/login', '/register'].includes(location.pathname)) location.replace('/login');
      return Promise.reject(new Error('Your session expired. Please sign in again.'));
    }
  }
  return config;
});
api.interceptors.response.use(r => r, error => {
  if (error.response?.status === 401 && !error.config?.url?.startsWith('/auth/')) {
    localStorage.removeItem('token'); location.replace('/login');
  }
  return Promise.reject(error);
});
export default api;

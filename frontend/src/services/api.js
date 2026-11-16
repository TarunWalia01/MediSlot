import axios from 'axios';

export const AUTH_TOKEN_KEY = 'medislot_auth_token';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  timeout: 5000
});

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem(AUTH_TOKEN_KEY);

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export async function getHealthStatus() {
  const response = await api.get('/health');
  return response.data;
}

export async function registerAccount(accountDetails) {
  const response = await api.post('/auth/register', accountDetails);
  return response.data;
}

export async function loginAccount(credentials) {
  const response = await api.post('/auth/login', credentials);
  return response.data;
}

export async function getCurrentUser() {
  const response = await api.get('/auth/me');
  return response.data;
}

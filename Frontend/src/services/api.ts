import axios from 'axios';

// Default to http://localhost:5000 or the environment variable
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API call failed:', error?.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default apiClient;


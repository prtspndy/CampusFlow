import axios from 'axios';

// Central API client configured with environment base URL
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request interceptor: inject JWT Access Token
api.interceptors.request.use(
  (config) => {
    const accessToken =
      localStorage.getItem('cf_access_token') || localStorage.getItem('cf_auth_token');
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle token refresh rotation and 401 unauthorized
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Avoid infinite loop if login or refresh endpoints itself fails with 401
    const isAuthUrl =
      originalRequest?.url?.includes('/auth/login') ||
      originalRequest?.url?.includes('/auth/refresh') ||
      originalRequest?.url?.includes('/auth/register');

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthUrl) {
      const refreshToken = localStorage.getItem('cf_refresh_token');

      if (!refreshToken) {
        localStorage.removeItem('cf_access_token');
        localStorage.removeItem('cf_auth_token');
        localStorage.removeItem('cf_user');
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshResponse = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken,
        });

        const newAccessToken =
          refreshResponse.data?.accessToken ||
          refreshResponse.data?.token ||
          refreshResponse.data?.data?.accessToken;
        const newRefreshToken =
          refreshResponse.data?.refreshToken ||
          refreshResponse.data?.data?.refreshToken ||
          refreshToken;

        if (newAccessToken) {
          localStorage.setItem('cf_access_token', newAccessToken);
          localStorage.setItem('cf_auth_token', newAccessToken);
          if (newRefreshToken) {
            localStorage.setItem('cf_refresh_token', newRefreshToken);
          }
          api.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          processQueue(null, newAccessToken);
          return api(originalRequest);
        }
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        localStorage.removeItem('cf_access_token');
        localStorage.removeItem('cf_auth_token');
        localStorage.removeItem('cf_refresh_token');
        localStorage.removeItem('cf_user');
        window.location.href = '/login?session_expired=true';
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;

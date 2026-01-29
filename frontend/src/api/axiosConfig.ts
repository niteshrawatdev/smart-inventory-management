// src/api/axiosConfig.ts
import axios, { AxiosResponse } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create two instances: one for JSON, one for blobs
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

export const apiBlob = axios.create({
  baseURL: API_URL,
  responseType: 'blob',
  timeout: 10000,
});

// Common error handler
const handleApiError = (error: any) => {
  console.error('API Error:', error.response?.data || error.message);
  
  if (error.response?.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  }
  
  if (error.code === 'ECONNABORTED') {
    return Promise.reject(new Error('Request timeout. Please try again.'));
  }
  
  if (error.response?.status >= 500) {
    return Promise.reject(new Error('Server error. Please try again later.'));
  }
  
  const errorMessage = error.response?.data?.error || error.message || 'Something went wrong';
  return Promise.reject(new Error(errorMessage));
};

// Request interceptor - add auth token
const addAuthHeader = (config: any) => {
  const token = localStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
};

// Response interceptor for JSON API (returns data property)
const handleJsonResponse = (response: AxiosResponse) => {
  return response.data;
};

// Response interceptor for Blob API (returns full response for blob access)
const handleBlobResponse = (response: AxiosResponse) => {
  return response; // Return full response so we can access .data for blob
};

// Apply interceptors
api.interceptors.request.use(addAuthHeader);
apiBlob.interceptors.request.use(addAuthHeader);

api.interceptors.response.use(handleJsonResponse, handleApiError);
apiBlob.interceptors.response.use(handleBlobResponse, handleApiError);

// Helper functions for typed API calls
export const apiGet = <T>(url: string, params?: any): Promise<T> => {
  return api.get(url, { params });
};

export const apiPost = <T>(url: string, data?: any): Promise<T> => {
  return api.post(url, data);
};

export const apiPut = <T>(url: string, data?: any): Promise<T> => {
  return api.put(url, data);
};

export const apiDelete = <T>(url: string): Promise<T> => {
  return api.delete(url);
};

export const apiGetBlob = (url: string): Promise<AxiosResponse> => {
  return apiBlob.get(url);
};
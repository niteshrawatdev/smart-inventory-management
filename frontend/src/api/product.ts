import { api } from './axiosConfig';
import type { 
  ApiResponse, 
  PaginatedResponse, 
  Product,
  CreateProductRequest,
  UpdateProductRequest
} from '../types';

export const productApi = {
  getAll: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
  }): Promise<PaginatedResponse<Product>> => {
    return api.get('/products', { params });
  },

  getById: (id: string): Promise<ApiResponse<Product>> => {
    return api.get(`/products/${id}`);
  },

  create: (data: CreateProductRequest): Promise<ApiResponse<Product>> => {
    return api.post('/products', data);
  },

  update: (id: string, data: UpdateProductRequest): Promise<ApiResponse<Product>> => {
    return api.put(`/products/${id}`, data);
  },

  delete: (id: string): Promise<ApiResponse> => {
    return api.delete(`/products/${id}`);
  },

  search: (query: string): Promise<ApiResponse<Product[]>> => {
    return api.get('/products/search', { params: { q: query } });
  },

  getCategories: (): Promise<ApiResponse<Array<{ category: string; _count: { _all: number } }>>> => {
    return api.get('/products/categories');
  },
};
import { api } from './axiosConfig';
import type { 
  ApiResponse, 
  PaginatedResponse, 
  Warehouse,
  CreateWarehouseRequest,
  UpdateWarehouseRequest
} from '../types';

export const warehouseApi = {
  getAll: (params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<PaginatedResponse<Warehouse>> => {
    return api.get('/warehouses', { params });
  },

  getById: (id: string): Promise<ApiResponse<Warehouse>> => {
    return api.get(`/warehouses/${id}`);
  },

  create: (data: CreateWarehouseRequest): Promise<ApiResponse<Warehouse>> => {
    return api.post('/warehouses', data);
  },

  update: (id: string, data: UpdateWarehouseRequest): Promise<ApiResponse<Warehouse>> => {
    return api.put(`/warehouses/${id}`, data);
  },

  delete: (id: string): Promise<ApiResponse> => {
    return api.delete(`/warehouses/${id}`);
  },

  getStats: (id: string): Promise<ApiResponse<any>> => {
    return api.get(`/warehouses/${id}/stats`);
  },
};
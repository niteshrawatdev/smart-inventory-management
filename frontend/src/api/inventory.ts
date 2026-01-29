// src/api/inventory.ts
import { api, apiGetBlob } from './axiosConfig';
import type { 
  ApiResponse, 
  PaginatedResponse, 
  InventoryItem,
  AdjustStockRequest
} from '../types';

export const inventoryApi = {
  getAll: (params?: {
    page?: number;
    limit?: number;
    warehouseId?: string;
    productId?: string;
  }): Promise<PaginatedResponse<InventoryItem>> => {
    return api.get('/inventory', { params });
  },

  getLowStock: (): Promise<ApiResponse<InventoryItem[]>> => {
    return api.get('/inventory/low-stock');
  },

  getOverstock: (): Promise<ApiResponse<InventoryItem[]>> => {
    return api.get('/inventory/overstock');
  },

  adjustStock: (data: AdjustStockRequest): Promise<ApiResponse<any>> => {
    return api.post('/inventory/adjust', data);
  },

  getTrends: (params?: {
    productId?: string;
    warehouseId?: string;
    days?: number;
  }): Promise<ApiResponse<any>> => {
    return api.get('/inventory/trends', { params });
  },

  exportCSV: async (): Promise<Blob> => {
    const response = await apiGetBlob('/inventory/export');
    return response.data; 
  },
};
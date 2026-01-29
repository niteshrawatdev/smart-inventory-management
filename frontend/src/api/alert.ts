import { api } from './axiosConfig';
import type { 
  ApiResponse, 
  PaginatedResponse, 
  Alert,
  ResolveAlertRequest
} from '../types';

export const alertApi = {
  getAll: (params?: {
    page?: number;
    limit?: number;
    resolved?: boolean;
    severity?: string;
    type?: string;
    warehouseId?: string;
  }): Promise<PaginatedResponse<Alert>> => {
    return api.get('/alerts', { params });
  },

  getUnresolved: (): Promise<ApiResponse<Alert[]>> => {
    return api.get('/alerts/unresolved');
  },

  resolve: (id: string, data?: ResolveAlertRequest): Promise<ApiResponse<Alert>> => {
    return api.post(`/alerts/${id}/resolve`, data);
  },

  bulkResolve: (alertIds: string[]): Promise<ApiResponse> => {
    return api.post('/alerts/bulk-resolve', { alertIds });
  },

  getStats: (): Promise<ApiResponse<any>> => {
    return api.get('/alerts/stats');
  },
};
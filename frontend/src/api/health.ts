import { api } from './axiosConfig';
import { ApiResponse } from '../types';

export const healthApi = {
  check: (): Promise<ApiResponse> => {
    return api.get('/health');
  },
};
import { api } from './axiosConfig';
import type { 
  ApiResponse, 
  User, 
  LoginRequest, 
  RegisterRequest, 
  AuthResponse 
} from '../types';

export const authApi = {
  login: (data: LoginRequest): Promise<ApiResponse<AuthResponse>> => {
    return api.post('/auth/login', data);
  },

  register: (data: RegisterRequest): Promise<ApiResponse<AuthResponse>> => {
    return api.post('/auth/register', data);
  },

  logout: (): Promise<ApiResponse> => {
    return api.post('/auth/logout');
  },

  getProfile: (): Promise<ApiResponse<User>> => {
    return api.get('/auth/me');
  },
};
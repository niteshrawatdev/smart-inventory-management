// src/store/auth.store.ts - UPDATED
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi } from '../api/auth';
import type { User, AuthState } from '../types';

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      hasLoadedProfile: false, // Add this flag

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.login({ email, password });
          if (response.success && response.data) {
            const { user, token } = response.data;
            set({ 
              user, 
              token, 
              isAuthenticated: true,
              isLoading: false,
              hasLoadedProfile: true,
            });
            localStorage.setItem('token', token);
          }
        } catch (error: any) {
          set({ 
            error: error.message || 'Login failed',
            isLoading: false,
          });
          throw error;
        }
      },

      register: async (email: string, password: string, fullName?: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.register({ email, password, fullName });
          if (response.success && response.data) {
            const { user, token } = response.data;
            set({ 
              user, 
              token, 
              isAuthenticated: true,
              isLoading: false,
              hasLoadedProfile: true,
            });
            localStorage.setItem('token', token);
          }
        } catch (error: any) {
          set({ 
            error: error.message || 'Registration failed',
            isLoading: false,
          });
          throw error;
        }
      },

      logout: async () => {
        try {
          await authApi.logout();
        } catch (error) {
          // Ignore logout errors
        } finally {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            error: null,
            hasLoadedProfile: true,
          });
          localStorage.removeItem('token');
        }
      },

      loadProfile: async () => {
        // Prevent multiple simultaneous loads
        if (get().isLoading) {
          return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
          set({ 
            isLoading: false, 
            hasLoadedProfile: true,
          });
          return;
        }

        set({ isLoading: true, error: null });
        
        try {
          const response = await authApi.getProfile();
          if (response.success && response.data) {
            set({
              user: response.data,
              token,
              isAuthenticated: true,
              isLoading: false,
              hasLoadedProfile: true,
            });
          } else {
            // Clear invalid token
            localStorage.removeItem('token');
            set({
              user: null,
              token: null,
              isAuthenticated: false,
              isLoading: false,
              hasLoadedProfile: true,
            });
          }
        } catch (error: any) {
          console.error('Profile load error:', error);
          
          // Clear invalid token on auth errors
          if (error.message?.includes('401') || error.message?.includes('token')) {
            localStorage.removeItem('token');
          }
          
          set({ 
            user: null,
            token: null,
            isAuthenticated: false,
            error: error.message || 'Failed to load profile',
            isLoading: false,
            hasLoadedProfile: true,
          });
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
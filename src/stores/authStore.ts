import { create } from 'zustand';
import { User, RoleName } from '../types';
import { authAPI } from '../api/auth';
import { tokenStorage } from '../api/client';
import apiClient from '../api/client';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (phone: string, password: string) => Promise<void>;
  register: (data: {
    phone: string;
    password: string;
    name: string;
    rollNumber: string;
    roomNumber?: string;
    hostelCode: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  clearError: () => void;

  // Role helpers
  hasRole: (role: RoleName) => boolean;
  isApproved: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  login: async (phone: string, password: string) => {
    try {
      set({ isLoading: true, error: null });
      const response = await authAPI.login(phone, password);
      await tokenStorage.setTokens(response.accessToken, response.refreshToken);
      set({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error: any) {
      const message = error.response?.data?.error || 'Login failed. Please try again.';
      set({ error: message, isLoading: false });
      throw new Error(message);
    }
  },

  register: async (data) => {
    try {
      set({ isLoading: true, error: null });
      const response = await authAPI.register(data);
      if (response.accessToken && response.refreshToken) {
        await tokenStorage.setTokens(response.accessToken, response.refreshToken);
      }
      set({
        user: response.user || null,
        isAuthenticated: !!response.accessToken,
        isLoading: false,
      });
    } catch (error: any) {
      const message = error.response?.data?.error || 'Registration failed. Please try again.';
      set({ error: message, isLoading: false });
      throw new Error(message);
    }
  },

  logout: async () => {
    await tokenStorage.clearTokens();
    set({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  },

  loadUser: async () => {
    try {
      const token = await tokenStorage.getAccessToken();
      if (!token) {
        set({ isLoading: false });
        return;
      }

      const response = await apiClient.get('/users/me');
      set({
        user: response.data,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      await tokenStorage.clearTokens();
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  clearError: () => set({ error: null }),

  hasRole: (role: RoleName) => {
    const { user } = get();
    if (!user?.roles) return false;
    return (user.roles as any[]).some((r: any) =>
      typeof r === 'string' ? r === role : r?.name === role
    );
  },

  isApproved: () => {
    const { user } = get();
    return user?.status === 'APPROVED';
  },
}));

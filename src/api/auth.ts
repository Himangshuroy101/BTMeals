import apiClient from './client';
import { AuthResponse } from '../types';

export const authAPI = {
  register: async (data: {
    phone: string;
    password: string;
    name: string;
    rollNumber: string;
    roomNumber?: string;
    hostelCode: string;
  }) => {
    const response = await apiClient.post('/auth/register', data);
    return response.data;
  },

  login: async (phone: string, password: string): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/login', { phone, password });
    return response.data;
  },

  refreshToken: async (refreshToken: string) => {
    const response = await apiClient.post('/auth/refresh', { refreshToken });
    return response.data;
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    const response = await apiClient.put('/auth/change-password', {
      currentPassword,
      newPassword,
    });
    return response.data;
  },

  updateFcmToken: async (fcmToken: string) => {
    const response = await apiClient.put('/auth/fcm-token', { fcmToken });
    return response.data;
  },
};

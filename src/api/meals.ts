import apiClient from './client';
import { DayMealStatus, MealCount, StudentMealInfo } from '../types';

export const mealsAPI = {
  getStatus: async (): Promise<DayMealStatus[]> => {
    const response = await apiClient.get('/meals/status');
    return response.data;
  },

  setPreference: async (data: {
    mealSlotId: string;
    isOn: boolean;
    preference?: string;
    effectiveFrom: string;  // YYYY-MM-DD — "from this date onwards"
  }) => {
    const response = await apiClient.put('/meals/preference', data);
    return response.data;
  },

  setOverride: async (data: {
    mealSlotId: string;
    date: string;
    isOn: boolean;
    preference?: string;
  }) => {
    const response = await apiClient.put('/meals/override', data);
    return response.data;
  },

  getMealCount: async (date: string, slotId: string): Promise<MealCount> => {
    const response = await apiClient.get(`/meals/count/${date}/${slotId}`);
    return response.data;
  },

  getStudentsWithMealOn: async (date: string, slotId: string): Promise<StudentMealInfo[]> => {
    const response = await apiClient.get(`/meals/students/${date}/${slotId}`);
    return response.data;
  },

  getGlobalStatus: async () => {
    const response = await apiClient.get('/meals/global-status');
    return response.data;
  },

  toggleGlobal: async (data: { isMealsEnabled: boolean; reason?: string }) => {
    const response = await apiClient.put('/meals/global-toggle', data);
    return response.data;
  },
};

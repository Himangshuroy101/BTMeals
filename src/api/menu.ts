import apiClient from './client';
import { DayMenu } from '../types';

export const menuAPI = {
  getWeeklyMenu: async (): Promise<DayMenu[]> => {
    const response = await apiClient.get('/menu/weekly');
    return response.data;
  },

  getTodayMenu: async () => {
    const response = await apiClient.get('/menu/today');
    return response.data;
  },

  updateWeeklyMenu: async (menus: Array<{
    mealSlotId: string;
    dayOfWeek: number;
    items: string[];
    menuType: string;
  }>) => {
    const response = await apiClient.put('/menu/weekly', { menus });
    return response.data;
  },
};

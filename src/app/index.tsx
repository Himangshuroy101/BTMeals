import React from 'react';
import { Redirect } from 'expo-router';
import { useAuthStore } from '../stores/authStore';

export default function Index() {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  if (user?.status === 'PENDING') {
    return <Redirect href="/(auth)/pending" />;
  }

  return <Redirect href="/(tabs)" />;
}

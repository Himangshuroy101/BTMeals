import { Stack } from 'expo-router';
import { Colors } from '../../constants/theme';
export default function MessPrefectLayout() {
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.background.primary }, animation: 'slide_from_bottom' }}><Stack.Screen name="assign-managers" /></Stack>;
}

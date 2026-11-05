import { Stack } from 'expo-router';
import { Colors } from '../../constants/theme';
export default function ManagerLayout() {
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.background.primary }, animation: 'slide_from_bottom' }}><Stack.Screen name="menu-editor" /><Stack.Screen name="meal-count" /><Stack.Screen name="attendance" /></Stack>;
}

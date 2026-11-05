import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator, TextInput, RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/theme';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { menuAPI } from '../../api/menu';
import apiClient from '../../api/client';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function MenuEditorScreen() {
  const [slots, setSlots] = useState<any[]>([]);
  const [selectedDay, setSelectedDay] = useState(new Date().getDay());
  const [menuData, setMenuData] = useState<Record<string, { VEG: string[]; NON_VEG: string[] }>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Local input state: slotId -> { VEG: "item1, item2", NON_VEG: "..." }
  const [inputs, setInputs] = useState<Record<string, { VEG: string; NON_VEG: string }>>({});

  const fetchData = async () => {
    try {
      const [weekMenu, slotsRes] = await Promise.all([
        menuAPI.getWeeklyMenu(),
        apiClient.get('/meals/slots'),  // Always fetch real slot UUIDs from DB
      ]);

      const fetchedSlots: { id: string; name: string }[] = slotsRes.data;
      setSlots(fetchedSlots);

      // Build inputs for selected day
      const dayMenu = weekMenu.find((d: any) => d.dayOfWeek === selectedDay);
      const newMenuData: Record<string, { VEG: string[]; NON_VEG: string[] }> = {};
      const newInputs: Record<string, { VEG: string; NON_VEG: string }> = {};

      fetchedSlots.forEach(slot => {
        const vegItems = dayMenu?.meals.find((m: any) => m.slotId === slot.id && m.menuType === 'VEG')?.items as string[] || [];
        const nonVegItems = dayMenu?.meals.find((m: any) => m.slotId === slot.id && m.menuType === 'NON_VEG')?.items as string[] || [];
        newMenuData[slot.id] = { VEG: vegItems, NON_VEG: nonVegItems };
        newInputs[slot.id] = { VEG: vegItems.join(', '), NON_VEG: nonVegItems.join(', ') };
      });

      setMenuData(newMenuData);
      setInputs(newInputs);
    } catch (e) {
      console.error('Menu editor fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [selectedDay]);

  const handleSave = async () => {
    const menus: any[] = [];
    slots.forEach(slot => {
      const vegItems = (inputs[slot.id]?.VEG || '').split(',').map(s => s.trim()).filter(Boolean);
      const nonVegItems = (inputs[slot.id]?.NON_VEG || '').split(',').map(s => s.trim()).filter(Boolean);

      if (vegItems.length > 0) {
        menus.push({ mealSlotId: slot.id, dayOfWeek: selectedDay, items: vegItems, menuType: 'VEG' });
      }
      if (nonVegItems.length > 0) {
        menus.push({ mealSlotId: slot.id, dayOfWeek: selectedDay, items: nonVegItems, menuType: 'NON_VEG' });
      }
    });

    if (menus.length === 0) {
      Alert.alert('Empty Menu', 'Please add at least one menu item');
      return;
    }

    setSaving(true);
    try {
      await menuAPI.updateWeeklyMenu(menus);
      Alert.alert('✅ Saved', `Menu for ${DAY_NAMES[selectedDay]} updated successfully`);
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.error || 'Failed to save menu');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['rgba(212,175,55,0.08)', 'transparent']} style={styles.headerGradient} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.text.primary} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Menu Editor</Text>
          <Text style={styles.headerSub}>Set weekly recurring menu</Text>
        </View>
      </View>

      {/* Day selector */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayScroll}>
        {DAY_SHORT.map((d, i) => (
          <TouchableOpacity
            key={i}
            onPress={() => setSelectedDay(i)}
            style={[styles.dayChip, selectedDay === i && styles.dayChipActive]}
          >
            {selectedDay === i && (
              <LinearGradient colors={['#D4AF37', '#B8932E']} style={StyleSheet.absoluteFillObject} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
            )}
            <Text style={[styles.dayChipText, selectedDay === i && styles.dayChipTextActive]}>{d}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <View style={styles.loader}><ActivityIndicator size="large" color={Colors.primary[500]} /></View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.dayTitle}>{DAY_NAMES[selectedDay]}'s Menu</Text>
          <Text style={styles.hint}>Enter items separated by commas (e.g., "Rice, Dal, Roti")</Text>

          {slots.map((slot) => (
            <Card key={slot.id} variant="default" style={styles.slotCard}>
              <View style={styles.slotHeader}>
                <Ionicons
                  name={slot.name === 'Morning' ? 'sunny-outline' : 'moon-outline'}
                  size={18}
                  color={Colors.primary[500]}
                />
                <Text style={styles.slotTitle}>{slot.name} Meal</Text>
              </View>

              {/* VEG */}
              <View style={styles.typeSection}>
                <View style={styles.typeLabelRow}>
                  <View style={[styles.typeDot, { backgroundColor: Colors.meal.veg }]} />
                  <Text style={[styles.typeLabel, { color: Colors.meal.veg }]}>Vegetarian Items</Text>
                </View>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Rice, Dal, Sabji, Roti"
                  placeholderTextColor={Colors.text.tertiary}
                  value={inputs[slot.id]?.VEG || ''}
                  onChangeText={(v) => setInputs(prev => ({
                    ...prev,
                    [slot.id]: { ...prev[slot.id], VEG: v }
                  }))}
                  multiline
                />
              </View>

              {/* NON-VEG */}
              <View style={styles.typeSection}>
                <View style={styles.typeLabelRow}>
                  <View style={[styles.typeDot, { backgroundColor: Colors.meal.nonVeg }]} />
                  <Text style={[styles.typeLabel, { color: Colors.meal.nonVeg }]}>Non-Veg Items</Text>
                </View>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Chicken Curry, Egg Bhurji"
                  placeholderTextColor={Colors.text.tertiary}
                  value={inputs[slot.id]?.NON_VEG || ''}
                  onChangeText={(v) => setInputs(prev => ({
                    ...prev,
                    [slot.id]: { ...prev[slot.id], NON_VEG: v }
                  }))}
                  multiline
                />
              </View>
            </Card>
          ))}

          <View style={{ height: 100 }} />
        </ScrollView>
      )}

      {/* Save button */}
      <View style={styles.bottomBar}>
        <Button title={`Save Menu for ${DAY_NAMES[selectedDay]}`} onPress={handleSave} loading={saving} fullWidth size="lg" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.primary },
  headerGradient: { position: 'absolute', top: 0, left: 0, right: 0, height: 200 },
  header: { flexDirection: 'row', alignItems: 'center', padding: Spacing['2xl'], paddingTop: Spacing['4xl'] },
  backBtn: { marginRight: Spacing.lg, width: 40, height: 40, borderRadius: BorderRadius.md, backgroundColor: Colors.background.secondary, borderWidth: 1, borderColor: Colors.border.default, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: Typography.size.xl, fontWeight: Typography.weight.bold, color: Colors.text.primary },
  headerSub: { fontSize: Typography.size.sm, color: Colors.text.secondary },
  dayScroll: { paddingHorizontal: Spacing['2xl'], paddingBottom: Spacing.md, gap: Spacing.sm },
  dayChip: { width: 52, height: 52, borderRadius: BorderRadius.lg, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background.secondary, borderWidth: 1, borderColor: Colors.border.default, overflow: 'hidden' },
  dayChipActive: { borderColor: Colors.primary[500] },
  dayChipText: { fontSize: Typography.size.sm, fontWeight: Typography.weight.semibold, color: Colors.text.tertiary },
  dayChipTextActive: { color: Colors.text.inverse },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { paddingHorizontal: Spacing['2xl'] },
  dayTitle: { fontSize: Typography.size.lg, fontWeight: Typography.weight.bold, color: Colors.text.primary, marginBottom: 4 },
  hint: { fontSize: Typography.size.xs, color: Colors.text.tertiary, marginBottom: Spacing.lg },
  slotCard: { marginBottom: Spacing.md },
  slotHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.lg },
  slotTitle: { fontSize: Typography.size.base, fontWeight: Typography.weight.semibold, color: Colors.text.primary, marginLeft: Spacing.sm },
  typeSection: { marginBottom: Spacing.md },
  typeLabelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
  typeDot: { width: 8, height: 8, borderRadius: 4, marginRight: Spacing.sm },
  typeLabel: { fontSize: Typography.size.sm, fontWeight: Typography.weight.semibold },
  textInput: { backgroundColor: Colors.background.input, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.border.default, padding: Spacing.md, fontSize: Typography.size.base, color: Colors.text.primary, minHeight: 60 },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: Spacing['2xl'], backgroundColor: Colors.background.primary, borderTopWidth: 1, borderTopColor: Colors.border.default },
});

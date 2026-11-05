import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Switch, Alert, RefreshControl, TextInput, Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/theme';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { mealsAPI } from '../../api/meals';
import apiClient from '../../api/client';

interface Holiday {
  id: string;
  startDate: string;
  endDate: string;
  reason?: string;
  mealsDisabled: boolean;
  creator: { name: string };
}

export default function HolidaysScreen() {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [globalStatus, setGlobalStatus] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState({ startDate: '', endDate: '', reason: '', mealsDisabled: true });
  const [toggling, setToggling] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetch = async () => {
    try {
      const [holidaysRes, statusRes] = await Promise.all([
        apiClient.get('/holidays'),
        mealsAPI.getGlobalStatus(),
      ]);
      setHolidays(holidaysRes.data);
      setGlobalStatus(statusRes);
    } catch (e) {} finally {
      setRefreshing(false);
    }
  };

  useEffect(() => { fetch(); }, []);

  const handleGlobalToggle = async (value: boolean) => {
    Alert.alert(
      value ? 'Enable Meals' : 'Disable Meals',
      value ? 'Enable meals for all students?' : 'This will disable meals for all students globally.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setToggling(true);
            try {
              await mealsAPI.toggleGlobal({ isMealsEnabled: value, reason: value ? 'Meals re-enabled' : 'Meals temporarily disabled' });
              await fetch();
            } catch (e: any) {
              Alert.alert('Error', e?.response?.data?.error || 'Failed to toggle');
            } finally {
              setToggling(false);
            }
          },
        },
      ]
    );
  };

  const handleAddHoliday = async () => {
    if (!form.startDate || !form.endDate) {
      Alert.alert('Error', 'Start and end dates are required (YYYY-MM-DD)');
      return;
    }
    setSaving(true);
    try {
      await apiClient.post('/holidays', form);
      setShowAddModal(false);
      setForm({ startDate: '', endDate: '', reason: '', mealsDisabled: true });
      await fetch();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.error || 'Failed to create holiday');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete Holiday', 'Remove this holiday?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiClient.delete(`/holidays/${id}`);
            setHolidays(prev => prev.filter(h => h.id !== id));
          } catch (e: any) {
            Alert.alert('Error', 'Failed to delete holiday');
          }
        },
      },
    ]);
  };

  const isMealsEnabled = globalStatus?.isMealsEnabled ?? true;

  return (
    <View style={styles.container}>
      <LinearGradient colors={['rgba(212,175,55,0.08)', 'transparent']} style={styles.headerGradient} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Holidays & Meal Control</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetch(); }} tintColor={Colors.primary[500]} colors={[Colors.primary[500]]} />}
      >
        {/* Global Meal Toggle */}
        <Card variant={isMealsEnabled ? 'gold' : 'default'} style={styles.globalCard}>
          <View style={styles.toggleRow}>
            <View style={styles.toggleLeft}>
              <Ionicons
                name={isMealsEnabled ? 'restaurant' : 'restaurant-outline'}
                size={28}
                color={isMealsEnabled ? Colors.primary[500] : Colors.error.main}
              />
              <View style={{ marginLeft: Spacing.md }}>
                <Text style={styles.toggleTitle}>Global Meal Status</Text>
                <Text style={[styles.toggleStatus, { color: isMealsEnabled ? Colors.success.main : Colors.error.main }]}>
                  {isMealsEnabled ? '● Meals Enabled' : '● Meals Disabled'}
                </Text>
              </View>
            </View>
            {toggling ? (
              <View style={styles.smallLoader} />
            ) : (
              <Switch
                value={isMealsEnabled}
                onValueChange={handleGlobalToggle}
                trackColor={{ false: Colors.error.dark, true: Colors.primary[700] }}
                thumbColor={isMealsEnabled ? Colors.primary[500] : Colors.error.main}
              />
            )}
          </View>
          {globalStatus?.reason && (
            <Text style={styles.toggleReason}>{globalStatus.reason}</Text>
          )}
        </Card>

        {/* Holidays Section */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Holiday Periods</Text>
          <Button
            title="Add Holiday"
            onPress={() => setShowAddModal(true)}
            variant="outline"
            size="sm"
            icon={<Ionicons name="add" size={16} color={Colors.primary[500]} />}
          />
        </View>

        {holidays.length === 0 ? (
          <Card variant="glass" style={styles.emptyCard}>
            <Ionicons name="calendar-outline" size={36} color={Colors.text.tertiary} />
            <Text style={styles.emptyText}>No holidays scheduled</Text>
          </Card>
        ) : (
          holidays.map((h) => (
            <Card key={h.id} variant="default" style={styles.holidayCard}>
              <View style={styles.holidayRow}>
                <View style={styles.holidayDateBlock}>
                  <Ionicons name="calendar-outline" size={18} color={Colors.primary[500]} />
                  <Text style={styles.holidayDate}>
                    {new Date(h.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    {' – '}
                    {new Date(h.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => handleDelete(h.id)}>
                  <Ionicons name="trash-outline" size={20} color={Colors.error.main} />
                </TouchableOpacity>
              </View>
              {h.reason && <Text style={styles.holidayReason}>{h.reason}</Text>}
              <View style={[styles.holidayMealBadge, { backgroundColor: h.mealsDisabled ? Colors.error.bg : Colors.success.bg }]}>
                <Text style={{ fontSize: Typography.size.xs, color: h.mealsDisabled ? Colors.error.main : Colors.success.main, fontWeight: Typography.weight.semibold }}>
                  {h.mealsDisabled ? 'Meals Disabled' : 'Meals Active'}
                </Text>
              </View>
            </Card>
          ))
        )}
      </ScrollView>

      {/* Add Holiday Modal */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Add Holiday</Text>
            <Input label="Start Date" placeholder="YYYY-MM-DD" leftIcon="calendar-outline" value={form.startDate} onChangeText={v => setForm(p => ({ ...p, startDate: v }))} />
            <Input label="End Date" placeholder="YYYY-MM-DD" leftIcon="calendar-outline" value={form.endDate} onChangeText={v => setForm(p => ({ ...p, endDate: v }))} />
            <Input label="Reason (Optional)" placeholder="e.g. Diwali vacation" leftIcon="document-text-outline" value={form.reason} onChangeText={v => setForm(p => ({ ...p, reason: v }))} />
            <View style={styles.mealsToggleRow}>
              <Text style={styles.mealsToggleLabel}>Disable meals during holiday</Text>
              <Switch value={form.mealsDisabled} onValueChange={v => setForm(p => ({ ...p, mealsDisabled: v }))} trackColor={{ false: Colors.border.default, true: Colors.primary[700] }} thumbColor={form.mealsDisabled ? Colors.primary[500] : Colors.text.tertiary} />
            </View>
            <View style={styles.modalActions}>
              <Button title="Cancel" onPress={() => setShowAddModal(false)} variant="ghost" style={{ flex: 1, marginRight: Spacing.sm }} />
              <Button title="Create" onPress={handleAddHoliday} loading={saving} style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.primary },
  headerGradient: { position: 'absolute', top: 0, left: 0, right: 0, height: 200 },
  header: { flexDirection: 'row', alignItems: 'center', padding: Spacing['2xl'], paddingTop: Spacing['4xl'] },
  backBtn: { marginRight: Spacing.lg, width: 40, height: 40, borderRadius: BorderRadius.md, backgroundColor: Colors.background.secondary, borderWidth: 1, borderColor: Colors.border.default, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: Typography.size.xl, fontWeight: Typography.weight.bold, color: Colors.text.primary },
  scroll: { paddingHorizontal: Spacing['2xl'], paddingBottom: Spacing['3xl'] },
  globalCard: { marginBottom: Spacing['2xl'] },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  toggleLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  toggleTitle: { fontSize: Typography.size.base, fontWeight: Typography.weight.semibold, color: Colors.text.primary },
  toggleStatus: { fontSize: Typography.size.sm, marginTop: 2, fontWeight: Typography.weight.medium },
  toggleReason: { fontSize: Typography.size.xs, color: Colors.text.tertiary, marginTop: Spacing.sm },
  smallLoader: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: Colors.primary[500], borderTopColor: 'transparent' },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  sectionTitle: { fontSize: Typography.size.md, fontWeight: Typography.weight.semibold, color: Colors.text.primary },
  emptyCard: { alignItems: 'center', padding: Spacing['2xl'] },
  emptyText: { fontSize: Typography.size.sm, color: Colors.text.tertiary, marginTop: Spacing.md },
  holidayCard: { marginBottom: Spacing.md },
  holidayRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  holidayDateBlock: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  holidayDate: { fontSize: Typography.size.base, fontWeight: Typography.weight.semibold, color: Colors.text.primary },
  holidayReason: { fontSize: Typography.size.sm, color: Colors.text.secondary, marginBottom: Spacing.sm },
  holidayMealBadge: { alignSelf: 'flex-start', borderRadius: BorderRadius.full, paddingHorizontal: Spacing.sm, paddingVertical: 3 },
  modalOverlay: { flex: 1, backgroundColor: Colors.surface.overlay, justifyContent: 'flex-end' },
  modal: { backgroundColor: Colors.background.elevated, borderTopLeftRadius: BorderRadius['2xl'], borderTopRightRadius: BorderRadius['2xl'], padding: Spacing['2xl'], paddingBottom: Spacing['4xl'] },
  modalTitle: { fontSize: Typography.size.xl, fontWeight: Typography.weight.bold, color: Colors.text.primary, marginBottom: Spacing.xl },
  mealsToggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xl },
  mealsToggleLabel: { fontSize: Typography.size.base, color: Colors.text.secondary, flex: 1 },
  modalActions: { flexDirection: 'row' },
});

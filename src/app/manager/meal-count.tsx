import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/theme';
import { Card } from '../../components/ui/Card';
import { mealsAPI } from '../../api/meals';

const TODAY = new Date().toISOString().split('T')[0];

export default function MealCountScreen() {
  const [slots, setSlots] = useState<any[]>([]);
  const [counts, setCounts] = useState<Record<string, any>>({});
  const [students, setStudents] = useState<Record<string, any[]>>({});
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCounts = async (slotList: any[]) => {
    const countData: Record<string, any> = {};
    const studentData: Record<string, any[]> = {};

    await Promise.all(
      slotList.map(async (slot) => {
        try {
          const [count, studentList] = await Promise.all([
            mealsAPI.getMealCount(TODAY, slot.id),
            mealsAPI.getStudentsWithMealOn(TODAY, slot.id),
          ]);
          countData[slot.id] = count;
          studentData[slot.id] = studentList;
        } catch (e) {
          countData[slot.id] = { totalOn: 0, vegCount: 0, nonVegCount: 0 };
          studentData[slot.id] = [];
        }
      })
    );

    setCounts(countData);
    setStudents(studentData);
  };

  const fetchData = async () => {
    // We need to get slots from the meal status API
    try {
      const status = await mealsAPI.getStatus();
      const slotList = status[0]?.slots?.map((s: any) => ({ id: s.slotId, name: s.slotName })) || [];
      setSlots(slotList);
      if (slotList.length > 0) setSelectedSlot(slotList[0].id);
      await fetchCounts(slotList);
    } catch (e) {} finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const currentCount = selectedSlot ? counts[selectedSlot] : null;
  const currentStudents = selectedSlot ? students[selectedSlot] || [] : [];
  const selectedSlotName = slots.find(s => s.id === selectedSlot)?.name || '';

  return (
    <View style={styles.container}>
      <LinearGradient colors={['rgba(212,175,55,0.08)', 'transparent']} style={styles.headerGradient} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.text.primary} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Meal Count</Text>
          <Text style={styles.headerSub}>{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
        </View>
      </View>

      {/* Slot Tabs */}
      <View style={styles.slotTabs}>
        {slots.map((slot) => (
          <TouchableOpacity
            key={slot.id}
            onPress={() => setSelectedSlot(slot.id)}
            style={[styles.slotTab, selectedSlot === slot.id && styles.slotTabActive]}
          >
            <Ionicons
              name={slot.name === 'Morning' ? 'sunny-outline' : 'moon-outline'}
              size={16}
              color={selectedSlot === slot.id ? Colors.primary[500] : Colors.text.tertiary}
            />
            <Text style={[styles.slotTabText, selectedSlot === slot.id && styles.slotTabTextActive]}>
              {slot.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.loader}><ActivityIndicator size="large" color={Colors.primary[500]} /></View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor={Colors.primary[500]} colors={[Colors.primary[500]]} />}
        >
          {/* Count Summary */}
          <View style={styles.countRow}>
            <CountCard
              value={currentCount?.totalOn || 0}
              label="Total"
              icon="people-outline"
              color={Colors.primary[500]}
            />
            <CountCard
              value={currentCount?.vegCount || 0}
              label="Veg"
              icon="leaf-outline"
              color={Colors.meal.veg}
            />
            <CountCard
              value={currentCount?.nonVegCount || 0}
              label="Non-Veg"
              icon="fish-outline"
              color={Colors.meal.nonVeg}
            />
          </View>

          {/* Student List */}
          <Text style={styles.listTitle}>
            Students with {selectedSlotName} meal ON ({currentStudents.length})
          </Text>

          {currentStudents.length === 0 ? (
            <Card variant="glass" style={styles.emptyCard}>
              <Ionicons name="moon-outline" size={32} color={Colors.text.tertiary} />
              <Text style={styles.emptyText}>No students have {selectedSlotName} meal ON</Text>
            </Card>
          ) : (
            currentStudents.map((student, idx) => (
              <Card key={student.id} variant="default" style={styles.studentCard}>
                <View style={styles.studentRow}>
                  <View style={styles.studentNum}>
                    <Text style={styles.studentNumText}>{idx + 1}</Text>
                  </View>
                  <View style={styles.studentInfo}>
                    <Text style={styles.studentName}>{student.name}</Text>
                    <Text style={styles.studentDetail}>
                      {student.rollNumber}{student.roomNumber ? ` • Room ${student.roomNumber}` : ''}
                    </Text>
                  </View>
                  <View style={[
                    styles.prefBadge,
                    { backgroundColor: student.preference === 'VEG' ? Colors.meal.vegBg : Colors.meal.nonVegBg }
                  ]}>
                    <Text style={[
                      styles.prefText,
                      { color: student.preference === 'VEG' ? Colors.meal.veg : Colors.meal.nonVeg }
                    ]}>
                      {student.preference === 'VEG' ? 'Veg' : 'Non-Veg'}
                    </Text>
                  </View>
                </View>
              </Card>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

function CountCard({ value, label, icon, color }: { value: number; label: string; icon: any; color: string }) {
  return (
    <View style={[styles.countCard, { borderColor: `${color}30` }]}>
      <LinearGradient colors={[`${color}15`, `${color}05`]} style={StyleSheet.absoluteFillObject} />
      <Ionicons name={icon} size={22} color={color} />
      <Text style={[styles.countValue, { color }]}>{value}</Text>
      <Text style={styles.countLabel}>{label}</Text>
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
  slotTabs: { flexDirection: 'row', paddingHorizontal: Spacing['2xl'], gap: Spacing.md, marginBottom: Spacing.lg },
  slotTab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.md, borderRadius: BorderRadius.lg, backgroundColor: Colors.background.secondary, borderWidth: 1, borderColor: Colors.border.default, gap: Spacing.sm },
  slotTabActive: { borderColor: Colors.primary[500], backgroundColor: Colors.surface.glassHighlight },
  slotTabText: { fontSize: Typography.size.sm, fontWeight: Typography.weight.semibold, color: Colors.text.tertiary },
  slotTabTextActive: { color: Colors.primary[500] },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { paddingHorizontal: Spacing['2xl'], paddingBottom: Spacing['3xl'] },
  countRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing['2xl'] },
  countCard: { flex: 1, borderRadius: BorderRadius.xl, borderWidth: 1, padding: Spacing.lg, alignItems: 'center', overflow: 'hidden', backgroundColor: Colors.background.secondary },
  countValue: { fontSize: Typography.size['2xl'], fontWeight: Typography.weight.extrabold, marginVertical: 4 },
  countLabel: { fontSize: Typography.size.xs, color: Colors.text.tertiary, fontWeight: Typography.weight.medium },
  listTitle: { fontSize: Typography.size.sm, fontWeight: Typography.weight.semibold, color: Colors.text.secondary, marginBottom: Spacing.md, textTransform: 'uppercase', letterSpacing: 0.4 },
  emptyCard: { alignItems: 'center', padding: Spacing['2xl'] },
  emptyText: { fontSize: Typography.size.sm, color: Colors.text.tertiary, marginTop: Spacing.md, textAlign: 'center' },
  studentCard: { marginBottom: Spacing.sm },
  studentRow: { flexDirection: 'row', alignItems: 'center' },
  studentNum: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.background.tertiary, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  studentNumText: { fontSize: Typography.size.xs, fontWeight: Typography.weight.bold, color: Colors.text.tertiary },
  studentInfo: { flex: 1 },
  studentName: { fontSize: Typography.size.base, fontWeight: Typography.weight.semibold, color: Colors.text.primary },
  studentDetail: { fontSize: Typography.size.sm, color: Colors.text.secondary },
  prefBadge: { borderRadius: BorderRadius.full, paddingHorizontal: Spacing.sm, paddingVertical: 3 },
  prefText: { fontSize: Typography.size.xs, fontWeight: Typography.weight.semibold },
});

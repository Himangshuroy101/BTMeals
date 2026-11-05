import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator, RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/theme';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { mealsAPI } from '../../api/meals';
import apiClient from '../../api/client';

const TODAY = new Date().toISOString().split('T')[0];

export default function AttendanceScreen() {
  const [slots, setSlots] = useState<any[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const status = await mealsAPI.getStatus();
      const slotList = status[0]?.slots?.map((s: any) => ({ id: s.slotId, name: s.slotName })) || [];
      setSlots(slotList);
      const firstSlot = slotList[0]?.id || null;
      setSelectedSlot(firstSlot);
      if (firstSlot) await fetchStudents(firstSlot);
    } catch (e) {} finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchStudents = async (slotId: string) => {
    try {
      const [list, existingRes] = await Promise.all([
        mealsAPI.getStudentsWithMealOn(TODAY, slotId),
        apiClient.get(`/attendance/${TODAY}/${slotId}`).catch(() => ({ data: [] })),
      ]);
      setStudents(list);

      const existingRecords: any[] = existingRes.data || [];
      const existingMap: Record<string, boolean> = {};
      existingRecords.forEach(r => {
        existingMap[r.userId] = r.wasPresent;
      });

      // Pre-fill from existing records if available; otherwise default to present (true)
      const initAttendance: Record<string, boolean> = {};
      list.forEach((s: any) => {
        initAttendance[s.id] = existingMap[s.id] !== undefined ? existingMap[s.id] : true;
      });
      setAttendance(initAttendance);
    } catch (e) {}
  };

  useEffect(() => { fetchData(); }, []);

  const handleSlotChange = async (slotId: string) => {
    setSelectedSlot(slotId);
    setLoading(true);
    await fetchStudents(slotId);
    setLoading(false);
  };

  const toggleAttendance = (userId: string) => {
    setAttendance(prev => ({ ...prev, [userId]: !prev[userId] }));
  };

  const markAll = (value: boolean) => {
    const newAtt: Record<string, boolean> = {};
    students.forEach(s => { newAtt[s.id] = value; });
    setAttendance(newAtt);
  };

  const handleSave = async () => {
    if (!selectedSlot || students.length === 0) {
      Alert.alert('No students', 'No students have meal ON for this slot');
      return;
    }

    setSaving(true);
    try {
      const attendanceRecords = students.map(s => ({
        userId: s.id,
        wasPresent: attendance[s.id] ?? true,
        preferenceUsed: s.preference || 'VEG',
      }));

      await apiClient.post('/attendance/mark', {
        mealSlotId: selectedSlot,
        date: TODAY,
        attendance: attendanceRecords,
      });

      const presentCount = attendanceRecords.filter(r => r.wasPresent).length;
      Alert.alert('✅ Saved', `Attendance marked: ${presentCount}/${students.length} present`);
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.error || 'Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  const presentCount = Object.values(attendance).filter(Boolean).length;
  const selectedSlotName = slots.find(s => s.id === selectedSlot)?.name || '';

  return (
    <View style={styles.container}>
      <LinearGradient colors={['rgba(212,175,55,0.08)', 'transparent']} style={styles.headerGradient} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.text.primary} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Mark Attendance</Text>
          <Text style={styles.headerSub}>{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
        </View>
      </View>

      {/* Slot selector */}
      <View style={styles.slotTabs}>
        {slots.map(slot => (
          <TouchableOpacity
            key={slot.id}
            onPress={() => handleSlotChange(slot.id)}
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

      {/* Summary bar */}
      <View style={styles.summaryBar}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{students.length}</Text>
          <Text style={styles.summaryLabel}>Expected</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: Colors.success.main }]}>{presentCount}</Text>
          <Text style={styles.summaryLabel}>Present</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: Colors.error.main }]}>{students.length - presentCount}</Text>
          <Text style={styles.summaryLabel}>Absent</Text>
        </View>
        <View style={styles.bulkActions}>
          <TouchableOpacity onPress={() => markAll(true)} style={[styles.bulkBtn, styles.bulkBtnPresent]}>
            <Text style={styles.bulkBtnText}>All Present</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => markAll(false)} style={[styles.bulkBtn, styles.bulkBtnAbsent]}>
            <Text style={[styles.bulkBtnText, { color: Colors.error.main }]}>All Absent</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.loader}><ActivityIndicator size="large" color={Colors.primary[500]} /></View>
      ) : students.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="moon-outline" size={52} color={Colors.text.tertiary} />
          <Text style={styles.emptyTitle}>No students</Text>
          <Text style={styles.emptySub}>No students have {selectedSlotName} meal ON today</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {students.map((student, idx) => {
            const isPresent = attendance[student.id] ?? true;
            return (
              <TouchableOpacity key={student.id} onPress={() => toggleAttendance(student.id)} activeOpacity={0.7}>
                <Card variant="default" style={[styles.studentCard, isPresent && styles.studentCardPresent]}>
                  <View style={styles.studentRow}>
                    {/* Serial number */}
                    <Text style={styles.serialNum}>{idx + 1}</Text>

                    {/* Checkbox */}
                    <View style={[styles.checkbox, isPresent && styles.checkboxChecked]}>
                      {isPresent && <Ionicons name="checkmark" size={14} color={Colors.text.inverse} />}
                    </View>

                    {/* Info */}
                    <View style={styles.studentInfo}>
                      <Text style={styles.studentName}>{student.name}</Text>
                      <Text style={styles.studentDetail}>
                        {student.rollNumber}{student.roomNumber ? ` • Room ${student.roomNumber}` : ''}
                      </Text>
                    </View>

                    {/* Status */}
                    <View style={[
                      styles.statusBadge,
                      { backgroundColor: isPresent ? Colors.success.bg : Colors.error.bg }
                    ]}>
                      <Text style={{ fontSize: Typography.size.xs, color: isPresent ? Colors.success.main : Colors.error.main, fontWeight: Typography.weight.semibold }}>
                        {isPresent ? 'Present' : 'Absent'}
                      </Text>
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>
            );
          })}
          <View style={{ height: 100 }} />
        </ScrollView>
      )}

      {/* Save button */}
      {students.length > 0 && (
        <View style={styles.bottomBar}>
          <Button
            title={`Submit Attendance (${presentCount}/${students.length} Present)`}
            onPress={handleSave}
            loading={saving}
            fullWidth
            size="lg"
          />
        </View>
      )}
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
  slotTabs: { flexDirection: 'row', paddingHorizontal: Spacing['2xl'], gap: Spacing.md, marginBottom: Spacing.md },
  slotTab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.md, borderRadius: BorderRadius.lg, backgroundColor: Colors.background.secondary, borderWidth: 1, borderColor: Colors.border.default, gap: Spacing.sm },
  slotTabActive: { borderColor: Colors.primary[500], backgroundColor: Colors.surface.glassHighlight },
  slotTabText: { fontSize: Typography.size.sm, fontWeight: Typography.weight.semibold, color: Colors.text.tertiary },
  slotTabTextActive: { color: Colors.primary[500] },
  summaryBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.background.secondary, marginHorizontal: Spacing['2xl'], borderRadius: BorderRadius.xl, padding: Spacing.md, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border.default },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryValue: { fontSize: Typography.size.xl, fontWeight: Typography.weight.bold, color: Colors.text.primary },
  summaryLabel: { fontSize: Typography.size.xs, color: Colors.text.tertiary, marginTop: 2 },
  summaryDivider: { width: 1, height: 32, backgroundColor: Colors.border.default, marginHorizontal: Spacing.sm },
  bulkActions: { flex: 1.5, gap: 4 },
  bulkBtn: { borderRadius: BorderRadius.sm, paddingVertical: 4, paddingHorizontal: Spacing.sm, alignItems: 'center' },
  bulkBtnPresent: { backgroundColor: Colors.success.bg },
  bulkBtnAbsent: { backgroundColor: Colors.error.bg },
  bulkBtnText: { fontSize: Typography.size.xs, fontWeight: Typography.weight.semibold, color: Colors.success.main },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyState: { flex: 1, alignItems: 'center', paddingTop: 80 },
  emptyTitle: { fontSize: Typography.size.xl, fontWeight: Typography.weight.bold, color: Colors.text.primary, marginTop: Spacing.lg },
  emptySub: { fontSize: Typography.size.base, color: Colors.text.secondary, textAlign: 'center', marginTop: Spacing.xs, paddingHorizontal: Spacing['2xl'] },
  scroll: { paddingHorizontal: Spacing['2xl'] },
  studentCard: { marginBottom: Spacing.sm },
  studentCardPresent: { borderColor: Colors.meal.on },
  studentRow: { flexDirection: 'row', alignItems: 'center' },
  serialNum: { width: 24, fontSize: Typography.size.xs, color: Colors.text.tertiary, textAlign: 'center', marginRight: Spacing.sm },
  checkbox: { width: 26, height: 26, borderRadius: 6, borderWidth: 2, borderColor: Colors.border.strong, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  checkboxChecked: { backgroundColor: Colors.success.main, borderColor: Colors.success.main },
  studentInfo: { flex: 1 },
  studentName: { fontSize: Typography.size.base, fontWeight: Typography.weight.semibold, color: Colors.text.primary },
  studentDetail: { fontSize: Typography.size.sm, color: Colors.text.secondary },
  statusBadge: { borderRadius: BorderRadius.full, paddingHorizontal: Spacing.sm, paddingVertical: 3 },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: Spacing['2xl'], backgroundColor: Colors.background.primary, borderTopWidth: 1, borderTopColor: Colors.border.default },
});

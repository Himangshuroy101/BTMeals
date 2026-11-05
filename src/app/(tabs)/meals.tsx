import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/theme';
import { mealsAPI } from '../../api/meals';
import { DayMealStatus, MealSlotStatus } from '../../types';
import { Card } from '../../components/ui/Card';

const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** Check if the cutoff time has already passed today (local time) */
function isCutoffPassed(cutoffTime: string): boolean {
  const [h, m] = cutoffTime.split(':').map(Number);
  const now = new Date();
  return now.getHours() > h || (now.getHours() === h && now.getMinutes() >= m);
}

export default function MealsScreen() {
  const [weekStatus, setWeekStatus] = useState<DayMealStatus[]>([]);
  const [selectedDayIdx, setSelectedDayIdx] = useState(0); // 0 = today
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      const data = await mealsAPI.getStatus();
      setWeekStatus(data);
    } catch (e) {
      Alert.alert('Error', 'Failed to load meal status');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchStatus(); }, []);

  const selectedDay = weekStatus[selectedDayIdx];
  const isToday = selectedDayIdx === 0;

  const handleToggle = async (slot: MealSlotStatus, newValue: boolean) => {
    if (!selectedDay) return;
    setToggling(slot.slotId);
    try {
      // Both today and future dates use setPreference with effectiveFrom.
      // "From this date onwards, my meal is ON/OFF" — persists until changed again.
      let effectiveDate: string;
      if (isToday) {
        // Compute today's date CLIENT-SIDE to avoid server UTC/IST timezone mismatch
        const now = new Date();
        effectiveDate = [
          now.getFullYear(),
          String(now.getMonth() + 1).padStart(2, '0'),
          String(now.getDate()).padStart(2, '0'),
        ].join('-');
      } else {
        effectiveDate = selectedDay.date;
      }

      await mealsAPI.setPreference({
        mealSlotId: slot.slotId,
        isOn: newValue,
        preference: slot.preference || 'VEG',
        effectiveFrom: effectiveDate,
      });
      await fetchStatus();
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || 'Failed to update meal';
      console.error('[handleToggle] error:', err?.response?.status, msg);
      Alert.alert('Update Failed', msg);
    } finally {
      setToggling(null);
    }
  };

  const handlePreferenceChange = async (slot: MealSlotStatus, pref: 'VEG' | 'NON_VEG') => {
    setToggling(slot.slotId + '_pref');
    try {
      // Use same effectiveFrom logic for preference changes
      let effectiveDate: string;
      if (isToday) {
        const now = new Date();
        effectiveDate = [
          now.getFullYear(),
          String(now.getMonth() + 1).padStart(2, '0'),
          String(now.getDate()).padStart(2, '0'),
        ].join('-');
      } else {
        effectiveDate = selectedDay.date;
      }

      await mealsAPI.setPreference({
        mealSlotId: slot.slotId,
        isOn: slot.isOn,
        preference: pref,
        effectiveFrom: effectiveDate,
      });
      await fetchStatus();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error || 'Failed to update preference');
    } finally {
      setToggling(null);
    }
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={Colors.primary[500]} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(212,175,55,0.08)', 'transparent']}
        style={styles.headerGradient}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchStatus(); }}
            tintColor={Colors.primary[500]} colors={[Colors.primary[500]]} />
        }
      >
        {/* Page Header */}
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Meal Control</Text>
          <Text style={styles.pageSubtitle}>Manage your daily meal preferences</Text>
        </View>

        {/* Week Selector */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.weekScroll}
        >
          {weekStatus.map((day, idx) => {
            const date = new Date(day.date);
            const dayName = WEEK_DAYS[date.getDay()];
            const dayNum = date.getDate();
            const isSelected = idx === selectedDayIdx;
            const hasMealOn = day.slots?.some(s => s.isOn);

            return (
              <TouchableOpacity
                key={day.date}
                onPress={() => setSelectedDayIdx(idx)}
                style={[styles.dayPill, isSelected && styles.dayPillSelected]}
                activeOpacity={0.7}
              >
                {isSelected && (
                  <LinearGradient
                    colors={['#D4AF37', '#B8932E']}
                    style={StyleSheet.absoluteFillObject}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  />
                )}
                <Text style={[styles.dayPillName, isSelected && styles.dayPillNameSelected]}>
                  {idx === 0 ? 'Today' : dayName}
                </Text>
                <Text style={[styles.dayPillNum, isSelected && styles.dayPillNumSelected]}>
                  {dayNum}
                </Text>
                {hasMealOn && !day.globalDisabled && !day.holiday && (
                  <View style={[
                    styles.dayDot,
                    { backgroundColor: isSelected ? Colors.text.inverse : Colors.meal.on }
                  ]} />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Selected Day Content */}
        <View style={styles.content}>
          {selectedDay?.globalDisabled ? (
            <Card variant="default" style={styles.statusCard}>
              <Ionicons name="close-circle" size={36} color={Colors.error.main} />
              <Text style={styles.statusTitle}>Meals Globally Disabled</Text>
              <Text style={styles.statusSub}>{selectedDay.reason}</Text>
            </Card>
          ) : selectedDay?.holiday ? (
            <Card variant="default" style={styles.statusCard}>
              <Ionicons name="umbrella-outline" size={36} color={Colors.warning.main} />
              <Text style={styles.statusTitle}>Holiday</Text>
              <Text style={styles.statusSub}>{selectedDay.reason || 'No meals on holidays'}</Text>
            </Card>
          ) : (
            selectedDay?.slots?.map((slot) => (
              <Card key={slot.slotId} variant="default" style={styles.slotCard}>
                {/* Slot header */}
                <View style={styles.slotHeader}>
                  <View style={styles.slotTitleRow}>
                    <Ionicons
                      name={slot.slotName === 'Morning' ? 'sunny' : 'moon'}
                      size={22}
                      color={slot.isOn ? Colors.primary[500] : Colors.text.tertiary}
                    />
                    <View style={{ marginLeft: Spacing.md }}>
                      <Text style={styles.slotTitle}>{slot.slotName} Meal</Text>
                      <Text style={styles.slotCutoff}>
                        Cutoff: {slot.cutoffTime === '07:00' ? '7:00 AM' : '5:00 PM'}
                      </Text>
                    </View>
                  </View>

                  {/* Toggle */}
                  {toggling === slot.slotId ? (
                    <ActivityIndicator size="small" color={Colors.primary[500]} />
                  ) : isToday && isCutoffPassed(slot.cutoffTime) ? (
                    <View style={styles.cutoffBadge}>
                      <Ionicons name="lock-closed" size={12} color={Colors.warning.main} />
                      <Text style={styles.cutoffBadgeText}>Locked</Text>
                    </View>
                  ) : (
                    <Switch
                      value={slot.isOn}
                      onValueChange={(val) => handleToggle(slot, val)}
                      trackColor={{
                        false: Colors.background.tertiary,
                        true: Colors.primary[700],
                      }}
                      thumbColor={slot.isOn ? Colors.primary[500] : Colors.text.tertiary}
                    />
                  )}
                </View>

                {/* Source info */}
                <View style={styles.sourceBadge}>
                  <Ionicons
                    name={slot.source === 'preference' ? 'checkmark-circle-outline' : 'ellipse-outline'}
                    size={12}
                    color={Colors.text.tertiary}
                  />
                  <Text style={styles.sourceText}>
                    {slot.source === 'preference' ? 'Persists until changed' : 'Not set yet'}
                  </Text>
                </View>

                {/* Preference selector */}
                {slot.isOn && (
                  <View style={styles.prefSection}>
                    <Text style={styles.prefLabel}>Preference</Text>
                    <View style={styles.prefRow}>
                      <TouchableOpacity
                        style={[
                          styles.prefBtn,
                          slot.preference === 'VEG' && styles.prefBtnActiveVeg,
                        ]}
                        onPress={() => handlePreferenceChange(slot, 'VEG')}
                        disabled={toggling === slot.slotId + '_pref'}
                      >
                        <Text style={[
                          styles.prefBtnText,
                          slot.preference === 'VEG' && { color: Colors.meal.veg },
                        ]}>
                          🟢 Vegetarian
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.prefBtn,
                          slot.preference === 'NON_VEG' && styles.prefBtnActiveNonVeg,
                        ]}
                        onPress={() => handlePreferenceChange(slot, 'NON_VEG')}
                        disabled={toggling === slot.slotId + '_pref'}
                      >
                        <Text style={[
                          styles.prefBtnText,
                          slot.preference === 'NON_VEG' && { color: Colors.meal.nonVeg },
                        ]}>
                          🔴 Non-Veg
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </Card>
            ))
          )}

          {/* Hint */}
          <View style={styles.hint}>
            <Ionicons name="information-circle-outline" size={16} color={Colors.text.tertiary} />
            <Text style={styles.hintText}>
              Toggle your meal ON or OFF — it stays that way for all future days until you change it again.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.primary },
  scrollContainer: { paddingBottom: 120 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background.primary },
  headerGradient: { position: 'absolute', top: 0, left: 0, right: 0, height: 200 },
  pageHeader: {
    paddingHorizontal: Spacing['2xl'],
    paddingTop: Spacing['4xl'],
    paddingBottom: Spacing.lg,
  },
  pageTitle: { fontSize: Typography.size.xl, fontWeight: Typography.weight.bold, color: Colors.text.primary },
  pageSubtitle: { fontSize: Typography.size.sm, color: Colors.text.secondary, marginTop: 2 },
  weekScroll: { paddingHorizontal: Spacing['2xl'], paddingVertical: Spacing.md, gap: Spacing.sm },
  dayPill: {
    width: 64,
    height: 80,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background.secondary,
    borderWidth: 1,
    borderColor: Colors.border.default,
    overflow: 'hidden',
    position: 'relative',
  },
  dayPillSelected: { borderColor: Colors.primary[500] },
  dayPillName: { fontSize: Typography.size.xs, color: Colors.text.tertiary, fontWeight: Typography.weight.medium },
  dayPillNameSelected: { color: Colors.text.inverse },
  dayPillNum: { fontSize: Typography.size.lg, fontWeight: Typography.weight.bold, color: Colors.text.primary, marginTop: 2 },
  dayPillNumSelected: { color: Colors.text.inverse },
  dayDot: { width: 6, height: 6, borderRadius: 3, marginTop: 4 },
  content: { paddingHorizontal: Spacing['2xl'], paddingBottom: 100 },
  statusCard: { alignItems: 'center', padding: Spacing['2xl'] },
  statusTitle: { fontSize: Typography.size.lg, fontWeight: Typography.weight.bold, color: Colors.text.primary, marginTop: Spacing.md },
  statusSub: { fontSize: Typography.size.sm, color: Colors.text.secondary, marginTop: Spacing.xs, textAlign: 'center' },
  slotCard: { marginBottom: Spacing.md },
  slotHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  slotTitleRow: { flexDirection: 'row', alignItems: 'center' },
  slotTitle: { fontSize: Typography.size.md, fontWeight: Typography.weight.semibold, color: Colors.text.primary },
  slotCutoff: { fontSize: Typography.size.xs, color: Colors.text.tertiary, marginTop: 2 },
  cutoffBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.warning.bg,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    gap: 4,
    borderWidth: 1,
    borderColor: Colors.warning.main,
  },
  cutoffBadgeText: { fontSize: Typography.size.xs, color: Colors.warning.main, fontWeight: Typography.weight.semibold },
  sourceBadge: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.sm },
  sourceText: { fontSize: Typography.size.xs, color: Colors.text.tertiary, marginLeft: 4 },
  prefSection: { marginTop: Spacing.lg, borderTopWidth: 1, borderTopColor: Colors.border.default, paddingTop: Spacing.lg },
  prefLabel: { fontSize: Typography.size.sm, color: Colors.text.secondary, marginBottom: Spacing.sm, fontWeight: Typography.weight.medium },
  prefRow: { flexDirection: 'row', gap: Spacing.md },
  prefBtn: {
    flex: 1, paddingVertical: Spacing.sm, borderRadius: BorderRadius.md,
    backgroundColor: Colors.background.tertiary, alignItems: 'center',
    borderWidth: 1, borderColor: Colors.border.default,
  },
  prefBtnActiveVeg: { backgroundColor: Colors.meal.vegBg, borderColor: Colors.meal.veg },
  prefBtnActiveNonVeg: { backgroundColor: Colors.meal.nonVegBg, borderColor: Colors.meal.nonVeg },
  prefBtnText: { fontSize: Typography.size.sm, color: Colors.text.secondary, fontWeight: Typography.weight.medium },
  hint: { flexDirection: 'row', alignItems: 'flex-start', padding: Spacing.md, marginTop: Spacing.sm },
  hintText: { fontSize: Typography.size.xs, color: Colors.text.tertiary, marginLeft: Spacing.sm, flex: 1, lineHeight: 18 },
});

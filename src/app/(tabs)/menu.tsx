import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/theme';
import { menuAPI } from '../../api/menu';
import { DayMenu } from '../../types';
import { Card } from '../../components/ui/Card';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TODAY_IDX = new Date().getDay();

export default function MenuScreen() {
  const [weekMenu, setWeekMenu] = useState<DayMenu[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetch = async () => {
    try {
      const data = await menuAPI.getWeeklyMenu();
      setWeekMenu(data);
    } catch (e) {} finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetch(); }, []);

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
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetch(); }}
            tintColor={Colors.primary[500]}
            colors={[Colors.primary[500]]}
          />
        }
      >
        {/* Header */}
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Weekly Menu</Text>
          <Text style={styles.pageSubtitle}>Recurring meal schedule for the week</Text>
        </View>

        <View style={styles.content}>
          {weekMenu.map((day) => {
            const isToday = day.dayOfWeek === TODAY_IDX;
            const hasMeals = day.meals.length > 0;

            return (
              <View key={day.dayOfWeek} style={styles.dayBlock}>
                {/* Day header */}
                <View style={[styles.dayHeader, isToday && styles.dayHeaderToday]}>
                  {isToday && (
                    <LinearGradient
                      colors={['rgba(212,175,55,0.15)', 'transparent']}
                      style={StyleSheet.absoluteFillObject}
                      start={{ x: 0, y: 0.5 }}
                      end={{ x: 1, y: 0.5 }}
                    />
                  )}
                  <Text style={[styles.dayName, isToday && styles.dayNameToday]}>
                    {day.dayName}
                  </Text>
                  {isToday && (
                    <View style={styles.todayBadge}>
                      <Text style={styles.todayBadgeText}>Today</Text>
                    </View>
                  )}
                </View>

                {/* Meal slots for the day */}
                {!hasMeals ? (
                  <View style={styles.emptyDay}>
                    <Text style={styles.emptyDayText}>No menu set</Text>
                  </View>
                ) : (
                  <View style={styles.mealsRow}>
                    {['Morning', 'Night'].map((slotName) => {
                      const slotMeals = day.meals.filter(m => m.slotName === slotName);
                      if (slotMeals.length === 0) return null;

                      return (
                        <Card key={slotName} variant="default" style={styles.mealCard}>
                          {/* Slot icon + name */}
                          <View style={styles.mealCardHeader}>
                            <Ionicons
                              name={slotName === 'Morning' ? 'sunny-outline' : 'moon-outline'}
                              size={16}
                              color={Colors.primary[500]}
                            />
                            <Text style={styles.mealSlotName}>{slotName}</Text>
                          </View>

                          {/* VEG section */}
                          {slotMeals.filter(m => m.menuType === 'VEG').map((meal, i) => (
                            <View key={i}>
                              <View style={styles.menuTypeRow}>
                                <View style={[styles.menuTypeDot, { backgroundColor: Colors.meal.veg }]} />
                                <Text style={[styles.menuTypeLabel, { color: Colors.meal.veg }]}>Veg</Text>
                              </View>
                              {(meal.items as string[]).map((item, j) => (
                                <Text key={j} style={styles.menuItemText}>• {item}</Text>
                              ))}
                            </View>
                          ))}

                          {/* NON-VEG section */}
                          {slotMeals.filter(m => m.menuType === 'NON_VEG').map((meal, i) => (
                            <View key={i} style={{ marginTop: Spacing.sm }}>
                              <View style={styles.menuTypeRow}>
                                <View style={[styles.menuTypeDot, { backgroundColor: Colors.meal.nonVeg }]} />
                                <Text style={[styles.menuTypeLabel, { color: Colors.meal.nonVeg }]}>Non-Veg</Text>
                              </View>
                              {(meal.items as string[]).map((item, j) => (
                                <Text key={j} style={styles.menuItemText}>• {item}</Text>
                              ))}
                            </View>
                          ))}
                        </Card>
                      );
                    })}
                  </View>
                )}
              </View>
            );
          })}
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
  pageHeader: { paddingHorizontal: Spacing['2xl'], paddingTop: Spacing['4xl'], paddingBottom: Spacing.lg },
  pageTitle: { fontSize: Typography.size.xl, fontWeight: Typography.weight.bold, color: Colors.text.primary },
  pageSubtitle: { fontSize: Typography.size.sm, color: Colors.text.secondary, marginTop: 2 },
  content: { paddingHorizontal: Spacing['2xl'], paddingBottom: 100 },
  dayBlock: { marginBottom: Spacing.xl },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    overflow: 'hidden',
  },
  dayHeaderToday: {
    borderWidth: 1,
    borderColor: Colors.border.gold,
  },
  dayName: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.semibold,
    color: Colors.text.secondary,
  },
  dayNameToday: {
    color: Colors.primary[500],
  },
  todayBadge: {
    marginLeft: Spacing.sm,
    backgroundColor: Colors.primary[500],
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  todayBadgeText: {
    fontSize: Typography.size.xs,
    color: Colors.text.inverse,
    fontWeight: Typography.weight.bold,
  },
  emptyDay: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  emptyDayText: {
    fontSize: Typography.size.sm,
    color: Colors.text.tertiary,
    fontStyle: 'italic',
  },
  mealsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  mealCard: { flex: 1 },
  mealCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.default,
  },
  mealSlotName: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semibold,
    color: Colors.text.primary,
    marginLeft: Spacing.xs,
  },
  menuTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  menuTypeDot: { width: 6, height: 6, borderRadius: 3, marginRight: Spacing.xs },
  menuTypeLabel: { fontSize: Typography.size.xs, fontWeight: Typography.weight.semibold },
  menuItemText: { fontSize: Typography.size.sm, color: Colors.text.secondary, marginLeft: Spacing.md, lineHeight: 20 },
});

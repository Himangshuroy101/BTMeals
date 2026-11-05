import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../constants/theme';
import { useAuthStore } from '../../stores/authStore';
import { mealsAPI } from '../../api/meals';
import { menuAPI } from '../../api/menu';
import { DayMealStatus, DayMenu } from '../../types';
import { Card } from '../../components/ui/Card';
import { RoleBadge } from '../../components/ui/Badge';
import apiClient from '../../api/client';

const { width } = Dimensions.get('window');
const TODAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function HomeScreen() {
  const { user } = useAuthStore();
  const [mealStatus, setMealStatus] = useState<DayMealStatus | null>(null);
  const [todayMenu, setTodayMenu] = useState<DayMenu['meals']>([]);
  const [todayStats, setTodayStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const today = new Date();
  const todayName = TODAY_NAMES[today.getDay()];
  const greeting = today.getHours() < 12 ? 'Good morning' : today.getHours() < 17 ? 'Good afternoon' : 'Good evening';

  const fetchData = async () => {
    try {
      const [statusData, menuData, statsData] = await Promise.all([
        mealsAPI.getStatus(),
        menuAPI.getTodayMenu(),
        apiClient.get('/meals/today-stats').then(r => r.data).catch(() => []),
      ]);
      setMealStatus(statusData[0] || null);
      setTodayMenu(menuData);
      setTodayStats(statsData || []);
    } catch (e) {
      // Silent fail — show cached state
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const roleNames: string[] = (user?.roles || []).map((r: any) =>
    typeof r === 'string' ? r : (r?.name ?? '')
  ).filter(Boolean);

  const adminRoles = roleNames.filter(r =>
    ['MAINTENANCE_PREFECT', 'MESS_PREFECT', 'MANAGER', 'SUPER_ADMIN'].includes(r)
  );

  return (
    <View style={styles.container}>
      {/* Header gradient */}
      <LinearGradient
        colors={['rgba(212,175,55,0.1)', 'transparent']}
        style={styles.headerGradient}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary[500]}
            colors={[Colors.primary[500]]}
          />
        }
      >
        {/* ── Top greeting ── */}
        <View style={styles.topRow}>
          <View>
            <Text style={styles.greeting}>{greeting},</Text>
            <Text style={styles.userName}>{user?.name?.split(' ')[0]} 👋</Text>
          </View>
          <TouchableOpacity
            style={styles.notifBtn}
            onPress={() => {/* TODO: Notifications */}}
          >
            <Ionicons name="notifications-outline" size={24} color={Colors.text.secondary} />
          </TouchableOpacity>
        </View>

        {/* ── Hostel pill ── */}
        <View style={styles.hostelPill}>
          <Ionicons name="business-outline" size={13} color={Colors.primary[500]} />
          <Text style={styles.hostelPillText}>{user?.hostel?.name}</Text>
        </View>

        {/* ── Role badges ── */}
        {adminRoles.length > 0 && (
          <View style={styles.rolesRow}>
            {adminRoles.map(role => (
              <RoleBadge key={role} role={role} style={{ marginRight: Spacing.sm }} />
            ))}
          </View>
        )}

        {/* ── Today's Meal Status Card ── */}
        <View style={styles.sectionLabel}>
          <Ionicons name="today-outline" size={16} color={Colors.primary[500]} />
          <Text style={styles.sectionText}>Today — {todayName}</Text>
        </View>

        {mealStatus?.globalDisabled ? (
          <Card variant="default" style={styles.alertCard}>
            <Ionicons name="close-circle" size={32} color={Colors.error.main} />
            <Text style={styles.alertTitle}>Meals Disabled</Text>
            <Text style={styles.alertSub}>{mealStatus.reason || 'Admin has disabled meals'}</Text>
          </Card>
        ) : mealStatus?.holiday ? (
          <Card variant="default" style={styles.alertCard}>
            <Ionicons name="umbrella-outline" size={32} color={Colors.warning.main} />
            <Text style={styles.alertTitle}>Holiday Today</Text>
            <Text style={styles.alertSub}>{mealStatus.reason || 'No meals on holiday'}</Text>
          </Card>
        ) : (
          <View style={styles.slotRow}>
            {(mealStatus?.slots || []).map((slot) => (
              <TouchableOpacity
                key={slot.slotId}
                style={styles.slotCard}
                onPress={() => router.push('/(tabs)/meals')}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={slot.isOn
                    ? ['rgba(52,211,153,0.12)', 'rgba(52,211,153,0.05)']
                    : ['rgba(30,30,36,0.9)', 'rgba(20,20,26,0.9)']
                  }
                  style={styles.slotGradient}
                >
                  <Ionicons
                    name={slot.slotName === 'Morning' ? 'sunny' : 'moon'}
                    size={28}
                    color={slot.isOn ? Colors.meal.on : Colors.text.tertiary}
                  />
                  <Text style={styles.slotName}>{slot.slotName}</Text>
                  <Text style={styles.slotCutoff}>Cutoff: {slot.cutoffTime}</Text>

                  <View style={[
                    styles.slotStatus,
                    { backgroundColor: slot.isOn ? Colors.meal.onBg : Colors.meal.offBg }
                  ]}>
                    <View style={[
                      styles.slotDot,
                      { backgroundColor: slot.isOn ? Colors.meal.on : Colors.meal.off }
                    ]} />
                    <Text style={[
                      styles.slotStatusText,
                      { color: slot.isOn ? Colors.meal.on : Colors.meal.off }
                    ]}>
                      {slot.isOn ? 'ON' : 'OFF'}
                    </Text>
                  </View>

                  {slot.isOn && (
                    <View style={styles.prefBadge}>
                      <Text style={styles.prefText}>
                        {slot.preference === 'VEG' ? '🟢 Veg' : '🔴 Non-Veg'}
                      </Text>
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* ── Transparency Stats ── */}
        {todayStats.length > 0 && (
          <>
            <View style={[styles.sectionLabel, { marginTop: Spacing['2xl'] }]}>
              <Ionicons name="stats-chart-outline" size={16} color={Colors.primary[500]} />
              <Text style={styles.sectionText}>Today's Meal Count</Text>
            </View>
            {todayStats.map((stat) => (
              <Card key={stat.slotId} variant="glass" style={styles.statCard}>
                <View style={styles.statHeader}>
                  <Ionicons
                    name={stat.slotName === 'Morning' ? 'sunny-outline' : 'moon-outline'}
                    size={18}
                    color={Colors.primary[500]}
                  />
                  <Text style={styles.statSlotName}>{stat.slotName} Meal</Text>
                  <View style={styles.totalBadge}>
                    <Text style={styles.totalBadgeText}>{stat.totalOn} eating</Text>
                  </View>
                </View>
                <View style={styles.statRow}>
                  <View style={styles.statItem}>
                    <Text style={styles.statDot}>🟢</Text>
                    <View>
                      <Text style={styles.statCount}>{stat.vegCount}</Text>
                      <Text style={styles.statLabel}>Veg</Text>
                    </View>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Text style={styles.statDot}>🔴</Text>
                    <View>
                      <Text style={styles.statCount}>{stat.nonVegCount}</Text>
                      <Text style={styles.statLabel}>Non-Veg</Text>
                    </View>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Ionicons name="people-outline" size={18} color={Colors.text.tertiary} />
                    <View>
                      <Text style={styles.statCount}>{stat.totalStudents}</Text>
                      <Text style={styles.statLabel}>Total</Text>
                    </View>
                  </View>
                </View>
              </Card>
            ))}
          </>
        )}

        {/* ── Today's Menu ── */}
        <View style={[styles.sectionLabel, { marginTop: Spacing['2xl'] }]}>
          <Ionicons name="restaurant-outline" size={16} color={Colors.primary[500]} />
          <Text style={styles.sectionText}>Today's Menu</Text>
        </View>

        {todayMenu.length === 0 ? (
          <Card variant="glass" style={styles.emptyMenu}>
            <Ionicons name="document-outline" size={28} color={Colors.text.tertiary} />
            <Text style={styles.emptyMenuText}>No menu set for today</Text>
          </Card>
        ) : (
          todayMenu.map((meal, idx) => (
            <Card key={idx} variant="default" style={styles.menuCard}>
              <View style={styles.menuCardHeader}>
                <View style={styles.menuSlotBadge}>
                  <Ionicons
                    name={meal.slotName === 'Morning' ? 'sunny-outline' : 'moon-outline'}
                    size={14}
                    color={Colors.primary[500]}
                  />
                  <Text style={styles.menuSlotText}>{meal.slotName}</Text>
                </View>
                <View style={[
                  styles.menuTypeBadge,
                  { backgroundColor: meal.menuType === 'VEG' ? Colors.meal.vegBg : Colors.meal.nonVegBg }
                ]}>
                  <Text style={[
                    styles.menuTypeText,
                    { color: meal.menuType === 'VEG' ? Colors.meal.veg : Colors.meal.nonVeg }
                  ]}>
                    {meal.menuType === 'VEG' ? '🟢 Veg' : '🔴 Non-Veg'}
                  </Text>
                </View>
              </View>
              <View style={styles.menuItems}>
                {(meal.items as string[]).map((item, i) => (
                  <View key={i} style={styles.menuItem}>
                    <View style={styles.menuItemDot} />
                    <Text style={styles.menuItemText}>{item}</Text>
                  </View>
                ))}
              </View>
            </Card>
          ))
        )}

        {/* ── Admin Quick Actions ── */}
        {adminRoles.length > 0 && (
          <>
            <View style={[styles.sectionLabel, { marginTop: Spacing['2xl'] }]}>
              <Ionicons name="grid-outline" size={16} color={Colors.primary[500]} />
              <Text style={styles.sectionText}>Quick Actions</Text>
            </View>
            <View style={styles.actionsGrid}>
              {roleNames.includes('MAINTENANCE_PREFECT') && (
                <>
                  <QuickAction
                    icon="person-add-outline"
                    label="Approvals"
                    color={Colors.info.main}
                    onPress={() => router.push('/maintenance/approvals')}
                  />
                  <QuickAction
                    icon="calendar-outline"
                    label="Holidays"
                    color={Colors.warning.main}
                    onPress={() => router.push('/maintenance/holidays')}
                  />
                </>
              )}
              {roleNames.includes('MESS_PREFECT') && (
                <QuickAction
                  icon="people-outline"
                  label="Managers"
                  color={Colors.role.messPrefect}
                  onPress={() => router.push('/mess-prefect/assign-managers')}
                />
              )}
              {roleNames.includes('MANAGER') && (
                <>
                  <QuickAction
                    icon="clipboard-outline"
                    label="Attendance"
                    color={Colors.success.main}
                    onPress={() => router.push('/manager/attendance')}
                  />
                  <QuickAction
                    icon="stats-chart-outline"
                    label="Meal Count"
                    color={Colors.primary[500]}
                    onPress={() => router.push('/manager/meal-count')}
                  />
                  <QuickAction
                    icon="pencil-outline"
                    label="Edit Menu"
                    color={Colors.role.manager}
                    onPress={() => router.push('/manager/menu-editor')}
                  />
                </>
              )}
              {roleNames.includes('SUPER_ADMIN') && (
                <>
                  <QuickAction
                    icon="person-add-outline"
                    label="Approvals"
                    color={Colors.info.main}
                    onPress={() => router.push('/maintenance/approvals')}
                  />
                  <QuickAction
                    icon="calendar-outline"
                    label="Holidays"
                    color={Colors.warning.main}
                    onPress={() => router.push('/maintenance/holidays')}
                  />
                  <QuickAction
                    icon="shield-outline"
                    label="Roles"
                    color={Colors.primary[500]}
                    onPress={() => router.push('/admin/roles')}
                  />
                  <QuickAction
                    icon="people-outline"
                    label="Users"
                    color={Colors.info.main}
                    onPress={() => router.push('/admin/users')}
                  />
                </>
              )}
            </View>
          </>
        )}

        <View style={{ height: Spacing['2xl'] }} />
      </ScrollView>
    </View>
  );
}

function QuickAction({ icon, label, color, onPress }: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.quickAction} onPress={onPress} activeOpacity={0.75}>
      <View style={[styles.quickActionIcon, { backgroundColor: `${color}18` }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text style={styles.quickActionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.primary },
  headerGradient: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 300,
  },
  scroll: {
    paddingHorizontal: Spacing['2xl'],
    paddingTop: Spacing['4xl'],
    paddingBottom: 100, // clears the 64px tab bar + extra breathing room
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  greeting: {
    fontSize: Typography.size.base,
    color: Colors.text.secondary,
  },
  userName: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
    color: Colors.text.primary,
  },
  notifBtn: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.background.secondary,
    borderWidth: 1,
    borderColor: Colors.border.default,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hostelPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface.glassHighlight,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    alignSelf: 'flex-start',
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border.gold,
  },
  hostelPillText: {
    fontSize: Typography.size.xs,
    color: Colors.primary[500],
    fontWeight: Typography.weight.medium,
    marginLeft: 5,
    letterSpacing: 0.3,
  },
  rolesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Spacing.lg,
  },
  sectionLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionText: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semibold,
    color: Colors.text.secondary,
    marginLeft: Spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  alertCard: {
    alignItems: 'center',
    padding: Spacing['2xl'],
  },
  alertTitle: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.bold,
    color: Colors.text.primary,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  alertSub: {
    fontSize: Typography.size.sm,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  slotRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  slotCard: {
    flex: 1,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border.default,
    ...Shadows.md,
  },
  slotGradient: {
    padding: Spacing.lg,
    alignItems: 'center',
    minHeight: 160,
    justifyContent: 'center',
  },
  slotName: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.bold,
    color: Colors.text.primary,
    marginTop: Spacing.sm,
    marginBottom: 4,
  },
  slotCutoff: {
    fontSize: Typography.size.xs,
    color: Colors.text.tertiary,
    marginBottom: Spacing.md,
  },
  slotStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
  },
  slotDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  slotStatusText: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.bold,
    letterSpacing: 0.5,
  },
  prefBadge: {
    marginTop: Spacing.sm,
  },
  prefText: {
    fontSize: Typography.size.xs,
    color: Colors.text.secondary,
  },
  emptyMenu: {
    alignItems: 'center',
    padding: Spacing['2xl'],
  },
  emptyMenuText: {
    fontSize: Typography.size.sm,
    color: Colors.text.tertiary,
    marginTop: Spacing.md,
  },
  menuCard: {
    marginBottom: Spacing.md,
  },
  menuCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  menuSlotBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface.glassHighlight,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
  },
  menuSlotText: {
    fontSize: Typography.size.xs,
    color: Colors.primary[500],
    fontWeight: Typography.weight.semibold,
    marginLeft: 4,
  },
  menuTypeBadge: {
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
  },
  menuTypeText: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.semibold,
  },
  menuItems: {
    gap: Spacing.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.primary[600],
    marginRight: Spacing.sm,
  },
  menuItemText: {
    fontSize: Typography.size.base,
    color: Colors.text.primary,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  quickAction: {
    width: (width - Spacing['2xl'] * 2 - Spacing.md * 2) / 3,
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border.default,
    padding: Spacing.lg,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  quickActionLabel: {
    fontSize: Typography.size.xs,
    color: Colors.text.secondary,
    fontWeight: Typography.weight.medium,
    textAlign: 'center',
  },
  statCard: {
    marginBottom: Spacing.md,
    padding: Spacing.lg,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  statSlotName: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semibold,
    color: Colors.text.primary,
    flex: 1,
    marginLeft: Spacing.sm,
  },
  totalBadge: {
    backgroundColor: Colors.surface.glassHighlight,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: Colors.border.gold,
  },
  totalBadgeText: {
    fontSize: Typography.size.xs,
    color: Colors.primary[500],
    fontWeight: Typography.weight.bold,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
    justifyContent: 'center',
  },
  statDot: {
    fontSize: 18,
  },
  statCount: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
    color: Colors.text.primary,
  },
  statLabel: {
    fontSize: Typography.size.xs,
    color: Colors.text.tertiary,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.border.default,
  },
});

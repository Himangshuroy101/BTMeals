import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/theme';
import { useAuthStore } from '../../stores/authStore';
import { Card } from '../../components/ui/Card';
import { RoleBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import apiClient from '../../api/client';

export default function ProfileScreen() {
  const { user, logout, loadUser } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  const [attendanceStats, setAttendanceStats] = useState({ total: 0, present: 0 });

  const fetchStats = async () => {
    try {
      const res = await apiClient.get('/attendance/my-history?limit=30');
      const records = res.data?.records || [];
      const present = records.filter((r: any) => r.wasPresent).length;
      setAttendanceStats({ total: records.length, present });
    } catch (e) {}
    setRefreshing(false);
  };

  useEffect(() => { fetchStats(); }, []);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  // Normalize roles — server may return strings OR {name,year,month} objects
  const roleNames: string[] = (user?.roles || []).map((r: any) =>
    typeof r === 'string' ? r : (r?.name ?? '')
  ).filter(Boolean);
  const adminRoles = roleNames.filter(r => r !== 'STUDENT');

  return (
    <View style={styles.container}>
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
            onRefresh={() => { setRefreshing(true); fetchStats(); loadUser(); }}
            tintColor={Colors.primary[500]}
            colors={[Colors.primary[500]]}
          />
        }
      >
        {/* Avatar & Name */}
        <View style={styles.avatarSection}>
          <LinearGradient
            colors={['#D4AF37', '#B8932E']}
            style={styles.avatar}
          >
            <Text style={styles.avatarText}>
              {user?.name?.charAt(0).toUpperCase()}
            </Text>
          </LinearGradient>
          <Text style={styles.userName}>{user?.name}</Text>
          <Text style={styles.userPhone}>{user?.phone}</Text>

          {/* Roles */}
          {adminRoles.length > 0 && (
            <View style={styles.rolesRow}>
              {adminRoles.map(r => <RoleBadge key={r} role={r as any} style={{ marginRight: 6 }} />)}
            </View>
          )}
        </View>

        {/* Info Card */}
        <Card variant="default" style={styles.infoCard}>
          <InfoRow icon="card-outline" label="Roll Number" value={user?.rollNumber || '—'} />
          <Divider />
          <InfoRow icon="home-outline" label="Room Number" value={user?.roomNumber || 'Not set'} />
          <Divider />
          <InfoRow icon="business-outline" label="Hostel" value={user?.hostel?.name || '—'} />
          <Divider />
          <InfoRow
            icon="shield-checkmark-outline"
            label="Status"
            value={user?.status || '—'}
            valueColor={user?.status === 'APPROVED' ? Colors.success.main : Colors.warning.main}
          />
        </Card>

        {/* Stats */}
        <Text style={styles.sectionTitle}>Attendance Overview</Text>
        <View style={styles.statsRow}>
          <StatCard
            label="Meals Recorded"
            value={attendanceStats.total}
            icon="calendar-outline"
            color={Colors.primary[500]}
          />
          <StatCard
            label="Present"
            value={attendanceStats.present}
            icon="checkmark-circle-outline"
            color={Colors.success.main}
          />
          <StatCard
            label="Absent"
            value={attendanceStats.total - attendanceStats.present}
            icon="close-circle-outline"
            color={Colors.error.main}
          />
        </View>

        {/* Admin shortcuts */}
        {adminRoles.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Admin Panels</Text>
            <Card variant="default">
              {roleNames.includes('MAINTENANCE_PREFECT') && (
                <>
                  <MenuRow
                    icon="person-add-outline"
                    label="Pending Approvals"
                    color={Colors.info.main}
                    onPress={() => router.push('/maintenance/approvals')}
                  />
                  <Divider />
                  <MenuRow
                    icon="toggle-outline"
                    label="Global Meal Toggle"
                    color={Colors.warning.main}
                    onPress={() => router.push('/maintenance/holidays')}
                  />
                  <Divider />
                </>
              )}
              {roleNames.includes('MESS_PREFECT') && (
                <>
                  <MenuRow
                    icon="people-outline"
                    label="Assign Managers"
                    color={Colors.role.messPrefect}
                    onPress={() => router.push('/mess-prefect/assign-managers')}
                  />
                  <Divider />
                </>
              )}
              {roleNames.includes('MANAGER') && (
                <>
                  <MenuRow
                    icon="restaurant-outline"
                    label="Menu Editor"
                    color={Colors.role.manager}
                    onPress={() => router.push('/manager/menu-editor')}
                  />
                  <Divider />
                  <MenuRow
                    icon="stats-chart-outline"
                    label="Meal Count"
                    color={Colors.primary[500]}
                    onPress={() => router.push('/manager/meal-count')}
                  />
                  <Divider />
                  <MenuRow
                    icon="clipboard-outline"
                    label="Mark Attendance"
                    color={Colors.success.main}
                    onPress={() => router.push('/manager/attendance')}
                  />
                  <Divider />
                </>
              )}
              {roleNames.includes('SUPER_ADMIN') && (
                <>
                  <MenuRow
                    icon="shield-outline"
                    label="Role Management"
                    color={Colors.primary[500]}
                    onPress={() => router.push('/admin/roles')}
                  />
                  <Divider />
                  <MenuRow
                    icon="people-outline"
                    label="User Management"
                    color={Colors.info.main}
                    onPress={() => router.push('/admin/users')}
                  />
                </>
              )}
            </Card>
          </>
        )}

        {/* Logout */}
        <Button
          title="Logout"
          onPress={handleLogout}
          variant="danger"
          fullWidth
          size="lg"
          icon={<Ionicons name="log-out-outline" size={20} color={Colors.error.main} />}
          style={{ marginTop: Spacing['2xl'] }}
        />

        <View style={{ height: Spacing['2xl'] }} />
      </ScrollView>
    </View>
  );
}

function InfoRow({ icon, label, value, valueColor }: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoRowLeft}>
        <Ionicons name={icon} size={18} color={Colors.text.tertiary} />
        <Text style={styles.infoLabel}>{label}</Text>
      </View>
      <Text style={[styles.infoValue, valueColor ? { color: valueColor } : undefined]}>
        {value}
      </Text>
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

function MenuRow({ icon, label, color, onPress }: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.menuRow} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.menuRowIcon, { backgroundColor: `${color}18` }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <Text style={styles.menuRowLabel}>{label}</Text>
      <Ionicons name="chevron-forward" size={16} color={Colors.text.tertiary} />
    </TouchableOpacity>
  );
}

function StatCard({ label, value, icon, color }: {
  label: string;
  value: number;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}) {
  return (
    <View style={styles.statCard}>
      <Ionicons name={icon} size={22} color={color} />
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.primary },
  headerGradient: { position: 'absolute', top: 0, left: 0, right: 0, height: 250 },
  scroll: { paddingHorizontal: Spacing['2xl'], paddingTop: Spacing['4xl'], paddingBottom: 100 },
  avatarSection: { alignItems: 'center', marginBottom: Spacing['2xl'] },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  avatarText: { fontSize: Typography.size['2xl'], fontWeight: Typography.weight.bold, color: Colors.text.inverse },
  userName: { fontSize: Typography.size.xl, fontWeight: Typography.weight.bold, color: Colors.text.primary, marginBottom: 4 },
  userPhone: { fontSize: Typography.size.base, color: Colors.text.secondary, marginBottom: Spacing.md },
  rolesRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6 },
  infoCard: { marginBottom: Spacing['2xl'] },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.sm },
  infoRowLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  infoLabel: { fontSize: Typography.size.sm, color: Colors.text.secondary },
  infoValue: { fontSize: Typography.size.sm, fontWeight: Typography.weight.semibold, color: Colors.text.primary },
  divider: { height: 1, backgroundColor: Colors.border.subtle },
  sectionTitle: { fontSize: Typography.size.sm, fontWeight: Typography.weight.semibold, color: Colors.text.secondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: Spacing.md, marginTop: Spacing.lg },
  statsRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.md },
  statCard: {
    flex: 1, backgroundColor: Colors.background.secondary, borderRadius: BorderRadius.xl,
    borderWidth: 1, borderColor: Colors.border.default, padding: Spacing.md, alignItems: 'center',
  },
  statValue: { fontSize: Typography.size.xl, fontWeight: Typography.weight.bold, marginVertical: 4 },
  statLabel: { fontSize: Typography.size.xs, color: Colors.text.tertiary, textAlign: 'center' },
  menuRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md },
  menuRowIcon: { width: 36, height: 36, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  menuRowLabel: { flex: 1, fontSize: Typography.size.base, color: Colors.text.primary },
});

import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, RefreshControl, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/theme';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import apiClient from '../../api/client';

const now = new Date();
const CURRENT_YEAR = now.getFullYear();
const CURRENT_MONTH = now.getMonth() + 1;
const MONTH_NAMES = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function AssignManagersScreen() {
  const [users, setUsers] = useState<any[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentManagers, setCurrentManagers] = useState<any[]>([]);
  const [month, setMonth] = useState(CURRENT_MONTH);

  const fetch = async () => {
    try {
      const [usersRes, managersRes] = await Promise.all([
        apiClient.get('/users'),
        apiClient.get(`/roles/managers/${CURRENT_YEAR}/${month}`),
      ]);
      setUsers(usersRes.data.filter((u: any) => !u.userRoles?.some((r: any) => ['MAINTENANCE_PREFECT', 'MESS_PREFECT', 'SUPER_ADMIN'].includes(r.role))));
      setCurrentManagers(managersRes.data);
      setSelected(managersRes.data.map((m: any) => m.user?.id).filter(Boolean));
    } catch (e) {} finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch(); }, [month]);

  const toggleSelect = (userId: string) => {
    setSelected(prev => {
      if (prev.includes(userId)) return prev.filter(id => id !== userId);
      if (prev.length >= 3) {
        Alert.alert('Limit', 'You can assign maximum 3 managers per month');
        return prev;
      }
      return [...prev, userId];
    });
  };

  const handleAssign = async () => {
    if (selected.length === 0) {
      Alert.alert('Select Managers', 'Please select at least 1 student as manager');
      return;
    }
    setSaving(true);
    try {
      await apiClient.post('/roles/assign-managers', {
        userIds: selected,
        year: CURRENT_YEAR,
        month,
      });
      Alert.alert('✅ Done', `${selected.length} manager(s) assigned for ${MONTH_NAMES[month]}`);
      await fetch();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.error || 'Failed to assign managers');
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
          <Text style={styles.headerTitle}>Assign Managers</Text>
          <Text style={styles.headerSub}>Select up to 3 students</Text>
        </View>
      </View>

      {/* Month selector */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.monthScroll}>
        {[CURRENT_MONTH - 1, CURRENT_MONTH, CURRENT_MONTH + 1].filter(m => m >= 1 && m <= 12).map(m => (
          <TouchableOpacity key={m} onPress={() => setMonth(m)} style={[styles.monthPill, month === m && styles.monthPillActive]}>
            <Text style={[styles.monthPillText, month === m && styles.monthPillTextActive]}>{MONTH_NAMES[m]}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Current managers summary */}
      <View style={styles.infoBar}>
        <Ionicons name="people-outline" size={16} color={Colors.info.main} />
        <Text style={styles.infoBarText}>
          {selected.length}/3 managers selected for {MONTH_NAMES[month]}
        </Text>
      </View>

      {loading ? (
        <View style={styles.loader}><ActivityIndicator size="large" color={Colors.primary[500]} /></View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {users.map((user) => {
            const isSelected = selected.includes(user.id);
            return (
              <TouchableOpacity key={user.id} onPress={() => toggleSelect(user.id)} activeOpacity={0.7}>
                <Card variant={isSelected ? 'gold' : 'default'} style={styles.userCard}>
                  <View style={styles.userRow}>
                    <LinearGradient
                      colors={isSelected ? ['#D4AF37', '#B8932E'] : ['#2A2A30', '#1E1E24']}
                      style={styles.avatar}
                    >
                      {isSelected
                        ? <Ionicons name="checkmark" size={20} color={Colors.text.inverse} />
                        : <Text style={styles.avatarText}>{user.name.charAt(0).toUpperCase()}</Text>
                      }
                    </LinearGradient>
                    <View style={styles.userInfo}>
                      <Text style={styles.userName}>{user.name}</Text>
                      <Text style={styles.userDetail}>{user.rollNumber} {user.roomNumber ? `• Room ${user.roomNumber}` : ''}</Text>
                    </View>
                    {isSelected && (
                      <View style={styles.selectedBadge}>
                        <Text style={styles.selectedBadgeText}>Manager</Text>
                      </View>
                    )}
                  </View>
                </Card>
              </TouchableOpacity>
            );
          })}
          <View style={{ height: 100 }} />
        </ScrollView>
      )}

      {/* Floating Save button */}
      <View style={styles.bottomBar}>
        <Button
          title={`Assign ${selected.length} Manager${selected.length !== 1 ? 's' : ''} for ${MONTH_NAMES[month]}`}
          onPress={handleAssign}
          loading={saving}
          fullWidth
          size="lg"
        />
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
  monthScroll: { paddingHorizontal: Spacing['2xl'], paddingBottom: Spacing.md, gap: Spacing.sm },
  monthPill: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full, backgroundColor: Colors.background.secondary, borderWidth: 1, borderColor: Colors.border.default },
  monthPillActive: { backgroundColor: Colors.primary[500], borderColor: Colors.primary[500] },
  monthPillText: { fontSize: Typography.size.sm, color: Colors.text.secondary, fontWeight: Typography.weight.medium },
  monthPillTextActive: { color: Colors.text.inverse },
  infoBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.info.bg, marginHorizontal: Spacing['2xl'], borderRadius: BorderRadius.md, padding: Spacing.sm, marginBottom: Spacing.md },
  infoBarText: { fontSize: Typography.size.sm, color: Colors.info.main, marginLeft: Spacing.sm, fontWeight: Typography.weight.medium },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { paddingHorizontal: Spacing['2xl'] },
  userCard: { marginBottom: Spacing.sm },
  userRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 46, height: 46, borderRadius: 23, justifyContent: 'center', alignItems: 'center', marginRight: Spacing.md },
  avatarText: { fontSize: Typography.size.lg, fontWeight: Typography.weight.bold, color: Colors.text.secondary },
  userInfo: { flex: 1 },
  userName: { fontSize: Typography.size.base, fontWeight: Typography.weight.semibold, color: Colors.text.primary },
  userDetail: { fontSize: Typography.size.sm, color: Colors.text.secondary },
  selectedBadge: { backgroundColor: Colors.primary[500], borderRadius: BorderRadius.full, paddingHorizontal: Spacing.sm, paddingVertical: 3 },
  selectedBadgeText: { fontSize: Typography.size.xs, color: Colors.text.inverse, fontWeight: Typography.weight.bold },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: Spacing['2xl'], backgroundColor: Colors.background.primary, borderTopWidth: 1, borderTopColor: Colors.border.default },
});

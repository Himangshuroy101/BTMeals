import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator, TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/theme';
import { Card } from '../../components/ui/Card';
import { RoleBadge } from '../../components/ui/Badge';
import apiClient from '../../api/client';

export default function UsersScreen() {
  const [users, setUsers] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [processing, setProcessing] = useState<string | null>(null);

  const fetch = async () => {
    try {
      const res = await apiClient.get('/users');
      setUsers(res.data);
      setFiltered(res.data);
    } catch (e) {} finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(users.filter(u =>
      u.name.toLowerCase().includes(q) ||
      u.rollNumber.toLowerCase().includes(q) ||
      u.phone.includes(q)
    ));
  }, [search, users]);

  const handleSuspend = (userId: string, name: string) => {
    Alert.alert('Suspend User', `Suspend ${name}? They will lose access.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Suspend',
        style: 'destructive',
        onPress: async () => {
          setProcessing(userId);
          try {
            await apiClient.put(`/users/${userId}/suspend`);
            await fetch();
          } catch (e: any) {
            Alert.alert('Error', e?.response?.data?.error || 'Failed to suspend');
          } finally { setProcessing(null); }
        },
      },
    ]);
  };

  const STATUS_COLORS: Record<string, string> = {
    APPROVED: Colors.success.main,
    PENDING: Colors.warning.main,
    REJECTED: Colors.error.main,
    SUSPENDED: Colors.error.dark,
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['rgba(212,175,55,0.08)', 'transparent']} style={styles.headerGradient} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.text.primary} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>All Users</Text>
          <Text style={styles.headerSub}>{users.length} registered students</Text>
        </View>
      </View>

      {/* Search bar */}
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={18} color={Colors.text.tertiary} style={{ marginRight: Spacing.sm }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, roll number, phone..."
          placeholderTextColor={Colors.text.tertiary}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={Colors.text.tertiary} />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.loader}><ActivityIndicator size="large" color={Colors.primary[500]} /></View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {filtered.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={48} color={Colors.text.tertiary} />
              <Text style={styles.emptyText}>No users found</Text>
            </View>
          ) : (
            filtered.map((user) => (
              <Card key={user.id} variant="default" style={styles.userCard}>
                <View style={styles.userRow}>
                  <LinearGradient
                    colors={user.status === 'APPROVED' ? ['#D4AF37', '#B8932E'] : ['#2A2A30', '#1E1E24']}
                    style={styles.avatar}
                  >
                    <Text style={styles.avatarText}>{user.name.charAt(0).toUpperCase()}</Text>
                  </LinearGradient>

                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{user.name}</Text>
                    <Text style={styles.userDetail}>
                      {user.rollNumber}{user.roomNumber ? ` • Room ${user.roomNumber}` : ''}
                    </Text>
                    <Text style={styles.userPhone}>{user.phone}</Text>
                  </View>

                  <View style={styles.rightCol}>
                    <View style={[styles.statusBadge, { backgroundColor: `${STATUS_COLORS[user.status]}18` }]}>
                      <Text style={[styles.statusText, { color: STATUS_COLORS[user.status] }]}>
                        {user.status}
                      </Text>
                    </View>
                    {user.status === 'APPROVED' && (
                      <TouchableOpacity
                        onPress={() => handleSuspend(user.id, user.name)}
                        style={styles.suspendBtn}
                        disabled={processing === user.id}
                      >
                        <Text style={styles.suspendBtnText}>Suspend</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                {/* Roles */}
                {user.userRoles?.length > 0 && (
                  <View style={styles.rolesRow}>
                    {user.userRoles.map((r: any) => (
                      <RoleBadge key={r.id} role={r.role} style={{ marginRight: 4 }} />
                    ))}
                  </View>
                )}
              </Card>
            ))
          )}
        </ScrollView>
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
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.background.input, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.border.default, paddingHorizontal: Spacing.lg, marginHorizontal: Spacing['2xl'], marginBottom: Spacing.md, height: 48 },
  searchInput: { flex: 1, fontSize: Typography.size.base, color: Colors.text.primary },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { paddingHorizontal: Spacing['2xl'], paddingBottom: Spacing['3xl'] },
  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: Typography.size.base, color: Colors.text.tertiary, marginTop: Spacing.lg },
  userCard: { marginBottom: Spacing.md },
  userRow: { flexDirection: 'row', alignItems: 'flex-start' },
  avatar: { width: 46, height: 46, borderRadius: 23, justifyContent: 'center', alignItems: 'center', marginRight: Spacing.md },
  avatarText: { fontSize: Typography.size.lg, fontWeight: Typography.weight.bold, color: Colors.text.inverse },
  userInfo: { flex: 1 },
  userName: { fontSize: Typography.size.base, fontWeight: Typography.weight.semibold, color: Colors.text.primary },
  userDetail: { fontSize: Typography.size.sm, color: Colors.text.secondary, marginTop: 2 },
  userPhone: { fontSize: Typography.size.sm, color: Colors.text.tertiary, marginTop: 1 },
  rightCol: { alignItems: 'flex-end', gap: Spacing.sm },
  statusBadge: { borderRadius: BorderRadius.full, paddingHorizontal: Spacing.sm, paddingVertical: 3 },
  statusText: { fontSize: Typography.size.xs, fontWeight: Typography.weight.semibold },
  suspendBtn: { backgroundColor: Colors.error.bg, borderRadius: BorderRadius.sm, paddingHorizontal: Spacing.sm, paddingVertical: 3 },
  suspendBtnText: { fontSize: Typography.size.xs, color: Colors.error.main, fontWeight: Typography.weight.semibold },
  rolesRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: Spacing.sm, paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.border.subtle },
});

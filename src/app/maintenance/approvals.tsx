import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, Alert, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/theme';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import apiClient from '../../api/client';

interface PendingUser {
  id: string;
  name: string;
  phone: string;
  rollNumber: string;
  roomNumber?: string;
  createdAt: string;
}

export default function ApprovalsScreen() {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);

  const fetch = async () => {
    try {
      const res = await apiClient.get('/users/pending');
      setPendingUsers(res.data);
    } catch (e) {} finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetch(); }, []);

  const handleApprove = async (userId: string, name: string) => {
    Alert.alert('Approve Student', `Approve ${name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Approve',
        onPress: async () => {
          setProcessing(userId);
          try {
            await apiClient.put(`/users/${userId}/approve`);
            setPendingUsers(prev => prev.filter(u => u.id !== userId));
            Alert.alert('✅ Approved', `${name} can now use the app.`);
          } catch (e: any) {
            Alert.alert('Error', e?.response?.data?.error || 'Failed to approve');
          } finally {
            setProcessing(null);
          }
        },
      },
    ]);
  };

  const handleReject = async (userId: string, name: string) => {
    Alert.alert('Reject Student', `Reject ${name}'s registration?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject',
        style: 'destructive',
        onPress: async () => {
          setProcessing(userId);
          try {
            await apiClient.put(`/users/${userId}/reject`);
            setPendingUsers(prev => prev.filter(u => u.id !== userId));
          } catch (e: any) {
            Alert.alert('Error', e?.response?.data?.error || 'Failed to reject');
          } finally {
            setProcessing(null);
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['rgba(212,175,55,0.08)', 'transparent']} style={styles.headerGradient} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.text.primary} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Pending Approvals</Text>
          <Text style={styles.headerSub}>{pendingUsers.length} student{pendingUsers.length !== 1 ? 's' : ''} waiting</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={Colors.primary[500]} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetch(); }}
              tintColor={Colors.primary[500]} colors={[Colors.primary[500]]} />
          }
        >
          {pendingUsers.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="checkmark-done-circle-outline" size={56} color={Colors.success.main} />
              <Text style={styles.emptyTitle}>All Clear!</Text>
              <Text style={styles.emptySub}>No pending registrations</Text>
            </View>
          ) : (
            pendingUsers.map((user) => (
              <Card key={user.id} variant="default" style={styles.userCard}>
                {/* User avatar letter */}
                <View style={styles.userRow}>
                  <LinearGradient colors={['#D4AF37', '#B8932E']} style={styles.userAvatar}>
                    <Text style={styles.userAvatarText}>{user.name.charAt(0).toUpperCase()}</Text>
                  </LinearGradient>
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{user.name}</Text>
                    <Text style={styles.userPhone}>{user.phone}</Text>
                  </View>
                  <View style={styles.pendingBadge}>
                    <Text style={styles.pendingBadgeText}>Pending</Text>
                  </View>
                </View>

                {/* Details */}
                <View style={styles.detailsRow}>
                  <View style={styles.detail}>
                    <Ionicons name="card-outline" size={14} color={Colors.text.tertiary} />
                    <Text style={styles.detailText}>{user.rollNumber}</Text>
                  </View>
                  {user.roomNumber && (
                    <View style={styles.detail}>
                      <Ionicons name="home-outline" size={14} color={Colors.text.tertiary} />
                      <Text style={styles.detailText}>Room {user.roomNumber}</Text>
                    </View>
                  )}
                  <View style={styles.detail}>
                    <Ionicons name="time-outline" size={14} color={Colors.text.tertiary} />
                    <Text style={styles.detailText}>
                      {new Date(user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </Text>
                  </View>
                </View>

                {/* Actions */}
                <View style={styles.actions}>
                  <Button
                    title="Reject"
                    onPress={() => handleReject(user.id, user.name)}
                    variant="danger"
                    size="sm"
                    loading={processing === user.id}
                    style={{ flex: 1, marginRight: Spacing.sm }}
                  />
                  <Button
                    title="Approve"
                    onPress={() => handleApprove(user.id, user.name)}
                    variant="primary"
                    size="sm"
                    loading={processing === user.id}
                    style={{ flex: 1 }}
                  />
                </View>
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
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { paddingHorizontal: Spacing['2xl'], paddingBottom: Spacing['3xl'] },
  emptyState: { alignItems: 'center', paddingTop: 80 },
  emptyTitle: { fontSize: Typography.size.xl, fontWeight: Typography.weight.bold, color: Colors.text.primary, marginTop: Spacing.lg },
  emptySub: { fontSize: Typography.size.base, color: Colors.text.secondary, marginTop: Spacing.xs },
  userCard: { marginBottom: Spacing.md },
  userRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
  userAvatar: { width: 46, height: 46, borderRadius: 23, justifyContent: 'center', alignItems: 'center', marginRight: Spacing.md },
  userAvatarText: { fontSize: Typography.size.lg, fontWeight: Typography.weight.bold, color: Colors.text.inverse },
  userInfo: { flex: 1 },
  userName: { fontSize: Typography.size.md, fontWeight: Typography.weight.semibold, color: Colors.text.primary },
  userPhone: { fontSize: Typography.size.sm, color: Colors.text.secondary },
  pendingBadge: { backgroundColor: Colors.warning.bg, borderRadius: BorderRadius.full, paddingHorizontal: Spacing.sm, paddingVertical: 3 },
  pendingBadgeText: { fontSize: Typography.size.xs, color: Colors.warning.main, fontWeight: Typography.weight.semibold },
  detailsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, marginBottom: Spacing.md },
  detail: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  detailText: { fontSize: Typography.size.sm, color: Colors.text.secondary },
  actions: { flexDirection: 'row', paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.border.default },
});

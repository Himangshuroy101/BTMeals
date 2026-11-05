import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator, Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/theme';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { RoleBadge } from '../../components/ui/Badge';
import apiClient from '../../api/client';

const ASSIGNABLE_ROLES = [
  { value: 'MAINTENANCE_PREFECT', label: 'Maintenance Prefect' },
  { value: 'MESS_PREFECT', label: 'Mess Prefect' },
  { value: 'AUDITOR', label: 'Auditor' },
  { value: 'LIBRARIAN', label: 'Librarian' },
  { value: 'GAME_PREFECT', label: 'Game Prefect' },
];

export default function RolesScreen() {
  const [usersWithRoles, setUsersWithRoles] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [assigning, setAssigning] = useState(false);

  const fetch = async () => {
    try {
      const [rolesRes, usersRes] = await Promise.all([
        apiClient.get('/roles/users'),
        apiClient.get('/users'),
      ]);
      setUsersWithRoles(rolesRes.data);
      setAllUsers(usersRes.data);
    } catch (e) {} finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch(); }, []);

  const handleAssign = async () => {
    if (!selectedUser || !selectedRole) {
      Alert.alert('Error', 'Please select both a user and a role');
      return;
    }
    setAssigning(true);
    try {
      await apiClient.post('/roles/assign', { userId: selectedUser, role: selectedRole });
      setShowModal(false);
      Alert.alert('✅ Role Assigned', 'Role has been successfully assigned');
      await fetch();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.error || 'Failed to assign role');
    } finally {
      setAssigning(false);
    }
  };

  const handleRevoke = (roleId: string, roleName: string, userName: string) => {
    Alert.alert('Revoke Role', `Remove ${roleName} from ${userName}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Revoke',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiClient.delete(`/roles/${roleId}`);
            await fetch();
          } catch (e: any) {
            Alert.alert('Error', e?.response?.data?.error || 'Failed to revoke role');
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['rgba(212,175,55,0.08)', 'transparent']} style={styles.headerGradient} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.text.primary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Role Management</Text>
          <Text style={styles.headerSub}>Assign & manage prefect roles</Text>
        </View>
        <Button
          title="Assign"
          onPress={() => setShowModal(true)}
          size="sm"
          icon={<Ionicons name="add" size={16} color={Colors.text.inverse} />}
        />
      </View>

      {loading ? (
        <View style={styles.loader}><ActivityIndicator size="large" color={Colors.primary[500]} /></View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {usersWithRoles.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="shield-outline" size={48} color={Colors.text.tertiary} />
              <Text style={styles.emptyTitle}>No Roles Assigned</Text>
              <Text style={styles.emptySub}>Tap "Assign" to assign roles to students</Text>
            </View>
          ) : (
            usersWithRoles.map((user) => (
              <Card key={user.id} variant="default" style={styles.userCard}>
                {/* User header */}
                <View style={styles.userRow}>
                  <LinearGradient colors={['#D4AF37', '#B8932E']} style={styles.avatar}>
                    <Text style={styles.avatarText}>{user.name.charAt(0).toUpperCase()}</Text>
                  </LinearGradient>
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{user.name}</Text>
                    <Text style={styles.userDetail}>{user.rollNumber}</Text>
                  </View>
                </View>

                {/* Roles */}
                <View style={styles.rolesSection}>
                  {user.userRoles?.map((userRole: any) => (
                    <View key={userRole.id} style={styles.roleRow}>
                      <RoleBadge role={userRole.role} />
                      {userRole.role !== 'SUPER_ADMIN' && (
                        <TouchableOpacity
                          onPress={() => handleRevoke(userRole.id, userRole.role, user.name)}
                          style={styles.revokeBtn}
                        >
                          <Ionicons name="close-circle" size={18} color={Colors.error.main} />
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                </View>
              </Card>
            ))
          )}
        </ScrollView>
      )}

      {/* Assign Role Modal */}
      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Assign Role</Text>

            {/* User picker */}
            <Text style={styles.pickerLabel}>Select Student</Text>
            <ScrollView style={styles.pickerList} nestedScrollEnabled>
              {allUsers.map(user => (
                <TouchableOpacity
                  key={user.id}
                  onPress={() => setSelectedUser(user.id)}
                  style={[styles.pickerItem, selectedUser === user.id && styles.pickerItemActive]}
                >
                  <Text style={[styles.pickerItemText, selectedUser === user.id && styles.pickerItemTextActive]}>
                    {user.name} ({user.rollNumber})
                  </Text>
                  {selectedUser === user.id && <Ionicons name="checkmark-circle" size={18} color={Colors.primary[500]} />}
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Role picker */}
            <Text style={[styles.pickerLabel, { marginTop: Spacing.lg }]}>Select Role</Text>
            <View style={styles.roleGrid}>
              {ASSIGNABLE_ROLES.map(role => (
                <TouchableOpacity
                  key={role.value}
                  onPress={() => setSelectedRole(role.value)}
                  style={[styles.roleChip, selectedRole === role.value && styles.roleChipActive]}
                >
                  <Text style={[styles.roleChipText, selectedRole === role.value && styles.roleChipTextActive]}>
                    {role.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalActions}>
              <Button title="Cancel" onPress={() => setShowModal(false)} variant="ghost" style={{ flex: 1, marginRight: Spacing.sm }} />
              <Button title="Assign Role" onPress={handleAssign} loading={assigning} style={{ flex: 1 }} />
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
  headerSub: { fontSize: Typography.size.sm, color: Colors.text.secondary },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { paddingHorizontal: Spacing['2xl'], paddingBottom: Spacing['3xl'] },
  emptyState: { alignItems: 'center', paddingTop: 80 },
  emptyTitle: { fontSize: Typography.size.xl, fontWeight: Typography.weight.bold, color: Colors.text.primary, marginTop: Spacing.lg },
  emptySub: { fontSize: Typography.size.base, color: Colors.text.secondary, marginTop: Spacing.xs },
  userCard: { marginBottom: Spacing.md },
  userRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
  avatar: { width: 46, height: 46, borderRadius: 23, justifyContent: 'center', alignItems: 'center', marginRight: Spacing.md },
  avatarText: { fontSize: Typography.size.lg, fontWeight: Typography.weight.bold, color: Colors.text.inverse },
  userInfo: { flex: 1 },
  userName: { fontSize: Typography.size.base, fontWeight: Typography.weight.semibold, color: Colors.text.primary },
  userDetail: { fontSize: Typography.size.sm, color: Colors.text.secondary },
  rolesSection: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.border.default, paddingTop: Spacing.md },
  roleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  revokeBtn: { padding: 2 },
  modalOverlay: { flex: 1, backgroundColor: Colors.surface.overlay, justifyContent: 'flex-end' },
  modal: { backgroundColor: Colors.background.elevated, borderTopLeftRadius: BorderRadius['2xl'], borderTopRightRadius: BorderRadius['2xl'], padding: Spacing['2xl'], paddingBottom: Spacing['4xl'], maxHeight: '85%' },
  modalTitle: { fontSize: Typography.size.xl, fontWeight: Typography.weight.bold, color: Colors.text.primary, marginBottom: Spacing.xl },
  pickerLabel: { fontSize: Typography.size.sm, fontWeight: Typography.weight.semibold, color: Colors.text.secondary, marginBottom: Spacing.sm, textTransform: 'uppercase', letterSpacing: 0.4 },
  pickerList: { maxHeight: 160, borderWidth: 1, borderColor: Colors.border.default, borderRadius: BorderRadius.lg, marginBottom: Spacing.sm },
  pickerItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border.subtle },
  pickerItemActive: { backgroundColor: Colors.surface.glassHighlight },
  pickerItemText: { fontSize: Typography.size.sm, color: Colors.text.secondary },
  pickerItemTextActive: { color: Colors.primary[500], fontWeight: Typography.weight.semibold },
  roleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.xl },
  roleChip: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full, backgroundColor: Colors.background.tertiary, borderWidth: 1, borderColor: Colors.border.default },
  roleChipActive: { backgroundColor: Colors.surface.glassHighlight, borderColor: Colors.primary[500] },
  roleChipText: { fontSize: Typography.size.sm, color: Colors.text.secondary },
  roleChipTextActive: { color: Colors.primary[500], fontWeight: Typography.weight.semibold },
  modalActions: { flexDirection: 'row' },
});

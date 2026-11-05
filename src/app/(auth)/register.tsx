import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/theme';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuthStore } from '../../stores/authStore';

const { height } = Dimensions.get('window');

export default function RegisterScreen() {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    rollNumber: '',
    roomNumber: '',
    password: '',
    confirmPassword: '',
    hostelCode: 'BTMH', // Pre-filled for B.T. Men's Hall
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { register, isLoading, error, clearError } = useAuthStore();

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
    if (error) clearError();
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.name.trim()) newErrors.name = 'Name is required';
    if (!form.phone.trim()) newErrors.phone = 'Phone number is required';
    else if (!/^\d{10,15}$/.test(form.phone.trim())) newErrors.phone = 'Enter a valid phone number';
    if (!form.rollNumber.trim()) newErrors.rollNumber = 'Roll number is required';
    if (!form.password) newErrors.password = 'Password is required';
    else if (form.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    if (form.password !== form.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    try {
      await register({
        name: form.name.trim(),
        phone: form.phone.trim(),
        rollNumber: form.rollNumber.trim(),
        roomNumber: form.roomNumber.trim() || undefined,
        password: form.password,
        hostelCode: form.hostelCode,
      });
      router.replace('/(auth)/pending');
    } catch (err: any) {
      // Error handled by store
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(212, 175, 55, 0.06)', 'transparent']}
        style={styles.topGradient}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <Button
              title=""
              onPress={() => router.back()}
              variant="ghost"
              size="sm"
              icon={<Ionicons name="arrow-back" size={22} color={Colors.text.primary} />}
              style={{ alignSelf: 'flex-start', marginBottom: Spacing.lg }}
            />
            <View style={styles.iconWrapper}>
              <LinearGradient
                colors={['#D4AF37', '#B8932E']}
                style={styles.iconGradient}
              >
                <Ionicons name="person-add" size={28} color={Colors.text.inverse} />
              </LinearGradient>
            </View>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>
              Register for B.T. Men's Hall mess system
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Personal Info Section */}
            <View style={styles.sectionHeader}>
              <View style={styles.sectionDot} />
              <Text style={styles.sectionTitle}>Personal Information</Text>
            </View>

            <Input
              label="Full Name"
              placeholder="Enter your full name"
              leftIcon="person-outline"
              value={form.name}
              onChangeText={(v) => updateField('name', v)}
              error={errors.name}
              autoCapitalize="words"
            />
            <Input
              label="Phone Number"
              placeholder="10-digit mobile number"
              leftIcon="call-outline"
              keyboardType="phone-pad"
              value={form.phone}
              onChangeText={(v) => updateField('phone', v)}
              error={errors.phone}
            />
            <Input
              label="Roll Number"
              placeholder="Your university roll number"
              leftIcon="card-outline"
              value={form.rollNumber}
              onChangeText={(v) => updateField('rollNumber', v)}
              error={errors.rollNumber}
              autoCapitalize="characters"
            />
            <Input
              label="Room Number (Optional)"
              placeholder="e.g. 101, A-12"
              leftIcon="home-outline"
              value={form.roomNumber}
              onChangeText={(v) => updateField('roomNumber', v)}
            />

            {/* Security Section */}
            <View style={styles.sectionHeader}>
              <View style={styles.sectionDot} />
              <Text style={styles.sectionTitle}>Security</Text>
            </View>

            <Input
              label="Password"
              placeholder="Minimum 6 characters"
              leftIcon="lock-closed-outline"
              isPassword
              value={form.password}
              onChangeText={(v) => updateField('password', v)}
              error={errors.password}
            />
            <Input
              label="Confirm Password"
              placeholder="Re-enter your password"
              leftIcon="shield-checkmark-outline"
              isPassword
              value={form.confirmPassword}
              onChangeText={(v) => updateField('confirmPassword', v)}
              error={errors.confirmPassword}
            />

            {/* API Error */}
            {error && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={16} color={Colors.error.main} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Info box */}
            <View style={styles.infoBox}>
              <Ionicons name="information-circle-outline" size={18} color={Colors.info.main} />
              <Text style={styles.infoText}>
                Your registration will be reviewed by the Maintenance Prefect before you can access the app.
              </Text>
            </View>

            <Button
              title="Submit Registration"
              onPress={handleRegister}
              loading={isLoading}
              fullWidth
              size="lg"
              style={{ marginTop: Spacing.lg }}
            />

            <View style={styles.loginRow}>
              <Text style={styles.loginText}>Already have an account?</Text>
              <Button
                title="Sign In"
                onPress={() => router.back()}
                variant="ghost"
                size="sm"
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  topGradient: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: height * 0.3,
  },
  scrollContent: {
    paddingHorizontal: Spacing['2xl'],
    paddingTop: Spacing['3xl'],
    paddingBottom: Spacing['4xl'],
  },
  header: {
    marginBottom: Spacing['2xl'],
  },
  iconWrapper: {
    marginBottom: Spacing.lg,
  },
  iconGradient: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
  },
  title: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: Typography.size.base,
    color: Colors.text.secondary,
  },
  form: {},
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    marginTop: Spacing.md,
  },
  sectionDot: {
    width: 4,
    height: 16,
    borderRadius: 2,
    backgroundColor: Colors.primary[500],
    marginRight: Spacing.sm,
  },
  sectionTitle: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semibold,
    color: Colors.text.gold,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.error.bg,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  errorText: {
    fontSize: Typography.size.sm,
    color: Colors.error.main,
    marginLeft: Spacing.sm,
    flex: 1,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.info.bg,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  infoText: {
    fontSize: Typography.size.sm,
    color: Colors.info.main,
    marginLeft: Spacing.sm,
    flex: 1,
    lineHeight: 20,
  },
  loginRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.lg,
  },
  loginText: {
    fontSize: Typography.size.sm,
    color: Colors.text.tertiary,
  },
});

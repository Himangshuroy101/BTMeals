import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/theme';
import { Button } from '../../components/ui/Button';
import { useAuthStore } from '../../stores/authStore';

const { width, height } = Dimensions.get('window');

const steps = [
  { icon: 'person-add-outline', label: 'Registered', done: true },
  { icon: 'shield-checkmark-outline', label: 'Under Review', active: true },
  { icon: 'checkmark-circle-outline', label: 'Approved', done: false },
];

export default function PendingScreen() {
  const { user, loadUser, logout } = useAuthStore();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  // Pulse animation for the waiting icon
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // Rotate animation for the spinner ring
  useEffect(() => {
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  // Auto-refresh user status every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadUser();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Redirect if approved
  useEffect(() => {
    if (user?.status === 'APPROVED') {
      router.replace('/(tabs)');
    }
  }, [user?.status]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(212, 175, 55, 0.08)', 'transparent']}
        style={styles.topGradient}
      />

      <View style={styles.content}>
        {/* Animated logo area */}
        <View style={styles.iconArea}>
          <Animated.View
            style={[styles.spinnerRing, { transform: [{ rotate: spin }] }]}
          />
          <Animated.View style={[styles.iconContainer, { transform: [{ scale: pulseAnim }] }]}>
            <LinearGradient
              colors={['#D4AF37', '#B8932E']}
              style={styles.iconGradient}
            >
              <Ionicons name="hourglass-outline" size={40} color={Colors.text.inverse} />
            </LinearGradient>
          </Animated.View>
        </View>

        {/* Title */}
        <Text style={styles.title}>Awaiting Approval</Text>
        <Text style={styles.subtitle}>
          Your registration is being reviewed by the{'\n'}
          <Text style={styles.highlightText}>Maintenance Prefect</Text>
        </Text>

        {/* Steps */}
        <View style={styles.stepsContainer}>
          {steps.map((step, index) => (
            <View key={index} style={styles.step}>
              {/* Step connector line */}
              {index < steps.length - 1 && (
                <View style={[
                  styles.connector,
                  step.done && styles.connectorDone,
                ]} />
              )}

              {/* Step circle */}
              <View style={[
                styles.stepCircle,
                step.done && styles.stepCircleDone,
                step.active && styles.stepCircleActive,
              ]}>
                <Ionicons
                  name={step.done ? 'checkmark' : step.icon as any}
                  size={16}
                  color={step.done
                    ? Colors.text.inverse
                    : step.active
                    ? Colors.primary[500]
                    : Colors.text.tertiary
                  }
                />
              </View>

              <Text style={[
                styles.stepLabel,
                step.done && styles.stepLabelDone,
                step.active && styles.stepLabelActive,
              ]}>
                {step.label}
              </Text>
            </View>
          ))}
        </View>

        {/* User info card */}
        <View style={styles.userCard}>
          <View style={styles.userCardRow}>
            <Ionicons name="person-circle-outline" size={20} color={Colors.primary[500]} />
            <Text style={styles.userCardLabel}>Name</Text>
            <Text style={styles.userCardValue}>{user?.name}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.userCardRow}>
            <Ionicons name="card-outline" size={20} color={Colors.primary[500]} />
            <Text style={styles.userCardLabel}>Roll No.</Text>
            <Text style={styles.userCardValue}>{user?.rollNumber}</Text>
          </View>
        </View>

        {/* Info text */}
        <Text style={styles.infoText}>
          You'll be notified once your account is approved. This page will refresh automatically.
        </Text>

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            title="Refresh Status"
            onPress={loadUser}
            variant="outline"
            size="md"
            icon={<Ionicons name="refresh-outline" size={18} color={Colors.primary[500]} />}
            style={{ flex: 1, marginRight: Spacing.sm }}
          />
          <Button
            title="Logout"
            onPress={async () => {
              await logout();
              router.replace('/(auth)/login');
            }}
            variant="ghost"
            size="md"
            style={{ flex: 1 }}
          />
        </View>
      </View>
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
    height: height * 0.5,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing['2xl'],
    paddingTop: height * 0.12,
    paddingBottom: Spacing['3xl'],
    alignItems: 'center',
  },
  iconArea: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing['2xl'],
  },
  spinnerRing: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 2,
    borderColor: Colors.primary[700],
    borderTopColor: Colors.primary[500],
    borderRightColor: 'transparent',
  },
  iconContainer: {
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  iconGradient: {
    width: 84,
    height: 84,
    borderRadius: 42,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: Typography.size.base,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Spacing['2xl'],
  },
  highlightText: {
    color: Colors.primary[500],
    fontWeight: Typography.weight.semibold,
  },
  stepsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing['2xl'],
    width: '100%',
  },
  step: {
    alignItems: 'center',
    flex: 1,
    position: 'relative',
  },
  connector: {
    position: 'absolute',
    top: 16,
    left: '50%',
    right: '-50%',
    height: 2,
    backgroundColor: Colors.border.default,
    zIndex: 0,
  },
  connectorDone: {
    backgroundColor: Colors.primary[500],
  },
  stepCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.background.tertiary,
    borderWidth: 1,
    borderColor: Colors.border.default,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
    marginBottom: Spacing.sm,
  },
  stepCircleDone: {
    backgroundColor: Colors.primary[500],
    borderColor: Colors.primary[500],
  },
  stepCircleActive: {
    borderColor: Colors.primary[500],
    backgroundColor: Colors.surface.glassHighlight,
  },
  stepLabel: {
    fontSize: Typography.size.xs,
    color: Colors.text.tertiary,
    textAlign: 'center',
  },
  stepLabelDone: {
    color: Colors.primary[500],
    fontWeight: Typography.weight.medium,
  },
  stepLabelActive: {
    color: Colors.text.primary,
    fontWeight: Typography.weight.semibold,
  },
  userCard: {
    width: '100%',
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border.gold,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  userCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userCardLabel: {
    fontSize: Typography.size.sm,
    color: Colors.text.tertiary,
    marginLeft: Spacing.sm,
    flex: 1,
  },
  userCardValue: {
    fontSize: Typography.size.sm,
    color: Colors.text.primary,
    fontWeight: Typography.weight.semibold,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border.default,
    marginVertical: Spacing.md,
  },
  infoText: {
    fontSize: Typography.size.sm,
    color: Colors.text.tertiary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing['2xl'],
    paddingHorizontal: Spacing.xl,
  },
  actions: {
    flexDirection: 'row',
    width: '100%',
  },
});

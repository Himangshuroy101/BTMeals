import React from 'react';
import { View, Text, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { Colors, BorderRadius, Typography, Spacing } from '../../constants/theme';

interface BadgeProps {
  label: string;
  color?: string;
  bgColor?: string;
  size?: 'sm' | 'md';
  style?: StyleProp<ViewStyle>;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  color = Colors.primary[500],
  bgColor,
  size = 'sm',
  style,
}) => {
  const bg = bgColor || `${color}18`; // 18 = ~10% opacity in hex

  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor: bg,
          paddingHorizontal: size === 'sm' ? Spacing.sm : Spacing.md,
          paddingVertical: size === 'sm' ? 2 : 4,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color,
            fontSize: size === 'sm' ? Typography.size.xs : Typography.size.sm,
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

/**
 * Role-specific badge with predefined colors
 */
export const RoleBadge: React.FC<{ role: string; style?: ViewStyle }> = ({ role, style }) => {
  const roleColors: Record<string, string> = {
    SUPER_ADMIN: Colors.role.superAdmin,
    MAINTENANCE_PREFECT: Colors.role.maintenancePrefect,
    MESS_PREFECT: Colors.role.messPrefect,
    MANAGER: Colors.role.manager,
    STUDENT: Colors.role.student,
    AUDITOR: Colors.role.auditor,
  };

  const roleLabels: Record<string, string> = {
    SUPER_ADMIN: 'Super Admin',
    MAINTENANCE_PREFECT: 'Maintenance',
    MESS_PREFECT: 'Mess Prefect',
    MANAGER: 'Manager',
    STUDENT: 'Student',
    AUDITOR: 'Auditor',
    LIBRARIAN: 'Librarian',
    GAME_PREFECT: 'Game Prefect',
    COOKING_STAFF: 'Cook',
  };

  return (
    <Badge
      label={roleLabels[role] || role}
      color={roleColors[role] || Colors.text.tertiary}
      style={style}
    />
  );
};

/**
 * Meal preference badge (VEG / NON_VEG)
 */
export const PreferenceBadge: React.FC<{ preference: string; style?: ViewStyle }> = ({
  preference,
  style,
}) => (
  <Badge
    label={preference === 'VEG' ? '🟢 Veg' : '🔴 Non-Veg'}
    color={preference === 'VEG' ? Colors.meal.veg : Colors.meal.nonVeg}
    style={style}
  />
);

const styles = StyleSheet.create({
  base: {
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
  },
  text: {
    fontWeight: Typography.weight.semibold,
    letterSpacing: 0.3,
  },
});

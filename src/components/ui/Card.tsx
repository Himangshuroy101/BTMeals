import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, BorderRadius, Spacing, Typography, Shadows } from '../../constants/theme';

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'glass' | 'gold' | 'elevated';
  style?: ViewStyle;
  padding?: keyof typeof Spacing;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  style,
  padding = 'lg',
}) => {
  const variantStyles: Record<string, ViewStyle> = {
    default: {
      backgroundColor: Colors.background.secondary,
      borderColor: Colors.border.default,
      borderWidth: 1,
    },
    glass: {
      backgroundColor: Colors.surface.glass,
      borderColor: Colors.surface.glassBorder,
      borderWidth: 1,
    },
    gold: {
      backgroundColor: Colors.surface.glassHighlight,
      borderColor: Colors.border.gold,
      borderWidth: 1,
    },
    elevated: {
      backgroundColor: Colors.background.elevated,
      ...Shadows.md,
    },
  };

  return (
    <View
      style={[
        styles.base,
        variantStyles[variant],
        { padding: Spacing[padding] },
        style,
      ]}
    >
      {children}
    </View>
  );
};

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  rightElement?: React.ReactNode;
}

export const CardHeader: React.FC<CardHeaderProps> = ({
  title,
  subtitle,
  rightElement,
}) => (
  <View style={styles.header}>
    <View style={styles.headerText}>
      <Text style={styles.headerTitle}>{title}</Text>
      {subtitle && <Text style={styles.headerSubtitle}>{subtitle}</Text>}
    </View>
    {rightElement}
  </View>
);

const styles = StyleSheet.create({
  base: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.semibold,
    color: Colors.text.primary,
  },
  headerSubtitle: {
    fontSize: Typography.size.sm,
    color: Colors.text.secondary,
    marginTop: 2,
  },
});

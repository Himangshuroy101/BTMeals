import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, BorderRadius, Typography, Spacing, Shadows } from '../../constants/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  icon,
  style,
}) => {
  const isDisabled = disabled || loading;

  const sizeStyles: Record<string, { height: number; paddingHorizontal: number; fontSize: number }> = {
    sm: { height: 36, paddingHorizontal: Spacing.lg, fontSize: Typography.size.sm },
    md: { height: 48, paddingHorizontal: Spacing.xl, fontSize: Typography.size.base },
    lg: { height: 56, paddingHorizontal: Spacing['2xl'], fontSize: Typography.size.md },
  };

  const currentSize = sizeStyles[size];

  if (variant === 'primary') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={isDisabled}
        activeOpacity={0.8}
        style={[fullWidth && { width: '100%' }, style]}
      >
        <LinearGradient
          colors={isDisabled
            ? ['#3A3A40', '#2A2A30']
            : ['#D4AF37', '#C9A84C', '#B8932E']
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.base,
            {
              height: currentSize.height,
              paddingHorizontal: currentSize.paddingHorizontal,
            },
            !isDisabled && Shadows.gold,
          ]}
        >
          {loading ? (
            <ActivityIndicator color={Colors.text.inverse} size="small" />
          ) : (
            <>
              {icon && <>{icon}</>}
              <Text style={[
                styles.text,
                { fontSize: currentSize.fontSize, color: Colors.text.inverse },
                icon ? { marginLeft: Spacing.sm } : undefined,
              ]}>
                {title}
              </Text>
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  const variantStyles: Record<string, { bg: string; textColor: string; borderColor?: string }> = {
    secondary: {
      bg: Colors.background.tertiary,
      textColor: Colors.text.primary,
    },
    outline: {
      bg: 'transparent',
      textColor: Colors.primary[500],
      borderColor: Colors.border.gold,
    },
    ghost: {
      bg: 'transparent',
      textColor: Colors.primary[500],
    },
    danger: {
      bg: Colors.error.bg,
      textColor: Colors.error.main,
    },
  };

  const vStyle = variantStyles[variant] || variantStyles.secondary;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
      style={[
        styles.base,
        {
          height: currentSize.height,
          paddingHorizontal: currentSize.paddingHorizontal,
          backgroundColor: vStyle.bg,
          borderWidth: vStyle.borderColor ? 1 : 0,
          borderColor: vStyle.borderColor,
          opacity: isDisabled ? 0.5 : 1,
        },
        fullWidth && { width: '100%' },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={vStyle.textColor} size="small" />
      ) : (
        <>
          {icon && <>{icon}</>}
          <Text style={[
            styles.text,
            { fontSize: currentSize.fontSize, color: vStyle.textColor },
            icon ? { marginLeft: Spacing.sm } : undefined,
          ]}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.lg,
  },
  text: {
    fontWeight: Typography.weight.semibold,
    letterSpacing: 0.3,
  },
});

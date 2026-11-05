/**
 * BTMeals Design System — Theme Constants
 * 
 * Color palette inspired by B.T. Men's Hall logo:
 * Deep black backgrounds with rich gold/amber accents
 */

export const Colors = {
  // ========================
  // PRIMARY PALETTE (Gold)
  // ========================
  primary: {
    50: '#FFF9E6',
    100: '#FFF0BF',
    200: '#FFE699',
    300: '#FFDB66',
    400: '#FFD23D',
    500: '#D4AF37', // Main gold
    600: '#C9A84C',
    700: '#B8932E',
    800: '#9A7B24',
    900: '#7C631D',
  },

  // ========================
  // BACKGROUNDS (Dark)
  // ========================
  background: {
    primary: '#0A0A0C',     // Deepest black
    secondary: '#111114',    // Card backgrounds
    tertiary: '#1A1A1F',     // Elevated surfaces
    elevated: '#222228',     // Modals, dropdowns
    input: '#1E1E24',        // Input fields
  },

  // ========================
  // SURFACES (Glassmorphism)
  // ========================
  surface: {
    glass: 'rgba(255, 255, 255, 0.04)',
    glassBorder: 'rgba(255, 255, 255, 0.08)',
    glassHighlight: 'rgba(212, 175, 55, 0.06)',
    overlay: 'rgba(0, 0, 0, 0.6)',
  },

  // ========================
  // TEXT
  // ========================
  text: {
    primary: '#FFFFFF',
    secondary: '#A0A0B0',
    tertiary: '#6B6B7B',
    disabled: '#404050',
    inverse: '#0A0A0C',
    gold: '#D4AF37',
  },

  // ========================
  // SEMANTIC COLORS
  // ========================
  success: {
    main: '#34D399',
    light: '#6EE7B7',
    dark: '#059669',
    bg: 'rgba(52, 211, 153, 0.1)',
  },
  error: {
    main: '#F87171',
    light: '#FCA5A5',
    dark: '#DC2626',
    bg: 'rgba(248, 113, 113, 0.1)',
  },
  warning: {
    main: '#FBBF24',
    light: '#FDE68A',
    dark: '#D97706',
    bg: 'rgba(251, 191, 36, 0.1)',
  },
  info: {
    main: '#60A5FA',
    light: '#93C5FD',
    dark: '#2563EB',
    bg: 'rgba(96, 165, 250, 0.1)',
  },

  // ========================
  // MEAL-SPECIFIC COLORS
  // ========================
  meal: {
    veg: '#34D399',          // Green for veg
    vegBg: 'rgba(52, 211, 153, 0.12)',
    nonVeg: '#F87171',       // Red for non-veg
    nonVegBg: 'rgba(248, 113, 113, 0.12)',
    on: '#34D399',           // Meal is ON
    onBg: 'rgba(52, 211, 153, 0.1)',
    off: '#6B6B7B',          // Meal is OFF
    offBg: 'rgba(107, 107, 123, 0.1)',
  },

  // ========================
  // ROLE BADGE COLORS
  // ========================
  role: {
    superAdmin: '#D4AF37',
    maintenancePrefect: '#60A5FA',
    messPrefect: '#A78BFA',
    manager: '#F59E0B',
    student: '#6B7280',
    auditor: '#34D399',
  },

  // ========================
  // BORDERS
  // ========================
  border: {
    default: 'rgba(255, 255, 255, 0.06)',
    subtle: 'rgba(255, 255, 255, 0.03)',
    strong: 'rgba(255, 255, 255, 0.12)',
    gold: 'rgba(212, 175, 55, 0.2)',
    goldStrong: 'rgba(212, 175, 55, 0.4)',
  },
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
  '6xl': 64,
} as const;

export const BorderRadius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  '2xl': 24,
  full: 9999,
} as const;

export const Typography = {
  // Font family
  fontFamily: {
    regular: 'System',
    medium: 'System',
    semibold: 'System',
    bold: 'System',
  },

  // Font sizes
  size: {
    xs: 11,
    sm: 13,
    base: 15,
    md: 17,
    lg: 20,
    xl: 24,
    '2xl': 30,
    '3xl': 36,
    '4xl': 48,
  },

  // Line heights
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.7,
  },

  // Font weights
  weight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
  },
} as const;

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  gold: {
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
} as const;

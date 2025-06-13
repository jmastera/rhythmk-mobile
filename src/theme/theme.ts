// src/theme/theme.ts
import { TextStyle, ViewStyle } from 'react-native';

export type Spacing = {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
};

export type Colors = {
  primary: string;
  background: string;
  card: string;
  text: {
    primary: string;
    secondary: string;
    inverse: string;
  };
  border: string;
  success: string;
  error: string;
  warning: string;
};

export type Typography = {
  h1: TextStyle;
  h2: TextStyle;
  h3: TextStyle;
  body: {
    regular: TextStyle;
    small: TextStyle;
  };
  button: TextStyle;
};

export type Theme = {
  colors: Colors;
  spacing: Spacing;
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
    full: number;
  };
  typography: Typography;
};

const baseSpacing: Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

const baseBorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

const baseTypography: Typography = {
  h1: {
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 40,
  },
  h2: {
    fontSize: 24,
    fontWeight: '600',
    lineHeight: 32,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 28,
  },
  body: {
    regular: {
      fontSize: 16,
      lineHeight: 24,
    },
    small: {
      fontSize: 14,
      lineHeight: 20,
    },
  },
  button: {
    fontSize: 16,
    fontWeight: '600',
  },
};

export const lightTheme: Theme = {
  colors: {
    primary: '#10B981',
    background: '#F9FAFB',
    card: '#FFFFFF',
    text: {
      primary: '#111827',
      secondary: '#6B7280',
      inverse: '#FFFFFF',
    },
    border: '#E5E7EB',
    success: '#10B981',
    error: '#EF4444',
    warning: '#F59E0B',
  },
  spacing: baseSpacing,
  borderRadius: baseBorderRadius,
  typography: baseTypography,
};

export const darkTheme: Theme = {
  ...lightTheme,
  colors: {
    ...lightTheme.colors,
    background: '#111827',
    text: {
      ...lightTheme.colors.text,
      primary: '#F9FAFB',
      secondary: '#9CA3AF',
    },
    border: '#374151',
  },
};
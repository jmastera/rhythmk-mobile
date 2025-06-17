// src/theme/styles.ts
import { StyleSheet, ViewStyle, TextStyle, ImageStyle } from 'react-native';
import { lightTheme } from './theme';

type NamedStyles<T> = { [P in keyof T]: ViewStyle | TextStyle | ImageStyle };

export const makeStyles = <T extends NamedStyles<T> | NamedStyles<any>>(
  styles: T | NamedStyles<T>,
) => StyleSheet.create(styles);

// Common styles
export const commonStyles = makeStyles({
  // Flex
  flex1: {
    flex: 1,
  },
  flexGrow1: {
    flexGrow: 1,
  },
  row: {
    flexDirection: 'row',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Spacing
  p4: {
    padding: lightTheme.spacing.xs,
  },
  p8: {
    padding: lightTheme.spacing.sm,
  },
  p16: {
    padding: lightTheme.spacing.md,
  },
  p24: {
    padding: lightTheme.spacing.lg,
  },
  
  // Margins
  m4: {
    margin: lightTheme.spacing.xs,
  },
  m8: {
    margin: lightTheme.spacing.sm,
  },
  m16: {
    margin: lightTheme.spacing.md,
  },
  
  // Text
  textCenter: {
    textAlign: 'center',
  },
  textPrimary: {
    color: lightTheme.colors.text.primary,
  },
  textSecondary: {
    color: lightTheme.colors.text.secondary,
  },
  
  // Buttons
  button: {
    backgroundColor: lightTheme.colors.primary,
    borderRadius: lightTheme.borderRadius.md,
    padding: lightTheme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: lightTheme.colors.text.inverse,
    fontSize: lightTheme.typography.button.fontSize,
    fontWeight: lightTheme.typography.button.fontWeight,
  },
});

// Card styles
export const cardStyles = makeStyles({
  card: {
    backgroundColor: lightTheme.colors.background,
    borderRadius: lightTheme.borderRadius.lg,
    padding: lightTheme.spacing.lg,
    borderWidth: 1,
    borderColor: lightTheme.colors.border,
  },
  selectedCard: {
    backgroundColor: '#F0FDF4',
    borderColor: lightTheme.colors.success,
    borderWidth: 2,
  },
});

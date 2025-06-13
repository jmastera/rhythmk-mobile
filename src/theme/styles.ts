// src/theme/styles.ts
import { StyleSheet, ViewStyle, TextStyle, ImageStyle } from 'react-native';
import { theme } from './theme';

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
    padding: theme.spacing.xs,
  },
  p8: {
    padding: theme.spacing.sm,
  },
  p16: {
    padding: theme.spacing.md,
  },
  p24: {
    padding: theme.spacing.lg,
  },
  
  // Margins
  m4: {
    margin: theme.spacing.xs,
  },
  m8: {
    margin: theme.spacing.sm,
  },
  m16: {
    margin: theme.spacing.md,
  },
  
  // Text
  textCenter: {
    textAlign: 'center',
  },
  textPrimary: {
    color: theme.colors.text.primary,
  },
  textSecondary: {
    color: theme.colors.text.secondary,
  },
  
  // Buttons
  button: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: theme.colors.text.inverse,
    fontSize: theme.text.button.fontSize,
    fontWeight: theme.text.button.fontWeight,
  },
});

// Card styles
export const cardStyles = makeStyles({
  card: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  selectedCard: {
    backgroundColor: '#F0FDF4',
    borderColor: theme.colors.success,
    borderWidth: 2,
  },
});

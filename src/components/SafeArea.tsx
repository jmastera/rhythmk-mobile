// src/components/SafeArea.tsx
import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeProvider';

export type SafeAreaProps = {
  children: ReactNode;
  style?: ViewStyle | ViewStyle[];
  edges?: ('top' | 'right' | 'bottom' | 'left')[];
  backgroundColor?: string;
};

export const SafeArea = ({
  children,
  style,
  edges = ['top', 'right', 'bottom', 'left'],
  backgroundColor,
}: SafeAreaProps) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const safeAreaStyle = {
    flex: 1,
    backgroundColor: backgroundColor || colors.background,
    paddingTop: edges.includes('top') ? insets.top : 0,
    paddingRight: edges.includes('right') ? insets.right : 0,
    paddingBottom: edges.includes('bottom') ? insets.bottom : 0,
    paddingLeft: edges.includes('left') ? insets.left : 0,
  };

  return <View style={[safeAreaStyle, style]}>{children}</View>;
};
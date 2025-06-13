// src/components/Screen.tsx
import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { SafeArea, SafeAreaProps } from './SafeArea';
import { useTheme } from '../theme/ThemeProvider';

type ScreenProps = Omit<SafeAreaProps, 'children'> & {
  children: React.ReactNode;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
};

export const Screen = ({
  children,
  style,
  contentContainerStyle,
  ...rest
}: ScreenProps) => {
  const { spacing } = useTheme();

  const combinedStyle: ViewStyle = StyleSheet.flatten([
    styles.container,
    style,
    contentContainerStyle,
  ]) as ViewStyle;

  return (
    <SafeArea
      style={combinedStyle}
      edges={['top', 'right', 'left']}
      {...rest}
    >
      {children}
    </SafeArea>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
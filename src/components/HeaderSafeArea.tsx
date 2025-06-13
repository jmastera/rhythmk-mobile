import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * A component that provides consistent top padding based on device safe area insets
 * to ensure content appears below the camera notch and status bar.
 */
export const HeaderSafeArea = () => {
  const insets = useSafeAreaInsets();
  
  return (
    <View 
      style={[
        styles.spacer, 
        // Ensure minimum top spacing even on devices without notches
        { height: Math.max(insets.top + 16, 45) }
      ]} 
    />
  );
};

const styles = StyleSheet.create({
  spacer: {
    width: '100%',
    // Removed background color to make it transparent
  },
});

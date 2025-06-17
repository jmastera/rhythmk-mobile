import React from 'react';
import { StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '../theme/ThemeProvider';

// Import screens
import WorkoutTrackerScreen from '../screens/WorkoutTrackerScreen';

// Import types
import { RootStackParamList } from './types';

// Create the stack navigator with RootStackParamList
const Stack = createNativeStackNavigator<RootStackParamList>();

export const StartRunStack = () => {
  const theme = useTheme();
  
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.background,
        },
        headerTintColor: theme.colors.text.primary,
        headerTitleStyle: {
          fontWeight: '600',
          fontSize: 18, // Match font size with other screens
        },
        headerBackTitle: '', // Empty string to hide back title
        contentStyle: {
          backgroundColor: theme.colors.background,
        },
      }}
    >
      <Stack.Screen 
        name="WorkoutTracker" 
        component={WorkoutTrackerScreen} 
        options={{
          title: 'Workout',
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  // Add any shared styles here if needed
});

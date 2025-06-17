import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '../theme/ThemeProvider';

// Import screens
import SettingsScreen from '../screens/SettingsScreen';
import RaceGoalScreen from '../screens/RaceGoalScreen';

// Import types
import { RootStackParamList } from './types';

// Create a stack navigator for the Settings tab
const Stack = createNativeStackNavigator<RootStackParamList>();

export const SettingsStack = () => {
  const theme = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: theme.colors.background,
        },
        headerTintColor: theme.colors.text.primary,
        headerTitleStyle: {
          fontWeight: '600',
        },
        contentStyle: { 
          backgroundColor: theme.colors.background 
        },
      }}
    >
      <Stack.Screen 
        name="SettingsMain" 
        component={SettingsScreen} 
        options={{ 
          headerShown: false,
          title: 'Settings'
        }} 
      />
      <Stack.Screen 
        name="RaceGoal" 
        component={RaceGoalScreen} 
        options={{ 
          title: 'Set Race Goal',
          presentation: 'modal',
        }} 
      />
    </Stack.Navigator>
  );
};

export default SettingsStack;

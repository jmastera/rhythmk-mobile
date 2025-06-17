import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '../theme/ThemeProvider';

// Import screens
import RaceGoalScreen from '../screens/RaceGoalScreen';

// Import types
import { RootStackParamList } from './types';

// Create a stack navigator for the Race Goal tab
const Stack = createNativeStackNavigator<RootStackParamList>();

export const RaceGoalStack = () => {
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
        name="RaceGoalMain" 
        component={RaceGoalScreen} 
        options={{ 
          headerShown: false,
        }} 
      />
    </Stack.Navigator>
  );
};

export default RaceGoalStack;

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '../theme/ThemeProvider';

// Import screens
import IndexScreen from '../screens/IndexScreen';
import LogActivityScreen from '../screens/LogActivityScreen';
import TrainingPlanScreen from '../screens/TrainingPlanScreen';
import { TrainingPlan } from '../types/planTypes';

// Import types
import { RootStackParamList } from './types';

// Create a stack navigator for the Home tab
const Stack = createNativeStackNavigator<RootStackParamList>();

export const HomeStack = () => {
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
        name="Index" 
        component={IndexScreen} 
        options={{ 
          title: 'RhythmK',
          headerShown: false
        }} 
      />
      <Stack.Screen 
        name="LogActivity" 
        component={LogActivityScreen} 
        options={{ 
          title: 'Log Activity',
          presentation: 'modal',
        }} 
      />
      <Stack.Screen 
        name="TrainingPlan" 
        component={TrainingPlanScreen}
        options={({ route }) => ({
          title: 'Training Plan',
          presentation: 'modal',
        })}
      />
    </Stack.Navigator>
  );
};

export default HomeStack;

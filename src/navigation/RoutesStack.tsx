import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '../theme/ThemeProvider';

// Import screens
import RoutesScreen from '../screens/RoutesScreen';
import RouteDetailsScreen from '../screens/RouteDetailsScreen';
import RaceGoalScreen from '../screens/RaceGoalScreen';

// Import types
import { RootStackParamList } from './types';

// Create a stack navigator for the Routes tab
const Stack = createNativeStackNavigator<RootStackParamList>();

export const RoutesStack = () => {
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
        name="RoutesList" 
        component={RoutesScreen} 
        options={{ 
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="RouteDetails" 
        component={RouteDetailsScreen} 
        options={({ route }) => ({
          title: 'Route Details',
          // You can add more options here if needed
        })}
      />
      <Stack.Screen 
        name="RaceGoal" 
        component={RaceGoalScreen} 
        options={{
          title: 'Set Race Goal',
          headerShown: true,
        }}
      />
    </Stack.Navigator>
  );
};

export default RoutesStack;

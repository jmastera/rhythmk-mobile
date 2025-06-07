import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import IndexScreen from './src/screens/IndexScreen';
import NotFoundScreen from './src/screens/NotFoundScreen';
import WorkoutTracker from './src/components/WorkoutTracker'; // Import WorkoutTracker
import SettingsScreen from './src/screens/SettingsScreen'; // Import SettingsScreen
import ProgressScreen from './src/screens/ProgressScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import RaceGoalScreen from './src/screens/RaceGoalScreen';
import LogActivityScreen from './src/screens/LogActivityScreen'; // Import LogActivityScreen
import { StatusBar } from 'expo-status-bar'; // Keep StatusBar if desired
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, Text } from 'react-native'; // Added Text import
import { initializeDatabase } from './src/utils/Database'; // Import database initializer

// Define the type for the stack navigator route params
// Ensure this interface matches or is imported from a shared types file
interface TrainingPlanDetails {
  fitnessLevel: string;
  raceType: string;
}

export type RootStackParamList = {
  Index: undefined; // No params for Index
  NotFound: undefined; // No params for NotFound
  WorkoutTracker: { currentPlan?: TrainingPlanDetails }; // WorkoutTracker now accepts currentPlan
  Settings: undefined; // Add SettingsScreen
  Progress: undefined;
  History: undefined;
  RaceGoal: undefined;
  LogActivity: undefined; // Add LogActivityScreen
  // Add other screen definitions here as we migrate them
  // e.g., WorkoutDetail: { workoutId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const queryClient = new QueryClient();

// New component to host Navigation and use insets
const AppNavigation = () => {
  const insets = useSafeAreaInsets(); // Correctly called within a child of SafeAreaProvider

  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="Index" 
        screenOptions={{
          headerShown: true,
          headerTransparent: true,
          headerStyle: { backgroundColor: 'transparent' },
          headerTitle: '', // Remove header titles globally
          headerBackTitle: '', // Remove back button label text
          headerTintColor: '#ffffff', // Make back arrow white
        }}
      >
        <Stack.Screen
          name="Index"
          component={IndexScreen}
        />
        <Stack.Screen
          name="NotFound"
          component={NotFoundScreen}
        />
        <Stack.Screen
          name="WorkoutTracker"
          component={WorkoutTracker}
        />
        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
        />
        <Stack.Screen
          name="Progress"
          component={ProgressScreen}
        />
        <Stack.Screen
          name="History"
          component={HistoryScreen}
        />
        <Stack.Screen
          name="RaceGoal"
          component={RaceGoalScreen}
        />
        <Stack.Screen
          name="LogActivity"
          component={LogActivityScreen}
        />
        {/* We will add more screens here later */}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default function App() {
  useEffect(() => {
    const initDB = async () => {
      try {
        await initializeDatabase();
        console.log('Database initialized successfully from App.tsx');
      } catch (error) {
        console.error('Failed to initialize database from App.tsx:', error);
      }
    };
    initDB();
  }, []); // Empty dependency array ensures this runs only once on mount

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AppNavigation />
        <StatusBar style="auto" />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

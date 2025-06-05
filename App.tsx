import React from 'react';
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
import { StatusBar } from 'expo-status-bar'; // Keep StatusBar if desired

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
  // Add other screen definitions here as we migrate them
  // e.g., WorkoutDetail: { workoutId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Index">
          <Stack.Screen
            name="Index"
            component={IndexScreen}
            options={{ title: 'Rhythmk' }} // Example title
          />
          <Stack.Screen
            name="NotFound"
            component={NotFoundScreen}
            options={{ title: 'Page Not Found' }}
          />
          <Stack.Screen
            name="WorkoutTracker"
            component={WorkoutTracker}
            options={{ title: 'Track Workout' }} // Example title for WorkoutTracker
          />
          <Stack.Screen
            name="Settings"
            component={SettingsScreen}
            options={{ title: 'Settings' }}
          />
          <Stack.Screen
            name="Progress"
            component={ProgressScreen}
            options={{ title: 'Progress' }}
          />
          <Stack.Screen
            name="History"
            component={HistoryScreen}
            options={{ title: 'History' }}
          />
          <Stack.Screen
            name="RaceGoal"
            component={RaceGoalScreen}
            options={{ title: 'Race Goal' }}
          />
          {/* We will add more screens here later */}
        </Stack.Navigator>
      </NavigationContainer>
      <StatusBar style="auto" />
    </QueryClientProvider>
  );
}

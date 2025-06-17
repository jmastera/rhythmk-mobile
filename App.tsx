import 'react-native-get-random-values';
import React, { useEffect, useState, useRef } from 'react';
import { Audio } from 'expo-av';
import BackgroundTimer from 'react-native-background-timer';
import { NavigationContainer, useNavigationContainerRef, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar as RNStatusBar, View, Text, ActivityIndicator, StyleSheet, useColorScheme } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { ThemeProvider, useTheme } from './src/theme/ThemeProvider';
import { lightTheme, darkTheme } from './src/theme/theme';
import { UserSettingsProvider } from './src/contexts/UserSettingsContext';
import { RouteProvider } from './src/contexts/RouteContext';
import { WorkoutProvider } from './src/contexts/WorkoutContext';
import SQLite from 'react-native-sqlite-storage';
import { supabase } from './src/lib/supabase';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';

// Import screens
import AuthScreen from './src/screens/AuthScreen';
import IndexScreen from './src/screens/IndexScreen';
import NotFoundScreen from './src/screens/NotFoundScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import ProgressScreen from './src/screens/ProgressScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import RaceGoalScreen from './src/screens/RaceGoalScreen';
import LogActivityScreen from './src/screens/LogActivityScreen';
import RoutesScreen from './src/screens/RoutesScreen';
import RouteDetailsScreen from './src/screens/RouteDetailsScreen';
import TrainingPlanScreen from './src/screens/TrainingPlanScreen';
import { TrainingPlan } from './src/types/planTypes';

// Import navigators
import { BottomTabNavigator } from './src/navigation/BottomTabNavigator';

// Initialize SQLite
SQLite.enablePromise(true);

// Create navigation types
export type RootStackParamList = {
  // Auth flow
  Auth: undefined;
  
  // Main app tabs (handled by BottomTabNavigator)
  MainTabs: undefined;
  
  // Modal screens
  WorkoutTracker: { currentPlan?: TrainingPlan; routeToFollow?: any };
  RaceGoal: { goalId?: string };
  RouteDetails: { routeId: string };
  TrainingPlan: {
    fitnessLevel?: string;
    raceType?: string;
    isPreview?: boolean;
  };
  TrainingPlanMain: undefined;
  SettingsMain: undefined;
  
  // Other screens
  NotFound: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const queryClient = new QueryClient();

// Component to handle auth state changes and navigation
const AuthListener = () => {
  const { user } = useAuth();
  const navigation = useNavigation();

  useEffect(() => {
    if (user) {
      // If user is logged in, navigate to MainTabs (which contains the bottom tabs)
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabs' as never }],
      });
    } else {
      // If user is not logged in, navigate to Auth screen
      navigation.reset({
        index: 0,
        routes: [{ name: 'Auth' as never }],
      });
    }
  }, [user, navigation]);

  return null;
};

// Main App component
const App = () => {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSplash, setShowSplash] = useState(true);
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;
  const navigationRef = useNavigationContainerRef();
  const routeNameRef = useRef<string | undefined>(undefined);

  // Hide splash screen after delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // Show splash screen while initializing
  if (showSplash) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <Ionicons name="fitness" size={80} color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.text.primary }]}>
          RhythmK
        </Text>
      </View>
    );
  }

  // Show error if initialization failed
  if (error) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: theme.colors.background }]}>
        <Ionicons name="warning" size={48} color={theme.colors.error} />
        <Text style={[styles.errorText, { color: theme.colors.text.primary }]}>
          {error}
        </Text>
      </View>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <UserSettingsProvider>
            <WorkoutProvider>
              <RouteProvider>
                <NavigationContainer 
                  ref={navigationRef}
                  theme={{
                    dark: colorScheme === 'dark',
                    colors: {
                      primary: theme.colors.primary,
                      background: theme.colors.background,
                      card: theme.colors.background,
                      text: theme.colors.text.primary,
                      border: theme.colors.border,
                      notification: theme.colors.primary,
                    },
                    fonts: {
                      regular: {
                        fontFamily: 'System',
                        fontWeight: 'normal' as const,
                      },
                      medium: {
                        fontFamily: 'System',
                        fontWeight: '500' as const,
                      },
                      bold: {
                        fontFamily: 'System',
                        fontWeight: 'bold' as const,
                      },
                      heavy: {
                        fontFamily: 'System',
                        fontWeight: 'bold' as const,
                      },
                    }
                  } as const}
                  onReady={() => {
                    routeNameRef.current = navigationRef.getCurrentRoute()?.name;
                  }}
                  onStateChange={async () => {
                    const previousRouteName = routeNameRef.current;
                    const currentRouteName = navigationRef.getCurrentRoute()?.name;
                    if (previousRouteName !== currentRouteName) {
                      // Handle route change if needed
                    }
                    routeNameRef.current = currentRouteName;
                  }}
                >
                  <AuthListener />
                  <Stack.Navigator
                    screenOptions={{
                      headerShown: false,
                      contentStyle: { backgroundColor: theme.colors.background },
                      headerStyle: {
                        backgroundColor: theme.colors.background,
                      },
                      headerTintColor: theme.colors.text.primary,
                      headerBackTitle: undefined,
                      presentation: 'modal',
                    }}
                  >
                    {/* Auth Stack */}
                    <Stack.Screen name="Auth" component={AuthScreen} />
                    
                    {/* Main App Tabs */}
                    <Stack.Screen 
                      name="MainTabs" 
                      component={BottomTabNavigator} 
                      options={{ headerShown: false }}
                    />
                    
                    {/* Modal Screens */}
                    <Stack.Screen 
                      name="RaceGoal" 
                      component={RaceGoalScreen} 
                      options={{ 
                        headerShown: true,
                        title: 'Set Race Goal',
                        headerStyle: {
                          backgroundColor: theme.colors.background,
                        },
                        headerTintColor: theme.colors.text.primary,
                      }} 
                    />
                    
                    <Stack.Screen 
                      name="RouteDetails" 
                      component={RouteDetailsScreen} 
                      options={{ 
                        headerShown: true,
                        title: 'Route Details',
                        headerStyle: {
                          backgroundColor: theme.colors.background,
                        },
                        headerTintColor: theme.colors.text.primary,
                      }} 
                    />
                    
                    <Stack.Screen 
                      name="TrainingPlan" 
                      component={TrainingPlanScreen} 
                      options={{ 
                        headerShown: true,
                        title: 'Training Plan',
                        headerStyle: {
                          backgroundColor: theme.colors.background,
                        },
                        headerTintColor: theme.colors.text.primary,
                      }} 
                    />
                    
                    {/* Other Screens */}
                    <Stack.Screen 
                      name="NotFound" 
                      component={NotFoundScreen} 
                      options={{ 
                        title: 'Oops!',
                        headerStyle: {
                          backgroundColor: theme.colors.background,
                        },
                        headerTintColor: theme.colors.text.primary,
                      }} 
                    />
                  </Stack.Navigator>
                </NavigationContainer>
              </RouteProvider>
            </WorkoutProvider>
          </UserSettingsProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 36,
    fontWeight: 'bold',
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    marginTop: 16,
    textAlign: 'center',
  },
});

export default App;

import 'react-native-get-random-values';
import React, { useEffect, useState } from 'react';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar as RNStatusBar, View, Text, ActivityIndicator, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

// Import SQLite
import SQLite from 'react-native-sqlite-storage';

// Initialize SQLite
SQLite.enablePromise(true);

// Import database initialization
import { testConnection } from './src/lib/supabase';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import AuthScreen from './src/screens/AuthScreen';
import ProtectedRoute from './src/components/ProtectedRoute';

// Import screens
import IndexScreen from './src/screens/IndexScreen';
import NotFoundScreen from './src/screens/NotFoundScreen';
import WorkoutTracker from './src/components/WorkoutTracker';
import SettingsScreen from './src/screens/SettingsScreen';
import ProgressScreen from './src/screens/ProgressScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import RaceGoalScreen from './src/screens/RaceGoalScreen';
import LogActivityScreen from './src/screens/LogActivityScreen';

// Import the TrainingPlan type from planTypes
import { TrainingPlan } from './src/types/planTypes';
import { WorkoutEntry } from './src/types/workoutTypes';
import { RouteProp } from '@react-navigation/native';

export type RootStackParamList = {
  Auth: undefined; // Auth screen
  Index: undefined; // No params for Index
  NotFound: undefined; // No params for NotFound
  WorkoutTracker: { currentPlan?: TrainingPlan }; // Updated to use TrainingPlan type
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

// Screen options for authenticated screens
const screenOptions = {
  headerShown: true,
  headerTransparent: true,
  headerStyle: { backgroundColor: 'transparent' },
  headerTitle: '',
  headerBackTitle: '',
  headerTintColor: '#ffffff',
  headerBackImage: () => (
    <Ionicons 
      name="arrow-back" 
      size={24} 
      color="#fff" 
      style={{ marginLeft: Platform.OS === 'ios' ? 8 : 0 }}
    />
  ),
};

// New component to host Navigation and use insets
const AppNavigation = () => {
  const insets = useSafeAreaInsets();
  const { user, initialLoading, signOut } = useAuth();

  // Show loading indicator while checking auth state
  if (initialLoading) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={screenOptions}>
        {!user ? (
          // Auth screens - shown when not logged in
          <Stack.Group screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Auth" component={AuthScreen} />
          </Stack.Group>
        ) : (
          // Authenticated app screens
          <Stack.Group>
            <Stack.Screen
              name="Index"
              component={IndexScreen}
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="WorkoutTracker"
              options={{ title: 'Workout Tracker' }}
            >
              {(props) => (
                <ProtectedRoute>
                  <WorkoutTracker 
                    {...props} 
                    route={props.route as any}
                    onWorkoutComplete={(workout: WorkoutEntry) => {
                      console.log('Workout completed:', workout);
                    }}
                  />
                </ProtectedRoute>
              )}
            </Stack.Screen>
            <Stack.Screen
              name="Settings"
              component={SettingsScreen}
              options={{
                headerRight: () => (
                  <TouchableOpacity onPress={signOut} style={{ marginRight: 16 }}>
                    <Text style={{ color: '#FF3B30', fontSize: 16 }}>Logout</Text>
                  </TouchableOpacity>
                ),
              }}
            />
            <Stack.Screen name="Progress" component={ProgressScreen} />
            <Stack.Screen name="History" component={HistoryScreen} />
            <Stack.Screen name="RaceGoal" component={RaceGoalScreen} />
            <Stack.Screen name="LogActivity" component={LogActivityScreen} />
            <Stack.Screen name="NotFound" component={NotFoundScreen} />
          </Stack.Group>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

// Enable debugging in development
const enableDebugging = () => {
  if (__DEV__) {
    // Enable SQLite debugging if available
    if (SQLite.DEBUG) {
      SQLite.DEBUG(true);
    }
    // Check if enableLogger exists before calling it
    if (typeof (SQLite as any).enableLogger === 'function') {
      (SQLite as any).enableLogger(true);
    }
  }
};

// Call the debugging function
enableDebugging();

function AppContent() {
  const [dbInitialized, setDbInitialized] = useState(false);
  const [dbError, setDbError] = useState<Error | null>(null);
  const { user, initialLoading } = useAuth();

  useEffect(() => {
    let isMounted = true;
    let retryCount = 0;
    const maxRetries = 3;
    const retryDelay = 1000; // 1 second

    const initDB = async () => {
      if (!isMounted) return;
      
      try {
        console.log('Initializing Supabase connection...');
        const { connected, error, details } = await testConnection();
        
        if (!connected) {
          const errorDetails = details ? `\nDetails: ${details}` : '';
          throw new Error(`Failed to connect to Supabase: ${error || 'Unknown error'}${errorDetails}`);
        }
        
        console.log('Supabase connection and query successful');
        
        if (isMounted) {
          setDbInitialized(true);
          setDbError(null);
        }
      } catch (error: any) {
        console.error('Failed to initialize Supabase:', error);
        
        if (retryCount < maxRetries) {
          retryCount++;
          const delay = retryDelay * Math.pow(2, retryCount - 1); // Exponential backoff
          console.log(`Retrying Supabase connection in ${delay}ms (attempt ${retryCount}/${maxRetries})...`);
          setTimeout(initDB, delay);
        } else if (isMounted) {
          const errorMessage = error instanceof Error ? error : new Error(String(error));
          console.error('Max retries reached, giving up:', errorMessage);
          setDbError(errorMessage);
        }
      }
    };
    
    initDB();
    
    // Cleanup on unmount
    return () => {
      isMounted = false;
      // No need to close Supabase connections explicitly
      console.log('App cleanup - Supabase connection will be handled automatically');
    };
  }, []);

  // Show loading/error UI while initializing database or auth
  if (initialLoading || !dbInitialized) {
    return (
      <SafeAreaProvider>
        <View style={[styles.loadingContainer, { padding: 20 }]}>
          {dbError ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>
                Failed to connect to Supabase
              </Text>
              <Text style={[styles.errorText, { marginTop: 10, fontSize: 14 }]}>
                {dbError.message}
              </Text>
              <Text style={[styles.errorText, { marginTop: 10, fontSize: 12 }]}>
                Check your internet connection and try again.
              </Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => {
                  setDbInitialized(false);
                  setDbError(null);
                  // Retry initialization
                  testConnection()
                    .then((isConnected) => {
                      if (isConnected) {
                        setDbInitialized(true);
                      } else {
                        throw new Error('Connection failed');
                      }
                    })
                    .catch(error => setDbError(error));
                }}
              >
                <Text style={styles.retryButtonText}>Retry Connection</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={[styles.loadingText, { marginTop: 10, color: '#FFFFFF' }]}>
                Connecting to Supabase...
              </Text>
            </>
          )}
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <AppNavigation />
        <StatusBar style="auto" />
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}

// Main App component that wraps everything with AuthProvider
export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
    padding: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#121212',
  },
  errorText: {
    color: 'white',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingText: {
    color: 'white',
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  headerRight: {
    marginRight: 16,
  },
  headerButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '500',
  },
});

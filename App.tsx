import 'react-native-get-random-values';
import React, { useEffect, useState, useCallback } from 'react';
import { Audio } from 'expo-av';
import BackgroundTimer from 'react-native-background-timer';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar as RNStatusBar, View, Text, ActivityIndicator, StyleSheet, TouchableOpacity, Platform, AppState } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { UserSettingsProvider } from './src/contexts/UserSettingsContext';

// Import SQLite
import SQLite from 'react-native-sqlite-storage';

// Initialize SQLite
SQLite.enablePromise(true);

// Import database initialization
import { supabase, testConnection as testSupabaseConnection } from './src/lib/supabase';
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
                  <TouchableOpacity 
                    onPress={signOut} 
                    style={{
                      marginRight: 16,
                      padding: 8,
                      borderRadius: 20,
                      backgroundColor: 'rgba(255, 59, 48, 0.1)'
                    }}
                  >
                    <Ionicons name="log-out" size={20} color="#FF3B30" />
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

// Keep track of audio configuration state
let isAudioConfigured = false;

// Safe reference to setTimeout that works in all environments
const safeSetTimeout = (callback: () => void, ms: number): NodeJS.Timeout | null => {
  try {
    if (typeof setTimeout === 'function') {
      return setTimeout(callback, ms) as unknown as NodeJS.Timeout;
    }
    
    if (typeof global !== 'undefined' && (global as any).setTimeout) {
      return (global as any).setTimeout(callback, ms);
    }
    
    console.warn('setTimeout not available in this environment');
    return null;
  } catch (error) {
    console.error('Error in safeSetTimeout:', error);
    return null;
  }
};

// Function to test database connection
const testConnection = async (): Promise<{ connected: boolean; error?: string }> => {
  try {
    // Use the Supabase connection test
    const result = await testSupabaseConnection();
    return { 
      connected: result.connected,
      error: result.error
    };
  } catch (error) {
    console.error('Connection test failed:', error);
    return { 
      connected: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

// Function to initialize the database
const initializeDatabase = async (): Promise<boolean> => {
  try {
    console.log('Initializing database connection...');
    const result = await testConnection();
    
    if (!result.connected) {
      throw new Error(`Failed to connect to database: ${result.error || 'Unknown error'}`);
    }
    
    console.log('Database connection successful');
    return true;
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error instanceof Error ? error : new Error('Failed to initialize database');
  }
};

async function configureAudio() {
  // If audio is already configured, skip reconfiguration
  if (isAudioConfigured) {
    console.log('Audio already configured, skipping...');
    return;
  }

  try {
    console.log('Configuring audio...');
    // Set up audio mode for background playback
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      playThroughEarpieceAndroid: false,
      staysActiveInBackground: true,
      shouldDuckAndroid: true,
    });
    
    isAudioConfigured = true;
    console.log('Audio configuration complete');
  } catch (error) {
    console.error('Error configuring audio:', error);
    // Don't throw here, as we want the app to continue even if audio setup fails
  }
}

// Function to clean up audio resources
async function cleanupAudio() {
  if (!isAudioConfigured) return;
  
  try {
    console.log('Cleaning up audio...');
    // Reset audio mode
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: false,
      playThroughEarpieceAndroid: false,
      staysActiveInBackground: false,
      shouldDuckAndroid: false,
    });
    isAudioConfigured = false;
    console.log('Audio configuration reset');
  } catch (error) {
    console.error('Error cleaning up audio:', error);
  }
}

// AppContent component manages the main app state and initialization

const AppContent: React.FC = () => {
  const [dbInitialized, setDbInitialized] = useState<boolean>(false);
  const [isReady, setIsReady] = useState<boolean>(false);
  const [dbErrorState, setDbErrorState] = useState<Error | null>(null);
  const [initializationComplete, setInitializationComplete] = useState<boolean>(false);
  
  // Helper to set DB error state
  const setDbError = useCallback((error: Error | null) => {
    console.error('Database error:', error);
    setDbErrorState(error);
  }, []);
  
  // Alias for compatibility
  const dbError = dbErrorState;
  const { user, initialLoading } = useAuth();
  
  // Function to test database connection
  const testConnection = useCallback(async (): Promise<{ connected: boolean; error?: string }> => {
    try {
      // Test Supabase connection
      const { data, error } = await supabase.rpc('test_connection');
      
      if (error) {
        console.error('Database connection test failed:', error);
        return { connected: false, error: error.message };
      }
      
      console.log('Database connection test successful:', data);
      return { connected: true };
    } catch (error) {
      console.error('Database connection error:', error);
      return { 
        connected: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }, []);
  
  // Function to initialize the app
  const initializeApp = useCallback(async (): Promise<void> => {
    try {
      // Test database connection
      const result = await testConnection();
      if (!result.connected) {
        throw new Error(result.error || 'Failed to connect to database');
      }
      
      setDbInitialized(true);
      setIsReady(true);
      setInitializationComplete(true);
    } catch (error) {
      console.error('App initialization failed:', error);
      setDbError(error instanceof Error ? error : new Error('Initialization failed'));
      setInitializationComplete(true);
    }
  }, [testConnection]);

  // Initialize app when component mounts
  useEffect(() => {
    let isMounted = true;
    
    const init = async () => {
      try {
        await initializeApp();
        
        // Start audio initialization after app is ready
        if (isMounted) {
          await startAudioInitialization();
        }
      } catch (error) {
        console.error('Initialization error:', error);
      }
    };
    
    init();
    
    return () => {
      isMounted = false;
      // Cleanup will be handled by the audio effect
    };
  }, [initializeApp]);
  
  // Audio initialization function
  const startAudioInitialization = useCallback(async (): Promise<() => void> => {
    let isMounted = true;
    let audioInitTimeout: NodeJS.Timeout | null = null;
    let intervalId: number | null = null;
    let subscription: { remove: () => void } | null = null;
    let retryTimeout: NodeJS.Timeout | null = null;
    
    // Initialize audio
    const initAudio = async (): Promise<void> => {
      if (!isMounted) return;
      
      try {
        console.log('Starting audio initialization...');
        await configureAudio();
        console.log('Audio initialization completed successfully');
      } catch (error) {
        if (isMounted) {
          console.error('Failed to initialize audio, will retry...', error);
          // Retry after a delay if still mounted
          audioInitTimeout = safeSetTimeout(() => {
            if (isMounted) {
              initAudio();
            }
          }, 2000);
        }
      }
    };
    
    // Start the audio initialization
    await initAudio();
    
    // Set up background timer for Android
    if (Platform.OS === 'android') {
      intervalId = BackgroundTimer.setInterval(() => {
        // Keep-alive for background audio
      }, 1000 * 60 * 10); // 10 minutes
      
      // Set up app state listener
      subscription = AppState.addEventListener('change', async (nextAppState) => {
        if (nextAppState === 'background') {
          console.log('App moved to background, ensuring audio continues');
          await configureAudio();
        } else if (nextAppState === 'active') {
          console.log('App is active, audio should be working');
          await configureAudio();
        }
      });
    }
    
    // Return the cleanup function
    return (): void => {
      isMounted = false;
      if (audioInitTimeout) clearTimeout(audioInitTimeout);
      if (intervalId !== null) BackgroundTimer.clearInterval(intervalId);
      if (subscription) subscription.remove();
      if (retryTimeout) clearTimeout(retryTimeout);
    };
  }, []);
  
  // Initialize audio when component mounts
  useEffect(() => {
    let cleanup: (() => void) | null = null;
    
    const initAudio = async () => {
      try {
        const cleanupFn = await startAudioInitialization();
        cleanup = cleanupFn;
      } catch (error) {
        console.error('Audio initialization failed:', error);
      }
    };
    
    initAudio();
    
    return () => {
      if (cleanup) {
        cleanup();
      }
    };
  }, [startAudioInitialization]);
  
  // Render the app content
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      {!initializationComplete ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text style={styles.loadingText}>Initializing app...</Text>
        </View>
      ) : dbError ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error: {dbError.message}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={initializeApp}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <AppNavigation />
          </AuthProvider>
        </QueryClientProvider>
      )}
    </SafeAreaProvider>
  );
};

// Add styles
const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

// Main App component that wraps everything with AuthProvider
const App = () => {
  const [dbError, setDbError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const initializeApp = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      setDbError(null);
      
      // Initialize database connection
      const dbInitialized = await initializeDatabase();
      if (!dbInitialized) {
        throw new Error('Database initialization failed');
      }
      
      // Configure audio
      await configureAudio();
      
      // BackgroundTimer doesn't need explicit start in newer versions
      // It's now used via its methods directly
      
      return; // Implicitly returns a resolved promise
    } catch (error) {
      console.error('Failed to initialize app:', error);
      setDbError(error instanceof Error ? error : new Error('Failed to initialize app'));
      throw error; // Re-throw to be caught by the error boundary
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    initializeApp();
  }, [initializeApp]);

  if (isLoading) {
    return (
      <SafeAreaProvider>
        <View style={[styles.loadingContainer, { padding: 20 }]}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={[styles.loadingText, { marginTop: 10 }]}>
            Initializing app...
          </Text>
        </View>
      </SafeAreaProvider>
    );
  }

  if (dbError) {
    return (
      <SafeAreaProvider>
        <View style={[styles.loadingContainer, { padding: 20 }]}>
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
              onPress={initializeApp}
            >
              <Text style={styles.retryButtonText}>Retry Connection</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <UserSettingsProvider>
            <AppNavigation />
            <StatusBar style="auto" />
          </UserSettingsProvider>
        </SafeAreaProvider>
      </QueryClientProvider>
    </AuthProvider>
  );
};

// Export the main App component
export default App;

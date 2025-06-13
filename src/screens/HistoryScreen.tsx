import React, { useState, useCallback, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  FlatList, 
  Text, 
  TouchableOpacity, 
  Modal, 
  Alert, 
  ActivityIndicator, 
  RefreshControl, 
  SafeAreaView 
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { format } from 'date-fns';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  getActivities as getSupabaseActivities, 
  deleteActivity as deleteDbActivity 
} from '../lib/supabase';
import { WorkoutEntry } from '../types/workoutTypes';
import { formatTime } from '../utils/TimeFormatter';
import { 
  Activity as ActivityIcon, 
  Calendar,
  ChevronLeft,
  Clock,
  Footprints,
  MapPin, 
  Flame, 
  X 
} from 'lucide-react-native';
import ErrorBoundary from '../components/ErrorBoundary';
import WorkoutDetail from '../components/WorkoutDetail';
import { WORKOUT_HISTORY_KEY } from '../types/history';
import { HeaderSafeArea } from '../components/HeaderSafeArea';

// Navigation types
type RootStackParamList = {
  History: undefined;
  EditWorkout: { workout: any };
};

type HistoryScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'History'>;

// Workout item interfaces
interface BaseWorkoutItem {
  id: string | number;
  date: string;
  duration: number; // in seconds
  distance?: number | null; // in meters
  avgPace?: number | null; // in seconds per km/mile
  avgHeartRate?: number | null; // in bpm
  caloriesBurned?: number | null;
  notes?: string | null;
  customActivityName?: string | null;
  activityType?: string;
  source: 'run' | 'logged';
}

interface RunHistoryItem extends BaseWorkoutItem {
  source: 'run';
  id: string;
}

interface LoggedActivityItem extends BaseWorkoutItem {
  source: 'logged';
  id: number;
  type: string;
  planName?: string | null;
  created_at?: string;
  coordinates?: any[] | null;
  totalElevationGain?: number | null;
  totalElevationLoss?: number | null;
  splits?: any[] | null;
  steps?: number | null;
  calories?: number | null;
}

const HistoryScreen: React.FC = () => {
  // State management
  const [workouts, setWorkouts] = useState<Array<RunHistoryItem | LoggedActivityItem>>([]);
  const [selectedWorkout, setSelectedWorkout] = useState<RunHistoryItem | LoggedActivityItem | null>(null);
  const [workoutForDetailView, setWorkoutForDetailView] = useState<WorkoutEntry | null>(null);
  const [isModalVisible, setModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<HistoryScreenNavigationProp>();

  // Helper function to convert string to number safely
  const toNumber = (value: string | number | null | undefined): number => {
    if (value === null || value === undefined) return 0;
    return typeof value === 'number' ? value : parseFloat(value) || 0;
  };

  // Helper function to format distance
  const formatDistance = (meters: number | null | undefined): string => {
    if (!meters) return '0.00';
    return (meters / 1000).toFixed(2);
  };

  // Helper function to format pace
  const formatPace = (seconds: number | null | undefined): string => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Handle workout press
  const handleWorkoutPress = (workout: RunHistoryItem | LoggedActivityItem) => {
    setSelectedWorkout(workout);
    
    // Convert to WorkoutEntry format for the detail view
    const entry: WorkoutEntry = {
      id: workout.id.toString(),
      date: workout.date,
      startTime: workout.date, // Using date as startTime if not available
      duration: toNumber(workout.duration),
      distance: toNumber(workout.distance),
      avgPace: toNumber(workout.avgPace),
      calories: toNumber(workout.caloriesBurned || (workout as LoggedActivityItem).calories),
      avgHeartRate: toNumber(workout.avgHeartRate),
      type: workout.activityType || 'run',
      notes: workout.notes || undefined,
      totalElevationGain: toNumber((workout as any).elevationGain || (workout as LoggedActivityItem).totalElevationGain),
      totalElevationLoss: toNumber((workout as any).elevationLoss || (workout as LoggedActivityItem).totalElevationLoss),
      steps: toNumber((workout as any).steps),
      splits: (workout as any).splits || [],
      coordinates: (workout as any).coordinates || [],
      planName: (workout as any).planName || null,
    };
    
    setWorkoutForDetailView(entry);
    setModalVisible(true);
  };

  // Load workouts from storage
  const loadWorkouts = useCallback(async () => {
    try {
      setIsLoading(true);
      const savedWorkouts = await AsyncStorage.getItem(WORKOUT_HISTORY_KEY);
      const localWorkouts: RunHistoryItem[] = savedWorkouts ? JSON.parse(savedWorkouts) : [];
      
      // Fetch from Supabase
      const dbActivities = await getSupabaseActivities();
      const loggedItems: LoggedActivityItem[] = dbActivities.map(activity => ({
        ...activity,
        activityType: activity.type,
        customActivityName: activity.planName || null,
        caloriesBurned: activity.caloriesBurned || activity.calories || null,
        source: 'logged',
        date: activity.created_at || new Date().toISOString(),
      }));
      
      // Combine and sort by date
      const allWorkouts = [...localWorkouts, ...loggedItems].sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      
      setWorkouts(allWorkouts);
    } catch (error) {
      console.error('Error loading workouts:', error);
      Alert.alert('Error', 'Failed to load workout history');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load data on focus
  useFocusEffect(
    useCallback(() => {
      loadWorkouts();
    }, [loadWorkouts])
  );

  // Handle deleting a workout
  const handleDeleteWorkout = async (workout: RunHistoryItem | LoggedActivityItem) => {
    try {
      if (workout.source === 'logged') {
        await deleteDbActivity(workout.id as number);
      } else {
        const updatedWorkouts = workouts.filter(w => w.id !== workout.id);
        await AsyncStorage.setItem(WORKOUT_HISTORY_KEY, JSON.stringify(updatedWorkouts));
        setWorkouts(updatedWorkouts);
      }
      setModalVisible(false);
      Alert.alert('Success', 'Workout deleted successfully');
    } catch (error) {
      console.error('Error deleting workout:', error);
      Alert.alert('Error', 'Failed to delete workout');
    }
  };

  // Render loading state
  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // Render empty state
  if (workouts.length === 0) {
    return (
      <View style={styles.centered}>
        <Text>No workouts found</Text>
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <SafeAreaView style={styles.container}>
        <HeaderSafeArea />
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Workout History</Text>
        </View>
        <FlatList
          style={styles.list}
          contentContainerStyle={styles.listContent}
          data={workouts}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.workoutItem}
              onPress={() => handleWorkoutPress(item)}
              onLongPress={() => handleDeleteWorkout(item)}
            >
              <View style={styles.workoutHeader}>
                <View style={styles.dateContainer}>
                  <Calendar size={16} color="#666" style={styles.iconSmall} />
                  <Text style={styles.workoutDate}>
                    {format(new Date(item.date), 'MMM d, yyyy')}
                  </Text>
                </View>
                <Text style={styles.workoutType}>
                  {item.customActivityName || item.activityType || 'Run'}
                </Text>
              </View>
              <View style={styles.workoutDetails}>
                <View style={styles.detailItem}>
                  <Clock size={16} color="#666" />
                  <Text style={styles.detailText}>
                    {formatTime(item.duration)}
                  </Text>
                </View>
                {item.distance && (
                  <View style={styles.detailItem}>
                    <MapPin size={16} color="#666" />
                    <Text style={styles.detailText}>
                      {formatDistance(item.distance)} km
                    </Text>
                  </View>
                )}
                {item.avgPace && (
                  <View style={styles.detailItem}>
                    <Footprints size={16} color="#666" />
                    <Text style={styles.detailText}>
                      {formatPace(item.avgPace)} /km
                    </Text>
                  </View>
                )}
                {item.caloriesBurned && (
                  <View style={styles.detailItem}>
                    <Flame size={16} color="#666" />
                    <Text style={styles.detailText}>
                      {Math.round(item.caloriesBurned)} cal
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          )}
          refreshControl={
            <RefreshControl 
              refreshing={isLoading} 
              onRefresh={loadWorkouts} 
            />
          }
        />

        {/* Workout Detail Modal */}
        <Modal
          visible={isModalVisible}
          animationType="slide"
          onRequestClose={() => setModalVisible(false)}
          statusBarTranslucent={true}
        >
          <SafeAreaView style={{ flex: 1, backgroundColor: '#1f2937' }}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <TouchableOpacity 
                  onPress={() => setModalVisible(false)}
                  style={styles.backButton}
                  hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                >
                  <ChevronLeft size={24} color="#f97316" />
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Workout Details</Text>
                <View style={styles.headerSpacer} />
              </View>
            
            {workoutForDetailView && (
              <WorkoutDetail 
                workout={workoutForDetailView}
                onEditNotes={(workoutId, currentNotes) => {
                  // Close the modal and navigate to edit screen
                  setModalVisible(false);
                  navigation.navigate('EditWorkout', { 
                    workout: {
                      ...workoutForDetailView,
                      id: workoutId,
                      notes: currentNotes
                    } 
                  });
                }}
              />
            )}
            </View>
          </SafeAreaView>
        </Modal>
      </SafeAreaView>
    </ErrorBoundary>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827', // Dark background
  },
  headerTextContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111827',
  },
  workoutItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937', // Darker border
    backgroundColor: '#1f2937', // Dark card background
    marginHorizontal: 8,
    marginVertical: 4,
    borderRadius: 8,
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  workoutDate: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 4,
    color: '#f3f4f6', // Light text
  },
  workoutType: {
    fontSize: 14,
    color: '#9ca3af', // Lighter text for secondary info
    textTransform: 'capitalize',
  },
  workoutDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginTop: 4,
  },
  detailText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#d1d5db', // Light gray text
  },
  iconSmall: {
    marginRight: 4,
    color: '#9ca3af', // Match secondary text color
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#111827', // Dark background
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
    backgroundColor: '#1f2937',
  },
  backButton: {
    padding: 8,
    marginRight: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#f3f4f6',
    flex: 1,
    textAlign: 'center',
    marginRight: 40, // To balance the flex space
  },
  headerSpacer: {
    width: 40, // Same as back button width for balance
    height: 40, // Match the height of the back button for vertical alignment
  },
  closeButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#111827', // Match container background
  },
  contentContainer: {
    paddingBottom: 20,
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 8,
  },
});

export default HistoryScreen;

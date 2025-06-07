import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUserSettings } from '../hooks/useUserSettings';
import { HeaderSafeArea } from '../components/HeaderSafeArea';
import { formatPaceDisplay, formatDistanceDisplay } from '../utils/units';
import { LinearGradient } from 'expo-linear-gradient';
import { Calendar, MapPin, Clock, Zap, TrendingUp, X } from 'lucide-react-native';
import ErrorBoundary from '../components/ErrorBoundary'; // Import ErrorBoundary
import WorkoutDetail from '../components/WorkoutDetail'; 
import { WorkoutEntry, WORKOUT_HISTORY_KEY } from '../types/history';
import { getActivities, deleteActivity as deleteDbActivity } from '../utils/Database'; // Renamed to avoid conflict 
import AsyncStorage from '@react-native-async-storage/async-storage';
// Define a type for logged activities from the database
interface LoggedActivity {
  id: number; // Assuming id is number from DB
  activityType: string;
  customActivityName?: string | null;
  date: string; // ISO date string
  duration: number; // in seconds
  intensity?: string | null;
  notes?: string | null;
  caloriesBurned?: number | null;
}

// Define a unified history item type
interface UnifiedHistoryItemBase {
  date: string; // Common property for sorting
  id: string | number; // string for runs, number for logged activities
}

interface RunHistoryItem extends WorkoutEntry, UnifiedHistoryItemBase {
  source: 'run';
  id: string; // WorkoutEntry id is string
}

interface LoggedActivityItem extends LoggedActivity, UnifiedHistoryItemBase {
  source: 'logged';
  id: number; // LoggedActivity id is number
}

export type UnifiedHistoryItem = RunHistoryItem | LoggedActivityItem;

const HistoryScreen: React.FC = () => {
  const { settings } = useUserSettings();
  const insets = useSafeAreaInsets();
  // Using any type for navigation since we don't have the RootStackParamList defined yet
  const navigation = useNavigation<any>();
  const [workouts, setWorkouts] = useState<UnifiedHistoryItem[]>([]);
  const [selectedWorkout, setSelectedWorkout] = useState<UnifiedHistoryItem | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      const loadAllHistory = async () => {
        setIsLoading(true);
        let combinedHistory: UnifiedHistoryItem[] = [];

        try {
          // 1. Fetch runs from AsyncStorage
          const storedWorkoutsJson = await AsyncStorage.getItem(WORKOUT_HISTORY_KEY);
          if (storedWorkoutsJson) {
            const parsedRuns: WorkoutEntry[] = JSON.parse(storedWorkoutsJson);
            const runItems: RunHistoryItem[] = parsedRuns.map(run => ({ ...run, source: 'run' as const, id: run.id }));
            combinedHistory.push(...runItems);
          }

          // 2. Fetch logged activities from SQLite
          // getActivities returns Promise<{ success: boolean; data?: LoggedActivity[]; error?: string; }>
          const dbActivitiesResult = await getActivities(); 
          if (dbActivitiesResult.success && Array.isArray(dbActivitiesResult.data)) {
            const loggedItems: LoggedActivityItem[] = dbActivitiesResult.data.map((act: LoggedActivity) => ({
              ...act,
              source: 'logged' as const,
              id: act.id, 
            }));
            combinedHistory.push(...loggedItems);
          } else if (!dbActivitiesResult.success) {
            console.error('Failed to load logged activities:', dbActivitiesResult.error);
          }

          // 3. Sort combined history by date, most recent first
          combinedHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          setWorkouts(combinedHistory);

        } catch (error) {
          console.error('Failed to load history:', error);
          setWorkouts([]); // Set to empty array on error
        }
        setIsLoading(false);
      };

      // Define the update workout notes function here so it has access to loadAllHistory
      const updateWorkoutNotes = async (workoutId: string, notes: string) => {
        try {
          // Get existing workouts
          const workoutsJson = await AsyncStorage.getItem(WORKOUT_HISTORY_KEY);
          if (workoutsJson) {
            const workouts: WorkoutEntry[] = JSON.parse(workoutsJson);
            
            // Find and update the specific workout
            const updatedWorkouts = workouts.map(workout => {
              if (workout.id === workoutId) {
                return { ...workout, notes };
              }
              return workout;
            });
            
            // Save back to storage
            await AsyncStorage.setItem(WORKOUT_HISTORY_KEY, JSON.stringify(updatedWorkouts));
            
            // Update the workouts in state
            loadAllHistory();
            
            return true;
          }
        } catch (error) {
          console.error('Error updating workout notes:', error);
        }
        return false;
      };
      
      // Store the function in state so it's accessible outside
      setUpdateWorkoutNotesState(() => updateWorkoutNotes);
      
      // Load history on mount
      loadAllHistory();

      return () => {
        // Clean up if needed
      };
    }, [])
  );


  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  const getTypeStyle = (item: UnifiedHistoryItem) => {
    if (item.source === 'logged') {
      // Default style for logged activities
      return { backgroundColor: 'rgba(75, 85, 99, 0.2)', textColor: '#4b5563', borderColor: 'rgba(75, 85, 99, 0.5)' };
    }
    // Existing logic for runs (planName is on RunHistoryItem)
    const planName = item.planName;
    if (!planName) return { backgroundColor: 'rgba(107, 114, 128, 0.2)', textColor: '#6b7280', borderColor: 'rgba(107, 114, 128, 0.5)' };
    const stylesMap: { [key: string]: { backgroundColor: string; textColor: string; borderColor: string } } = {
      'Easy Run': { backgroundColor: 'rgba(34, 197, 94, 0.2)', textColor: '#22c55e', borderColor: 'rgba(34, 197, 94, 0.5)' },
      'Recovery': { backgroundColor: 'rgba(59, 130, 246, 0.2)', textColor: '#3b82f6', borderColor: 'rgba(59, 130, 246, 0.5)' },
      'Tempo': { backgroundColor: 'rgba(249, 115, 22, 0.2)', textColor: '#f97316', borderColor: 'rgba(249, 115, 22, 0.5)' },
      'Long Run': { backgroundColor: 'rgba(168, 85, 247, 0.2)', textColor: '#a855f7', borderColor: 'rgba(168, 85, 247, 0.5)' },
      'Intervals': { backgroundColor: 'rgba(239, 68, 68, 0.2)', textColor: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.5)' },
    };
    return stylesMap[planName] || { backgroundColor: 'rgba(107, 114, 128, 0.2)', textColor: '#6b7280', borderColor: 'rgba(107, 114, 128, 0.5)' };
  };

  const totalStats = {
    totalRuns: workouts.filter(w => w.source === 'run').length,
    totalDistance: parseFloat(
      (workouts.reduce((sum, w) => {
        if (w.source === 'run') {
          return sum + w.distance;
        }
        return sum;
      }, 0) / 1000).toFixed(1)
    ),
    totalDuration: workouts.reduce((sum, w) => sum + w.duration, 0), // duration is common
  };

  const handleWorkoutPress = (workout: UnifiedHistoryItem) => {
    // For workouts from tracked runs
    if (workout.source === 'run') {
      setSelectedWorkout(workout);
      setModalVisible(true);
      return;
    }
    
    // For logged activities, show an alert with details and options
    if (workout.source === 'logged') {
      const durationInSeconds = workout.duration;
      const durationString = typeof durationInSeconds === 'number' && !isNaN(durationInSeconds)
        ? `${Math.round(durationInSeconds / 60)} minutes` // Convert seconds to minutes and round
        : 'N/A';
      
      Alert.alert(
        workout.customActivityName || workout.activityType,
        `Duration: ${durationString}\nIntensity: ${workout.intensity || 'N/A'}\nNotes: ${workout.notes || 'N/A'}`,
        [
          { text: 'Close', style: 'cancel' },
          { 
            text: 'Edit', 
            onPress: () => {
              // Navigate to LogActivityScreen with edit params
              navigation.navigate('LogActivity', {
                editMode: true,
                activityId: workout.id,
                activityType: workout.customActivityName ? 'Other' : workout.activityType,
                customActivityName: workout.customActivityName,
                date: workout.date,
                duration: workout.duration,
                intensity: workout.intensity,
                notes: workout.notes,
                caloriesBurned: workout.caloriesBurned
              });
            }
          }
        ]
      );
    }
  };

  // Function to handle editing notes for tracked runs
  const handleEditRunNotes = useCallback(async (workoutId: string, currentNotes: string | undefined) => {
    // Close the modal
    setModalVisible(false);
    
    // Navigate to the LogActivityScreen with just the notes editing parameters
    navigation.navigate('LogActivity', {
      editMode: true,
      isRunNotesEdit: true,
      workoutId: workoutId,
      notes: currentNotes || ''
    });
  }, [navigation]);

  // Move the updateWorkoutNotes inside useFocusEffect so it can access loadAllHistory
  const [updateWorkoutNotesState, setUpdateWorkoutNotesState] = useState<
    ((workoutId: string, notes: string) => Promise<boolean>) | null
  >(null);

  const handleDeleteWorkout = async (itemToDelete: UnifiedHistoryItem) => {
    Alert.alert(
      'Delete Workout',
      'Are you sure you want to delete this workout? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          onPress: async () => {
            try {
              let updatedWorkouts = workouts.filter(w => w.id !== itemToDelete.id);
            if (itemToDelete.source === 'run') {
              // Filter out the deleted run and save only runs back to AsyncStorage
              const runsToSave = updatedWorkouts.filter(w => w.source === 'run') as RunHistoryItem[];
              await AsyncStorage.setItem(WORKOUT_HISTORY_KEY, JSON.stringify(runsToSave));
            } else if (itemToDelete.source === 'logged') {
              // Call deleteDbActivity for logged items (which are numbers)
              const result = await deleteDbActivity(itemToDelete.id as number);
              if (!result.success) {
                Alert.alert('Error', result.error || 'Failed to delete logged activity from database.');
                // Potentially revert optimistic update if DB delete fails by re-fetching
                // loadAllHistory(); // Make sure loadAllHistory is accessible or defined if needed here
                return; // Prevent setting state if DB delete failed
              }
            }
              setWorkouts(updatedWorkouts);
              // AsyncStorage.setItem was moved into the 'run' block, no longer needed here for all cases
            } catch (error) {
              console.error('Failed to delete workout:', error);
              Alert.alert('Error', 'Could not delete item. Please try again.');
              // Optionally, reload history to revert optimistic update if save fails
              // loadAllHistory(); // Make sure loadAllHistory is accessible or defined here
            }
          },
          style: 'destructive',
        },
      ],
      { cancelable: true }
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centeredContent]}>
        <HeaderSafeArea />
        <Text style={styles.loadingText}>Loading workouts...</Text>
      </View>
    );
  }

  if (workouts.length === 0) {
    return (
      <View style={[styles.container, styles.centeredContent]}>
        <HeaderSafeArea />
        <Text style={styles.noWorkoutsText}>No Workouts Yet</Text>
        <Text style={styles.noWorkoutsSubText}>Complete a workout to see your history here.</Text>
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <View style={styles.container}>
        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={styles.contentContainer}>
          <HeaderSafeArea />
          <View style={styles.headerTextContainer}>
            <Text style={styles.mainTitle}>Workout History</Text>
            <Text style={styles.mainSubtitle}>Review your past activities and performance.</Text>
          </View>
          {/* Summary Card */}
          <LinearGradient
            colors={['#8b5cf6', '#7c3aed']} // Violet gradient
            style={[styles.card, styles.summaryCard]}
          >
            <Text style={styles.summaryCardTitle}>Lifetime Stats</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItemWide}>
                <Text style={styles.statValue}>{totalStats.totalRuns}</Text>
                <Text style={styles.statLabel}>Total Runs</Text>
              </View>
              <View style={styles.statItemWide}>
                <Text style={styles.statValue}>{totalStats.totalDistance} km</Text>
                <Text style={styles.statLabel}>Total Distance</Text>
              </View>
              <View style={styles.statItemWide}>
                <Text style={styles.statValue}>{formatTime(totalStats.totalDuration)}</Text>
                <Text style={styles.statLabel}>Total Time</Text>
              </View>
            </View>
          </LinearGradient>

          {/* Workout List */}
          {workouts.map((item) => {
            const typeStyle = getTypeStyle(item);
            if (item.source === 'run') {
              // Render card for a Run (existing logic, ensuring item is cast to RunHistoryItem for type safety)
              const runItem = item as RunHistoryItem;
              return (
                <TouchableOpacity 
                  key={runItem.id} 
                  onPress={() => handleWorkoutPress(runItem)} 
                  onLongPress={() => handleDeleteWorkout(runItem)} 
                  style={[styles.card, styles.workoutItemCard]}
                >
                  <View style={styles.workoutItemHeader}>
                    <View style={styles.dateContainer}>
                      <Calendar size={16} color={typeStyle.textColor} style={styles.iconSmall} />
                      <Text style={[styles.dateText, { color: typeStyle.textColor }]}>
                        {new Date(runItem.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        {' • '}
                        {new Date(runItem.date).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                      </Text>
                    </View>
                    <View style={[styles.badge, { backgroundColor: typeStyle.backgroundColor, borderColor: typeStyle.borderColor }]}>
                      <Text style={[styles.badgeText, { color: typeStyle.textColor }]}>{(runItem.planName || 'Free Run').toUpperCase()}</Text>
                    </View>
                  </View>
                  <View style={styles.workoutStatsGrid}>
                    <View style={styles.workoutStatItem}>
                      <MapPin size={18} color="#9ca3af" />
                      <Text style={styles.workoutStatValue}>
                        {formatDistanceDisplay(item.distance, settings.displayUnit)}
                      </Text>
                      <Text style={styles.workoutStatLabel}>Distance</Text>
                    </View>
                    <View style={styles.workoutStatItem}>
                      <Clock size={18} color="#9ca3af" />
                      <Text style={styles.workoutStatValue}>{formatTime(item.duration)}</Text>
                      <Text style={styles.workoutStatLabel}>Duration</Text>
                    </View>
                    <View style={styles.workoutStatItem}>
                      <Zap size={16} color="#9ca3af" style={styles.iconSmall} />
                      <Text style={styles.workoutStatValue}>
                        {item.avgPace !== undefined
                          ? formatPaceDisplay(item.avgPace, settings.displayUnit)
                          : '--:--'}
                      </Text>
                      <Text style={styles.workoutStatLabel}>Avg Pace</Text>
                    </View>
                    <View style={styles.workoutStatItem}>
                      <TrendingUp size={18} color="#9ca3af" />
                      <Text style={styles.workoutStatValue}>
                        {runItem.avgHeartRate ? `${Math.round(runItem.avgHeartRate)} bpm` : 'N/A'}
                      </Text>
                      <Text style={styles.workoutStatLabel}>Avg HR</Text>
                    </View>
                  </View>
                </TouchableOpacity>
          );
        } else if (item.source === 'logged') {
          // Render card for a Logged Activity
          const loggedItem = item as LoggedActivityItem;
          return (
            <TouchableOpacity key={loggedItem.id} onPress={() => handleWorkoutPress(loggedItem)} onLongPress={() => handleDeleteWorkout(loggedItem)} style={[styles.card, styles.workoutItemCard, {backgroundColor: typeStyle.backgroundColor}]}>
              <View style={styles.workoutItemHeader}>
                 <View style={styles.dateContainer}>
                  <Calendar size={16} color={typeStyle.textColor} style={styles.iconSmall} />
                  <Text style={[styles.dateText, { color: typeStyle.textColor }]}>
                    {new Date(loggedItem.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    {' • '}
                    {new Date(loggedItem.date).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                  </Text>
                </View>
                <View style={[styles.badge, { backgroundColor: typeStyle.borderColor, borderColor: typeStyle.textColor }]}>
                  <Text style={[styles.badgeText, { color: typeStyle.textColor }]}>{(loggedItem.activityType).toUpperCase()}</Text>
                </View>
              </View>
              <Text style={[styles.loggedActivityTitle, {color: typeStyle.textColor}]}>{loggedItem.customActivityName || loggedItem.activityType}</Text>
              <View style={styles.loggedActivityDetailsContainer}>
                <View style={styles.loggedActivityDetailItem}>
                  <Clock size={16} color="#9ca3af" />
                  <Text style={styles.loggedActivityDetailText}>Duration: {formatTime(loggedItem.duration)}</Text>
                </View>
                {loggedItem.intensity && (
                  <View style={styles.loggedActivityDetailItem}>
                    <Zap size={16} color="#9ca3af" />{/* Using Zap for intensity, can change icon */}
                    <Text style={styles.loggedActivityDetailText}>Intensity: {loggedItem.intensity}</Text>
                  </View>
                )}
                {loggedItem.caloriesBurned !== null && loggedItem.caloriesBurned !== undefined && (
                  <View style={styles.loggedActivityDetailItem}>
                    {/* Icon for calories, e.g., Fire icon */}
                    <Text style={styles.loggedActivityDetailText}>Calories: {loggedItem.caloriesBurned}</Text>
                  </View>
                )}
              </View>
              {loggedItem.notes && <Text style={[styles.itemNotes, {color: typeStyle.textColor}]}>Notes: {loggedItem.notes}</Text>}
            </TouchableOpacity>
          );
        }
        return null; // Should not happen
      })}

          {/* Workout Detail Modal */}
          {selectedWorkout && selectedWorkout.source === 'run' && (
            <Modal
              animationType="slide"
              transparent={true}
              visible={modalVisible}
              onRequestClose={() => {
                setModalVisible(!modalVisible);
              }}>
              <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Workout Details</Text>
                    <TouchableOpacity onPress={() => setModalVisible(false)}>
                      <X size={24} color="white" />
                    </TouchableOpacity>
                  </View>
                  <ErrorBoundary>
                    <WorkoutDetail 
                      workout={selectedWorkout} 
                      onEditNotes={handleEditRunNotes} 
                    />
                  </ErrorBoundary>
                </View>
              </View>
            </Modal>
          )}
        </ScrollView>
      </View>
    </ErrorBoundary>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  workoutItemCard: {
    marginBottom: 12,
  },
  workoutStatItem: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 4, // Add some spacing between items
  },
  workoutStatValue: {
    fontSize: 15,
    fontWeight: '600',
    color: 'white',
    marginTop: 2,
  },
  workoutStatLabel: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 2,
    textAlign: 'center',
  },
  workoutStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '500',
    // color: 'white', // Color will be set by typeStyle
  },
  iconSmall: {
    marginRight: 6,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  workoutItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.75)', // Darker overlay
  },
  modalContent: {
    // flex: 1, // Removed to allow content to dictate height up to maxHeight
    width: '90%',
    maxHeight: '85%', // Slightly increased maxHeight
    backgroundColor: '#1e293b', // slate-800 (consistent with cards)
    borderRadius: 8, // Consistent border radius
    // padding: 20, // Padding will be handled by ScrollView content container
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    overflow: 'hidden', // Ensures children (ScrollView) respect border radius
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    // marginBottom: 16, // Margin handled by ScrollView content
    borderBottomWidth: 1,
    // borderBottomColor: 'rgba(255,255,255,0.1)',
    borderBottomColor: '#334155', // slate-700
    paddingHorizontal: 16, // Consistent horizontal padding
    paddingVertical: 16,
    backgroundColor: '#273246', // Slightly different shade for header, slate-800 variant
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  loggedActivityTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5,
  },
  loggedActivityDetailsContainer: {
    marginTop: 8,
  },
  loggedActivityDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  loggedActivityDetailText: {
    fontSize: 14,
    marginLeft: 6,
    color: '#4b5563',
  },
  itemNotes: {
    fontSize: 13,
    fontStyle: 'italic',
    color: '#6b7280',
    marginTop: 8,
  },
  centeredContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: 'white',
    textAlign: 'center',
    marginTop: 50,
  },
  noWorkoutsText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  noWorkoutsSubText: {
    fontSize: 16,
    color: '#9ca3af', // slate-400
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  container: {
    flex: 1,
    backgroundColor: '#111827', // slate-900 (darker than #121212)
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32, // Ensure space for last item
  },
  headerTextContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  mainSubtitle: {
    fontSize: 16,
    color: '#94a3b8', // slate-400
  },
  card: {
    backgroundColor: '#1e293b', // slate-800
    borderRadius: 8, // Consistent border radius
    padding: 16,
    marginBottom: 16,
    // borderColor: 'rgba(255, 255, 255, 0.15)', // Can use slate-700 for border
    borderColor: '#334155', // slate-700
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  summaryCard: {
    // backgroundColor was '#8b5cf6', now handled by LinearGradient
    marginBottom: 20,
  },
  summaryCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 12,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  statItemWide: {
    alignItems: 'center',
    flex: 1, // Allow items to take equal width
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  // WorkoutDetail will be wrapped in a ScrollView inside the modal
  // so styles for detailLabel, detailValue are in WorkoutDetail.tsx
});

export default HistoryScreen;

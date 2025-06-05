import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Alert } from 'react-native';
import { useUserSettings } from '../hooks/useUserSettings';
import { formatPaceDisplay, formatDistanceDisplay } from '../utils/units';
import { LinearGradient } from 'expo-linear-gradient';
import { Calendar, MapPin, Clock, Zap, TrendingUp, X } from 'lucide-react-native';
import ErrorBoundary from '../components/ErrorBoundary'; // Import ErrorBoundary
import WorkoutDetail from '../components/WorkoutDetail'; 
import { WorkoutEntry, WORKOUT_HISTORY_KEY } from '../types/history'; 
import AsyncStorage from '@react-native-async-storage/async-storage';
const HistoryScreen: React.FC = () => {
  const { settings } = useUserSettings();
  const [workouts, setWorkouts] = useState<WorkoutEntry[]>([]);
  const [selectedWorkout, setSelectedWorkout] = useState<WorkoutEntry | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      const loadWorkouts = async () => {
        setIsLoading(true);
        try {
          const storedWorkouts = await AsyncStorage.getItem(WORKOUT_HISTORY_KEY);
          if (storedWorkouts) {
            const parsedWorkouts: WorkoutEntry[] = JSON.parse(storedWorkouts);
            // Sort by date, most recent first
            parsedWorkouts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            setWorkouts(parsedWorkouts);
          } else {
            setWorkouts([]);
          }
        } catch (error) {
          console.error('Failed to load workouts:', error);
          setWorkouts([]);
        }
        setIsLoading(false);
      };

      loadWorkouts();

      return () => {
        // Optional cleanup if needed when screen loses focus
      };
    }, [])
  );


  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  const getTypeStyle = (planName: string | undefined) => {
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
    totalRuns: workouts.length,
    totalDistance: parseFloat((workouts.reduce((sum, w) => sum + w.distance, 0) / 1000).toFixed(1)),
    totalDuration: workouts.reduce((sum, w) => sum + w.duration, 0),
  };

  const handleWorkoutPress = (workout: WorkoutEntry) => {
    setSelectedWorkout(workout);
    setModalVisible(true);
  };

  const handleDeleteWorkout = async (workoutId: string) => {
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
              const updatedWorkouts = workouts.filter(w => w.id !== workoutId);
              setWorkouts(updatedWorkouts);
              await AsyncStorage.setItem(WORKOUT_HISTORY_KEY, JSON.stringify(updatedWorkouts));
            } catch (error) {
              console.error('Failed to delete workout:', error);
              Alert.alert('Error', 'Could not delete workout. Please try again.');
              // Optionally, reload workouts to revert optimistic update if save fails
              // loadWorkouts(); // Make sure loadWorkouts is accessible or defined here
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
        <Text style={styles.loadingText}>Loading workouts...</Text>
      </View>
    );
  }

  if (workouts.length === 0) {
    return (
      <View style={[styles.container, styles.centeredContent]}>
        <Text style={styles.noWorkoutsText}>No Workouts Yet</Text>
        <Text style={styles.noWorkoutsSubText}>Complete a workout to see your history here.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
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
      {workouts.map((workout) => {
        const typeStyle = getTypeStyle(workout.planName);
        return (
          <TouchableOpacity key={workout.id} onPress={() => handleWorkoutPress(workout)} onLongPress={() => handleDeleteWorkout(workout.id)} style={[styles.card, styles.workoutItemCard]}>
            <View style={styles.workoutItemHeader}>
              <View style={styles.dateContainer}>
                <Calendar size={16} color={typeStyle.textColor} style={styles.iconSmall} />
                <Text style={[styles.dateText, { color: typeStyle.textColor }]}>
                  {new Date(workout.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </Text>
              </View>
              <View style={[styles.badge, { backgroundColor: typeStyle.backgroundColor, borderColor: typeStyle.borderColor }]}>
                <Text style={[styles.badgeText, { color: typeStyle.textColor }]}>{(workout.planName || 'Free Run').toUpperCase()}</Text>
              </View>
            </View>

            <View style={styles.workoutStatsGrid}>
              <View style={styles.workoutStatItem}>
                <MapPin size={18} color="#9ca3af" />
                <Text style={styles.workoutStatValue}>
                  {formatDistanceDisplay(workout.distance, settings.displayUnit)}
                </Text>
                <Text style={styles.workoutStatLabel}>Distance</Text>
              </View>
              <View style={styles.workoutStatItem}>
                <Clock size={18} color="#9ca3af" />
                <Text style={styles.workoutStatValue}>{formatTime(workout.duration)}</Text>
                <Text style={styles.workoutStatLabel}>Duration</Text>
              </View>
              <View style={styles.workoutStatItem}>
                <Zap size={16} color="#9ca3af" style={styles.iconSmall} />
                <Text style={styles.workoutStatValue}>
                  {workout.avgPace !== undefined
                    ? formatPaceDisplay(workout.avgPace, settings.displayUnit)
                    : '--:--'}
                </Text>
                <Text style={styles.workoutStatLabel}>Avg Pace</Text>
              </View>
              <View style={styles.workoutStatItem}>
                <TrendingUp size={18} color="#9ca3af" />
                <Text style={styles.workoutStatValue}>N/A</Text>
                <Text style={styles.workoutStatLabel}>Avg HR</Text>
              </View>
            </View>
          </TouchableOpacity>
        );
      })}

      {/* Workout Detail Modal */}
      {selectedWorkout && (
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
                <WorkoutDetail workout={selectedWorkout} />
              </ErrorBoundary>
            </View>
          </View>
        </Modal>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
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
  workoutItemCard: {
    // Styles for individual workout cards
  },
  workoutItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconSmall: {
    marginRight: 6,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '500',
    // color: 'white', // Color will be set by typeStyle
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8, // Consistent border radius
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  workoutStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  workoutStatItem: {
    alignItems: 'center',
    flex: 1, // Distribute space evenly
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
    color: '#9ca3af', // slate-400 (lighter gray for labels)
    marginTop: 2,
    textAlign: 'center',
  },
  // Modal Styles
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
  // WorkoutDetail will be wrapped in a ScrollView inside the modal
  // so styles for detailLabel, detailValue are in WorkoutDetail.tsx
});

export default HistoryScreen;

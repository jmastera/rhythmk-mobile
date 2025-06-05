import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Calendar, MapPin, Clock, Zap, TrendingUp, X } from 'lucide-react-native';
import WorkoutDetail from './WorkoutDetail';
import { Workout } from '../types/workout'; // Adjust path as necessary

const WorkoutHistory: React.FC = () => {
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const mockWorkouts: Workout[] = [
    {
      id: '1',
      userId: 'mockUser123',
      date: '2025-06-02T08:00:00Z',
      type: 'Easy Run',
      distance: 5200, // meters
      duration: 28 * 60, // seconds
      pace: '5:23/km',
      avgHeartRate: 145,
      calories: 312,
      notes: 'Felt great today, good recovery from yesterday',
      routeCoordinates: [{latitude: 0, longitude: 0, timestamp: 0}],
      splits: [{splitNumber: 1, distance: 1000, duration: 323, pace: '5:23/km'}],
      totalElevationGain: 20,
      totalElevationLoss: 15
    },
    {
      id: '2',
      userId: 'mockUser123',
      date: '2025-06-01T17:30:00Z',
      type: 'Recovery',
      distance: 3000,
      duration: 18 * 60,
      pace: '6:00/km',
      avgHeartRate: 130,
      calories: 180,
      notes: 'Easy pace, focused on form',
      routeCoordinates: [],
      splits: [],
      totalElevationGain: 5,
      totalElevationLoss: 5
    },
    {
      id: '3',
      userId: 'mockUser123',
      date: '2025-05-30T07:00:00Z',
      type: 'Tempo',
      distance: 7000,
      duration: 32 * 60,
      pace: '4:34/km',
      avgHeartRate: 165,
      calories: 420,
      notes: 'Strong tempo run, hit target pace',
      routeCoordinates: [{latitude: 1, longitude: 1, timestamp: 1}],
      splits: [{splitNumber: 1, distance: 1000, duration: 274, pace: '4:34/km'}],
      totalElevationGain: 50,
      totalElevationLoss: 45
    },
    {
      id: '4',
      userId: 'mockUser123',
      date: '2025-05-28T09:00:00Z',
      type: 'Long Run',
      distance: 12000,
      duration: 68 * 60,
      pace: '5:40/km',
      avgHeartRate: 155,
      calories: 720,
      notes: 'Built endurance, stayed consistent',
      routeCoordinates: [],
      splits: [],
      totalElevationGain: 120,
      totalElevationLoss: 110
    },
    {
      id: '5',
      userId: 'mockUser123',
      date: '2025-05-26T18:00:00Z',
      type: 'Intervals',
      distance: 6000,
      duration: 26 * 60,
      pace: '4:20/km',
      avgHeartRate: 175,
      calories: 360,
      notes: '6x800m intervals, good speed work',
      routeCoordinates: [],
      splits: [],
      totalElevationGain: 30,
      totalElevationLoss: 25
    }
  ];

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  const getTypeStyle = (type: string) => {
    const stylesMap: { [key: string]: { backgroundColor: string; textColor: string; borderColor: string } } = {
      'Easy Run': { backgroundColor: 'rgba(34, 197, 94, 0.2)', textColor: '#22c55e', borderColor: 'rgba(34, 197, 94, 0.5)' },
      'Recovery': { backgroundColor: 'rgba(59, 130, 246, 0.2)', textColor: '#3b82f6', borderColor: 'rgba(59, 130, 246, 0.5)' },
      'Tempo': { backgroundColor: 'rgba(249, 115, 22, 0.2)', textColor: '#f97316', borderColor: 'rgba(249, 115, 22, 0.5)' },
      'Long Run': { backgroundColor: 'rgba(168, 85, 247, 0.2)', textColor: '#a855f7', borderColor: 'rgba(168, 85, 247, 0.5)' },
      'Intervals': { backgroundColor: 'rgba(239, 68, 68, 0.2)', textColor: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.5)' },
    };
    return stylesMap[type] || { backgroundColor: 'rgba(107, 114, 128, 0.2)', textColor: '#6b7280', borderColor: 'rgba(107, 114, 128, 0.5)' };
  };

  const totalStats = {
    totalRuns: mockWorkouts.length,
    totalDistance: mockWorkouts.reduce((sum, workout) => sum + workout.distance, 0) / 1000, // km
    totalTime: mockWorkouts.reduce((sum, workout) => sum + workout.duration, 0), // seconds
    // avgPace: '5:16' // Calculating true average pace is more complex, placeholder for now
  };

  const handleWorkoutPress = (workout: Workout) => {
    setSelectedWorkout(workout);
    setModalVisible(true);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.headerTextContainer}>
        <Text style={styles.mainTitle}>Workout History</Text>
        <Text style={styles.mainSubtitle}>Your complete running journey</Text>
      </View>

      {/* Summary Stats Card */}
      <LinearGradient
        colors={['#8b5cf6', '#7c3aed']} // Example purple gradient
        style={[styles.card, styles.summaryCard]}
      >
        <Text style={styles.summaryCardTitle}>All Time Stats</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItemWide}>
            <Text style={styles.statValue}>{totalStats.totalRuns}</Text>
            <Text style={styles.statLabel}>Total Runs</Text>
          </View>
          <View style={styles.statItemWide}>
            <Text style={styles.statValue}>{totalStats.totalDistance.toFixed(1)}km</Text>
            <Text style={styles.statLabel}>Distance</Text>
          </View>
          <View style={styles.statItemWide}>
            <Text style={styles.statValue}>{formatTime(totalStats.totalTime)}</Text>
            <Text style={styles.statLabel}>Time</Text>
          </View>
          {/* <View style={styles.statItemWide}>
            <Text style={styles.statValue}>{totalStats.avgPace}</Text>
            <Text style={styles.statLabel}>Avg Pace</Text>
          </View> */}
        </View>
      </LinearGradient>

      {/* Workout List */}
      {mockWorkouts.map((workout) => {
        const typeSpecificStyle = getTypeStyle(workout.type);
        return (
          <TouchableOpacity key={workout.id} onPress={() => handleWorkoutPress(workout)} style={[styles.card, styles.workoutItemCard]}>
            <View style={styles.workoutItemHeader}>
              <View style={styles.dateContainer}>
                <Calendar size={16} color="#9ca3af" style={styles.iconSmall} />
                <Text style={styles.dateText}>{new Date(workout.date).toLocaleDateString()}</Text>
              </View>
              <View style={[styles.badge, { backgroundColor: typeSpecificStyle.backgroundColor, borderColor: typeSpecificStyle.borderColor }]}>
                <Text style={[styles.badgeText, { color: typeSpecificStyle.textColor }]}>{workout.type}</Text>
              </View>
            </View>
            <View style={styles.workoutStatsGrid}>
              <View style={styles.workoutStatItem}>
                <MapPin size={16} color="#f97316" style={styles.iconSmall} />
                <Text style={styles.workoutStatValue}>{(workout.distance / 1000).toFixed(1)}km</Text>
                <Text style={styles.workoutStatLabel}>Distance</Text>
              </View>
              <View style={styles.workoutStatItem}>
                <Clock size={16} color="#f97316" style={styles.iconSmall} />
                <Text style={styles.workoutStatValue}>{formatTime(workout.duration)}</Text>
                <Text style={styles.workoutStatLabel}>Duration</Text>
              </View>
              <View style={styles.workoutStatItem}>
                <Zap size={16} color="#f97316" style={styles.iconSmall} />
                <Text style={styles.workoutStatValue}>{workout.pace}</Text>
                <Text style={styles.workoutStatLabel}>Pace</Text>
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
            setSelectedWorkout(null);
          }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{selectedWorkout.type} - Details</Text>
                <TouchableOpacity onPress={() => { setModalVisible(false); setSelectedWorkout(null); }}>
                  <X size={24} color="#9ca3af" />
                </TouchableOpacity>
              </View>
              {(console.log('WorkoutHistory - selectedWorkout in Modal:', selectedWorkout), null)}
              <WorkoutDetail workout={selectedWorkout} />
            </View>
          </View>
        </Modal>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  contentContainer: {
    padding: 16,
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
    color: '#a0a0a0',
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
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
    color: 'white',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
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
  },
  workoutStatValue: {
    fontSize: 15,
    fontWeight: '600',
    color: 'white',
    marginTop: 2,
  },
  workoutStatLabel: {
    fontSize: 11,
    color: '#a0a0a0',
    marginTop: 2,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContent: {
    flex: 1, // Added to allow child ScrollView to expand
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#1e1e1e', // Darker card background
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    paddingBottom: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  detailLabel: {
    fontSize: 14,
    color: '#a0a0a0',
    marginBottom: 8,
  },
  detailValue: {
    fontWeight: '600',
    color: 'white',
  },
});

export default WorkoutHistory;


import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MapPin, Clock, Zap, Target, Watch, Navigation } from 'lucide-react-native';
import { UserSettings } from '../types/userTypes'; // Adjust path if necessary, ensure this type is correct

interface WorkoutStatsGridProps {
  displayDistance: string;
  displayDuration: string;
  displayPace: string;
  displayAvgPace: string;
  displayCalories: string;
  totalElevationGain: number;
  settings: UserSettings; 
}

const WorkoutStatsGrid: React.FC<WorkoutStatsGridProps> = ({
  displayDistance,
  displayDuration,
  displayPace,
  displayAvgPace,
  displayCalories,
  totalElevationGain,
  settings,
}) => {
  return (
    <View style={styles.statsGrid}>
      <View style={styles.statCard}>
        <MapPin size={24} color="#FFA500" style={styles.statIcon} />
        <Text style={styles.statValue}>{displayDistance}</Text>
        <Text style={styles.statLabel}>Distance</Text>
      </View>
      <View style={styles.statCard}>
        <Clock size={24} color="#34D399" style={styles.statIcon} />
        <Text style={styles.statValue}>{displayDuration}</Text>
        <Text style={styles.statLabel}>Duration</Text>
      </View>
      <View style={styles.statCard}>
        <Zap size={24} color="#F472B6" style={styles.statIcon} />
        <Text style={styles.statValue}>{displayPace}</Text>
        <Text style={styles.statLabel}>Pace ({settings.displayUnit === 'miles' ? 'min/mi' : 'min/km'})</Text>
      </View>
      <View style={styles.statCard}>
        <Target size={24} color="#60A5FA" style={styles.statIcon} />
        <Text style={styles.statValue}>{displayAvgPace}</Text>
        <Text style={styles.statLabel}>Avg Pace</Text>
      </View>
      {settings.showCalories && (
        <View style={styles.statCard}>
          <Watch size={24} color="#FBBF24" style={styles.statIcon} />
          <Text style={styles.statValue}>{displayCalories}</Text>
          <Text style={styles.statLabel}>Calories</Text>
        </View>
      )}
      {settings.showElevation && (
        <View style={styles.statCard}>
          <Navigation size={24} color="#A78BFA" style={styles.statIcon} />
          <Text style={styles.statValue}>{totalElevationGain.toFixed(0)} m</Text>
          <Text style={styles.statLabel}>Elevation Gain</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  statCard: {
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#333',
    width: '48%',
    marginBottom: 8,
  },
  statIcon: {
    marginBottom: 8,
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#AAA',
  },
});

export default WorkoutStatsGrid;

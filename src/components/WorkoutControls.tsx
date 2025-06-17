import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Play, Pause, Square, Save, Headphones, Footprints } from 'lucide-react-native';
import { WorkoutState } from '../types/workoutTypes'; // Adjust path if necessary

interface WorkoutControlsProps {
  workoutState: WorkoutState;
  countdownValue: number;
  initiateCountdown: () => void;
  pauseTracking: () => void;
  stopTracking: () => void;
  currentRaceGoalName?: string | null;
  onAudioPress?: () => void;
  onPedometerPress?: () => void;
}

const WorkoutControls: React.FC<WorkoutControlsProps> = ({
  workoutState,
  countdownValue,
  initiateCountdown,
  pauseTracking,
  stopTracking,
  currentRaceGoalName,
  onAudioPress,
  onPedometerPress,
}) => {
  // Render control buttons (audio and pedometer)
  const renderControlButton = (onPress: (() => void) | undefined, icon: React.ReactNode, isActive = false) => (
    <TouchableOpacity 
      style={[styles.controlButton, isActive && styles.controlButtonActive]}
      onPress={onPress}
      disabled={!onPress}
    >
      {icon}
    </TouchableOpacity>
  );
  if (workoutState === 'countdown') {
    return (
      <View style={styles.countdownContainer}>
        <Text style={styles.countdownText}>{countdownValue}</Text>
      </View>
    );
  }

  return (
    <View style={styles.controlsSection}>
      {(workoutState === 'idle' || workoutState === 'finished') && (
        <View style={styles.mainControlsRow}>
          {renderControlButton(onAudioPress, <Headphones size={24} color="#FFF" />, false)}
          <TouchableOpacity 
            style={[styles.button, styles.startButton]} 
            onPress={initiateCountdown}
          >
            <Play size={24} color="#FFF" />
            <Text style={styles.buttonText}>
              {currentRaceGoalName ? `Start Race: ${currentRaceGoalName}` : 'Start Workout'}
            </Text>
          </TouchableOpacity>
          {renderControlButton(onPedometerPress, <Footprints size={24} color="#FFF" />, false)}
        </View>
      )}

      {(workoutState === 'active' || workoutState === 'paused') && (
        <View style={styles.trackingControlsContainer}>
          <TouchableOpacity 
            style={[styles.button, styles.pauseResumeButton, workoutState === 'paused' ? styles.resumeButton : styles.pauseButton]}
            onPress={pauseTracking}
          >
            {workoutState === 'paused' ? <Play size={24} color="#FFF" /> : <Pause size={24} color="#FFF" />}
            <Text style={styles.buttonText}>{workoutState === 'paused' ? 'Resume' : 'Pause'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.finishButton]} onPress={stopTracking}>
            <Square size={24} color="#FFF" />
            <Text style={styles.buttonText}>Finish</Text>
          </TouchableOpacity>
        </View>
      )}

      {workoutState === 'saving' && (
        <View style={[styles.button, styles.savingButton]} >
          <ActivityIndicator size="small" color="#FFF" />
          <Text style={styles.buttonText}>Saving Workout...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  controlsSection: {
    marginBottom: 25,
    alignItems: 'center',
    width: '100%',
  },
  mainControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: 16,
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  controlButtonActive: {
    backgroundColor: '#4B5563',
  },
  countdownContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 100, // Or adjust as needed
    marginBottom: 25,
  },
  countdownText: {
    fontSize: 72,
    fontWeight: 'bold',
    color: '#FFF',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 4,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  startButton: {
    backgroundColor: '#10B981', // Green-500
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    minWidth: 200,
  },
  trackingControlsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 10,
  },
  pauseResumeButton: {
    flex: 1,
    maxWidth: 140,
    marginHorizontal: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 25,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  pauseButton: {
    backgroundColor: '#F59E0B', // Amber-500
  },
  resumeButton: {
    backgroundColor: '#10B981', // Green-500
  },
  finishButton: {
    backgroundColor: '#EF4444', // Red-500
    flex: 1,
    maxWidth: 140,
    marginHorizontal: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 25,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  savingButton: {
    backgroundColor: '#757575', // Grey
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default WorkoutControls;

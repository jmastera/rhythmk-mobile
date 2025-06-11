import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Play, Pause, Square, Save } from 'lucide-react-native';
import { WorkoutState } from '../types/workoutTypes'; // Adjust path if necessary

interface WorkoutControlsProps {
  workoutState: WorkoutState;
  countdownValue: number;
  initiateCountdown: () => void;
  pauseTracking: () => void;
  stopTracking: () => void;
  currentRaceGoalName?: string | null;
}

const WorkoutControls: React.FC<WorkoutControlsProps> = ({
  workoutState,
  countdownValue,
  initiateCountdown,
  pauseTracking,
  stopTracking,
  currentRaceGoalName,
}) => {
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
        <TouchableOpacity style={[styles.button, styles.startButton]} onPress={initiateCountdown}>
          <Play size={24} color="#FFF" />
          <Text style={styles.buttonText}>{currentRaceGoalName ? `Start Race: ${currentRaceGoalName}` : 'Start Workout'}</Text>
        </TouchableOpacity>
      )}

      {(workoutState === 'tracking' || workoutState === 'paused') && (
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
    elevation: 5,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  startButton: {
    backgroundColor: '#4CAF50', // Green
    width: '100%',
    maxWidth: 320, // Slightly wider to accommodate longer text
    paddingVertical: 12,
    paddingHorizontal: 5,
    marginHorizontal: 5,
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
    maxWidth: 150,
    marginHorizontal: 5,
    paddingVertical: 12,
    paddingHorizontal: 5,
  },
  pauseButton: {
    backgroundColor: '#FFC107', // Amber
  },
  resumeButton: {
    backgroundColor: '#4CAF50', // Green
  },
  finishButton: {
    backgroundColor: '#F44336', // Red
    flex: 1,
    maxWidth: 150,
    marginHorizontal: 5,
    paddingVertical: 12,
    paddingHorizontal: 5,
  },
  savingButton: {
    backgroundColor: '#757575', // Grey
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default WorkoutControls;

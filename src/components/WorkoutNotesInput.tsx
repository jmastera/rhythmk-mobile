import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { WorkoutState } from '../types/workoutTypes'; // Adjust path if necessary

interface WorkoutNotesInputProps {
  workoutState: WorkoutState;
  workoutNotes: string;
  setWorkoutNotes: (notes: string) => void;
  style?: {
    color?: string;
    // Add other style properties as needed
  };
}

const WorkoutNotesInput: React.FC<WorkoutNotesInputProps> = ({
  workoutState,
  workoutNotes,
  setWorkoutNotes,
  style,
}) => {
  // Show notes input only when active or paused
  if (workoutState !== 'active' && workoutState !== 'paused') {
    return null;
  }

  return (
    <View style={styles.notesSection}>
      <Text style={[styles.sectionTitleSmall, style]}>Workout Notes:</Text>
      <TextInput
        style={[styles.notesInput, style]}
        value={workoutNotes}
        onChangeText={setWorkoutNotes}
        placeholder="How did it go? Any PBs?"
        placeholderTextColor="#888"
        multiline
      />
    </View>
  );
};

const styles = StyleSheet.create({
  notesSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
    marginTop: 10, // Added margin top for spacing
  },
  sectionTitleSmall: {
    fontSize: 16,
    fontWeight: '600',
    color: '#DDD',
    marginBottom: 10,
  },
  notesInput: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    color: '#FFF',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    minHeight: 60,
    textAlignVertical: 'top',
  },
});

export default WorkoutNotesInput;

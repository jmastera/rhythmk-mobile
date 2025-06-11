import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Lightbulb } from 'lucide-react-native';
import { UserSettings } from '../types/userTypes'; // Adjust path if necessary
import { WorkoutState } from '../types/workoutTypes'; // Adjust path if necessary

export interface CoachTip {
  id: string;
  title: string;
  tip: string;
  conditions?: any; // Define more specific conditions if available
}

interface CoachTipsDisplayProps {
  settings: UserSettings;
  currentCoachTip: CoachTip | null;
  workoutState: WorkoutState;
}

const CoachTipsDisplay: React.FC<CoachTipsDisplayProps> = ({
  settings,
  currentCoachTip,
  workoutState,
}) => {
  if (!settings.showCoachTips || !currentCoachTip || (workoutState !== 'tracking' && workoutState !== 'paused')) {
    return null;
  }

  return (
    <View style={styles.coachTipCard}>
      <View style={styles.coachTipHeader}>
        <Lightbulb size={18} color="#FFA500" style={{ marginRight: 8 }} />
        <Text style={styles.coachTipTitle}>{currentCoachTip.title}</Text>
      </View>
      <Text style={styles.coachTipText}>{currentCoachTip.tip}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  coachTipCard: {
    backgroundColor: 'rgba(255, 165, 0, 0.15)', 
    padding: 15,
    borderRadius: 8,
    borderColor: 'rgba(255, 165, 0, 0.4)',
    borderWidth: 1,
    marginBottom: 10,
    marginTop: 10, // Added margin top for spacing
  },
  coachTipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  coachTipTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFA500',
    flexShrink: 1, // Allow title to shrink if too long
  },
  coachTipText: {
    fontSize: 14,
    color: '#FFDAB9',
    lineHeight: 20,
  },
});

export default CoachTipsDisplay;

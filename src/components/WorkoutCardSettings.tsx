import React from 'react';
import { View, Text, StyleSheet, Switch, useColorScheme } from 'react-native';
import { useUserSettings, WorkoutCardType, WorkoutCardSettings } from '../hooks/useUserSettings';

const cardLabels: Record<WorkoutCardType, string> = {
  distance: 'Distance',
  duration: 'Duration',
  pace: 'Average Pace',
  steps: 'Steps',
  calories: 'Calories',
  stride: 'Stride Length',
  cadence: 'Cadence',
  speed: 'Average Speed',
  elevationGain: 'Elevation Gain',
  caloriesPerKm: 'Calories per km/mi'
};

const cardDescriptions: Record<WorkoutCardType, string> = {
  distance: 'Total distance covered during workout',
  duration: 'Total time spent during workout',
  pace: 'Average speed per kilometer/mile',
  steps: 'Total number of steps taken',
  calories: 'Estimated calories burned',
  stride: 'Average length of each step',
  cadence: 'Steps per minute',
  speed: 'Average speed in km/h or mph',
  elevationGain: 'Total elevation gained during workout',
  caloriesPerKm: 'Calories burned per kilometer/mile'
};

interface WorkoutCardSettingsComponentProps {
  isExpanded: boolean;
}

const defaultCardSettings: WorkoutCardSettings = {
  distance: true,
  duration: true,
  pace: true,
  steps: true,
  calories: true,
  stride: true,
  cadence: true,
  speed: true,
  elevationGain: true,
  caloriesPerKm: true,
} as const;

const WorkoutCardSettingsComponent: React.FC<WorkoutCardSettingsComponentProps> = ({ isExpanded }) => {
  const { settings, updateSettings } = useUserSettings();
  const colorScheme = useColorScheme();
  
  const isDark = colorScheme === 'dark';
  
  const colors = {
    card: isDark ? '#1E1E1E' : '#FFFFFF',
    border: isDark ? '#333333' : '#E0E0E0',
    primary: '#FFA500',
    text: isDark ? '#FFFFFF' : '#000000',
    textSecondary: isDark ? '#AAAAAA' : '#666666'
  };

  const toggleCard = (cardType: WorkoutCardType) => {
    const currentSettings = (settings.workoutCardSettings as Record<WorkoutCardType, boolean> | undefined) || defaultCardSettings;
    updateSettings({
      workoutCardSettings: {
        ...currentSettings,
        [cardType]: !currentSettings[cardType]
      }
    });
  };

  if (!isExpanded) return null;
  
  // Use default settings if not available
  const cardSettings = (settings.workoutCardSettings as Record<WorkoutCardType, boolean> | undefined) || defaultCardSettings;

  return (
    <View style={styles.cardsContainer}>
      {(Object.keys(cardSettings) as WorkoutCardType[]).map((cardType) => (
        <View 
          key={cardType} 
          style={[
            styles.cardToggle, 
            { 
              backgroundColor: colors.card,
              borderColor: colors.border
            }
          ]}
        >
          <View style={styles.cardContent}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              {cardLabels[cardType]}
            </Text>
            <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>
              {cardDescriptions[cardType]}
            </Text>
          </View>
          <Switch
            value={cardSettings[cardType]}
            onValueChange={() => toggleCard(cardType)}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={cardSettings[cardType] ? colors.primary : colors.border}
          />
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  cardsContainer: {
    gap: 12,
    marginBottom: 20,
  },
  cardToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginHorizontal: 16,
  },
  cardContent: {
    flex: 1,
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 13,
    opacity: 0.8,
  },
});

// Export the component as default
export default WorkoutCardSettingsComponent;

// Export the default settings for use in other files
export { defaultCardSettings };

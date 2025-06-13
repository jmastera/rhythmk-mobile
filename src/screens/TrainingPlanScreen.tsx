import React, { useEffect, useCallback, useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../theme/ThemeProvider';
import { SafeArea } from '../components/SafeArea';
import { HeaderSafeArea } from '../components/HeaderSafeArea';
import TrainingPlan from '../components/TrainingPlan';
import { useUserSettings } from '../hooks/useUserSettings';
import { FAB, Button } from 'react-native-paper';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';
import type { RaceGoalData } from '../types/userTypes';

type FitnessLevel = 'beginner' | 'intermediate' | 'advanced';

type Props = NativeStackScreenProps<RootStackParamList, 'TrainingPlan'> & {
  route: {
    params: {
      fitnessLevel: string;
      raceType: string;
      isPreview?: boolean;
    };
  };
};

const TrainingPlanScreen: React.FC<Props> = ({ route, navigation }) => {
  const { fitnessLevel, raceType, isPreview = false } = route.params;
  const [isSaving, setIsSaving] = useState(false);
  const theme = useTheme();
  const { settings, updateSettings } = useUserSettings();

  // Normalize race type for comparison
  const normalizeRaceType = (type: string | undefined) => {
    if (!type) return '';
    // Convert to lowercase and replace any non-word characters with nothing
    // This will convert '5k' to '5k' and 'half-marathon' to 'halfmarathon'
    return type.toLowerCase().replace(/[^a-z0-9]/g, '');
  };

  // Debug logging for settings
  useEffect(() => {
    console.log('Settings loaded:', {
      raceGoal: settings?.raceGoal,
      fitnessLevel: settings?.fitnessLevel,
      hasRaceGoal: !!settings?.raceGoal,
      hasRaceType: !!settings?.raceGoal?.type
    });
  }, [settings]);

  const currentRaceType = normalizeRaceType(settings?.raceGoal?.type);
  const viewingRaceType = normalizeRaceType(raceType);

  // Debug logging for plan comparison
  console.log('Plan comparison:', {
    currentRaceType,
    viewingRaceType,
    currentFitness: settings?.fitnessLevel,
    viewingFitness: fitnessLevel,
    raceTypesMatch: currentRaceType === viewingRaceType,
    fitnessLevelsMatch: settings?.fitnessLevel === (fitnessLevel as FitnessLevel)
  });

  const isCurrentPlan = currentRaceType === viewingRaceType && 
                      settings?.fitnessLevel === (fitnessLevel as FitnessLevel);

  const handleBackPress = () => {
    navigation.goBack();
  };

  const handleSelectPlan = useCallback(async () => {
    try {
      setIsSaving(true);
      console.log('Saving plan:', { fitnessLevel, raceType });
      
      // Create a complete race goal object with all required fields
      const raceGoal: RaceGoalData = {
        type: raceType,
        distance: 0, // Default value, adjust as needed
        time: '00:00:00' // Default value
        // Add other properties as needed
      };
      
      console.log('Updating settings with:', { fitnessLevel, raceGoal });
      
      // Update settings with both fitness level and race goal
      await updateSettings({
        fitnessLevel: fitnessLevel as FitnessLevel,
        raceGoal: raceGoal,
      });
      
      console.log('Plan saved successfully');
      
      // Show success message
      Alert.alert('Success', 'Your training plan has been updated!');
      
      // Navigate back to the previous screen
      navigation.goBack();
      
    } catch (error) {
      console.error('Failed to update plan:', error);
      Alert.alert('Error', 'Failed to save your training plan. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [fitnessLevel, raceType, updateSettings, navigation]);

  return (
    <SafeArea style={styles.container}>
      <HeaderSafeArea />
      <TrainingPlan 
        fitnessLevel={fitnessLevel}
        raceType={raceType}
        onReset={handleBackPress}
      />
      {/* Always show FAB when not the current plan */}
      {!isCurrentPlan && (
        <FAB
          style={[styles.fab, { backgroundColor: theme.colors.primary }]}
          icon="plus"
          onPress={handleSelectPlan}
          color="white"
          size="medium"
        />
      )}
    </SafeArea>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 16,
    bottom: 16,
    borderRadius: 28, // Makes it a perfect circle for medium size FAB
  },
  footer: {
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  confirmButton: {
    marginBottom: 12,
    paddingVertical: 8,
    backgroundColor: '#007AFF',
  },
  cancelButton: {
    paddingVertical: 8,
    borderColor: '#007AFF',
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default TrainingPlanScreen;

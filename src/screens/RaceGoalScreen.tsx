import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { ArrowLeft, CheckCircle, Zap, Edit3 } from 'lucide-react-native';
import { useUserSettings, RaceGoalData } from '../hooks/useUserSettings';
import RaceTypeSelector from '../components/RaceTypeSelector';
import TrainingPlan from '../components/TrainingPlan';
import { HeaderSafeArea } from '../components/HeaderSafeArea';

// Define strict step type to avoid TypeScript comparison errors
type Step = 'selectFitness' | 'selectRaceType' | 'viewPlan' | 'confirmed';

// Helper function to ensure type safety with string literals
const isStepEqual = (currentStep: Step, targetStep: Step): boolean => {
  return currentStep === targetStep;
};

const FITNESS_LEVELS = [
  { id: 'beginner', name: 'Beginner', description: 'Just starting out or returning after a break.' },
  { id: 'intermediate', name: 'Intermediate', description: 'Comfortable with regular runs, looking to improve.' },
  { id: 'advanced', name: 'Advanced', description: 'Experienced runner aiming for peak performance.' },
];

const RACE_DETAILS_MAP: { [key: string]: { name: string; distanceMeters: number } } = {
  '5k': { name: '5K Run', distanceMeters: 5000 },
  '10k': { name: '10K Run', distanceMeters: 10000 },
  'half-marathon': { name: 'Half Marathon', distanceMeters: 21097 },
  'marathon': { name: 'Marathon', distanceMeters: 42195 },
};

const RaceGoalScreen = () => {
  const { settings, updateSettings, isLoadingSettings } = useUserSettings();

  const [step, setStep] = useState<Step>('selectFitness');
  const [flowFitnessLevel, setFlowFitnessLevel] = useState<string | null>(null);
  const [flowRaceType, setFlowRaceType] = useState<string | null>(null);
  const [flowRaceGoalDetails, setFlowRaceGoalDetails] = useState<RaceGoalData | null>(null);
  const [isInitializedFromSettings, setIsInitializedFromSettings] = useState(false);

  useEffect(() => {
    if (!isLoadingSettings && !isInitializedFromSettings) {
      if (settings.fitnessLevel && settings.raceGoal?.type) {
        setFlowFitnessLevel(settings.fitnessLevel);
        setFlowRaceType(settings.raceGoal.type);
        setFlowRaceGoalDetails(settings.raceGoal);
        setStep('viewPlan');
      } else {
        setStep('selectFitness');
        setFlowFitnessLevel(null);
        setFlowRaceType(null);
        setFlowRaceGoalDetails(null);
      }
      setIsInitializedFromSettings(true);
    }
  }, [settings, isLoadingSettings, isInitializedFromSettings]);

  const handleFitnessSelect = (levelId: string) => {
    setFlowFitnessLevel(levelId);
    setFlowRaceType(null); // Reset subsequent selections
    setFlowRaceGoalDetails(null);
    setStep('selectRaceType');
  };

  const handleRaceTypeSelect = (raceId: string) => {
    setFlowRaceType(raceId);
    const raceDetails = RACE_DETAILS_MAP[raceId];
    if (raceDetails) {
      setFlowRaceGoalDetails({ type: raceId, distance: raceDetails.distanceMeters });
    }
    setStep('viewPlan');
  };

  const handleConfirmPlan = async () => {
    if (flowFitnessLevel && flowRaceGoalDetails) {
      await updateSettings({
        fitnessLevel: flowFitnessLevel,
        raceGoal: flowRaceGoalDetails,
      });
      setStep('confirmed');
    }
  };

  const handleEditActiveGoal = () => {
    // Current flowFitnessLevel, flowRaceType, flowRaceGoalDetails are already pre-filled from settings
    // Just need to change the step to start the editing sequence
    setStep('selectFitness');
  };

  const handleResetAndSetNewGoal = () => {
    setFlowFitnessLevel(null);
    setFlowRaceType(null);
    setFlowRaceGoalDetails(null);
    setStep('selectFitness');
    setIsInitializedFromSettings(false); // Allow re-evaluation if user leaves and returns
  };
  
  const handleBackNavigation = () => {
    if (step === ('selectRaceType' as Step)) setStep('selectFitness' as Step);
    // Back from 'viewPlan' is handled by TrainingPlan's onReset prop
    // Back from 'selectFitness' would typically be handled by stack navigator if this is not the initial screen
  };

  if (isLoadingSettings || !isInitializedFromSettings) {
    return (
      <View style={styles.centered}>
        <HeaderSafeArea />
        <ActivityIndicator size="large" color="#f97316" />
      </View>
    );
  }

  const renderHeader = (title: string) => (
    <View style={styles.headerContainer}>
      <Text style={styles.headerTitle}>{title}</Text>
    </View>
  );

  if (step === 'confirmed' as Step) {
    return (
      <View style={[styles.container, styles.centered]}>
        <CheckCircle size={80} color="#22c55e" style={{ marginBottom: 20 }} />
        <Text style={styles.confirmationTitle}>Plan Set!</Text>
        <Text style={styles.confirmationSubtitle}>Your new training plan is ready.</Text>
        <TouchableOpacity style={[styles.button, styles.primaryButton, { marginTop: 30 }]} onPress={handleResetAndSetNewGoal}>
          <Text style={styles.buttonText}>Set Another Goal</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (step === ('selectFitness' as Step)) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContentContainer}>
        {renderHeader(flowFitnessLevel ? 'Editing Goal: Fitness Level' : 'Set Your Fitness Level')}
        <Text style={styles.subtitle}>How would you describe your current running fitness?</Text>
        {FITNESS_LEVELS.map((level) => (
          <TouchableOpacity
            key={level.id}
            style={[styles.selectionCard, flowFitnessLevel === level.id && styles.selectedCard]}
            onPress={() => handleFitnessSelect(level.id)}
          >
            <Zap size={28} color={flowFitnessLevel === level.id ? "white" : "#f97316"} style={styles.cardIcon} />
            <View style={styles.cardTextContainer}>
              <Text style={[styles.selectionTitle, flowFitnessLevel === level.id && styles.selectedText]}>{level.name}</Text>
              <Text style={[styles.selectionDescription, flowFitnessLevel === level.id && styles.selectedTextSecondary]}>{level.description}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  }

  if ((step === 'selectRaceType' as Step) && flowFitnessLevel) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContentContainer}>
        {renderHeader('Select Your Race Goal')}
        <RaceTypeSelector onSelect={handleRaceTypeSelect} currentRaceTypeId={flowRaceType} />
      </ScrollView>
    );
  }

  if ((step === 'viewPlan' as Step) && flowFitnessLevel && flowRaceType && flowRaceGoalDetails) {
    const isViewingActiveSavedPlan =
      settings.fitnessLevel === flowFitnessLevel &&
      settings.raceGoal?.type === flowRaceType &&
      settings.raceGoal?.distance === flowRaceGoalDetails.distance;

    return (
      <ScrollView style={styles.container} contentContainerStyle={[styles.scrollContentContainer, {paddingBottom: 80}]}>
        <TrainingPlan
          fitnessLevel={flowFitnessLevel}
          raceType={flowRaceType}
          onReset={() => setStep('selectRaceType')} // Go back to race type selection
        />
        <View style={styles.fixedActionContainer}>
          <View style={styles.buttonContainerFixed}>
            {isViewingActiveSavedPlan ? (
              <TouchableOpacity
                style={[styles.button, styles.editButton, { flex: 1 } ]}
                onPress={handleEditActiveGoal}
              >
                <Edit3 size={18} color="white" style={{marginRight: 8}} />
                <Text style={styles.buttonText}>Edit Current Goal</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.button, styles.primaryButton, { flex: 1 } ]}
                onPress={handleConfirmPlan}
              >
                <Text style={styles.buttonText}>Confirm & Start Plan</Text>
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity 
            style={styles.stopGoalButton} 
            onPress={() => {
              // Clear race goal data
              updateSettings({
                ...settings,
                raceGoal: undefined,
                fitnessLevel: undefined
              });
              handleResetAndSetNewGoal();
            }}
          >
            <Text style={styles.stopGoalText}>Stop Goal</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }
  
  if (step === ('selectFitness' as Step)) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContentContainer}>
        <HeaderSafeArea />
        {renderHeader('Set Your Fitness Goals')}
        <Text style={styles.subtitle}>Select your current fitness level:</Text>
        {FITNESS_LEVELS.map(level => (
          <TouchableOpacity
            key={level.id}
            style={[
              styles.selectionCard,
              flowFitnessLevel === level.id && styles.selectedCard
            ]}
            onPress={() => handleFitnessSelect(level.id)}
          >
            <Zap
              size={24}
              color={flowFitnessLevel === level.id ? 'white' : '#f97316'}
              style={styles.cardIcon}
            />
            <View style={styles.cardTextContainer}>
              <Text style={[
                styles.selectionTitle,
                flowFitnessLevel === level.id && styles.selectedText
              ]}>
                {level.name}
              </Text>
              <Text style={[
                styles.selectionDescription,
                flowFitnessLevel === level.id && styles.selectedTextSecondary
              ]}>
                {level.description}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  }

  if (step === 'selectRaceType' as Step) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContentContainer}>
        <HeaderSafeArea />
        {renderHeader('Set Your Race Goal')}
        <Text style={styles.subtitle}>Choose the race you're training for:</Text>
        <RaceTypeSelector onSelect={handleRaceTypeSelect} currentRaceTypeId={flowRaceType} />
      </ScrollView>
    );
  }

  if ((step === 'viewPlan' as Step) || (step === 'confirmed' as Step)) {
    return (
      <ScrollView 
        style={styles.container} 
        contentContainerStyle={[styles.scrollContentContainer, { paddingBottom: 120 }]}
      >
        <HeaderSafeArea />
        {renderHeader((step === 'confirmed' as Step) ? 'Training Plan Activated' : 'Review Training Plan')}
        
        {(step === 'confirmed' as Step) ? (
          <View style={{ alignItems: 'center', marginTop: 20, marginBottom: 30 }}>
            <CheckCircle size={60} color="#22c55e" />
            <Text style={styles.confirmationTitle}>Plan Activated!</Text>
            <Text style={styles.confirmationSubtitle}>
              Your training plan is now set. Head to Workout Tracker to start your first run.
            </Text>
          </View>
        ) : null}
        
        {flowFitnessLevel && flowRaceType ? (
          <TrainingPlan 
            fitnessLevel={flowFitnessLevel}
            raceType={flowRaceType}
            // Removed isConfirmed prop as it's not in the TrainingPlanProps interface
            onReset={() => handleBackNavigation()} // Allow canceling plan
          />
        ) : null}
        
        <View style={styles.buttonContainerFixed}>
          {(step !== 'confirmed' as Step) && (
            <TouchableOpacity 
              style={[styles.button, styles.primaryButton, { flex: 1 }]}
              onPress={handleConfirmPlan}
            >
              <Text style={styles.buttonText}>Confirm & Start Plan</Text>
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity 
          style={styles.stopGoalButton} 
          onPress={() => {
            // Clear race goal data
            updateSettings({
              ...settings,
              raceGoal: undefined,
              fitnessLevel: undefined
            });
            handleResetAndSetNewGoal();
          }}
        >
          <Text style={styles.stopGoalText}>Stop Goal</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }
  
  return (
    <View style={styles.centered}>
      <HeaderSafeArea />
      <Text style={styles.subtitle}>Loading goal settings...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  scrollContentContainer: {
    paddingTop: 24, // Consistent with SettingsScreen for front camera clearance
    paddingBottom: 16,
    // paddingBottom: 100, // Adjusted per-screen if fixed button is present
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16, // Consistent padding
    backgroundColor: '#121212',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
    marginBottom: 10,
    marginLeft: 40, // Add space for the back button on the left
  },
  backButton: {
    marginRight: 16,
    padding: 8,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: 'white',
  },
  subtitle: {
    fontSize: 16,
    color: '#a1a1aa', // zinc-400
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  selectionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8, // Consistent border radius
    padding: 16, // Consistent padding
    marginHorizontal: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
  },
  selectedCard: {
    backgroundColor: '#f97316', // orange-500
    borderColor: '#f97316',
  },
  selectedText: {
    color: 'white',
  },
  selectedTextSecondary: {
    color: 'rgba(255,255,255,0.8)',
  },
  cardIcon: {
    marginRight: 16,
  },
  cardTextContainer: {
    flex: 1,
  },
  selectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginBottom: 4,
  },
  selectionDescription: {
    fontSize: 14,
    color: '#d4d4d8', // zinc-300
  },
  buttonContainerFixed: {
    // This view is now part of ScrollView content for 'viewPlan' to avoid overlap issues
    // For other steps, if a fixed button is needed, it should be positioned carefully
    // Or, ensure ScrollView contentContainerStyle has enough paddingBottom
    flexDirection: 'row',
    padding: 16,
    paddingTop: 24, // Give some space from plan content
  },
  fixedActionContainer: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    flexDirection: 'column',
    gap: 15,
  },
  stopGoalButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  stopGoalText: {
    color: '#9ca3af',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    minHeight: 50,
  },
  primaryButton: {
    backgroundColor: '#f97316', // orange-500
  },
  editButton: {
    backgroundColor: '#3f3f46', // zinc-700, for a less prominent edit button
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  confirmationTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 12,
    textAlign: 'center',
  },
  confirmationSubtitle: {
    fontSize: 16,
    color: '#d4d4d8',
    textAlign: 'center',
    marginBottom: 8,
  },
});

export default RaceGoalScreen;

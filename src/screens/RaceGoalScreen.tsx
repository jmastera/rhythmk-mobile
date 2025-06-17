import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  SafeAreaView,
  StatusBar,
  Platform
} from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeProvider';
import { useNavigation } from '@react-navigation/native';
import { useUserSettings } from '../hooks/useUserSettings';
import RaceTypeSelector from '../components/RaceTypeSelector';
import type { RaceGoal } from '../types/userTypes';
import type { Theme } from '../theme/theme';

// Define step types
type Step = 'selectFitness' | 'selectRaceType' | 'viewPlan' | 'confirmed';

// Define fitness levels
type FitnessLevel = 'beginner' | 'intermediate' | 'advanced';

// RaceGoalData represents the structure of a race goal in the app
interface RaceGoalData {
  type: string; // e.g., '5k', '10k', 'Half Marathon', 'Full Marathon', 'Custom Distance', 'Custom Time', 'hyrox'
  distance: number; // in km or miles, depending on unit preference
  time: string; // hh:mm:ss or mm:ss
  raceDetails: {
    name: string;
    distance: number;
    unit: string;
  };
  fitnessLevel: FitnessLevel;
  targetTime: string;
}

type RaceGoalDataWithOptionalDistance = Omit<RaceGoalData, 'distance'> & {
  distance?: number;
};

interface FitnessLevelOption {
  id: FitnessLevel;
  name: string;
  description: string;
}

const FITNESS_LEVELS: FitnessLevelOption[] = [
  {
    id: 'beginner',
    name: 'Beginner',
    description: 'New to running or returning after a long break',
  },
  {
    id: 'intermediate',
    name: 'Intermediate',
    description: 'Run occasionally, looking to improve',
  },
  {
    id: 'advanced',
    name: 'Advanced',
    description: 'Regular runner with race experience',
  },
];

// Create styles with proper TypeScript types
const createStyles = (theme: Theme) => {
  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.colors.background,
      paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },
    container: {
      flex: 1,
      padding: theme.spacing.md,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: theme.spacing.xl,
      paddingTop: theme.spacing.sm,
    },
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
      padding: theme.spacing.lg,
    },
    headerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.lg,
    },
    backButton: {
      padding: theme.spacing.sm,
      marginRight: theme.spacing.sm,
    },
    backButtonPlaceholder: {
      width: 40,
      height: 40,
      marginRight: theme.spacing.sm,
    },
    headerContent: {
      flex: 1,
    },
    headerTitle: {
      ...theme.typography.h2,
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.xs,
    },
    headerDescription: {
      ...theme.typography.body.regular,
      color: theme.colors.text.secondary,
    },
    cardsContainer: {
      marginTop: theme.spacing.md,
    },
    fitnessLevelCard: {
      backgroundColor: theme.colors.background,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    fitnessLevelCardSelected: {
      borderColor: theme.colors.primary,
      backgroundColor: `${theme.colors.primary}10`,
    },
    fitnessLevelContent: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    fitnessLevelName: {
      ...theme.typography.h3,
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.xs,
    },
    fitnessLevelDescription: {
      ...theme.typography.body.regular,
      color: theme.colors.text.secondary,
    },
    selectedIndicator: {
      marginLeft: 'auto',
    },
    button: {
      backgroundColor: theme.colors.primary,
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      alignItems: 'center',
      marginTop: theme.spacing.lg,
    },
    buttonText: {
      ...theme.typography.button,
      color: theme.colors.text.inverse,
    },
    confirmationContainer: {
      alignItems: 'center',
      padding: theme.spacing.xl,
    },
    confirmationTitle: {
      ...theme.typography.h2,
      color: theme.colors.text.primary,
      textAlign: 'center',
      marginBottom: theme.spacing.sm,
    },
    confirmationSubtitle: {
      ...theme.typography.body.regular,
      color: theme.colors.text.secondary,
      textAlign: 'center',
      marginBottom: theme.spacing.xl,
    },
    confirmButton: {
      backgroundColor: theme.colors.primary,
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      alignItems: 'center',
      width: '100%',
    },
    confirmButtonText: {
      ...theme.typography.button,
      color: theme.colors.text.inverse,
    },
    subtitle: {
      ...theme.typography.body.regular,
      color: theme.colors.text.secondary,
      marginBottom: theme.spacing.md,
    },
    selectedText: {
      ...theme.typography.h3,
      color: theme.colors.primary,
      marginBottom: theme.spacing.sm,
    },
    selectedTextSecondary: {
      ...theme.typography.body.regular,
      color: theme.colors.text.secondary,
      marginBottom: theme.spacing.xl,
    },
    errorText: {
      ...theme.typography.body.regular,
      color: theme.colors.error,
      textAlign: 'center',
      marginTop: theme.spacing.md,
    },
    tryAgainButton: {
      marginTop: theme.spacing.md,
      padding: theme.spacing.md,
      alignItems: 'center',
    },
    tryAgainButtonText: {
      ...theme.typography.button,
      color: theme.colors.primary,
    },
    buttonRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: theme.spacing.md,
      marginTop: theme.spacing.xl,
    },
    secondaryButton: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
  });
};

const RaceGoalScreen: React.FC = () => {
  const { settings, updateSettings } = useUserSettings();
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  
  const navigation = useNavigation<any>(); // Using any to avoid navigation type complexity
  const [currentStep, setCurrentStep] = useState<Step>('selectFitness');
  const [selectedFitnessLevel, setSelectedFitnessLevel] = useState<FitnessLevel | null>(null);
  const [selectedRaceType, setSelectedRaceType] = useState<string | null>(null);
  const [flowRaceGoalDetails, setFlowRaceGoalDetails] = useState<RaceGoalData | null>(null);
  const [flowFitnessLevel, setFlowFitnessLevel] = useState<FitnessLevel | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasMadeSelection, setHasMadeSelection] = useState(false);

  // Initialize the screen based on existing settings
  useEffect(() => {
    if (settings) {
      if (settings.fitnessLevel) {
        setFlowFitnessLevel(settings.fitnessLevel as FitnessLevel);
        setSelectedFitnessLevel(settings.fitnessLevel as FitnessLevel);
        
        if (settings.raceGoal?.type) {
          setSelectedRaceType(settings.raceGoal.type);
          setCurrentStep('selectRaceType');
        } else {
          setCurrentStep('selectRaceType');
        }
      } else {
        setCurrentStep('selectFitness');
      }
      setIsInitialized(true);
    }
  }, [settings]);

  // Handle back button press based on current step
  const handleBackPress = () => {
    if (currentStep === 'selectRaceType') {
      if (hasMadeSelection) {
        // If user made a selection but didn't save, reset to original selection
        setSelectedRaceType(settings?.raceGoal?.type || null);
        setHasMadeSelection(false);
      }
      setCurrentStep('selectFitness');
    } else {
      navigation.goBack();
    }
  };

  const handleRaceTypeSelect = (raceId: string) => {
    if (!flowFitnessLevel) return;
    
    // Just navigate to the training plan screen without saving
    // The user will confirm the selection on the next screen
    navigation.navigate('TrainingPlan', {
      fitnessLevel: flowFitnessLevel,
      raceType: raceId,
      isPreview: true // Indicate this is a preview, not yet saved
    });
  };

  // Add your component logic here
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar 
        barStyle={theme.mode === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.background}
      />
      <View style={styles.container}>
        
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          contentInsetAdjustmentBehavior="automatic"
        >
            {currentStep === 'selectFitness' && isInitialized && (
              <View style={styles.cardsContainer}>
                {FITNESS_LEVELS.map((level) => (
                  <TouchableOpacity
                    key={level.id}
                    style={[
                      styles.fitnessLevelCard,
                      selectedFitnessLevel === level.id && styles.fitnessLevelCardSelected,
                    ]}
                    onPress={() => setSelectedFitnessLevel(level.id)}
                  >
                    <View style={styles.fitnessLevelContent}>
                      <View>
                        <Text style={styles.fitnessLevelName}>{level.name}</Text>
                        <Text style={styles.fitnessLevelDescription}>{level.description}</Text>
                      </View>
                      {selectedFitnessLevel === level.id && (
                        <View style={styles.selectedIndicator}>
                          <Text style={{ color: theme.colors.primary }}>✓</Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
                
                {selectedFitnessLevel && (
                  <TouchableOpacity
                    style={styles.button}
                    onPress={() => {
                      setFlowFitnessLevel(selectedFitnessLevel);
                      setCurrentStep('selectRaceType');
                    }}
                  >
                    <Text style={styles.buttonText}>Continue</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
            
            {currentStep === 'selectRaceType' && isInitialized && (
              <View style={{ flex: 1 }}>
                <RaceTypeSelector 
                  onSelect={handleRaceTypeSelect}
                  currentRaceTypeId={selectedRaceType}
                />
              </View>
            )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default RaceGoalScreen;

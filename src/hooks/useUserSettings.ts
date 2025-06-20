import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import types from type definitions
import { AudioCueSettingsData } from '../types/audioTypes';
import { 
  UserSettings, 
  RaceGoalData,
  DisplayUnit
} from '../types/userTypes';

export type WorkoutCardType = 'distance' | 'duration' | 'pace' | 'steps' | 'calories' | 'stride' | 'cadence' | 'speed' | 'elevationGain' | 'caloriesPerKm';

export interface WorkoutCardSettings {
  distance: boolean;
  duration: boolean;
  pace: boolean;
  steps: boolean;
  calories: boolean;
  stride: boolean;
  cadence: boolean;
  speed: boolean;
  elevationGain: boolean;
  caloriesPerKm: boolean;
}

const defaultAudioCueSettings: AudioCueSettingsData = {
  enabled: true,
  volume: 0.8, // 80% volume by default
  distanceUnit: 'km',
  announceDistance: true,
  distanceInterval: 1,
  announceTime: false,
  timeInterval: 5, // 5 minutes
  announcePace: false,
  targetPace: '6:00', // Default to 6:00 min/km
  paceTolerance: 10, // 10 seconds
  announceCalories: false,
  splitAnnouncementsEnabled: true, // Default to true
};

// Extend the base UserSettings with our app-specific settings
type AppUserSettings = UserSettings & {
  audioCueDefaults: AudioCueSettingsData;
  workoutCardSettings: WorkoutCardSettings;
};

const defaultUserSettings: AppUserSettings = {
  audioCueDefaults: defaultAudioCueSettings,
  countdownDuration: 5, // Default countdown duration in seconds
  fitnessLevel: undefined,
  raceGoal: undefined,
  displayUnit: 'km', // Default display unit
  heightUnit: 'cm', // Default to metric units
  weightUnit: 'kg', // Default to metric units
  renderMapsDebug: true, // Default to true, maps render by default
  showDebugInfo: false, // Default to false, only show debug info when explicitly enabled
  usePedometer: true, // Enable pedometer/step counting by default
  workoutCardSettings: {
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
  },
  userHeightFeet: undefined,
  userHeightInches: undefined,
};

const SETTINGS_STORAGE_KEY = 'rhythmkUserSettings';

export const useUserSettings = () => {
  const [settings, setSettings] = useState<UserSettings>(defaultUserSettings);
  const [isLoading, setIsLoading] = useState(true);

  // Create a reusable function to load settings from AsyncStorage
  const loadSettings = useCallback(async () => {
    try {
      setIsLoading(true);
      const storedSettings = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
      if (storedSettings) {
        const parsed = JSON.parse(storedSettings) as UserSettings;
        // Merge with defaults to ensure all keys are present if structure changed
        setSettings({
          ...defaultUserSettings,
          ...parsed,
          audioCueDefaults: {
            ...defaultAudioCueSettings,
            ...(parsed.audioCueDefaults || {}),
            splitAnnouncementsEnabled: parsed.audioCueDefaults?.splitAnnouncementsEnabled ?? defaultAudioCueSettings.splitAnnouncementsEnabled,
          },
          fitnessLevel: parsed.fitnessLevel || defaultUserSettings.fitnessLevel,
          raceGoal: parsed.raceGoal || defaultUserSettings.raceGoal,
          renderMapsDebug: parsed.renderMapsDebug ?? defaultUserSettings.renderMapsDebug, // Ensure new setting is loaded or defaulted
        });
      } else {
        // If no stored settings, use defaults
        setSettings(defaultUserSettings);
      }
    } catch (error) {
      console.error('Error loading user settings from AsyncStorage:', error);
      // Fallback to default settings if loading fails
      setSettings(defaultUserSettings);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Function to explicitly refresh settings from AsyncStorage
  const refreshSettings = useCallback(async () => {
    await loadSettings();
  }, [loadSettings]);

  // Load settings from AsyncStorage when the hook mounts
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Save settings to AsyncStorage whenever they change
  useEffect(() => {
    if (!isLoading) { // Only save after initial load
      const saveSettings = async () => {
        try {
          await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
        } catch (error) {
          console.error('Error saving user settings to AsyncStorage:', error);
        }
      };
      saveSettings();
    }
  }, [settings, isLoading]);

  const updateSettings = useCallback((newSettings: Partial<UserSettings>) => {
    setSettings(prevSettings => {
      const updated = { ...prevSettings, ...newSettings };
      if (newSettings.audioCueDefaults) {
        updated.audioCueDefaults = {
          ...prevSettings.audioCueDefaults,
          ...newSettings.audioCueDefaults,
        };
      }
      return updated;
    });
  }, []);

  const updateAudioCueDefaults = useCallback(
    async (newAudioDefaults: Partial<AudioCueSettingsData>) => {
      try {
        // Update the in-memory state
        const updatedSettings = {
          ...settings,
          audioCueDefaults: {
            ...settings.audioCueDefaults,
            ...newAudioDefaults,
          },
        };
        
        // Update state
        setSettings(updatedSettings);
        
        // Explicitly save to AsyncStorage immediately
        await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updatedSettings));
        
        return true;
      } catch (error) {
        console.error('Error updating audio cue settings:', error);
        return false;
      }
    },
    [settings] // Include settings in dependency array
  );

  return {
    settings,
    updateSettings,
    updateAudioCueDefaults,
    refreshSettings,
    isLoadingSettings: isLoading, // Expose loading state
  };
};
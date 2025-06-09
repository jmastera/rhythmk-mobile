import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import the AudioCueSettingsData interface from types file
import { AudioCueSettingsData } from '../types/audioTypes';

export interface RaceGoalData {
  type: string; // e.g., '5k', '10k', 'Half Marathon', 'Full Marathon', 'Custom Distance', 'Custom Time'
  distance?: number; // in km or miles, depending on unit preference (not yet in settings)
  time?: string; // hh:mm:ss or mm:ss
  // Potentially add targetPace here too if it's part of the goal itself
}

export interface UserSettings {
  audioCueDefaults: AudioCueSettingsData;
  fitnessLevel?: string; // e.g., 'beginner', 'intermediate', 'advanced'
  raceGoal?: RaceGoalData;
  displayUnit: 'km' | 'mi'; // Global display unit preference
  heightUnit: 'cm' | 'ft-in'; // Height unit preference (cm or feet-inches)
  weightUnit: 'kg' | 'lb'; // Weight unit preference (kg or pounds)
  renderMapsDebug?: boolean; // Add other global settings here in the future
  userHeight?: number; // User height in cm for stride length calculation (always stored in cm internally)
  userWeight?: number; // User weight in kg for potential calorie calculations (always stored in kg internally)
  userHeightFeet?: number; // For display only when using imperial units
  userHeightInches?: number; // For display only when using imperial units
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

const defaultUserSettings: UserSettings = {
  audioCueDefaults: defaultAudioCueSettings,
  fitnessLevel: undefined,
  raceGoal: undefined,
  displayUnit: 'km', // Default display unit
  heightUnit: 'cm', // Default to metric units
  weightUnit: 'kg', // Default to metric units
  renderMapsDebug: true, // Default to true, maps render by default
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
    (newAudioDefaults: Partial<AudioCueSettingsData>) => {
      setSettings(prev => ({
        ...prev,
        audioCueDefaults: {
          ...prev.audioCueDefaults,
          ...newAudioDefaults,
        },
      }));
    },
    []
  );

  return {
    settings,
    updateSettings,
    updateAudioCueDefaults,
    refreshSettings,
    isLoadingSettings: isLoading, // Expose loading state
  };
};
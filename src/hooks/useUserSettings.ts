import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define interfaces (can be moved to a types file later)
export interface AudioCueSettingsData {
  distanceEnabled: boolean;
  distanceInterval: number;
  distanceUnit: 'km' | 'miles';
  paceEnabled: boolean;
  targetPace: string; // mm:ss format
  paceTolerance: number; // seconds
  splitAnnouncementsEnabled: boolean;
}

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
  renderMapsDebug?: boolean; // Add other global settings here in the future
}

const defaultAudioCueSettings: AudioCueSettingsData = {
  distanceEnabled: true,
  distanceInterval: 1,
  distanceUnit: 'km',
  paceEnabled: false,
  targetPace: '6:00', // Default to 6:00 min/km
  paceTolerance: 10, // 10 seconds
  splitAnnouncementsEnabled: true, // Default to true
};

const defaultUserSettings: UserSettings = {
  audioCueDefaults: defaultAudioCueSettings,
  fitnessLevel: undefined,
  raceGoal: undefined,
  displayUnit: 'km', // Default display unit
  renderMapsDebug: true, // Default to true, maps render by default
};

const SETTINGS_STORAGE_KEY = 'rhythmkUserSettings';

export const useUserSettings = () => {
  const [settings, setSettings] = useState<UserSettings>(defaultUserSettings);
  const [isLoading, setIsLoading] = useState(true);

  // Load settings from AsyncStorage when the hook mounts
  useEffect(() => {
    const loadSettings = async () => {
      try {
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
        }
      } catch (error) {
        console.error('Error loading user settings from AsyncStorage:', error);
        // Fallback to default settings if loading fails
        setSettings(defaultUserSettings);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

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
    isLoadingSettings: isLoading, // Expose loading state
  };
};
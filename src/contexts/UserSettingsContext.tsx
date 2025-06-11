// src/contexts/UserSettingsContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { 
  getProfile, 
  updateProfile, 
  getPreferences, 
  updatePreferences,
  getAudioCueSettings,
  updateAudioCueSetting,
  createAudioCueSetting,
  deleteAudioCueSetting,
  UserProfile,
  UserPreferences,
  AudioCueSetting
} from '../lib/supabase';

type UserSettingsContextType = {
  profile: UserProfile | null;
  preferences: UserPreferences | null;
  audioCueSettings: AudioCueSetting[];
  loading: boolean;
  error: string | null;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
  updateUserPreferences: (updates: Partial<UserPreferences>) => Promise<void>;
  updateUserAudioCueSetting: (id: string, updates: Partial<AudioCueSetting>) => Promise<void>;
  createUserAudioCueSetting: (setting: Omit<AudioCueSetting, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  removeAudioCueSetting: (id: string) => Promise<void>;
  refreshSettings: () => Promise<void>;
};

const UserSettingsContext = createContext<UserSettingsContextType | undefined>(undefined);

export const UserSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [audioCueSettings, setAudioCueSettings] = useState<AudioCueSetting[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadUserSettings = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Load all settings in parallel
      const [profileData, preferencesData, audioCuesData] = await Promise.all([
        getProfile(user.id),
        getPreferences(user.id),
        getAudioCueSettings(user.id)
      ]);

      setProfile(profileData);
      setPreferences(preferencesData);
      setAudioCueSettings(audioCuesData);
    } catch (err) {
      console.error('Error loading user settings:', err);
      setError('Failed to load user settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      loadUserSettings();
    }
  }, [user?.id]);

  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    if (!user?.id) return;

    try {
      const updatedProfile = await updateProfile(user.id, updates);
      setProfile(updatedProfile);
    } catch (err) {
      console.error('Error updating profile:', err);
      throw err;
    }
  };

  const updateUserPreferences = async (updates: Partial<UserPreferences>) => {
    if (!user?.id) return;

    try {
      const updatedPrefs = await updatePreferences(user.id, updates);
      setPreferences(updatedPrefs);
    } catch (err) {
      console.error('Error updating preferences:', err);
      throw err;
    }
  };

  const updateUserAudioCueSetting = async (id: string, updates: Partial<AudioCueSetting>) => {
    try {
      const updatedSetting = await updateAudioCueSetting(id, updates);
      setAudioCueSettings(prev => 
        prev.map(setting => 
          setting.id === id ? updatedSetting : setting
        )
      );
    } catch (err) {
      console.error('Error updating audio cue setting:', err);
      throw err;
    }
  };

  const createUserAudioCueSetting = async (setting: Omit<AudioCueSetting, 'id' | 'created_at' | 'updated_at'>) => {
    if (!user?.id) return;

    try {
      const newSetting = await createAudioCueSetting({
        ...setting,
        user_id: user.id
      });
      setAudioCueSettings(prev => [...prev, newSetting]);
      return newSetting;
    } catch (err) {
      console.error('Error creating audio cue setting:', err);
      throw err;
    }
  };

  const removeAudioCueSetting = async (id: string) => {
    try {
      await deleteAudioCueSetting(id);
      setAudioCueSettings(prev => prev.filter(setting => setting.id !== id));
    } catch (err) {
      console.error('Error deleting audio cue setting:', err);
      throw err;
    }
  };

  return (
    <UserSettingsContext.Provider
      value={{
        profile,
        preferences,
        audioCueSettings,
        loading,
        error,
        updateUserProfile,
        updateUserPreferences,
        updateUserAudioCueSetting,
        createUserAudioCueSetting,
        removeAudioCueSetting,
        refreshSettings: loadUserSettings
      }}
    >
      {children}
    </UserSettingsContext.Provider>
  );
};

export const useUserSettings = () => {
  const context = useContext(UserSettingsContext);
  if (context === undefined) {
    throw new Error('useUserSettings must be used within a UserSettingsProvider');
  }
  return context;
};
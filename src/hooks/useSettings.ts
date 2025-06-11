import { useUserSettings } from '../contexts/UserSettingsContext';

export const useSettings = () => {
  const {
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
    refreshSettings
  } = useUserSettings();

  // Helper functions for common operations
  const updatePersonalInfo = async (updates: {
    firstName?: string;
    lastName?: string;
    displayName?: string;
    birthDate?: string;
    gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  }) => {
    return updateUserProfile({
      first_name: updates.firstName,
      last_name: updates.lastName,
      display_name: updates.displayName,
      birth_date: updates.birthDate,
      gender: updates.gender,
    });
  };

  const updateDisplayUnits = async (units: {
    displayUnit?: 'km' | 'miles';
    heightUnit?: 'cm' | 'ft-in';
    weightUnit?: 'kg' | 'lb';
  }) => {
    return updateUserPreferences({
      display_unit: units.displayUnit,
      height_unit: units.heightUnit,
      weight_unit: units.weightUnit,
    });
  };

  return {
    // State
    profile,
    preferences,
    audioCueSettings,
    loading,
    error,
    
    // Actions
    updatePersonalInfo,
    updateDisplayUnits,
    updateUserProfile,
    updateUserPreferences,
    updateUserAudioCueSetting,
    createUserAudioCueSetting,
    removeAudioCueSetting,
    refreshSettings
  };
};
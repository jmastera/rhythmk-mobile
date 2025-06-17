import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  Switch, 
  TouchableOpacity, 
  ScrollView, 
  TextInput, 
  ActivityIndicator, 
  Alert, 
  StyleSheet,
  Keyboard,
  Platform
} from 'react-native';
import { supabase } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { styles } from './SettingsScreen.styles';
import { HeaderSafeArea } from '../components/HeaderSafeArea';
import { useSettings } from '../hooks/useSettings';
import { useAuth } from '../contexts/AuthContext';
import { ChevronDown, ChevronUp, LogOut } from 'lucide-react-native';
import AudioCueSettings from '../components/AudioCueSettings';
import WorkoutCardSettings from '../components/WorkoutCardSettings';
import DateTimePicker from '@react-native-community/datetimepicker';
import { AudioCueSettingsData } from '../types/audioTypes';
import { Database, Json } from '../types/database.types';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

type DisplayUnit = 'km' | 'miles' | 'min/km' | 'min/mile';

// Extend the preferences type to include all possible fields
// Define the base user preferences type from the database
type BaseUserPreferences = Omit<Database['public']['Tables']['user_preferences']['Row'], 'workout_card_settings'> & {
  workout_card_settings?: Json; // Use the Json type from the database
};

// Extend with our custom fields
// Type for the structure of workout_card_settings JSON field
type WorkoutCardSettings = {
  audioCueDefaults?: AudioCueSettingsData;
  [key: string]: unknown;
};

type UserPreferences = BaseUserPreferences & {
  // Add any additional custom fields here if needed
};

// Default audio cue settings
const defaultAudioCueSettings: AudioCueSettingsData = {
  enabled: true,
  volume: 0.8,
  distanceUnit: 'km',
  announceDistance: true,
  distanceInterval: 1,
  announceTime: true,
  timeInterval: 5,
  announcePace: true,
  targetPace: '5:30',
  paceTolerance: 10,
  announceCalories: false,
  splitAnnouncementsEnabled: true
};

type Props = NativeStackScreenProps<RootStackParamList, 'SettingsMain'>;

const SettingsScreen: React.FC<Props> = ({ navigation }) => {
  const {
    profile,
    preferences,
    loading: isLoadingSettings,
    updatePersonalInfo,
    updateDisplayUnits,
    updateUserPreferences,
    updateUserProfile
  } = useSettings();
  
  const { user, signOut } = useAuth();
  
  // Define a type for the form data
  type FormData = {
    firstName: string;
    lastName: string;
    displayName: string;
    birthDate: string;
    gender: string;
    displayUnit: 'km' | 'miles';
    heightUnit: 'cm' | 'ft-in';
    weightUnit: 'kg' | 'lb';
    userHeight: number;
    userWeight: number;
    userHeightFeet: number;
    userHeightInches: number;
    userWeightLbs: number;
    audioCueDefaults?: AudioCueSettingsData;
  };
  
  // Local state for form inputs
  const [formData, setFormData] = useState<FormData>({
    firstName: profile?.first_name || '',
    lastName: profile?.last_name || '',
    displayName: profile?.display_name || '',
    birthDate: profile?.birth_date || '',
    gender: profile?.gender || 'prefer_not_to_say',
    displayUnit: (preferences?.display_unit as 'km' | 'miles') || 'km',
    heightUnit: (preferences?.height_unit as 'cm' | 'ft-in') || 'cm',
    weightUnit: (preferences?.weight_unit as 'kg' | 'lb') || 'kg',
    userHeight: preferences?.user_height_cm || 0,
    userWeight: preferences?.user_weight_kg || 0,
    userHeightFeet: 0,
    userHeightInches: 0,
    userWeightLbs: preferences?.user_weight_kg ? Math.round(preferences.user_weight_kg * 2.20462) : 0
  });
  
  // State to track expanded/collapsed sections
  const [expandedSections, setExpandedSections] = useState({
    personalInfo: false,   // Personal Info section - collapsed by default
    userAttributes: false, // User Attributes section - collapsed by default
    audioCues: false,      // Audio Cues section - collapsed by default
    displayPrefs: false,   // Display Preferences - collapsed by default
    workoutCards: false,   // Workout Cards section - collapsed by default
    workoutSettings: false, // Workout Settings section - collapsed by default
    debugSettings: false,  // Debug Settings - collapsed by default
  });
  
  // State for date picker visibility
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // Initialize form data when profile or preferences load
  useEffect(() => {
    if (profile) {
      setFormData(prev => ({
        ...prev,
        firstName: profile.first_name || '',
        lastName: profile.last_name || '',
        displayName: profile.display_name || '',
        birthDate: profile.birth_date || '',
        gender: profile.gender || 'prefer_not_to_say'
      }));
    }

    if (preferences) {
      // Convert height from cm to ft-in for display
      let userHeightFeet = 0;
      let userHeightInches = 0;
      if (preferences.user_height_cm) {
        const totalInches = Math.round(preferences.user_height_cm / 2.54);
        userHeightFeet = Math.floor(totalInches / 12);
        userHeightInches = totalInches % 12;
      }

      setFormData(prev => ({
        ...prev,
        displayUnit: (preferences.display_unit as 'km' | 'miles') || 'km',
        heightUnit: (preferences.height_unit as 'cm' | 'ft-in') || 'cm',
        weightUnit: (preferences.weight_unit as 'kg' | 'lb') || 'kg',
        userHeight: preferences.user_height_cm || 0,
        userWeight: preferences.user_weight_kg || 0,
        userHeightFeet,
        userHeightInches,
        userWeightLbs: preferences.user_weight_kg ? Math.round(preferences.user_weight_kg * 2.20462) : 0
      }));
    }
  }, [profile, preferences]);
  
  // Load audio cue settings
  useEffect(() => {
    const loadAudioCueSettings = async () => {
      if (!user?.id) return;
      
      try {
        // Try to get existing audio cue settings
        const { data: audioCueSettings, error } = await supabase
          .from('audio_cue_settings')
          .select('*')
          .eq('user_id', user.id)
          .single();
          
        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
          throw error;
        }
        
        if (audioCueSettings?.content) {
          const content = audioCueSettings.content as AudioCueSettingsData;
          // If volume exists at the root level (0-100 scale), convert it to 0-1 scale
          if (audioCueSettings.volume !== undefined) {
            content.volume = audioCueSettings.volume / 100;
          }
          setFormData(prev => ({
            ...prev,
            audioCueDefaults: content
          }));
        } else {
          // Set default audio cue settings if none exist
          setFormData(prev => ({
            ...prev,
            audioCueDefaults: defaultAudioCueSettings
          }));
        }
      } catch (error) {
        console.error('Error loading audio cue settings:', error);
        // Set default settings on error
        setFormData(prev => ({
          ...prev,
          audioCueDefaults: defaultAudioCueSettings
        }));
      }
    };
    
    loadAudioCueSettings();
  }, [user?.id]);

  const handleLogout = async () => {
    try {
      await signOut();
      // Navigation is handled by the AuthListener in App.tsx
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Toggle expanded/collapsed state for a section
  const toggleSection = (section: 'personalInfo' | 'audioCues' | 'userAttributes' | 'displayPrefs' | 'workoutCards' | 'workoutSettings' | 'debugSettings') => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };
  
  // Handle form input changes
  const handleInputChange = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle height changes in cm
  const handleHeightCmChange = (cm: number) => {
    const validatedCm = Math.max(0, cm);
    const totalInches = validatedCm / 2.54;
    const feet = Math.floor(totalInches / 12);
    const inches = Math.round(totalInches % 12);
    
    setFormData(prev => ({
      ...prev,
      userHeight: validatedCm,
      userHeightFeet: feet,
      userHeightInches: inches
    }));
    
    // Only update preferences if the value has meaningfully changed
    if (validatedCm > 0) {
      updateUserPreferences({ user_height_cm: validatedCm } as Partial<UserPreferences>);
    }
  };

  // Handle height changes in ft-in
  const handleHeightFeetChange = (feet: number) => {
    const validatedFeet = Math.max(0, feet);
    const totalInches = validatedFeet * 12 + (formData.userHeightInches || 0);
    const heightCm = Math.round(totalInches * 2.54);
    
    setFormData(prev => ({
      ...prev,
      userHeightFeet: validatedFeet,
      userHeight: heightCm
    }));
    
    // Only update preferences if the value has meaningfully changed
    if (heightCm > 0) {
      updateUserPreferences({ user_height_cm: heightCm } as Partial<UserPreferences>);
    }
  };

  const handleHeightInchesChange = (inches: number) => {
    // Ensure inches is between 0 and 11
    const validatedInches = Math.min(11, Math.max(0, inches));
    const totalInches = (formData.userHeightFeet || 0) * 12 + validatedInches;
    const heightCm = Math.round(totalInches * 2.54);
    
    setFormData(prev => ({
      ...prev,
      userHeightInches: validatedInches,
      userHeight: heightCm
    }));
    
    // Only update preferences if the value has meaningfully changed
    if (heightCm > 0) {
      updateUserPreferences({ user_height_cm: heightCm } as Partial<UserPreferences>);
    }
  };

  // Handle weight changes in kg
  const handleWeightKgChange = (kg: number) => {
    const updatedKg = Math.max(0, kg); // Ensure non-negative
    const updatedLbs = Math.round(updatedKg * 2.20462);
    
    setFormData(prev => ({
      ...prev,
      userWeight: updatedKg,
      userWeightLbs: updatedLbs
    }));
    
    // Only update preferences if the value has meaningfully changed
    if (updatedKg > 0) {
      updateUserPreferences({ user_weight_kg: updatedKg } as Partial<UserPreferences>);
    }
  };

  // Handle weight changes in lbs
  const handleWeightLbsChange = (lbs: number) => {
    const updatedLbs = Math.max(0, lbs); // Ensure non-negative
    const kg = Math.round(updatedLbs * 0.453592);
    
    setFormData(prev => ({
      ...prev,
      userWeightLbs: updatedLbs,
      userWeight: kg
    }));
    
    // Only update preferences if the value has meaningfully changed
    if (kg > 0) {
      updateUserPreferences({ user_weight_kg: kg } as Partial<UserPreferences>);
    }
  };
  
  // Handle toggle changes
  const handleToggleChange = (field: string, value: boolean) => {
    try {
      // Update local state immediately for better UX
      if (field === 'dark_mode') {
        // Handle dark mode toggle if needed
        // You can add theme switching logic here if needed
      }
      
// Update preferences in the backend with proper typing
      const update: Partial<Database['public']['Tables']['user_preferences']['Row']> = {};
      // Only update if the field exists on the preferences row type
      if (field in (preferences || {})) {
        update[field as keyof Database['public']['Tables']['user_preferences']['Row']] = value as any;
        updateUserPreferences(update);
      } else {
        console.warn(`Attempted to update non-existent preference field: ${field}`);
      }
    } catch (error) {
      console.error(`Error toggling ${field}:`, error);
      Alert.alert('Error', `Failed to update ${String(field).replace('_', ' ')}`);
      
      // Revert the toggle if there was an error
      setFormData(prev => ({
        ...prev,
        [field]: !value
      }));
    }
  };
  
  // Handle unit changes
  const handleUnitChange = async (unitType: 'display' | 'height' | 'weight', value: string) => {
    try {
      if (unitType === 'display') {
        const unit = value as 'km' | 'miles';
        setFormData(prev => ({ 
          ...prev, 
          displayUnit: unit 
        }));
        await updateUserPreferences({ display_unit: unit });
      } else if (unitType === 'height') {
        const unit = value as 'cm' | 'ft-in';
        
        // Convert values if needed
        let heightCm = formData.userHeight;
        if (unit === 'ft-in' && formData.userHeight) {
          // Convert cm to ft-in
          const totalInches = formData.userHeight / 2.54;
          const feet = Math.floor(totalInches / 12);
          const inches = Math.round(totalInches % 12);
          
          setFormData(prev => ({
            ...prev,
            heightUnit: unit,
            userHeightFeet: feet,
            userHeightInches: inches
          }));
        } else if (unit === 'cm' && formData.userHeightFeet !== null && formData.userHeightInches !== null) {
          // Convert ft-in to cm
          heightCm = Math.round((formData.userHeightFeet * 30.48) + (formData.userHeightInches * 2.54));
          
          setFormData(prev => ({
            ...prev,
            heightUnit: unit,
            userHeight: heightCm
          }));
        } else {
          // Just update the unit if no conversion needed
          setFormData(prev => ({
            ...prev,
            heightUnit: unit
          }));
        }
        
        // Update backend with the current values
        await updateUserPreferences({ 
          height_unit: unit,
          user_height_cm: unit === 'cm' ? heightCm || formData.userHeight : null
        });
      } else if (unitType === 'weight') {
        const unit = value as 'kg' | 'lb';
        
        // Convert values if needed
        let weightKg = formData.userWeight;
        if (unit === 'lb' && formData.userWeight) {
          // Convert kg to lb
          const weightLbs = Math.round(formData.userWeight * 2.20462);
          setFormData(prev => ({
            ...prev,
            weightUnit: unit,
            userWeightLbs: weightLbs
          }));
        } else if (unit === 'kg' && formData.userWeightLbs !== null) {
          // Convert lb to kg
          weightKg = Math.round(formData.userWeightLbs / 2.20462);
          setFormData(prev => ({
            ...prev,
            weightUnit: unit,
            userWeight: weightKg
          }));
        } else {
          // Just update the unit if no conversion needed
          setFormData(prev => ({
            ...prev,
            weightUnit: unit
          }));
        }
        
        // Update backend with the current values
        await updateUserPreferences({ 
          weight_unit: unit,
          user_weight_kg: unit === 'kg' ? (weightKg || formData.userWeight) : null
        });
      }
    } catch (error) {
      console.error(`Error changing ${unitType} unit:`, error);
      Alert.alert('Error', `Failed to update ${unitType} unit`);
    }
  };

  // Validate date string (YYYY-MM-DD)
  const isValidDate = (dateString: string): boolean => {
    const regex = /^\d{2}-\d{2}-\d{4}$/;
    if (!regex.test(dateString)) return false;
    
    const date = new Date(dateString);
    const today = new Date();
    
    // Check if the date is valid and not in the future
    return date.toString() !== 'Invalid Date' && date <= today;
  };

  // Save personal info with validation
  /**
   * Saves the user's personal information (first name, last name, display name, birth date, gender) to the backend.
   * Performs basic validation before saving:
   *   - First name and last name must be non-empty strings
   *   - Birth date must be a valid date string (MM-DD-YYYY)
   * Shows an alert if there are any validation errors or if the save fails.
   * Shows a success alert if the save is successful.
   */
  const handleSavePersonalInfo = async () => {
    try {
      Keyboard.dismiss(); // Dismiss keyboard if open
      
      // Basic validation
      if (!formData.firstName?.trim()) {
        Alert.alert('Validation Error', 'Please enter your first name');
        return;
      }
      
      if (!formData.lastName?.trim()) {
        Alert.alert('Validation Error', 'Please enter your last name');
        return;
      }
      
      if (formData.birthDate && !isValidDate(formData.birthDate)) {
        Alert.alert('Validation Error', 'Please enter a valid date of birth (MM-DD-YYYY)');
        return;
      }
      
      const profileUpdates = {
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        display_name: formData.displayName?.trim() || null,
        birth_date: formData.birthDate?.trim() || null,
        gender: formData.gender as 'male' | 'female' | 'other' | 'prefer_not_to_say' | null
      };
      
      await updateUserProfile(profileUpdates);
      
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    }
  };

  // Save display units with validation
  const handleSaveDisplayUnits = async () => {
    try {
      Keyboard.dismiss(); // Dismiss keyboard if open
      
      // Validate height and weight values
      if (formData.userHeight < 0 || formData.userWeight < 0) {
        Alert.alert('Validation Error', 'Height and weight must be positive numbers');
        return;
      }
      
      // Set reasonable maximums
      const maxHeightCm = 300; // ~9'10"
      const maxWeightKg = 500; // ~1100 lbs
      
      if (formData.userHeight > maxHeightCm) {
        Alert.alert('Validation Error', `Height must be less than ${maxHeightCm}cm`);
        return;
      }
      
      if (formData.userWeight > maxWeightKg) {
        Alert.alert('Validation Error', `Weight must be less than ${maxWeightKg}kg`);
        return;
      }
      
      await updateUserPreferences({
        display_unit: formData.displayUnit,
        height_unit: formData.heightUnit,
        weight_unit: formData.weightUnit,
        user_height_cm: formData.userHeight || null,
        user_weight_kg: formData.userWeight || null
      } as Partial<UserPreferences>);
      
      Alert.alert('Success', 'Display units updated');
    } catch (error) {
      console.error('Error updating display units:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to update display units');
    }
  };
  
  // Format date for display (MM-DD-YYYY)
  const formatDate = (dateString: string): string => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return ''; // Return empty string for invalid dates
      
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const year = date.getFullYear();
      
      return `${month}-${day}-${year}`;
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  };

  if (isLoadingSettings) {
    return (
      <View style={[styles.container, styles.centered]}>
        <HeaderSafeArea />
        <ActivityIndicator size="large" color="#FFA500" />
        <Text style={styles.loadingText}>Loading rhythms...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <HeaderSafeArea />
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>Settings</Text>
        </View>

        {/* User Info */}
        <View style={styles.userInfoSection}>
          {user?.email && (
            <View style={styles.userInfoContainer}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {user.email.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.userInfoText}>
                <Text style={styles.userEmail}>{user.email}</Text>
                <Text style={styles.userStatus}>Active</Text>
              </View>
            </View>
          )}
          <TouchableOpacity 
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <LogOut size={18} color="#EF4444" />
            <Text style={styles.logoutButtonText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

      {/* Personal Information Section */}
      <View style={styles.sectionContainer}>
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => toggleSection('personalInfo')}
          activeOpacity={0.7}
        >
          <Text style={styles.sectionTitle}>Personal Information</Text>
          {expandedSections.personalInfo ? 
            <ChevronUp size={20} color="#FFF" /> : 
            <ChevronDown size={20} color="#FFF" />}
        </TouchableOpacity>

        {expandedSections.personalInfo && (
          <View>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>First Name  </Text>
              <TextInput
                style={styles.textInput}
                value={formData.firstName || ''}
                onChangeText={(text) => setFormData(prev => ({ ...prev, firstName: text }))}
                placeholder="Enter first name"
              />
            </View>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Last Name  </Text>
              <TextInput
                style={styles.textInput}
                value={formData.lastName || ''}
                onChangeText={(text) => setFormData(prev => ({ ...prev, lastName: text }))}
                placeholder="Enter last name"
              />
            </View>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Display Name  </Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter display name"
                value={formData.displayName}
                onChangeText={(text) => handleInputChange('displayName', text)}
              />
            </View>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Date of Birth  </Text>
              <TouchableOpacity
                style={[styles.textInput, { justifyContent: 'center' }]}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={{ color: formData.birthDate ? '#fff' : '#888' }}>
                  {formData.birthDate || 'Select date'}
                </Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={formData.birthDate ? new Date(formData.birthDate) : new Date()}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(false);
                    if (selectedDate) {
                      // Format date as MM-DD-YYYY
                      const day = String(selectedDate.getDate()).padStart(2, '0');
                      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
                      const year = selectedDate.getFullYear();
                      const formattedDate = `${month}-${day}-${year}`;
                      handleInputChange('birthDate', formattedDate);
                    }
                  }}
                  maximumDate={new Date()}
                />
              )}
            </View>
            <View style={{ padding: 16, alignItems: 'center' }}>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: '#007AFF' }]}
                onPress={handleSavePersonalInfo}
                activeOpacity={0.8}
              >
                <Text style={styles.buttonText}>Save Personal Information</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* User Profile Section */}
      <View style={styles.sectionContainer}>
        <TouchableOpacity 
          style={styles.sectionHeader}
          onPress={() => toggleSection('userAttributes')}
          activeOpacity={0.7}
        >
          <Text style={styles.sectionTitle}>User Attributes</Text>
          {expandedSections.userAttributes ? 
            <ChevronUp size={20} color="#FFF" /> : 
            <ChevronDown size={20} color="#FFF" />}
        </TouchableOpacity>
        
        {expandedSections.userAttributes && (
          <View style={styles.sectionContent}>
            {/* Height Section */}
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Height</Text>
              <View style={styles.buttonGroup}>
                <TouchableOpacity
                  style={[styles.unitButton, preferences?.height_unit === 'cm' && styles.unitButtonActive]}
                  onPress={() => updateUserPreferences({ height_unit: 'cm' })}
                >
                  <Text style={[styles.unitButtonText, preferences?.height_unit === 'cm' && styles.unitButtonTextActive]}>
                    Metric (cm)
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.unitButton, preferences?.height_unit === 'ft-in' && styles.unitButtonActive]}
                  onPress={() => updateUserPreferences({ height_unit: 'ft-in' })}
                >
                  <Text style={[styles.unitButtonText, preferences?.height_unit === 'ft-in' && styles.unitButtonTextActive]}>
                    Imperial (ft-in)
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Conditional Height Input */}
            <View style={styles.settingRow}>
              {preferences?.height_unit === 'cm' ? (
                <>
                  <Text style={styles.settingLabel}>Height (cm)</Text>
                  <TextInput
                    style={styles.numericInput}
                    keyboardType="numeric"
                    placeholder="170"
                    value={formData.userHeight?.toString() || ''}
                    onChangeText={(value) => handleHeightCmChange(parseFloat(value) || 0)}
                    onBlur={() => Keyboard.dismiss()}
                  />
                </>
              ) : (
                <View style={{ flex: 1 }}>
                  <Text style={styles.settingLabel}>Height (ft-in)</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.smallLabel}>Feet</Text>
                      <TextInput
                        style={[styles.numericInput, styles.smallInput]}
                        keyboardType="numeric"
                        placeholder="5"
                        value={formData.userHeightFeet?.toString() || ''}
                        onChangeText={(value) => handleHeightFeetChange(parseFloat(value) || 0)}
                        onBlur={() => Keyboard.dismiss()}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.smallLabel}>Inches</Text>
                      <TextInput
                        style={[styles.numericInput, styles.smallInput]}
                        keyboardType="numeric"
                        placeholder="10"
                        value={formData.userHeightInches?.toString() || ''}
                        onChangeText={(value) => handleHeightInchesChange(parseFloat(value) || 0)}
                        onBlur={() => Keyboard.dismiss()}
                      />
                    </View>
                  </View>
                </View>
              )}
            </View>

            {/* Weight Section */}
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Weight</Text>
              <View style={styles.buttonGroup}>
                <TouchableOpacity
                  style={[styles.unitButton, preferences?.weight_unit === 'kg' && styles.unitButtonActive]}
                  onPress={() => updateUserPreferences({ weight_unit: 'kg' })}
                >
                  <Text style={[styles.unitButtonText, preferences?.weight_unit === 'kg' && styles.unitButtonTextActive]}>
                    Metric (kg)
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.unitButton, preferences?.weight_unit === 'lb' && styles.unitButtonActive]}
                  onPress={() => updateUserPreferences({ weight_unit: 'lb' })}
                >
                  <Text style={[styles.unitButtonText, preferences?.weight_unit === 'lb' && styles.unitButtonTextActive]}>
                    Imperial (lb)
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Weight Input */}
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>
                {preferences?.weight_unit === 'kg' ? 'Weight (kg)' : 'Weight (lb)'}
              </Text>
              <TextInput
                style={styles.numericInput}
                keyboardType="numeric"
                placeholder={preferences?.weight_unit === 'kg' ? '70' : '154'}
                value={preferences?.weight_unit === 'kg' 
                  ? formData.userWeight?.toString() 
                  : formData.userWeightLbs?.toString()}
                onChangeText={(value) => {
                  const numValue = parseFloat(value) || 0;
                  if (preferences?.weight_unit === 'kg') {
                    handleWeightKgChange(numValue);
                  } else {
                    handleWeightLbsChange(numValue);
                  }
                }}
                onBlur={() => Keyboard.dismiss()}
              />
            </View>
          </View>
        )}
      </View>

      {/* Audio Cues Section */}
      <View style={styles.sectionContainer}>
        <TouchableOpacity 
          style={styles.sectionHeader}
          onPress={() => toggleSection('audioCues')}
          activeOpacity={0.7}
        >
          <Text style={styles.sectionTitle}>Audio Cues</Text>
          {expandedSections.audioCues ? 
            <ChevronUp size={20} color="#FFF" /> : 
            <ChevronDown size={20} color="#FFF" />}
        </TouchableOpacity>
        
        {expandedSections.audioCues && (
          <View style={{ marginTop: 8 }}>
            <AudioCueSettings 
              currentSettings={formData.audioCueDefaults || defaultAudioCueSettings}
              onSave={async (newSettings: AudioCueSettingsData) => {
                try {
                  // Update local state first for immediate feedback
                  setFormData(prev => ({
                    ...prev,
                    audioCueDefaults: newSettings
                  }));
                  
                  if (!user?.id) {
                    throw new Error('User not authenticated');
                  }
                  
                  // Check if we have existing audio cue settings
                  const { data: existingSettings, error: fetchError } = await supabase
                    .from('audio_cue_settings')
                    .select('id')
                    .eq('user_id', user.id)
                    .single();
                  
                  if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows returned
                    throw fetchError;
                  }
                  
                  if (existingSettings) {
                    // Update existing settings
                    const { error: updateError } = await supabase
                      .from('audio_cue_settings')
                      .update({
                        content: newSettings,
                        updated_at: new Date().toISOString()
                      })
                      .eq('id', existingSettings.id);
                      
                    if (updateError) throw updateError;
                  } else {
                    // Create new settings
                    const { error: createError } = await supabase
                      .from('audio_cue_settings')
                      .insert([{
                        user_id: user.id,
                        name: 'default',
                        enabled: true,
                        volume: Math.round((newSettings.volume || 0.8) * 100), // Convert 0-1 to 0-100 scale
                        frequency: '1km',
                        content: newSettings
                      }])
                      .single();
                      
                    if (createError) throw createError;
                  }
                  
                  // Show success message
                  Alert.alert('Success', 'Audio cue settings saved successfully');
                } catch (error) {
                  console.error('Error saving audio cue settings:', error);
                  Alert.alert('Error', 'Failed to save audio cue settings');
                }
              }}
              onClose={() => toggleSection('audioCues')}
            />
          </View>
        )}
      </View>

      {/* Workout Dashboard Cards Section */}
      <View style={styles.sectionContainer}>
        <TouchableOpacity 
          style={styles.sectionHeader}
          onPress={() => toggleSection('workoutCards')}
          activeOpacity={0.7}
        >
          <Text style={styles.sectionTitle}>Workout Dashboard</Text>
          {expandedSections.workoutCards ? 
            <ChevronUp size={20} color="#FFF" /> : 
            <ChevronDown size={20} color="#FFF" />}
        </TouchableOpacity>
        
        {expandedSections.workoutCards && (
          <WorkoutCardSettings isExpanded={expandedSections.workoutCards} />
        )}
      </View>

      {/* Workout Settings Section */}
      <View style={styles.sectionContainer}>
        <TouchableOpacity 
          style={styles.sectionHeader}
          onPress={() => toggleSection('workoutSettings')}
          activeOpacity={0.7}
        >
          <Text style={styles.sectionTitle}>Workout Settings</Text>
          {expandedSections.workoutSettings ? 
            <ChevronUp size={20} color="#FFF" /> : 
            <ChevronDown size={20} color="#FFF" />}
        </TouchableOpacity>
        
        {expandedSections.workoutSettings && (
          <View style={styles.sectionContent}>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Countdown Duration (seconds)</Text>
              <TextInput
                style={[styles.numericInput, { width: 80, textAlign: 'center' }]}
                keyboardType="numeric"
                value={preferences?.countdown_duration?.toString() || '5'}
                onChangeText={(value) => {
                  const numValue = parseInt(value, 10) || 0;
                  if (numValue >= 0 && numValue <= 10) { // Limit to 0-10 seconds
                    updateUserPreferences({ countdown_duration: numValue } as any);
                  }
                }}
                onBlur={() => Keyboard.dismiss()}
              />
            </View>
          </View>
        )}
      </View>

      {/* Debug Settings Section */}
      <View style={styles.sectionContainer}>
        <TouchableOpacity 
          style={styles.sectionHeader}
          onPress={() => toggleSection('debugSettings')}
          activeOpacity={0.7}
        >
          <Text style={styles.sectionTitle}>Debug Settings</Text>
          {expandedSections.debugSettings ? 
            <ChevronUp size={20} color="#FFF" /> : 
            <ChevronDown size={20} color="#FFF" />}
        </TouchableOpacity>
        
        {expandedSections.debugSettings && (
          <View style={styles.sectionContent}>
            {/* Debug Toggles */}
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Show Debug Information</Text>
              <Switch
                value={preferences?.show_debug_info || false}
                onValueChange={(value) => handleToggleChange('show_debug_info', value)}
                trackColor={{ false: '#3e3e3e', true: '#f97316' }}
                thumbColor={preferences?.show_debug_info ? '#ffffff' : '#f4f3f4'}
              />
            </View>
            
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Render Maps (Experimental)</Text>
              <Switch
                value={preferences?.render_maps_debug || false}
                onValueChange={(value) => handleToggleChange('render_maps_debug', value)}
                trackColor={{ false: '#3e3e3e', true: '#f97316' }}
                thumbColor={preferences?.render_maps_debug ? '#ffffff' : '#f4f3f4'}
              />
            </View>
            
            {/* Debug Actions */}
            <View style={[styles.settingRow, { marginTop: 20 }]}>
              <TouchableOpacity 
                style={[styles.button, styles.dangerButton]}
                onPress={() => {
                  Alert.alert(
                    'Reset Settings',
                    'Are you sure you want to reset all settings to default? This cannot be undone.',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { 
                        text: 'Reset', 
                        style: 'destructive',
                        onPress: () => {
                          updateUserPreferences({
                            height_unit: 'cm',
                            weight_unit: 'kg',
                            user_height_cm: null,
                            user_weight_kg: null,
                            show_debug_info: false,
                            render_maps: true
                          } as any);
                        }
                      }
                    ]
                  );
                }}
              >
                <Text style={styles.buttonText}>Reset All Settings</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.button, styles.warningButton]}
                onPress={async () => {
                  try {
                    // Clear local storage
                    await AsyncStorage.clear();
                    Alert.alert('Success', 'Local storage has been cleared.');
                  } catch (error) {
                    console.error('Error clearing local storage:', error);
                    Alert.alert('Error', 'Failed to clear local storage.');
                  }
                }}
              >
                <Text style={styles.buttonText}>Clear Local Storage</Text>
              </TouchableOpacity>
            </View>
            
            {/* App Info */}
            {preferences?.show_debug_info && (
              <View style={styles.debugInfoContainer}>
                <Text style={styles.debugInfoTitle}>App Information</Text>
                <Text style={styles.debugInfoText}>Version: 1.0.0</Text>
                <Text style={styles.debugInfoText}>Build: 1</Text>
                <Text style={styles.debugInfoText}>Environment: {__DEV__ ? 'Development' : 'Production'}</Text>
              </View>
            )}
          </View>
        )}
      </View>
      
      </ScrollView>
    </View>
  );
};

export default SettingsScreen;

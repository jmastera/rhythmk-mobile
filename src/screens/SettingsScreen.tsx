import React, { useState, useEffect } from 'react';
import { View, Text, Switch, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Keyboard, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { styles } from './SettingsScreen.styles';
import { HeaderSafeArea } from '../components/HeaderSafeArea';
import { useUserSettings } from '../hooks/useUserSettings';
import { UserSettings, DisplayUnit } from '../types/userTypes';
import AudioCueSettings from '../components/AudioCueSettings';
import WorkoutCardSettings from '../components/WorkoutCardSettings';
import { ChevronDown, ChevronUp, LogOut } from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';

const SettingsScreen = () => {
  const {
    settings,
    updateAudioCueDefaults,
    updateSettings, // Add updateSettings to manage global settings like displayUnit
    isLoadingSettings,
  } = useUserSettings();
  
  const { user, signOut } = useAuth();
  
  // State to track expanded/collapsed sections
  const [expandedSections, setExpandedSections] = useState({
    userProfile: true,     // User Profile section - expanded by default
    audioCues: false,      // Audio Cues section - collapsed by default
    displayPrefs: false,   // Display Preferences - collapsed by default
    workoutCards: false,   // Workout Cards section - collapsed by default
    debugSettings: false,  // Debug Settings - collapsed by default
  });
  
  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      Alert.alert('Error', 'Failed to log out. Please try again.');
      console.error('Logout error:', error);
    }
  };
  
  // Toggle expanded/collapsed state for a section
  const toggleSection = (section: 'audioCues' | 'userProfile' | 'displayPrefs' | 'workoutCards' | 'debugSettings') => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };
  
  // Synchronize height unit conversions when user switches between metric and imperial
  useEffect(() => {
    if (settings.heightUnit === 'ft-in' && settings.userHeight) {
      // Convert from cm to feet and inches
      const totalInches = settings.userHeight / 2.54;
      const feet = Math.floor(totalInches / 12);
      const inches = Math.round(totalInches % 12);
      
      // Only update if the values don't match the current converted values
      if (settings.userHeightFeet !== feet || settings.userHeightInches !== inches) {
        updateSettings({
          userHeightFeet: feet,
          userHeightInches: inches
        });
      }
    }
  }, [settings.heightUnit, settings.userHeight]);

  if (isLoadingSettings) {
    return (
      <View style={[styles.container, styles.centered]}>
        <HeaderSafeArea />
        <ActivityIndicator size="large" color="#FFA500" />
        <Text style={styles.loadingText}>Loading Settings...</Text>
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
          <AudioCueSettings
            currentSettings={settings.audioCueDefaults}
            onSave={updateAudioCueDefaults}
          />
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

      {/* Display Unit Preference Section */}
      <View style={styles.sectionContainer}>
        <TouchableOpacity 
          style={styles.sectionHeader}
          onPress={() => toggleSection('displayPrefs')}
          activeOpacity={0.7}
        >
          <Text style={styles.sectionTitle}>Display Preferences</Text>
          {expandedSections.displayPrefs ? 
            <ChevronUp size={20} color="#FFF" /> : 
            <ChevronDown size={20} color="#FFF" />}
        </TouchableOpacity>
        
        {expandedSections.displayPrefs && (
          <View style={styles.sectionContent}>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Preferred Units</Text>
              <View style={styles.buttonGroup}>
                <TouchableOpacity
                  style={[
                    styles.unitButton,
                    settings.displayUnit === 'km' && styles.unitButtonActive,
                  ]}
                  onPress={() => updateSettings({ displayUnit: 'km' as DisplayUnit })}
                >
                  <Text
                    style={[
                      styles.unitButtonText,
                      settings.displayUnit === 'km' && styles.unitButtonTextActive,
                    ]}
                  >
                    Kilometers
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.unitButton,
                    settings.displayUnit === 'miles' && styles.unitButtonActive,
                  ]}
                  onPress={() => updateSettings({ displayUnit: 'miles' as DisplayUnit })}
                >
                  <Text style={[
                    styles.unitButtonText,
                    settings.displayUnit === 'miles' && styles.unitButtonTextActive
                  ]}>
                    Miles
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </View>

      {/* User Profile Section */}
      <View style={styles.sectionContainer}>
        <TouchableOpacity 
          style={styles.sectionHeader}
          onPress={() => toggleSection('userProfile')}
          activeOpacity={0.7}
        >
          <Text style={styles.sectionTitle}>User Profile</Text>
          {expandedSections.userProfile ? 
            <ChevronUp size={20} color="#FFF" /> : 
            <ChevronDown size={20} color="#FFF" />}
        </TouchableOpacity>
        
        {expandedSections.userProfile && (
          <View style={styles.sectionContent}>
            <View style={styles.userInfoContainer}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </Text>
              </View>
              <View>
                <Text style={styles.userEmail}>{user?.email || 'User'}</Text>
                <Text style={styles.userStatus}>Active</Text>
              </View>
            </View>
            <TouchableOpacity 
              style={styles.logoutButton}
              onPress={handleLogout}
            >
              <LogOut size={20} color="#FF3B30" />
              <Text style={styles.logoutButtonText}>Log Out</Text>
            </TouchableOpacity>

            {/* Height Section with Unit Toggle */}
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Height</Text>
              <View style={styles.buttonGroup}>
                <TouchableOpacity
                  style={[
                    styles.unitButton,
                    settings.heightUnit === 'cm' && styles.unitButtonActive,
                  ]}
                  onPress={() => updateSettings({ heightUnit: 'cm' })}
                >
                  <Text
                    style={[
                      styles.unitButtonText,
                      settings.heightUnit === 'cm' && styles.unitButtonTextActive,
                    ]}
                  >
                    Metric (cm)
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.unitButton,
                    settings.heightUnit === 'ft-in' && styles.unitButtonActive,
                  ]}
                  onPress={() => updateSettings({ heightUnit: 'ft-in' })}
                >
                  <Text
                    style={[
                      styles.unitButtonText,
                      settings.heightUnit === 'ft-in' && styles.unitButtonTextActive,
                    ]}
                  >
                    Imperial (ft-in)
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
            
            {/* Height Input Section */}
            <View style={styles.settingRow}>
              {settings.heightUnit === 'cm' ? (
                <View style={{ flex: 1 }}>
                  <Text style={styles.settingLabel}>Height (cm)</Text>
                  <TextInput
                    style={styles.numericInput}
                    keyboardType="numeric"
                    placeholder="170"
                    defaultValue={settings.userHeight ? settings.userHeight.toString() : ''}
                    onChangeText={(text) => {
                      const height = parseInt(text, 10);
                      if (!isNaN(height) && height > 0) {
                        updateSettings({ userHeight: height });
                      } else if (text === '') {
                        updateSettings({ userHeight: undefined });
                      }
                    }}
                    onBlur={() => Keyboard.dismiss()}
                  />
                </View>
              ) : (
                <View style={{ flex: 1 }}>
                  <View style={styles.settingRowDoubleInput}>
                    <View style={styles.doubleInputContainer}>
                      <Text style={styles.settingLabel}>Feet</Text>
                      <TextInput
                        style={[styles.numericInput, styles.smallInput]}
                        keyboardType="numeric"
                        placeholder="5"
                        defaultValue={settings.userHeightFeet ? settings.userHeightFeet.toString() : ''}
                        onChangeText={(text) => {
                          const feet = parseInt(text, 10);
                          if (!isNaN(feet) && feet >= 0) {
                            // Convert to cm and update both values
                            const inches = settings.userHeightInches || 0;
                            const totalCm = Math.round((feet * 30.48) + (inches * 2.54));
                            updateSettings({ 
                              userHeightFeet: feet, 
                              userHeight: totalCm 
                            });
                          } else if (text === '') {
                            updateSettings({ userHeightFeet: undefined });
                          }
                        }}
                        onBlur={() => Keyboard.dismiss()}
                      />
                    </View>
                    <View style={styles.doubleInputContainer}>
                      <Text style={styles.settingLabel}>Inches</Text>
                      <TextInput
                        style={[styles.numericInput, styles.smallInput]}
                        keyboardType="numeric"
                        placeholder="10"
                        onChangeText={(text) => {
                          const inches = parseInt(text, 10);
                          if (!isNaN(inches) && inches >= 0 && inches < 12) {
                            // Convert to cm and update both values
                            const feet = settings.userHeightFeet || 0;
                            const totalCm = Math.round((feet * 30.48) + (inches * 2.54));
                            updateSettings({ 
                              userHeightInches: inches, 
                              userHeight: totalCm 
                            });
                          } else if (text === '') {
                            updateSettings({ userHeightInches: undefined });
                          }
                        }}
                        onBlur={() => Keyboard.dismiss()}
                      />
                    </View>
                  </View>
                </View>
              )}

              {/* Weight Section with Unit Toggle */}
              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>Weight</Text>
                <View style={styles.buttonGroup}>
                  <TouchableOpacity
                    style={[
                      styles.unitButton,
                      settings.weightUnit === 'kg' && styles.unitButtonActive,
                    ]}
                    onPress={() => updateSettings({ weightUnit: 'kg' })}
                  >
                    <Text
                      style={[
                        styles.unitButtonText,
                        settings.weightUnit === 'kg' && styles.unitButtonTextActive,
                      ]}
                    >
                      Metric (kg)
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.unitButton,
                      settings.weightUnit === 'lb' && styles.unitButtonActive,
                    ]}
                    onPress={() => updateSettings({ weightUnit: 'lb' })}
                  >
                    <Text
                      style={[
                        styles.unitButtonText,
                        settings.weightUnit === 'lb' && styles.unitButtonTextActive,
                      ]}
                    >
                      Imperial (lb)
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>
                  {settings.weightUnit === 'kg' ? 'Weight (kg)' : 'Weight (lb)'}
                </Text>
                <TextInput
                  style={styles.numericInput}
                  keyboardType="numeric"
                  placeholder={settings.weightUnit === 'kg' ? '70' : '154'}
                  value={settings.userWeight 
                    ? settings.weightUnit === 'kg'
                      ? settings.userWeight.toString()
                      : Math.round(settings.userWeight * 2.20462).toString()
                    : ''}
                  onChangeText={(text) => {
                    const weightValue = parseFloat(text);
                    if (!isNaN(weightValue) && weightValue > 0) {
                      // Always store in kg internally
                      const weightInKg = settings.weightUnit === 'kg' 
                        ? weightValue 
                        : Math.round(weightValue / 2.20462);
                      updateSettings({ userWeight: weightInKg });
                    } else if (text === '') {
                      updateSettings({ userWeight: undefined });
                    }
                  }}
                  onBlur={() => Keyboard.dismiss()}
                />
              </View>
            </View>
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
                trackColor={{ false: '#3e3e3e', true: '#f97316' }}
                thumbColor={settings.showDebugInfo ? "#ffffff" : "#f4f3f4"}
                ios_backgroundColor="#3e3e3e"
                onValueChange={(newValue) => updateSettings({ showDebugInfo: newValue })}
                value={settings.showDebugInfo ?? false}
              />
            </View>
            
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Render Maps (Experimental)</Text>
              <Switch
                trackColor={{ false: '#3e3e3e', true: '#f97316' }}
                thumbColor={settings.renderMapsDebug ? "#ffffff" : "#f4f3f4"}
                ios_backgroundColor="#3e3e3e"
                onValueChange={(newValue) => updateSettings({ renderMapsDebug: newValue })}
                value={settings.renderMapsDebug ?? true}
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
                          // Reset to default settings
                          updateSettings({
                            heightUnit: 'cm',
                            weightUnit: 'kg',
                            userHeight: undefined,
                            userWeight: undefined,
                            userHeightFeet: undefined,
                            userHeightInches: undefined,
                            showDebugInfo: false,
                            renderMapsDebug: true
                          });
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
            {settings.showDebugInfo && (
              <View style={styles.debugInfoContainer}>
                <Text style={styles.debugInfoTitle}>App Information</Text>
                <Text style={styles.debugInfoText}>Version: 1.0.0</Text>
                <Text style={styles.debugInfoText}>Build: 1</Text>
                <Text style={styles.debugInfoText}>Environment: {__DEV__ ? 'Development' : 'Production'}</Text>
                <Text style={[styles.debugInfoText, { marginTop: 10 }]}>User ID: {user?.id || 'N/A'}</Text>
                <Text style={styles.debugInfoText}>Email: {user?.email || 'N/A'}</Text>
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

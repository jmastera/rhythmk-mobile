import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Keyboard } from 'react-native';
import { HeaderSafeArea } from '../components/HeaderSafeArea';
import { useUserSettings, UserSettings } from '../hooks/useUserSettings';
import AudioCueSettings from '../components/AudioCueSettings';
import { ChevronDown, ChevronUp } from 'lucide-react-native';

const SettingsScreen = () => {
  const {
    settings,
    updateAudioCueDefaults,
    updateSettings, // Add updateSettings to manage global settings like displayUnit
    isLoadingSettings,
  } = useUserSettings();
  
  // State to track expanded/collapsed sections
  const [expandedSections, setExpandedSections] = useState({
    audioCues: false,    // Audio Cues section - collapsed by default
    userProfile: false,  // User Profile section - collapsed by default
    displayPrefs: false, // Display Preferences - collapsed by default
    debugSettings: false, // Debug Settings - collapsed by default
  });
  
  // Toggle expanded/collapsed state for a section
  const toggleSection = (section: 'audioCues' | 'userProfile' | 'displayPrefs' | 'debugSettings') => {
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
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <HeaderSafeArea />
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
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Preferred Units</Text>
            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={[
                  styles.unitButton,
                  settings.displayUnit === 'km' && styles.unitButtonActive,
                ]}
                onPress={() => updateSettings({ displayUnit: 'km' })}
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
                  settings.displayUnit === 'mi' && styles.unitButtonActive,
                ]}
                onPress={() => updateSettings({ displayUnit: 'mi' })}
              >
                <Text
                  style={[
                    styles.unitButtonText,
                    settings.displayUnit === 'mi' && styles.unitButtonTextActive,
                  ]}
                >
                  Miles
                </Text>
              </TouchableOpacity>
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
          <>
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
            
            {settings.heightUnit === 'cm' ? (
              <View style={styles.settingRow}>
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
                    defaultValue={settings.userHeightInches ? settings.userHeightInches.toString() : ''}
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
          </>
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
          <View>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Render Maps (Experimental)</Text>
              <Switch
                trackColor={{ false: '#3e3e3e', true: '#f97316' }} // Using a darker grey for off and accent for on
                thumbColor={settings.renderMapsDebug ? "#ffffff" : "#f4f3f4"}
                ios_backgroundColor="#3e3e3e"
                onValueChange={(newValue) => updateSettings({ renderMapsDebug: newValue })}
                value={settings.renderMapsDebug ?? true} // Default to true if undefined during load
              />
            </View>
          </View>
        )}
      </View>
      
      {/* Add more settings sections or components as needed */}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212', // Dark background for the screen
  },
  contentContainer: {
    padding: 16, // Consistent padding
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#FFFFFF',
    fontSize: 16,
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingTop: 24, // More padding at the top for status bar etc.
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  // Styles for new sections and settings
  sectionContainer: {
    marginTop: 20,
    marginHorizontal: 16,
    padding: 16,
    backgroundColor: '#1e1e1e', // Slightly lighter than screen background
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    color: '#FFF',
    fontWeight: 'bold',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  settingLabel: {
    fontSize: 16,
    color: 'white',
  },
  buttonGroup: {
    flexDirection: 'row',
  },
  unitButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8, // Consistent with other elements
    borderWidth: 1,
    borderColor: '#FFA500', // Accent color
    marginHorizontal: 4,
  },
  unitButtonActive: {
    backgroundColor: '#FFA500', // Accent color for active button
  },
  unitButtonText: {
    fontSize: 14,
    color: '#FFA500', // Accent color
  },
  unitButtonTextActive: {
    color: '#121212', // Dark text for active button
    fontWeight: 'bold',
  },
  numericInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#FFF',
    minWidth: 80,
    textAlign: 'center',
    fontSize: 16,
  },
  settingRowDoubleInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  doubleInputContainer: {
    width: '48%',
  },
  smallInput: {
    width: '100%',
  },
});

export default SettingsScreen;

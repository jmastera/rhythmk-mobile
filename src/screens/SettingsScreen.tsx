import React from 'react';
import { ScrollView, StyleSheet, Text, View, ActivityIndicator, TouchableOpacity, Switch } from 'react-native';

import AudioCueSettings from '../components/AudioCueSettings';
import { useUserSettings, UserSettings } from '../hooks/useUserSettings';
import { HeaderSafeArea } from '../components/HeaderSafeArea';

const SettingsScreen = () => {
  const {
    settings,
    updateAudioCueDefaults,
    updateSettings, // Add updateSettings to manage global settings like displayUnit
    isLoadingSettings,
  } = useUserSettings();

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

      {/* AudioCueSettings requires current settings and a save handler */}
      {/* The 'onClose' prop for AudioCueSettings is not strictly needed here, */}
      {/* but we provide a no-op function for completeness as it's in its props. */}
      <AudioCueSettings
        currentSettings={settings.audioCueDefaults}
        onSave={updateAudioCueDefaults}
      />

      {/* Display Unit Preference Section */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Display Preferences</Text>
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
      </View>

      {/* Debug Settings Section */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Debug Settings</Text>
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
    fontWeight: 'bold',
    color: '#FFA500', // Accent color for section titles
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
});

export default SettingsScreen;

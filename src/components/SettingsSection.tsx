import React from 'react';
import { View, Text, StyleSheet, Switch, TextInput } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useUserSettings } from '../hooks/useUserSettings';

// Define a type for the settings keys to ensure type safety in handleAudioSettingChange
type AudioCueSettingKey = keyof ReturnType<typeof useUserSettings>['settings']['audioCueDefaults'];

const SettingsSection = () => {
  const { settings, updateAudioCueDefaults } = useUserSettings();

  const distanceOptions = {
    km: [0.25, 0.5, 1, 2, 5],
    miles: [0.25, 0.5, 1, 2, 3],
  };

  const handleAudioSettingChange = (setting: AudioCueSettingKey, value: any) => {
    updateAudioCueDefaults({ [setting]: value });
  };

  return (
    <View style={styles.container}>
      {/* Distance Alerts Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Distance Alerts</Text>
          <Text style={styles.cardDescription}>Set defaults for distance-based audio cues.</Text>
        </View>
        <View style={styles.cardContent}>
          <View style={styles.settingRow}>
            <Text style={styles.label}>Enable Distance Alerts</Text>
            <Switch
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={settings.audioCueDefaults.announceDistance ? '#f5dd4b' : '#f4f3f4'}
              ios_backgroundColor="#3e3e3e"
              onValueChange={(value) => handleAudioSettingChange('announceDistance', value)}
              value={settings.audioCueDefaults.announceDistance}
            />
          </View>
          {settings.audioCueDefaults.announceDistance && (
            <>
              <View style={styles.settingRow}>
                <Text style={styles.label}>Unit</Text>
                <Picker
                  selectedValue={settings.audioCueDefaults.distanceUnit}
                  style={styles.picker}
                  itemStyle={styles.pickerItem} // For iOS picker item styling
                  dropdownIconColor="#ffffff" // For Android dropdown icon color
                  onValueChange={(itemValue: 'km' | 'miles') => {
                    const newUnit = itemValue as 'km' | 'miles';
                    updateAudioCueDefaults({
                      distanceUnit: newUnit,
                      distanceInterval: distanceOptions[newUnit][0], // Reset interval
                    });
                  }}
                >
                  <Picker.Item label="Kilometers" value="km" color="#000000" />
                  <Picker.Item label="Miles" value="miles" color="#000000" />
                </Picker>
              </View>
              <View style={styles.settingRow}>
                <Text style={styles.label}>Interval ({settings.audioCueDefaults.distanceUnit})</Text>
                <Picker
                  selectedValue={settings.audioCueDefaults.distanceInterval}
                  style={styles.picker}
                  itemStyle={styles.pickerItem}
                  dropdownIconColor="#ffffff"
                  onValueChange={(itemValue: string | number) => handleAudioSettingChange('distanceInterval', parseFloat(String(itemValue)))}
                >
                  {distanceOptions[settings.audioCueDefaults.distanceUnit].map((interval: number) => (
                    <Picker.Item key={interval} label={`${interval} ${settings.audioCueDefaults.distanceUnit}`} value={interval} color="#000000" />
                  ))}
                </Picker>
              </View>
            </>
          )}
        </View>
      </View>

      {/* Pace Alerts Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Pace Alerts</Text>
          <Text style={styles.cardDescription}>Set defaults for pace-based audio cues.</Text>
        </View>
        <View style={styles.cardContent}>
          <View style={styles.settingRow}>
            <Text style={styles.label}>Enable Pace Alerts</Text>
            <Switch
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={settings.audioCueDefaults.announcePace ? '#f5dd4b' : '#f4f3f4'}
              ios_backgroundColor="#3e3e3e"
              onValueChange={(value) => handleAudioSettingChange('announcePace', value)}
              value={settings.audioCueDefaults.announcePace}
            />
          </View>
          {settings.audioCueDefaults.announcePace && (
            <>
              <View style={styles.settingRow}>
                <Text style={styles.label}>Target Pace (mm:ss)</Text>
                <TextInput
                  style={styles.input}
                  value={settings.audioCueDefaults.targetPace}
                  onChangeText={(value) => handleAudioSettingChange('targetPace', value)}
                  placeholder="5:30"
                  placeholderTextColor="#999"
                />
              </View>
              <View style={styles.settingRow}>
                <Text style={styles.label}>Pace Tolerance (seconds)</Text>
                <TextInput
                  style={styles.input}
                  value={String(settings.audioCueDefaults.paceTolerance)} // TextInput expects string
                  onChangeText={(value) => handleAudioSettingChange('paceTolerance', parseInt(value, 10) || 0)}
                  keyboardType="numeric"
                  placeholder="15"
                  placeholderTextColor="#999"
                />
              </View>
            </>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#121212', // Dark background for the section
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)', // white/10
    borderColor: 'rgba(255, 255, 255, 0.2)', // white/20
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 20,
    padding: 16,
  },
  cardHeader: {
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: '#B0B0B0',
  },
  cardContent: {
    // No specific styles needed here if padding is on the card itself
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    borderBottomWidth: 1,
  },
  label: {
    fontSize: 16,
    color: '#E0E0E0',
    flex: 1, // Allow label to take available space
  },
  picker: {
    height: 50,
    width: 150,
    color: '#FFFFFF', // Text color for selected item on Android
    backgroundColor: 'rgba(255, 255, 255, 0.15)', // Slightly different background for picker
    borderRadius: 4,
  },
  pickerItem: { // For iOS picker item styling
    color: '#000000', // iOS picker items are typically black on a light background
  },
  input: {
    height: 40,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 10,
    color: '#FFFFFF',
    minWidth: 80, // Ensure input is not too small
    textAlign: 'right',
  },
});

export default SettingsSection;

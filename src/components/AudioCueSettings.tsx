import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, TextInput, ScrollView } from 'react-native';
import { MapPin, Timer, Volume2, X, ChevronDown, ChevronUp } from 'lucide-react-native';
import { AudioCueSettingsData } from '../types/audioTypes'; // Import the interface

interface AudioCueSettingsProps {
  onSave: (settings: AudioCueSettingsData) => void;
  currentSettings: AudioCueSettingsData;
  onClose?: () => void; // Added onClose prop
}

const AudioCueSettings = ({ onSave, currentSettings, onClose }: AudioCueSettingsProps) => {
  const [settings, setSettings] = useState<AudioCueSettingsData>(currentSettings);
  
  // Track expanded/collapsed state for each section
  const [expandedSections, setExpandedSections] = useState({
    distance: false,  // Default to collapsed
    time: false,      // Default to collapsed
    pace: false       // Default to collapsed
  });
  
  // Toggle expanded/collapsed state for a section
  const toggleSection = (section: 'distance' | 'time' | 'pace') => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const distanceOptions = {
    km: [0.25, 0.5, 1, 2, 5],
    miles: [0.25, 0.5, 1, 2, 3],
  };

  const paceToleranceOptions = [5, 10, 15, 20];

  const handleSave = () => {
    onSave(settings);
  };

  const formatPaceInput = (value: string): string => {
    const cleaned = value.replace(/[^\d:]/g, '');
    if (cleaned.includes(':')) {
      const parts = cleaned.split(':');
      if (parts.length === 2) {
        const mins = parts[0].slice(0, 2);
        const secs = parts[1].slice(0, 2);
        return `${mins}:${secs}`;
      }
    } else if (cleaned.length <= 2) {
      return cleaned;
    } else if (cleaned.length <= 4) {
      return `${cleaned.slice(0, 2)}:${cleaned.slice(-2)}`;
    }
    return cleaned.slice(0, 5); // Max 5 chars like "MM:SS"
  };

  return (
    <View>
      {onClose && (
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
      )}

      {/* Distance Alerts Card */}
      <View style={styles.card}>
        <TouchableOpacity 
          style={styles.cardHeader}
          onPress={() => toggleSection('distance')}
          activeOpacity={0.7}
        >
          <View style={styles.cardHeaderTitleContainer}>
            <MapPin size={22} color="#FFA500" style={styles.icon} />
            <Text style={styles.cardTitle}>Distance Alerts</Text>
          </View>
          <View style={styles.headerRightContainer}>
            <Switch
              trackColor={{ false: '#767577', true: '#FFA500' }}
              thumbColor={settings.announceDistance ? '#FFF' : '#f4f3f4'}
              ios_backgroundColor="#3e3e3e"
              onValueChange={(enabled) => setSettings((prev) => ({ ...prev, announceDistance: enabled }))}
              value={settings.announceDistance}
              style={{marginRight: 10}}
            />
            {expandedSections.distance ? 
              <ChevronUp size={18} color="#FFA500" /> : 
              <ChevronDown size={18} color="#FFA500" />}
          </View>
        </TouchableOpacity>
        {settings.announceDistance && expandedSections.distance && (
          <View style={styles.cardContent}>
            <Text style={styles.label}>Unit</Text>
            <View style={styles.buttonGroup}>
              {(['km', 'miles'] as const).map((unit) => (
                <TouchableOpacity
                  key={unit}
                  style={[
                    styles.toggleButton,
                    settings.distanceUnit === unit && styles.toggleButtonActive,
                  ]}
                  onPress={() =>
                    setSettings((prev) => ({
                      ...prev,
                      distanceUnit: unit,
                      distanceInterval: distanceOptions[unit][0], // Reset interval when unit changes
                    }))
                  }
                >
                  <Text style={[styles.toggleButtonText, settings.distanceUnit === unit && styles.toggleButtonTextActive]}>
                    {unit.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Interval</Text>
            <View style={styles.grid}>
              {distanceOptions[settings.distanceUnit].map((interval) => (
                <TouchableOpacity
                  key={interval}
                  style={[
                    styles.gridButton,
                    settings.distanceInterval === interval && styles.gridButtonActive,
                  ]}
                  onPress={() => setSettings((prev) => ({ ...prev, distanceInterval: interval }))}
                >
                  <Text style={[styles.gridButtonText, settings.distanceInterval === interval && styles.gridButtonTextActive]}>
                    {interval} {settings.distanceUnit}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </View>

      {/* Pace Alerts Card */}
      <View style={styles.card}>
        <TouchableOpacity 
          style={styles.cardHeader}
          onPress={() => toggleSection('pace')}
          activeOpacity={0.7}
        >
          <View style={styles.cardHeaderTitleContainer}>
            <Timer size={22} color="#FFA500" style={styles.icon} />
            <Text style={styles.cardTitle}>Pace Alerts</Text>
          </View>
          <View style={styles.headerRightContainer}>
            <Switch
              trackColor={{ false: '#767577', true: '#FFA500' }}
              thumbColor={settings.announcePace ? '#FFF' : '#f4f3f4'}
              ios_backgroundColor="#3e3e3e"
              onValueChange={(enabled) => setSettings((prev) => ({ ...prev, announcePace: enabled }))}
              value={settings.announcePace}
              style={{marginRight: 10}}
            />
            {expandedSections.pace ? 
              <ChevronUp size={18} color="#FFA500" /> : 
              <ChevronDown size={18} color="#FFA500" />}
          </View>
        </TouchableOpacity>
        {settings.announcePace && expandedSections.pace && (
          <View style={styles.cardContent}>
            <Text style={styles.label}>Target Pace (per {settings.distanceUnit})</Text>
            <TextInput
              style={styles.input}
              value={settings.targetPace}
              onChangeText={(text) =>
                setSettings((prev) => ({ ...prev, targetPace: formatPaceInput(text) }))
              }
              placeholder="MM:SS"
              placeholderTextColor="#999"
              keyboardType="numbers-and-punctuation"
              maxLength={5}
            />

            <Text style={styles.label}>Tolerance (±seconds)</Text>
            <View style={styles.grid}>
              {paceToleranceOptions.map((tolerance) => (
                <TouchableOpacity
                  key={tolerance}
                  style={[
                    styles.gridButton,
                    settings.paceTolerance === tolerance && styles.gridButtonActive,
                  ]}
                  onPress={() => setSettings((prev) => ({ ...prev, paceTolerance: tolerance }))}
                >
                  <Text style={[styles.gridButtonText, settings.paceTolerance === tolerance && styles.gridButtonTextActive]}>
                    ±{tolerance}s
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </View>

      {onClose && (
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save Audio Settings</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 10,
  },
  closeButton: {
    padding: 8, // Make it easier to tap
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)', // Translucent white
    borderRadius: 12,
    marginBottom: 15,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardHeaderTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
  },
  cardContent: {
    padding: 16,
  },
  label: {
    fontSize: 14,
    color: '#AAA',
    marginBottom: 8,
    marginTop: 12,
  },
  buttonGroup: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#FFA500',
    borderColor: '#FFA500',
  },
  toggleButtonText: {
    color: '#FFF',
  },
  toggleButtonTextActive: {
    color: '#000', // Dark text on active orange button
    fontWeight: 'bold',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridButton: {
    minWidth: '30%', // Adjust for 3 or 4 items per row
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 6,
    alignItems: 'center',
    marginBottom: 8,
  },
  gridButtonActive: {
    backgroundColor: '#FFA500',
    borderColor: '#FFA500',
  },
  gridButtonText: {
    color: '#FFF',
    fontSize: 13,
  },
  gridButtonTextActive: {
    color: '#000',
    fontWeight: 'bold',
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    color: '#FFF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    fontSize: 16,
    marginBottom: 16,
  },
  saveButton: {
    backgroundColor: '#FFA500',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    marginTop: 16,
    marginBottom: 8,
    alignSelf: 'center',
    minWidth: 200,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  saveButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});

export default AudioCueSettings;

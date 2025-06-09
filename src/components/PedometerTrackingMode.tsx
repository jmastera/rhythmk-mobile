import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform, Switch } from 'react-native';
import { Watch, Navigation, ChevronDown, ChevronUp } from 'lucide-react-native';
import { useStepCounter } from '../hooks/useStepCounter';
import { useUserSettings } from '../hooks/useUserSettings';

interface PedometerTrackingModeProps {
  isActive: boolean;
  gpsDistanceKm: number;
  onStepDistanceUpdate: (distanceInKm: number) => void;
  onHybridDistanceUpdate: (distanceInKm: number) => void;
  gpsActive: boolean;
  onGpsActiveChange?: (active: boolean) => void;
}

const PedometerTrackingMode: React.FC<PedometerTrackingModeProps> = ({ 
  isActive, 
  gpsDistanceKm,
  onStepDistanceUpdate,
  onHybridDistanceUpdate,
  gpsActive,
  onGpsActiveChange
}) => {
  const { settings } = useUserSettings();
  const [showCalibration, setShowCalibration] = useState(false);
  const [heightCm, setHeightCm] = useState<number>(settings.userHeight || 170); // Default to 170cm if not set
  const [isExpanded, setIsExpanded] = useState(false); // Default to minimized state
  const isRunning = true; // Assume running mode for stride length calculation
  
  // Toggle the expanded/minimized state
  const toggleExpanded = () => setIsExpanded(prev => !prev);
  
  const {
    steps,
    distance,
    distanceKm,
    hybridDistance,
    hybridDistanceKm,
    calibrationFactor,
    isCalibrated,
    resetCounter,
    calibrateStride
  } = useStepCounter({
    enabled: isActive, // Always enabled when tracking is active
    isRunning,
    userHeightCm: heightCm,
    gpsDistanceMeters: gpsDistanceKm * 1000, // Convert km to meters
    isGpsActive: gpsActive,
    onDistanceChange: (distanceMeters) => {
      // Convert meters to kilometers for the callback
      onStepDistanceUpdate(distanceMeters / 1000);
    },
    onHybridDistanceChange: (hybridDistanceMeters) => {
      console.log(`🔄 Direct hybrid distance callback: ${(hybridDistanceMeters/1000).toFixed(3)} km`);
      onHybridDistanceUpdate(hybridDistanceMeters / 1000);
    }
  });
  
  // Reset counter when mode changes or tracking stops
  useEffect(() => {
    if (!isActive) {
      resetCounter();
    }
  }, [isActive, resetCounter]);
  
  // Platform check for sensor availability
  const [sensorsAvailable, setSensorsAvailable] = useState(true);
  
  useEffect(() => {
    // In a real implementation, we would check for sensor availability
    // This is a placeholder for that check
    const checkSensors = async () => {
      try {
        // This would be replaced with actual sensor checking code
        setSensorsAvailable(true);
      } catch (error) {
        setSensorsAvailable(false);
        Alert.alert(
          "Sensors Unavailable",
          "Your device doesn't support step counting. GPS tracking will be used instead.",
          [{ text: "OK" }]
        );
        if (onGpsActiveChange) {
          onGpsActiveChange(true); // Force GPS mode
        }
      }
    };
    
    checkSensors();
  }, []);
  
  if (!sensorsAvailable) {
    return null;
  }
  
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.headerContainer}
        onPress={toggleExpanded}
        activeOpacity={0.7}
      >
        <View style={styles.headerRow}>
          <Text style={styles.sectionHeader}>Accuracy Tracking</Text>
          <View style={styles.headerRightContent}>
            <Text style={[styles.sectionTag, gpsActive ? styles.activeTag : styles.inactiveTag]}>
              {gpsActive ? 'GPS + Steps' : 'Steps Only'}
            </Text>
            {isExpanded ? 
              <ChevronUp size={18} color="#d1d5db" /> : 
              <ChevronDown size={18} color="#d1d5db" />
            }
          </View>
        </View>

        {/* Always show steps summary even when minimized */}
        <View style={styles.minimizedSummary}>
          <Text style={styles.infoText}>
            {gpsActive 
              ? `Steps: ${steps} (${(distanceKm).toFixed(2)} km) • GPS Assisted`
              : `Steps: ${steps} (${(distanceKm).toFixed(2)} km) • Steps Only`}
          </Text>
        </View>
      </TouchableOpacity>

      {isExpanded && (
        <>
          <View style={styles.toggleContainer}>
            <Text style={styles.infoText}>
              {gpsActive 
                ? 'Using hybrid GPS + step data for optimal accuracy.'
                : 'Using step counter only - ideal for treadmills and indoor running.'}
            </Text>
          </View>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Steps:</Text>
              <Text style={styles.statValue}>{steps}</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Steps Distance:</Text>
              <Text style={styles.statValue}>{(distanceKm).toFixed(2)} km</Text>
            </View>
            
            {gpsActive && (
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>GPS Distance:</Text>
                <Text style={styles.statValue}>{(gpsDistanceKm).toFixed(2)} km</Text>
              </View>
            )}
            
            <View style={styles.statItemWide}>
              <Text style={styles.statLabel}>Tracking Quality:</Text>
              <View style={styles.qualityBar}>
                <View 
                  style={[styles.qualityFill, { width: `${Math.min(100, Math.max(0, calibrationFactor * 50))}%` }]} 
                />
                <Text style={styles.qualityText}>
                  {calibrationFactor > 0.95 && calibrationFactor < 1.05 ? 'Excellent' : 
                   calibrationFactor > 0.9 && calibrationFactor < 1.1 ? 'Good' : 'Needs Calibration'}
                </Text>
              </View>
            </View>
            
            <TouchableOpacity 
              style={styles.calibrateButton}
              onPress={() => Alert.alert(
                "Calibrate Step Counter",
                "For more accurate results, run a known distance (like 400m on a track) and calibrate.",
                [
                  { text: "Later" },
                  { 
                    text: "Calibrate with 400m", 
                    onPress: () => calibrateStride(400) 
                  }
                ]
              )}
            >
              <Text style={styles.calibrateButtonText}>Manual Calibrate</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#1f2937',
    borderRadius: 8,
    marginBottom: 16,
  },
  headerContainer: {
    paddingBottom: 8,
  },
  minimizedSummary: {
    marginTop: 4,
  },
  headerRightContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toggleContainer: {
    marginBottom: 8,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  sectionHeader: {
    color: '#f3f4f6',
    fontSize: 16,
    fontWeight: '600',
  },
  sectionTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 12,
    overflow: 'hidden',
    fontWeight: '500',
  },
  activeTag: {
    backgroundColor: '#4ade80',
    color: '#064e3b',
  },
  inactiveTag: {
    backgroundColor: '#fb923c',
    color: '#7c2d12',
  },
  toggleLabel: {
    color: '#f3f4f6',
    fontSize: 16,
    flex: 1,
    marginLeft: 8,
  },
  infoText: {
    color: '#9ca3af',
    fontSize: 12,
    marginTop: 2,
  },
  statsContainer: {
    marginTop: 8,
  },
  statItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statItemWide: {
    marginBottom: 12,
  },
  statLabel: {
    color: '#d1d5db',
    fontSize: 14,
  },
  statValue: {
    color: '#f97316',
    fontSize: 14,
    fontWeight: '600',
  },
  qualityBar: {
    height: 16,
    backgroundColor: '#374151',
    borderRadius: 8,
    marginTop: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  qualityFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    backgroundColor: '#4ade80',
  },
  qualityText: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    textAlign: 'center',
    textAlignVertical: 'center',
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  calibrateButton: {
    backgroundColor: '#f97316',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
    alignSelf: 'center',
    marginTop: 8,
  },
  calibrateButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default PedometerTrackingMode;

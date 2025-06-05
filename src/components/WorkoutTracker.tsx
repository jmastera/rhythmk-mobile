import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, AppState, Platform, TextInput } from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../App'; // Adjust path if App.tsx is elsewhere
import * as Location from 'expo-location';
import { Settings, Clock, MapPin, Zap, Target, Play, Pause, Square } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AudioCueSettings from './AudioCueSettings';
import { useAudioCues } from '../hooks/useAudioCues';
import { AudioCueSettingsData, useUserSettings } from '../hooks/useUserSettings';
import { WorkoutEntry, WORKOUT_HISTORY_KEY, Split } from '../types/history';
import { formatDistanceDisplay, formatPaceDisplay, decimalMinutesToTime, formatDurationDisplay } from '../utils/units';

const DEFAULT_USER_WEIGHT_KG = 70; // Default user weight in kilograms for calorie estimation
const SPLIT_DISTANCE_KM = 1; // Define 1km as the distance for each split

// Placeholder for TrainingPlanType if not imported from elsewhere
// TrainingPlanDetails is now defined in App.tsx and passed via navigation
// We'll use RootStackParamList to type the route prop

type WorkoutTrackerScreenRouteProp = RouteProp<RootStackParamList, 'WorkoutTracker'>;

interface WorkoutTrackerProps {
  route: WorkoutTrackerScreenRouteProp;
  onWorkoutComplete?: (workoutData: any) => void; // Replace 'any' with a more specific type if available
}

// Helper function to calculate distance between two lat/lng points (Haversine formula)
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
};

const calculatePaceMinPerKm = (distanceKm: number, durationSeconds: number): number | null => {
  if (distanceKm <= 0 || durationSeconds <= 0) return null;
  return durationSeconds / 60 / distanceKm; // Returns decimal minutes per km
};

const WorkoutTracker: React.FC<WorkoutTrackerProps> = ({ route, onWorkoutComplete }) => {
  const currentPlan = route.params?.currentPlan;

  const [isTracking, setIsTracking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0); // in seconds
  const [distance, setDistance] = useState(0); // in km
  const [currentPace, setCurrentPace] = useState<number | null>(null); // min/km as decimal
  const [avgPace, setAvgPace] = useState<number | null>(null); // min/km as decimal
  const [coordinates, setCoordinates] = useState<Array<{ latitude: number; longitude: number; altitude?: number | null; timestamp?: number }>>([]);
  const [lastPosition, setLastPosition] = useState<Location.LocationObjectCoords | null>(null);
  const [totalElevationGain, setTotalElevationGain] = useState(0); // in meters
  const [totalElevationLoss, setTotalElevationLoss] = useState(0); // in meters
  const [currentNotes, setCurrentNotes] = useState('');
  const [estimatedCalories, setEstimatedCalories] = useState(0);
  const [splits, setSplits] = useState<Split[]>([]);
  const [distanceSinceLastSplitKm, setDistanceSinceLastSplitKm] = useState(0);
  const [timeAtLastSplitSeconds, setTimeAtLastSplitSeconds] = useState(0);
  
  const [showAudioSettings, setShowAudioSettings] = useState(false);
  const { settings, updateAudioCueDefaults, isLoadingSettings } = useUserSettings();
  // Initialize runAudioSettings with current user defaults, or app defaults if not loaded
  const [runAudioSettings, setRunAudioSettings] = useState<AudioCueSettingsData>(settings.audioCueDefaults);

  useEffect(() => {
    if (!isLoadingSettings) {
        setRunAudioSettings(settings.audioCueDefaults);
    }
  }, [settings.audioCueDefaults, isLoadingSettings]);

  // Refs for state values needed in callbacks
  const isTrackingRef = useRef(isTracking);
  const isPausedRef = useRef(isPaused);
  const lastLocationTimestampRef = useRef<number | null>(null);
  // Keep refs updated with the latest state
  useEffect(() => {
    isTrackingRef.current = isTracking;
  }, [isTracking]);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  const {
    checkDistanceCue,
    checkPaceCue,
    announceWorkoutStart,
    announceWorkoutEnd,
    announceSplit,
  } = useAudioCues({ settings: runAudioSettings, isTracking: isTrackingRef.current });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);
  const hasAnnouncedStart = useRef(false);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App has come to the foreground
        // Potentially re-check GPS status or permissions if issues arise
      }
      appState.current = nextAppState;
    });
    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (isTracking && !isPaused) {
      if (!hasAnnouncedStart.current) {
        announceWorkoutStart();
        hasAnnouncedStart.current = true;
      }
      intervalRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isTracking, isPaused, announceWorkoutStart]);

  const startTracking = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      console.error('Permission to access location was denied');
      // TODO: Show an alert to the user
      return;
    }

    setIsTracking(true);
    setIsPaused(false);
    setDuration(0);
    setDistance(0);
    setCurrentPace(null);
    setAvgPace(null);
    setCoordinates([]);
    setLastPosition(null);
    hasAnnouncedStart.current = false;

    try {
      const subscriber = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation, 
          timeInterval: 1000, 
          distanceInterval: 1, 
        },
        (newLocation) => {
          if (!isTrackingRef.current || isPausedRef.current) return;

          const { latitude, longitude, altitude } = newLocation.coords;
          const timestamp = newLocation.timestamp;

          let segmentDistanceKm = 0;
          setCoordinates((prevCoords) => {
            const newCoordsList = [...prevCoords, { latitude, longitude, altitude, timestamp }];
            if (newCoordsList.length > 1) {
              const prevPoint = newCoordsList[newCoordsList.length - 2];
              segmentDistanceKm = calculateDistance(
                prevPoint.latitude,
                prevPoint.longitude,
                latitude,
                longitude
              );
              setDistance((prevDistance) => prevDistance + segmentDistanceKm);

              // Calculate Elevation Gain/Loss
              if (prevPoint.altitude != null && altitude != null) {
                const altitudeDifference = altitude - prevPoint.altitude;
                if (altitudeDifference > 0) {
                  setTotalElevationGain((prevGain) => prevGain + altitudeDifference);
                } else if (altitudeDifference < 0) {
                  setTotalElevationLoss((prevLoss) => prevLoss + Math.abs(altitudeDifference));
                }
              }
            }
            return newCoordsList;
          });

          setLastPosition(newLocation.coords);

          // Pace calculations
          // 'distance' state is cumulative and in KM.
          // 'duration' state is cumulative and in seconds.
          const currentTotalDistance = distance + segmentDistanceKm; // Best estimate of current total distance

          // Update Average Pace
          if (currentTotalDistance > 0 && duration > 0) {
            setAvgPace(calculatePaceMinPerKm(currentTotalDistance, duration));
          }

          // Update Current Pace
          if (lastLocationTimestampRef.current) { // Simplified condition
            const timeDiffSeconds = (timestamp - lastLocationTimestampRef.current) / 1000;
            if (timeDiffSeconds > 0 && segmentDistanceKm > 0) {
              setCurrentPace(calculatePaceMinPerKm(segmentDistanceKm, timeDiffSeconds));
            } else if (timeDiffSeconds > 0 && segmentDistanceKm === 0) {
               setCurrentPace(null); // Or a very high number to indicate no pace
            }
          }
          
          lastLocationTimestampRef.current = timestamp; 

          // Pace Cues
          if (runAudioSettings.paceEnabled) {
            const displayUnitForAudio = runAudioSettings.distanceUnit === 'miles' ? 'mi' : runAudioSettings.distanceUnit;
            const formattedCurrentPace = currentPace !== null ? formatPaceDisplay(currentPace, displayUnitForAudio) : '--:--';
            const formattedAvgPace = avgPace !== null ? formatPaceDisplay(avgPace, displayUnitForAudio) : '--:--';
            checkPaceCue(formattedCurrentPace, formattedAvgPace);
          }

          // Distance Cues
          checkDistanceCue(currentTotalDistance);

          // Calorie Estimation
          if (currentTotalDistance > 0) {
            const calories = DEFAULT_USER_WEIGHT_KG * currentTotalDistance * 1.036;
            setEstimatedCalories(calories);
          }

          // Split Tracking
          if (segmentDistanceKm > 0) {
            setDistanceSinceLastSplitKm(prevDistSinceSplit => {
              const newDistSinceSplit = prevDistSinceSplit + segmentDistanceKm;
              if (newDistSinceSplit >= SPLIT_DISTANCE_KM) {
                const currentTotalDuration = duration; // Get the most up-to-date duration
                const splitDurationSeconds = currentTotalDuration - timeAtLastSplitSeconds;
                const numericSplitPace = calculatePaceMinPerKm(SPLIT_DISTANCE_KM, splitDurationSeconds);

                const newSplit: Split = {
                  splitNumber: splits.length + 1,
                  distance: SPLIT_DISTANCE_KM * 1000, // Store split distance in meters
                  duration: splitDurationSeconds,
                  pace: numericSplitPace !== null ? decimalMinutesToTime(numericSplitPace) : '--:--', // Format to MM:SS string for storage
                };
                setSplits(prevSplits => [...prevSplits, newSplit]);

                // Announce split (using audio cue settings for unit)
                const formattedPaceForAnnouncement = numericSplitPace !== null 
                  ? formatPaceDisplay(numericSplitPace, runAudioSettings.distanceUnit === 'miles' ? 'mi' : runAudioSettings.distanceUnit) 
                  : 'Pace not available';
                announceSplit(newSplit.splitNumber, formattedPaceForAnnouncement);
                setTimeAtLastSplitSeconds(currentTotalDuration);
                return newDistSinceSplit - SPLIT_DISTANCE_KM; // Carry over excess distance
              }
              return newDistSinceSplit;
            });
          }
        }
      );
      locationSubscription.current = subscriber;
    } catch (error) {
      console.error('Error starting workout tracking:', error);
      setIsTracking(false);
      // TODO: Show an alert to the user
    }
  };

  // Refs for state values needed in callbacks
  // isPausedRef is defined earlier (around line 79)


  const pauseTracking = () => {
    setIsPaused(!isPaused);
    if (!isPaused) { // Pausing
        // Speech.speak("Workout paused."); // Handled by useAudioCues if desired
    } else { // Resuming
        // Speech.speak("Workout resumed.");
        hasAnnouncedStart.current = true; // Don't re-announce start
    }
  };

  const stopTracking = async () => {
    // For announcements, use the audio cue's distance unit preference
    const audioCueUnitForPace = runAudioSettings.distanceUnit === 'miles' ? 'mi' : runAudioSettings.distanceUnit;
    const formattedAvgPaceForAnnouncement = avgPace !== null 
      ? formatPaceDisplay(avgPace, audioCueUnitForPace) 
      : 'Not available'; // useAudioCues's formatPace will handle this for speech
    announceWorkoutEnd(duration, distance, formattedAvgPaceForAnnouncement);

    // --- Save Workout Data --- 
    const newWorkoutEntry: WorkoutEntry = {
      id: new Date().getTime().toString(),
      date: new Date().toISOString(),
      duration: duration, // in seconds
      distance: Math.round(distance * 1000), // Convert km to meters and round
      avgPace: avgPace === null ? undefined : avgPace, // Convert null to undefined for storage
      coordinates: coordinates,
      planName: currentPlan?.raceType || 'Free Run',
      totalElevationGain: Math.round(totalElevationGain),
      totalElevationLoss: Math.round(totalElevationLoss),
      notes: currentNotes, // Save current notes
      calories: Math.round(estimatedCalories),
      avgHeartRate: undefined, // Placeholder
      splits: splits, // Save recorded splits
    };

    try {
      const existingHistoryJson = await AsyncStorage.getItem(WORKOUT_HISTORY_KEY);
      const existingHistory: WorkoutEntry[] = existingHistoryJson ? JSON.parse(existingHistoryJson) : [];
      existingHistory.push(newWorkoutEntry);
      await AsyncStorage.setItem(WORKOUT_HISTORY_KEY, JSON.stringify(existingHistory));
      } catch (e) {
      console.error('Failed to save workout history:', e);
      // Optionally, inform the user about the failure
    }
    // --- End Save Workout Data ---

    setIsTracking(false);
    setIsPaused(false);
    
    if (locationSubscription.current) {
      locationSubscription.current.remove();
      locationSubscription.current = null;
    }

    // Original workoutData for onWorkoutComplete prop, if still needed for other purposes
    const workoutDataForProp = {
      duration,
      distance: parseFloat(distance.toFixed(2)),
      avgPace,
      coordinates,
      date: new Date().toISOString(),
      planType: currentPlan?.raceType || 'Free Run',
      fitnessLevel: currentPlan?.fitnessLevel || 'N/A',
      audioSettingsUsed: runAudioSettings, // Save the settings used for this run
    };
    
      if (onWorkoutComplete) {
        onWorkoutComplete(workoutDataForProp);
    }
    
    // Reset for next workout
    setDuration(0);
    setDistance(0);
    setCurrentPace(null);
    setAvgPace(null);
    setCoordinates([]);
    setLastPosition(null);
    setCurrentNotes(''); // Reset notes
    setEstimatedCalories(0); // Reset calories
    setSplits([]); // Reset splits array
    setDistanceSinceLastSplitKm(0); // Reset distance for current split
    setTimeAtLastSplitSeconds(0); // Reset time for current split
    setTotalElevationGain(0); // Also reset elevation
    setTotalElevationLoss(0); // Also reset elevation
    hasAnnouncedStart.current = false;
  };

  const handleSaveAudioSettings = (newSettings: AudioCueSettingsData) => {
    setRunAudioSettings(newSettings); // Update settings for the current run
    updateAudioCueDefaults(newSettings); // Optionally update global defaults
    setShowAudioSettings(false);
  };

  if (showAudioSettings) {
    return (
      <AudioCueSettings
        currentSettings={runAudioSettings}
        onSave={handleSaveAudioSettings}
        onClose={() => setShowAudioSettings(false)}
      />
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.headerSection}>
        <View>
          <Text style={styles.title}>
            {isTracking ? 'Tracking Your Run' : 'Ready to Run?'}
          </Text>
          <Text style={styles.subtitle}>
            {currentPlan
              ? `Training for ${currentPlan.raceType.toUpperCase()} • ${currentPlan.fitnessLevel} level`
              : 'Free run mode'}
          </Text>
        </View>
        <TouchableOpacity onPress={() => setShowAudioSettings(true)} style={styles.settingsButton}>
          <Settings size={24} color="#FFA500" />
        </TouchableOpacity>
      </View>

      {(runAudioSettings.distanceEnabled || runAudioSettings.paceEnabled) && !isLoadingSettings && (
        <View style={styles.audioCuesInfoSection}>
          {runAudioSettings.distanceEnabled && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {runAudioSettings.distanceInterval} {runAudioSettings.distanceUnit} alerts
              </Text>
            </View>
          )}
          {runAudioSettings.paceEnabled && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                Pace: {runAudioSettings.targetPace} (±{runAudioSettings.paceTolerance}s)
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Stats Display */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Clock size={28} color="#FFA500" style={styles.statIcon} />
          <Text style={styles.statValue}>{formatDurationDisplay(duration)}</Text>
          <Text style={styles.statLabel}>Duration</Text>
        </View>
        <View style={styles.statCard}>
          <MapPin size={24} color="#FFA500" style={styles.statIcon} />
          <Text style={styles.statValue}>{formatDistanceDisplay(distance * 1000, settings.displayUnit)}</Text>
          <Text style={styles.statLabel}>Distance</Text>
        </View>
        <View style={styles.statCard}>
          <Zap size={24} color="#FFA500" style={styles.statIcon} />
          <Text style={styles.statValue}>{currentPace !== null ? formatPaceDisplay(currentPace, settings.displayUnit) : '--:--'}</Text>
          <Text style={styles.statLabel}>Current Pace</Text>
        </View>
        <View style={styles.statCard}>
          <Zap size={24} color="#FFA500" style={styles.statIcon} />
          <Text style={styles.statValue}>{avgPace !== null ? formatPaceDisplay(avgPace, settings.displayUnit) : '--:--'}</Text>
          <Text style={styles.statLabel}>Avg Pace</Text>
        </View>
      </View>

      {/* Notes Section */} 
      {isTracking && (
        <View style={styles.notesSection}>
          <Text style={styles.sectionTitleSmall}>Workout Notes</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="How was your run? Any PBs or issues?"
            placeholderTextColor="#888"
            value={currentNotes}
            onChangeText={setCurrentNotes}
            multiline
            numberOfLines={3}
          />
        </View>
      )}

      {/* Control Buttons */}
      <View style={styles.controlsSection}>
        {!isTracking ? (
          <TouchableOpacity style={[styles.button, styles.startButton]} onPress={startTracking}>
            <Play size={24} color="#FFF" style={styles.buttonIcon} />
            <Text style={styles.buttonText}>Start Run</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.trackingButtonsContainer}>
            <TouchableOpacity
              style={[styles.button, isPaused ? styles.resumeButton : styles.pauseButton, styles.halfButton]}
              onPress={pauseTracking}
            >
              {isPaused ? <Play size={22} color="#FFF" style={styles.buttonIcon} /> : <Pause size={22} color="#FFF" style={styles.buttonIcon} />}
              <Text style={styles.buttonText}>{isPaused ? 'Resume' : 'Pause'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.finishButton, styles.halfButton]} onPress={stopTracking}>
              <Square size={22} color="#FFF" style={styles.buttonIcon} />
              <Text style={styles.buttonText}>Finish</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Coaching Tips */}
      {isTracking && !isPaused && (
        <View style={styles.coachTipCard}>
          <View style={styles.coachTipHeader}>
            <Target size={20} color="#FFA500" style={styles.buttonIcon} />
            <Text style={styles.coachTipTitle}>Coach Tips</Text>
          </View>
          <Text style={styles.coachTipText}>
            {distance < 0.1
              ? "Great start! Focus on your breathing and find your rhythm."
              : distance < 1
              ? "You're doing great! Keep a steady effort."
              : avgPace !== null && avgPace > 7.0 // Compare numeric avgPace (7.0 min/km)
              ? "Push a little harder if you can, or maintain if this is your goal pace."
              : "Excellent pace! Keep it up and stay hydrated."}
          </Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  contentContainer: {
    padding: 16,
  },
  headerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#AAA',
  },
  settingsButton: {
    padding: 8,
  },
  audioCuesInfoSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 20,
    gap: 8,
  },
  badge: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  badgeText: {
    color: '#DDD',
    fontSize: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  statCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    width: '48%',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
  },
  statIcon: {
    marginBottom: 8,
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#AAA',
  },
  controlsSection: {
    marginBottom: 25,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  buttonIcon: {
    marginRight: 10,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  startButton: {
    backgroundColor: '#4CAF50', // Green
  },
  trackingButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfButton: {
    width: '48%',
  },
  pauseButton: {
    backgroundColor: '#FFC107', // Amber
  },
  resumeButton: {
    backgroundColor: '#4CAF50', // Green
  },
  finishButton: {
    backgroundColor: '#F44336', // Red
  },
  coachTipCard: {
    backgroundColor: 'rgba(255, 165, 0, 0.15)', // Orange-ish, semi-transparent
    padding: 15,
    borderRadius: 8,
    borderColor: 'rgba(255, 165, 0, 0.4)',
    borderWidth: 1,
  },
  coachTipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  coachTipTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFA500',
  },
  coachTipText: {
    fontSize: 14,
    color: '#FFDAB9', // Lighter orange/peach
    lineHeight: 20,
  },
  notesSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
  },
  sectionTitleSmall: {
    fontSize: 16,
    fontWeight: '600',
    color: '#DDD',
    marginBottom: 10,
  },
  notesInput: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    color: '#FFF',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    minHeight: 60,
    textAlignVertical: 'top', // Align text to the top for multiline
  },
});

export default WorkoutTracker;

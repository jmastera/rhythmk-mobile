import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, AppState, Platform, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../App'; // Adjust path if App.tsx is elsewhere
import * as Location from 'expo-location';
import { Settings, Clock, MapPin, Zap, Target, Play, Pause, Square } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AudioCueSettings from './AudioCueSettings';
import * as Speech from 'expo-speech';
import { useAudioCues } from '../hooks/useAudioCues';
import { AudioCueSettingsData, useUserSettings } from '../hooks/useUserSettings';
import { WorkoutEntry, WORKOUT_HISTORY_KEY, Split } from '../types/history';
import { formatDistanceDisplay, formatPaceDisplay, decimalMinutesToTime, formatDurationDisplay } from '../utils/units';
import { getRaceColor } from '../utils/raceColors';
import { HeaderSafeArea } from './HeaderSafeArea';

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
  const insets = useSafeAreaInsets();
  const currentPlan = route.params?.currentPlan;

  const [isTracking, setIsTracking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [countdownSeconds, setCountdownSeconds] = useState(5); // 5 second countdown
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
  
  // Play countdown beep using speech synthesis
  const playCountdownSound = async (countdownValue: number) => {
    try {
      // Stop any currently speaking audio
      await Speech.stop();
      
      // Different sounds for different countdown values
      if (countdownValue === 1) {
        // Final beep - use a longer sound or say "Go"
        await Speech.speak('Go', {
          rate: 0.8,
          pitch: 1.2,
          volume: 1.0,
        });
      } else {
        // Regular countdown beep - just say the number
        await Speech.speak(countdownValue.toString(), {
          rate: 1.0,
          pitch: 1.0,
          volume: 1.0,
        });
      }
    } catch (error) {
      console.log('Error playing countdown sound:', error);
    }
  };
  const { settings, updateAudioCueDefaults, isLoadingSettings } = useUserSettings();
  // Initialize runAudioSettings with current user defaults, or app defaults if not loaded
  const [runAudioSettings, setRunAudioSettings] = useState<AudioCueSettingsData>(settings.audioCueDefaults);
  
  // Helper function to format race type for display
  const formatRaceType = (type: string): string => {
    switch(type) {
      case '5k': return '5K';
      case '10k': return '10K';
      case 'half-marathon': return 'Half Marathon';
      case 'marathon': return 'Marathon';
      default: return type.charAt(0).toUpperCase() + type.slice(1);
    }
  };

  // Refs for state values needed in callbacks to avoid stale closures
  const distanceRef = useRef(distance);
  const durationRef = useRef(duration);

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

  useEffect(() => {
    distanceRef.current = distance;
  }, [distance]);

  useEffect(() => {
    durationRef.current = duration;
  }, [duration]);

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

  // useEffect for Average Pace Calculation
  useEffect(() => {
    if (distance > 0 && duration > 0) {
      const newAvgPace = calculatePaceMinPerKm(distance, duration);
      
      // Only update average pace if it's within reasonable limits (1-30 min/km)
      if (newAvgPace !== null && newAvgPace >= 1 && newAvgPace <= 30) {
        console.log(`AVG PACE EFFECT DEBUG: distance=${distance.toFixed(3)}, duration=${duration}, newAvgPace=${newAvgPace.toFixed(2)}`);
        setAvgPace(newAvgPace);
      } else {
        console.log(`AVG PACE EFFECT DEBUG: Discarded unrealistic average pace calculation: ${newAvgPace}`);
      }
    } else {
      // Reset avgPace if conditions aren't met (e.g., at the start or after reset)
      setAvgPace(null);
    }
  }, [distance, duration]);

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

  // Countdown timer effect
  useEffect(() => {
    let countdownInterval: NodeJS.Timeout | null = null;
    
    if (isCountingDown && countdownSeconds > 0) {
      // Play sound immediately when each countdown second starts
      playCountdownSound(countdownSeconds);
      
      countdownInterval = setInterval(() => {
        setCountdownSeconds(prev => {
          // Will be decremented to this value
          const nextValue = prev - 1;
          return nextValue;
        });
      }, 1000);
    } else if (isCountingDown && countdownSeconds === 0) {
      // Countdown finished, start actual tracking
      setIsCountingDown(false);
      setIsTracking(true);
      
      // Reset countdown for next time
      setCountdownSeconds(5);
    }
    
    return () => {
      if (countdownInterval) {
        clearInterval(countdownInterval);
      }
    };
  }, [isCountingDown, countdownSeconds]);
  
  // Duration timer effect
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

  const initiateCountdown = () => {
    // Start the countdown
    setIsCountingDown(true);
    setCountdownSeconds(5);
  };
  
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

          const { latitude, longitude, altitude, speed, accuracy } = newLocation.coords;
          const timestamp = newLocation.timestamp;

          // Filter out low accuracy GPS updates
          if (accuracy != null && accuracy > 20) { // 20 meters is a reasonable threshold for accuracy
            console.log(`Skipping update due to poor accuracy: ${accuracy}m`);
            return;
          }

          let calculatedSegmentDistanceKm = 0;

          if (lastPosition) {
            calculatedSegmentDistanceKm = calculateDistance(
              lastPosition.latitude,
              lastPosition.longitude,
              latitude,
              longitude
            );
            
            // Apply minimum threshold to filter out GPS jitter (2 meters)
            const MIN_DISTANCE_THRESHOLD = 0.002;
            if (calculatedSegmentDistanceKm > MIN_DISTANCE_THRESHOLD) {
                setDistance((prevDistance) => prevDistance + calculatedSegmentDistanceKm);
            } else {
                calculatedSegmentDistanceKm = 0; // Reset to zero if under threshold
                console.log('GPS jitter detected, distance increment ignored');
            }

            // Calculate Elevation Gain/Loss
            if (lastPosition.altitude != null && altitude != null) {
              const altitudeDifference = altitude - lastPosition.altitude;
              if (altitudeDifference > 0) {
                setTotalElevationGain((prevGain) => prevGain + altitudeDifference);
              } else if (altitudeDifference < 0) {
                setTotalElevationLoss((prevLoss) => prevLoss + Math.abs(altitudeDifference));
              }
            }
          }
          
          setCoordinates((prevCoords) => [...prevCoords, { latitude, longitude, altitude, timestamp }]);
          setLastPosition(newLocation.coords); // Update lastPosition *after* using it

          // --- Pace Calculations --- 
          // Average Pace is now calculated in a useEffect hook

          // Update Current Pace with improved filtering
          let newCurrentPace = null;
          
          // Minimum movement speed (0.3 m/s is roughly 1 km/h)
          const MIN_SIGNIFICANT_SPEED = 0.3;
          // Minimum segment distance for pace calculation (5 meters)
          const MIN_PACE_DISTANCE = 0.005;
          
          // Method 1: Use speed directly from GPS if available and significant
          if (speed !== null && speed >= MIN_SIGNIFICANT_SPEED) {
            newCurrentPace = 1000 / speed / 60; // Convert m/s to min/km
            
            // Apply sanity check for extremely slow/fast paces (1-30 min/km)
            if (newCurrentPace < 1 || newCurrentPace > 30) {
              newCurrentPace = null;
              console.log(`CUR PACE DEBUG: Discarded unrealistic pace from speed=${speed.toFixed(2)} m/s`);
            } else {
              console.log(`CUR PACE DEBUG: from speed=${speed.toFixed(2)} m/s, newCurrentPace=${newCurrentPace ? newCurrentPace.toFixed(2) : null}`);
            }
          } 
          // Method 2: Calculate from segment distance and time
          else if (lastLocationTimestampRef.current && calculatedSegmentDistanceKm >= MIN_PACE_DISTANCE) {
            const timeDiffSeconds = (timestamp - lastLocationTimestampRef.current) / 1000;
            
            // Ensure we have a meaningful time difference (at least 1 second)
            if (timeDiffSeconds >= 1) {
                newCurrentPace = calculatePaceMinPerKm(calculatedSegmentDistanceKm, timeDiffSeconds);
                
                // Apply sanity check for paces
                if (newCurrentPace !== null && (newCurrentPace < 1 || newCurrentPace > 30)) {
                  newCurrentPace = null;
                  console.log(`CUR PACE DEBUG: Discarded unrealistic calculated pace`);
                } else {
                  console.log(`CUR PACE DEBUG: from calc: segmentDist=${calculatedSegmentDistanceKm.toFixed(3)}, timeDiff=${timeDiffSeconds.toFixed(1)}, pace=${newCurrentPace ? newCurrentPace.toFixed(2) : null}`);
                }
            } else {
                console.log(`CUR PACE DEBUG: Time difference too small: ${timeDiffSeconds.toFixed(1)}s`);
            }
          } else {
            console.log(`CUR PACE DEBUG: Insufficient data for pace calculation. Speed=${speed?.toFixed(2) || 'null'}, segment=${calculatedSegmentDistanceKm.toFixed(3)}`);
          }
          setCurrentPace(newCurrentPace);
          
          lastLocationTimestampRef.current = timestamp;

          // --- Other Calculations (Cues, Calories, Splits) ---
          // Calculate the total distance including the current segment for immediate use in cues/calories
          const updatedTotalDistance = distanceRef.current + calculatedSegmentDistanceKm;

          // Pace Cues
          if (runAudioSettings.paceEnabled) {
            const displayUnitForAudio = runAudioSettings.distanceUnit === 'miles' ? 'mi' : runAudioSettings.distanceUnit;
            // Use newCurrentPace (calculated in this cycle) and avgPace (state from previous cycle's update) for cues
            const formattedCurrentPaceForCue = newCurrentPace !== null ? formatPaceDisplay(newCurrentPace, displayUnitForAudio) : '--:--';
            const formattedAvgPaceForCue = avgPace !== null ? formatPaceDisplay(avgPace, displayUnitForAudio) : '--:--'; // Changed newAvgPace to avgPace (state)
            checkPaceCue(formattedCurrentPaceForCue, formattedAvgPaceForCue);
          }

          // Distance Cues
          // Convert to correct unit in case settings use miles
          const displayUnitForAudio = runAudioSettings.distanceUnit === 'miles' ? 'mi' : runAudioSettings.distanceUnit;
          const convertedDistance = displayUnitForAudio === 'mi' ? updatedTotalDistance * 0.621371 : updatedTotalDistance;
          
          // Log distance for debugging
          console.log(`DISTANCE CUE DEBUG: Raw=${updatedTotalDistance.toFixed(3)}km, Converted=${convertedDistance.toFixed(3)}${displayUnitForAudio}, Interval=${runAudioSettings.distanceInterval}`);
          
          // Send distance update for audio cue checks
          checkDistanceCue(updatedTotalDistance);

          // Calorie Estimation
          if (updatedTotalDistance > 0) { // Changed currentTotalDistance to updatedTotalDistance
            const calories = DEFAULT_USER_WEIGHT_KG * updatedTotalDistance * 1.036; // Changed currentTotalDistance to updatedTotalDistance
            setEstimatedCalories(calories);
          }

          // Split Tracking (uses calculatedSegmentDistanceKm)
          if (calculatedSegmentDistanceKm > 0) {
            setDistanceSinceLastSplitKm(prevDistSinceSplit => {
              const newDistSinceSplit = prevDistSinceSplit + calculatedSegmentDistanceKm;
              if (newDistSinceSplit >= SPLIT_DISTANCE_KM) {
                const totalDurationForSplit = durationRef.current;
                const splitDurationSeconds = totalDurationForSplit - timeAtLastSplitSeconds;
                const numericSplitPace = calculatePaceMinPerKm(SPLIT_DISTANCE_KM, splitDurationSeconds);

                const newSplitData: Split = {
                  splitNumber: splits.length + 1,
                  distance: SPLIT_DISTANCE_KM * 1000,
                  duration: splitDurationSeconds,
                  pace: numericSplitPace !== null ? decimalMinutesToTime(numericSplitPace) : '--:--',
                };
                setSplits(prevSplits => [...prevSplits, newSplitData]);

                const formattedPaceForAnnouncement = numericSplitPace !== null 
                  ? formatPaceDisplay(numericSplitPace, runAudioSettings.distanceUnit === 'miles' ? 'mi' : runAudioSettings.distanceUnit)
                  : "pace unavailable";
                announceSplit(newSplitData.splitNumber, formattedPaceForAnnouncement);

                setDistanceSinceLastSplitKm(newDistSinceSplit % SPLIT_DISTANCE_KM);
                setTimeAtLastSplitSeconds(totalDurationForSplit);
                return newDistSinceSplit % SPLIT_DISTANCE_KM;
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
    // Get the proper plan name from user settings race goal or passed in plan
    const planDisplay = settings.raceGoal?.type 
      ? settings.raceGoal.type.charAt(0).toUpperCase() + settings.raceGoal.type.slice(1) // Capitalize race goal type
      : currentPlan?.raceType 
      ? currentPlan.raceType
      : 'Free Run';
    
    const newWorkoutEntry: WorkoutEntry = {
      id: new Date().getTime().toString(),
      date: new Date().toISOString(),
      duration: duration, // in seconds
      distance: Math.round(distance * 1000), // Convert km to meters and round
      avgPace: avgPace === null ? undefined : avgPace, // Convert null to undefined for storage
      coordinates: coordinates,
      planName: planDisplay, // Use the properly formatted plan name
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
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom }]}>
      <HeaderSafeArea />
      <View style={styles.headerSection}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Workout Tracker</Text>
          <Text style={styles.subtitle}>
            {settings.raceGoal && settings.fitnessLevel
              ? `Training for ${formatRaceType(settings.raceGoal.type)} • ${settings.fitnessLevel} level`
              : 'Free run mode'}
          </Text>
        </View>
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
          <Clock size={28} color={settings.raceGoal ? getRaceColor(settings.raceGoal.type) : "#FFA500"} style={styles.statIcon} />
          <Text style={styles.statValue}>{formatDurationDisplay(duration)}</Text>
          <Text style={styles.statLabel}>Duration</Text>
        </View>
        <View style={styles.statCard}>
          <MapPin size={24} color={settings.raceGoal ? getRaceColor(settings.raceGoal.type) : "#FFA500"} style={styles.statIcon} />
          <Text style={styles.statValue}>{formatDistanceDisplay(distance * 1000, settings.displayUnit)}</Text>
          <Text style={styles.statLabel}>Distance</Text>
        </View>
        <View style={styles.statCard}>
          <Zap size={24} color={settings.raceGoal ? getRaceColor(settings.raceGoal.type) : "#FFA500"} style={styles.statIcon} />
          <Text style={styles.statValue}>{currentPace !== null ? formatPaceDisplay(currentPace, settings.displayUnit) : '--:--'}</Text>
          <Text style={styles.statLabel}>Current Pace</Text>
        </View>
        <View style={styles.statCard}>
          <Zap size={24} color={settings.raceGoal ? getRaceColor(settings.raceGoal.type) : "#FFA500"} style={styles.statIcon} />
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
        {isCountingDown ? (
        <View style={[styles.button, styles.countdownButton]}>
          <Text style={styles.countdownText}>{countdownSeconds}</Text>
          <Text style={styles.buttonText}>Starting soon...</Text>
        </View>
      ) : !isTracking ? (
        <TouchableOpacity
          onPress={initiateCountdown}
          style={[styles.button, styles.startButton, settings.raceGoal && { backgroundColor: getRaceColor(settings.raceGoal.type) }]}
        >
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

      {/* Settings Button - only shown when not tracking */}
      {!isTracking && (
        <TouchableOpacity 
          onPress={() => setShowAudioSettings(true)} 
          style={styles.settingsButtonContainer}
        >
          <Settings size={22} color={settings.raceGoal ? getRaceColor(settings.raceGoal.type) : "#FFA500"} />
          <Text style={styles.settingsButtonText}>Audio Settings</Text>
        </TouchableOpacity>
      )}

      {/* Coaching Tips */}
      {isTracking && !isPaused && (
        <View style={styles.coachTipCard}>
          <View style={styles.coachTipHeader}>
            <Target size={20} color={settings.raceGoal ? getRaceColor(settings.raceGoal.type) : "#FFA500"} style={styles.buttonIcon} />
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
    justifyContent: 'center',
    marginBottom: 20,
  },
  headerContent: {
    alignItems: 'center',
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
  settingsButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginVertical: 10,
    backgroundColor: 'rgba(255, 165, 0, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 165, 0, 0.3)',
  },
  settingsButtonText: {
    color: '#FFA500',
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
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
  countdownButton: {
    backgroundColor: '#FF9800', // Orange
  },
  countdownText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 5,
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

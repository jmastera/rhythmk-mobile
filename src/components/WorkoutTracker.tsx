/// <reference path="../hooks/useLocation.d.ts" />
/// <reference path="../utils/PaceCalculator.d.ts" />
/// <reference path="../utils/TimeFormatter.d.ts" />

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Alert, 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  Modal, 
  TouchableWithoutFeedback, 
  Switch, 
  Dimensions, 
  TextInput, 
  AppState 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WORKOUT_HISTORY_KEY } from '../types/history';
import AudioCueSettings from './AudioCueSettings';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { decimalMinutesToTime, metersPerSecondToMinPerKm, formatDistanceDisplay, formatPaceDisplay, formatDurationDisplay } from '../utils/PaceCalculator';
import MapView, { Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { Play, Pause, StopCircle, Square, Trash2, Zap, Target, Clock, MapPin, ChevronUp, ChevronDown, Map, Settings, Volume2, VolumeX, Watch, Navigation } from 'lucide-react-native';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigationTypes';
import { useAudioCues } from '../hooks/useAudioCues';
import { AudioCueSettingsData } from '../types/audioTypes';
import { useUserSettings } from '../hooks/useUserSettings';
import { TrackingPosition, Coordinate, Split, WorkoutEntry } from '../types/workoutTypes';
import { useStepCounter } from '../hooks/useStepCounter';
import { getRaceColor } from '../utils/raceColors';
import { HeaderSafeArea } from './HeaderSafeArea';
import PedometerTrackingMode from './PedometerTrackingMode';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import * as Speech from 'expo-speech';

const DEFAULT_USER_WEIGHT_KG = 70; // Default user weight in kilograms for calorie estimation
const SPLIT_DISTANCE_KM = 1; // Define 1km as the distance for each split

// Placeholder for TrainingPlanType if not imported from elsewhere
// TrainingPlanDetails is now defined in App.tsx and passed via navigation
// We'll use RootStackParamList to type the route prop

type WorkoutTrackerScreenRouteProp = RouteProp<RootStackParamList, 'WorkoutTracker'>;

interface WorkoutTrackerProps {
  route: WorkoutTrackerScreenRouteProp;
  navigation: any; // Navigation prop passed automatically by Stack Navigator
  onWorkoutComplete: (workoutData: WorkoutEntry) => void;
}

// Define SplitData interface for workout splits
interface SplitData {
  distance: number; // in km
  time: number; // in seconds
  pace: number; // in min/km
  timestamp: number; // timestamp when this split was recorded
}

// Helper function to convert SplitData to Split
const convertToSplit = (splitData: SplitData, index: number, displayUnit?: 'km' | 'mi'): Split => {
  return {
    splitNumber: index + 1,
    distance: splitData.distance, 
    duration: splitData.time, // Map time to duration
    pace: typeof splitData.pace === 'number' 
      ? formatPaceDisplay(splitData.pace, displayUnit === 'mi' ? 'miles' : 'km')
      : String(splitData.pace)
  };
}

// Helper function to calculate pace in minutes per km
const calculatePace = (distanceKm: number, durationSeconds: number): number => {
  if (!distanceKm || distanceKm <= 0 || !durationSeconds || durationSeconds <= 0) {
    return 0;
  }
  return durationSeconds / 60 / distanceKm; // Returns decimal minutes per km
};

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

// Helper function to calculate distance in meters between two coordinates
const calculateDistanceInMeters = (coord1: Location.LocationObjectCoords, coord2: Location.LocationObjectCoords): number => {
  // Implementation of the Haversine formula
  const R = 6371e3; // Earth radius in meters
  const lat1 = coord1.latitude * Math.PI / 180;
  const lat2 = coord2.latitude * Math.PI / 180;
  const deltaLat = (coord2.latitude - coord1.latitude) * Math.PI / 180;
  const deltaLon = (coord2.longitude - coord1.longitude) * Math.PI / 180;
  
  const a = Math.sin(deltaLat/2) * Math.sin(deltaLat/2) +
            Math.cos(lat1) * Math.cos(lat2) *
            Math.sin(deltaLon/2) * Math.sin(deltaLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  
  return R * c; // Distance in meters
};

const calculatePaceMinPerKm = (distance: number, durationSeconds: number): number => {
  // Ensure we don't divide by zero and have valid inputs
  if (distance <= 0 || durationSeconds <= 0) return 0;
  
  // Convert distance to kilometers if it's in meters
  const distanceKm = distance < 100 ? distance : distance / 1000;
  
  // Calculate pace as minutes per kilometer
  return (durationSeconds / 60) / distanceKm;
};

const formatRaceType = (type: string): string => {
  switch(type) {
    case '5k': return '5K';
    case '10k': return '10K';
    case 'half-marathon': return 'Half Marathon';
    case 'marathon': return 'Marathon';
    default: return type.charAt(0).toUpperCase() + type.slice(1);
  }
};

const WorkoutTracker = ({ route, navigation, onWorkoutComplete }: WorkoutTrackerProps): React.ReactElement => {
  const insets = useSafeAreaInsets();
  const currentPlan = route?.params?.currentPlan;
  const { settings, updateAudioCueDefaults, isLoadingSettings } = useUserSettings();
  
  // Define default audio cue settings
  const defaultAudioCueSettings: AudioCueSettingsData = {
    enabled: true,
    announceDistance: true,
    distanceInterval: 1, // 1km
    announcePace: true,
    announceTime: true,
    timeInterval: 5, // 5 minutes
    volume: 0.8,
    distanceUnit: 'km',
    announceCalories: false
  };
  
  // Tracking state
  const [isTracking, setIsTracking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [countdownValue, setCountdownValue] = useState(0); // Countdown value
  const [duration, setDuration] = useState(0); // in seconds
  const [distance, setDistance] = useState(0); // in km
  const [currentPace, setCurrentPace] = useState<number | null>(null); // min/km as decimal
  const [avgPace, setAvgPace] = useState<number | null>(null); // min/km as decimal
  const [coordinates, setCoordinates] = useState<Coordinate[]>([]);
  const [lastPosition, setLastPosition] = useState<Location.LocationObjectCoords | null>(null);
  const [showAudioSettings, setShowAudioSettings] = useState(false);
  const [estimatedCalories, setEstimatedCalories] = useState(0);
  const [runAudioSettings, setRunAudioSettings] = useState<AudioCueSettingsData>(settings.audioCueDefaults);
  const [splits, setSplits] = useState<SplitData[]>([]);
  const [distanceSinceLastSplitKm, setDistanceSinceLastSplitKm] = useState(0);
  const [timeAtLastSplitSeconds, setTimeAtLastSplitSeconds] = useState(0);
  const [gpsActive, setGpsActive] = useState(true); // GPS active by default
  const [pedometerDistance, setPedometerDistance] = useState(0); // in km from step counter
  const [hybridDistance, setHybridDistance] = useState(0); // combined distance from hybrid tracking
  const [currentNotes, setCurrentNotes] = useState(''); // Notes for current workout
  const [totalElevationGain, setTotalElevationGain] = useState(0); // Elevation gain in meters
  const [totalElevationLoss, setTotalElevationLoss] = useState(0); // Elevation loss in meters
  const [hasAnnouncedStart, setHasAnnouncedStart] = useState(false);

  // Refs for state values needed in callbacks to avoid stale closures

  // Refs for tracking state and callbacks
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const locationSubscriptionRef = useRef<Location.LocationSubscription | null>(null);
  const hasAnnouncedStartRef = useRef(false);
  const appStateRef = useRef(AppState.currentState);
  const isTrackingRef = useRef(isTracking);
  const isPausedRef = useRef(isPaused);
  const distanceRef = useRef(distance);
  const durationRef = useRef(duration);
  const lastLocationTimestampRef = useRef<number | null>(null);
  const lastPositionRef = useRef<TrackingPosition | null>(null);
  const userSettingsRef = useRef(settings);

  // Update refs when state changes
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
  
  useEffect(() => {
    userSettingsRef.current = settings;
  }, [settings]);
  
  // Handle step-based distance updates
  const handleStepDistanceUpdate = useCallback((distanceInKm: number) => {
    if (isTracking && !isPaused) {
      console.log('Step counter distance update:', distanceInKm, 'km');
      setPedometerDistance(distanceInKm);
      
      // If GPS is not active, use step counter as the primary distance source
      if (!gpsActive) {
        setDistance(distanceInKm);
        
        // Calculate pace based on pedometer distance
        if (duration > 0 && distanceInKm > 0) {
          const paceMinutes = duration / 60 / distanceInKm;
          setCurrentPace(paceMinutes);
          setAvgPace(paceMinutes);
        }
      }
    }
  }, [gpsActive, isTracking, isPaused, duration]);
  
  // Handle hybrid distance updates (combined GPS + step data)
  const handleHybridDistanceUpdate = useCallback((distanceInKm: number) => {
    // Validate the incoming data first
    if (typeof distanceInKm !== 'number' || isNaN(distanceInKm)) {
      console.warn('⚠️ Invalid hybrid distance received:', distanceInKm);
      return;
    }
    
    // Only process updates when actively tracking
    if (isTracking && !isPaused) {
      console.log(`🔄 Hybrid distance update: ${distanceInKm.toFixed(3)} km (tracking active)`);
      
      // Always update the hybrid distance state
      setHybridDistance(prevDistance => {
        console.log(`🔄 Hybrid distance changed: ${prevDistance.toFixed(3)} → ${distanceInKm.toFixed(3)} km`);
        return distanceInKm;
      });
      
      // When GPS is active, we use the hybrid distance as our primary distance
      if (gpsActive) {
        console.log(`📍 GPS active: Updating main distance with hybrid: ${distanceInKm.toFixed(3)} km`);
        
        setDistance(prevDistance => {
          console.log(`📏 Main distance changed: ${prevDistance.toFixed(3)} → ${distanceInKm.toFixed(3)} km`);
          return distanceInKm;
        });
      }
    }
  }, [gpsActive, isTracking, isPaused]);
  
  // Initialize step counter
  const {
    steps,
    distance: stepCounterDistance,
    hybridDistance: stepCounterHybridDistance,
    isActive: isStepCounterActive,
    enabled: stepCounterEnabled,
    setEnabled: setStepCounterEnabled
  } = useStepCounter({
    enabled: isTracking && !isPaused,
    isRunning: true, // Assuming this is for running, not walking
    userHeightCm: settings.userHeight || 170,
    onDistanceChange: handleStepDistanceUpdate,
    onHybridDistanceChange: handleHybridDistanceUpdate,
    gpsDistanceMeters: distance * 1000, // Convert km to meters
    isGpsActive: gpsActive
  });
  
  // Update step counter when tracking state changes
  useEffect(() => {
    // The step counter is controlled by the enabled prop which we already set
    console.log(`Step counter ${isTracking && !isPaused ? 'enabled' : 'disabled'} based on tracking state`);
  }, [isTracking, isPaused]);
  
  // Explicitly sync the main distance state with pedometer/GPS data
  useEffect(() => {
    if (isTracking && !isPaused) {
      console.log('Syncing distance - pedometer:', stepCounterDistance, 'km, hybrid:', stepCounterHybridDistance, 'km, gpsActive:', gpsActive);
      
      if (gpsActive && stepCounterHybridDistance > 0) {
        // When GPS is active, use hybrid distance (GPS + step calibration)
        console.log('📊 UPDATING DISTANCE from hybrid source:', stepCounterHybridDistance.toFixed(3), 'km');
        setDistance(stepCounterHybridDistance);
        // Also update the state that holds the hybrid distance value
        setHybridDistance(stepCounterHybridDistance);
      } else if (!gpsActive && stepCounterDistance > 0) {
        // When GPS is not active, use pedometer distance
        console.log('📊 UPDATING DISTANCE from pedometer source:', stepCounterDistance.toFixed(3), 'km');
        setDistance(stepCounterDistance);
        // Also update the state that holds the pedometer distance value
        setPedometerDistance(stepCounterDistance);
      }
      
      // Recalculate pace based on updated distance
      if (duration > 0 && (stepCounterHybridDistance > 0 || stepCounterDistance > 0)) {
        const activeDistance = gpsActive ? stepCounterHybridDistance : stepCounterDistance;
        if (activeDistance > 0) {
          const paceMinutes = duration / 60 / activeDistance;
          console.log('⏱️ Recalculating pace based on updated distance:', paceMinutes.toFixed(2), 'min/km');
          setCurrentPace(paceMinutes);
          setAvgPace(paceMinutes);
        }
      }
    }
  }, [isTracking, isPaused, gpsActive, stepCounterDistance, stepCounterHybridDistance, duration]);

  useEffect(() => {
    if (!isLoadingSettings) {
      setRunAudioSettings(settings.audioCueDefaults);
    }
  }, [settings.audioCueDefaults, isLoadingSettings]);

  // We removed duplicate declarations and are keeping the original handler functions
  // (defined earlier in lines 201-218 and 221-246)

  // Handle GPS active state changes

  // Handle GPS active state changes
  const handleGpsActiveChange = useCallback((active: boolean) => {
    if (isTracking) {
      Alert.alert(
        active ? "Activate GPS Tracking" : "Disable GPS Tracking",
        active ? 
          "GPS will now be combined with step data for better accuracy." :
          "Tracking will now rely solely on step counter data. This is ideal for indoor workouts.",
        [{ text: "OK" }]
      );
    }
    
    setGpsActive(active);
    
    // If turning off GPS, switch to using step counter distance
    if (!active && isTracking) {
      setDistance(pedometerDistance);
    } 
    // If turning on GPS, start using hybrid distance
    else if (active && isTracking && hybridDistance > 0) {
      setDistance(hybridDistance);
    }
  }, [isTracking, pedometerDistance, hybridDistance]);

  // Location tracking
  const [locationSubscription, setLocationSubscription] = useState<Location.LocationSubscription | null>(null);

  // Pace calculation

  // useEffect for Average Pace Calculation
  useEffect(() => {
    if (distance > 0 && duration > 0) {
      // Calculate the average pace in minutes per km
      const paceValue = calculatePaceMinPerKm(distance, duration);
      setAvgPace(paceValue);
      
      // Calculate current pace based on last split or total if no splits
      if (splits.length > 0) {
        const lastSplit = splits[splits.length - 1];
        // Use lastSplit.time since we're using SplitData which has 'time' not 'duration'
        const paceFromSplit = calculatePaceMinPerKm(lastSplit.distance, lastSplit.time);
        setCurrentPace(paceFromSplit);
      } else {
        // If no splits yet, current pace equals average pace
        setCurrentPace(paceValue);
      }
    }
  }, [distance, duration, splits]);

  // Calorie Estimation
  // Calculate calories when distance changes
  useEffect(() => {
    if (distance > 0) { 
      // Use default weight since UserSettings doesn't have a weight property yet
      // In the future, we could add weight to UserSettings interface
      const weight = DEFAULT_USER_WEIGHT_KG;
      const calories = weight * distance * 1.036; 
      setEstimatedCalories(calories);
    }
  }, [distance]);

  const handleAudioSettingsChange = useCallback((newSettings: Partial<AudioCueSettingsData>) => {
    setRunAudioSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  const updateRunAudioSettings = useCallback((newSettings: AudioCueSettingsData) => {
    setRunAudioSettings(newSettings);
    updateAudioCueDefaults(newSettings);
    setShowAudioSettings(false);
  }, [updateAudioCueDefaults]);

  // Play countdown beep using speech synthesis - local implementation
  const handleCountdownBeep = async (countdownValue: number) => {
    try {
      // Cancel any existing speech
      if (await Speech.isSpeakingAsync()) {
        await Speech.stop();
      }
      
      if (countdownValue <= 0) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await Speech.speak("Go!", { 
          rate: 1.0,
          pitch: 1.1,
          volume: 1.0
        });
      } else {
        // Simple beep for countdowns
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        await Speech.speak(`${countdownValue}`, {
          rate: 0.9,
          pitch: 1.0,
          volume: 1.0
        });
      }
    } catch (error) {
      console.log('Error playing countdown sound:', error);
    }
  };

  // Countdown timer before starting tracking
  const initiateCountdown = async () => {
    setIsCountingDown(true);
    setCountdownValue(5);
    handleCountdownBeep(5);
    
    // Start the countdown
    const countdownInterval = setInterval(async () => {
      setCountdownValue(prev => {
        const newValue = prev - 1;
        // Play sound for each step
        if (newValue >= 0) {
          handleCountdownBeep(newValue);
        }
        return newValue;
      });
    }, 1000);

    // Wait 6 seconds (5,4,3,2,1,Go) and then start tracking
    setTimeout(() => {
      clearInterval(countdownInterval);
      setIsCountingDown(false);
      startTracking();
    }, 6000);
  };

  // Initialize audio cues from user settings - only use what's provided by the hook
  const { 
    announceWorkoutStart,
    announceWorkoutEnd,
    announceSplit,
    checkDistanceCue,
    checkPaceCue
  } = useAudioCues({ settings: runAudioSettings, isTracking: isTrackingRef.current });
  
  // Function to pause or resume tracking
  const pauseTracking = () => {
    if (isPaused) {
      // Resume tracking
      setIsPaused(false);
      // Announce resume via Speech directly since useAudioCues may not have this
      Speech.speak('Workout resumed', { rate: 0.9 });
    } else {
      // Pause tracking
      setIsPaused(true);
      // Announce pause via Speech directly since useAudioCues may not have this
      Speech.speak('Workout paused', { rate: 0.9 });
    }
  };

  const stopTracking = async () => {
    console.log('Stopping workout tracking...');
    // Set tracking state to false immediately to prevent further updates
    setIsTracking(false);
    
    // Stop location tracking & clean up all intervals
    if (locationSubscription) {
      console.log('Removing location subscription');
      locationSubscription.remove();
      setLocationSubscription(null);
    }
    
    if (intervalRef.current) {
      console.log('Clearing timer interval');
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    // Step counter will be disabled automatically when isTracking is set to false
    console.log('Step counter will be disabled via enabled prop');
    
    // Play audio cue for workout end with full sentence format
    try {
      // Format time announcement in natural language
      const minutes = Math.floor(duration / 60);
      const seconds = duration % 60;
      
      let timeAnnouncement = "";
      if (minutes > 0) {
        timeAnnouncement += `${minutes} minute${minutes > 1 ? 's' : ''} `;
      }
      if (seconds > 0 || minutes === 0) {
        timeAnnouncement += `${seconds} second${seconds > 1 ? 's' : ''}`;
      }
      
      // Format distance in natural language
      const distanceUnit = userSettingsRef.current?.displayUnit === 'mi' ? 'miles' : 'km';
      // Convert km to miles if needed
      const distanceValue = userSettingsRef.current?.displayUnit === 'mi' ? distance * 0.621371 : distance;
      // Round to 2 decimal places
      const roundedDistance = Math.round(distanceValue * 100) / 100;
      
      // Format in natural language
      let formattedDistance;
      if (roundedDistance === 0.25) {
        formattedDistance = `a quarter ${distanceUnit === 'miles' ? 'mile' : 'kilometer'}`;
      } else if (roundedDistance === 0.5) {
        formattedDistance = `a half ${distanceUnit === 'miles' ? 'mile' : 'kilometer'}`;
      } else if (roundedDistance === 1) {
        formattedDistance = `one ${distanceUnit === 'miles' ? 'mile' : 'kilometer'}`;
      } else {
        formattedDistance = `${roundedDistance} ${distanceUnit === 'miles' ? 'mile' : 'kilometer'}${roundedDistance !== 1 ? 's' : ''}`;
      }
      
      // Format pace information in natural language if available
      let paceInfo = '';
      if (avgPace && avgPace !== 0) {
        // Format pace in natural language (minutes and seconds)
        const paceMinutes = Math.floor(avgPace);
        const paceSeconds = Math.round((avgPace - paceMinutes) * 60);
        
        let paceAnnouncement = '';
        if (paceMinutes > 0) {
          paceAnnouncement += `${paceMinutes} minute${paceMinutes !== 1 ? 's' : ''}`;
        }
        
        if (paceSeconds > 0) {
          // Add 'and' if we have both minutes and seconds
          if (paceMinutes > 0) paceAnnouncement += ' and ';
          paceAnnouncement += `${paceSeconds} second${paceSeconds !== 1 ? 's' : ''}`;
        }
        
        // Only add the pace info if we have a valid pace to announce
        if (paceAnnouncement) {
          paceInfo = ` at an average pace of ${paceAnnouncement} per ${distanceUnit === 'miles' ? 'mile' : 'kilometer'}`;
        }
      }
      
      // Build the complete announcement with motivational message
      const announcement = `Workout complete! You ran ${formattedDistance} in ${timeAnnouncement}${paceInfo}. Great job!`;
      
      Speech.speak(announcement, {
        rate: 0.9,
        pitch: 1.0,
      });
      
      console.log('Workout completion announcement:', announcement);
    } catch (err) {
      console.log('Error announcing workout end:', err);
    }
    
    // Save workout data 
    if (distance > 0 || duration > 0) {
      // Convert workout data to WorkoutEntry format and call the completion handler
      const workoutEntry: WorkoutEntry = {
        id: Date.now().toString(), // Generate unique ID
        date: new Date().toISOString(),
        // Convert distance to meters for storage (WorkoutEntry expects meters)
        distance: distance * 1000, // Convert km to meters
        duration: duration, // Duration in seconds
        avgPace: avgPace || 0,
        calories: estimatedCalories,
        notes: currentNotes,
        // Convert SplitData[] to Split[] using our helper function
        splits: Array.isArray(splits) 
          ? splits.map((splitData, index) => 
              // Use the helper function to convert each split safely
              convertToSplit(splitData, index, userSettingsRef.current?.displayUnit)
            )
          : [],
        coordinates: coordinates,
        planName: currentPlan ? 'Training Plan' : undefined,
        // Use gpsActive and step counter state to determine tracking mode
        trackingMode: gpsActive ? (hybridDistance > 0 ? 'hybrid' : 'gps') : 'pedometer',
      };
      
      console.log('Saving workout data:', workoutEntry);
      
      // Save to AsyncStorage directly if no callback provided
      const saveWorkoutToHistory = async () => {
        try {
          // Get existing workout history
          const historyJson = await AsyncStorage.getItem(WORKOUT_HISTORY_KEY);
          let history: WorkoutEntry[] = [];
          
          if (historyJson) {
            history = JSON.parse(historyJson);
          }
          
          // Add the new workout
          history.push(workoutEntry);
          
          // Save back to AsyncStorage
          await AsyncStorage.setItem(WORKOUT_HISTORY_KEY, JSON.stringify(history));
          console.log('✅ Workout saved to history storage');
          
          // Navigate to history screen after successful save
          navigation.navigate('History');
        } catch (error) {
          console.error('Failed to save workout:', error);
          Alert.alert('Error', 'Failed to save workout data. Please try again.');
        }
      };
      
      // Use the provided callback if available, otherwise save directly
      if (typeof onWorkoutComplete === 'function') {
        onWorkoutComplete(workoutEntry);
      } else {
        saveWorkoutToHistory();
      }
      
      // Show success message
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Reset workout data
      setCurrentNotes('');
      setCoordinates([]);
      setSplits([]);
    } else {
      console.log('Workout discarded - no significant distance or duration');
      // Show feedback that workout was too short
      Alert.alert("Workout Not Saved", "Your workout was too short to be saved. Make sure to complete some distance for it to be recorded.");
    }
    
    setIsTracking(false);
  };

    const startTracking = async () => {
    // Request location permissions first
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      console.error('Permission to access location was denied');
      Alert.alert('Location Permission Required', 'Please enable location permissions to track your workout');
      return;
    }
    
    // Initialize tracking state
    setIsTracking(true);
    setIsPaused(false);
    setDuration(0);
    setDistance(0);
    setCurrentPace(null);
    setAvgPace(null);
    setCoordinates([]);
    setLastPosition(null);
    setEstimatedCalories(0);
    setSplits([]);
    setDistanceSinceLastSplitKm(0);
    setTimeAtLastSplitSeconds(0);
    hasAnnouncedStartRef.current = false;
    
    // Setup timer to track duration every second
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    intervalRef.current = setInterval(() => {
      if (isTrackingRef.current && !isPausedRef.current) {
        setDuration(prev => prev + 1);
      }
    }, 1000);
    
    // Start location tracking if GPS is active
    if (gpsActive) {
      console.log('📍 Starting GPS location tracking...');
      try {
        // Start location tracking
        const subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.BestForNavigation,
            distanceInterval: 5, // Update every 5 meters
            timeInterval: 5000, // Or at least every 5 seconds
          },
          (location) => {
            // Process new location
            const { latitude, longitude, altitude } = location.coords;
            console.log(`📍 New location: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
            
            // Add to coordinates array
            const newCoord: Coordinate = {
              latitude,
              longitude,
              timestamp: location.timestamp,
              altitude: altitude || 0
            };
            
            setCoordinates(prev => [...prev, newCoord]);
            
            // Calculate distance if we have a previous position
            if (lastPosition) {
              const newSegmentDistance = calculateDistanceInMeters(
                lastPosition,
                location.coords
              ) / 1000; // Convert meters to km
              
              // Update total distance
              if (newSegmentDistance > 0) {
                setDistance(prevDistance => {
                  const updatedDistance = prevDistance + newSegmentDistance;
                  console.log(`📏 Distance updated: ${prevDistance.toFixed(3)} + ${newSegmentDistance.toFixed(3)} = ${updatedDistance.toFixed(3)} km`);
                  return updatedDistance;
                });
                
                // Also update distance since last split
                setDistanceSinceLastSplitKm(prev => prev + newSegmentDistance);
              }
            }
            
            // Update last position with just the coordinate data
            setLastPosition(location.coords);
          }
        );
        
        // Now we can safely set the subscription
        setLocationSubscription(subscription);
        console.log('✅ GPS tracking started successfully');
      } catch (error) {
        console.error('❌ Failed to start GPS tracking:', error);
        Alert.alert('GPS Error', 'Failed to start location tracking. Your workout will be tracked using step count instead.');
        setGpsActive(false);
      }
    }
  };

  // Show audio settings modal if enabled
  if (showAudioSettings) {
    return (
      <AudioCueSettings
        currentSettings={runAudioSettings}
        onSave={handleSaveAudioSettings}
        onClose={() => setShowAudioSettings(false)}
      />
    );
  }
  
  // Function to handle saving audio settings
  function handleSaveAudioSettings(newSettings: AudioCueSettingsData) {
    updateRunAudioSettings(newSettings);
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
            {userSettingsRef.current?.raceGoal?.type && userSettingsRef.current?.fitnessLevel
              ? `Training for ${formatRaceType(userSettingsRef.current.raceGoal.type)} • ${userSettingsRef.current.fitnessLevel} level`
              : 'Free run mode'}
          </Text>
        </View>
      </View>

      {(runAudioSettings.announceDistance || runAudioSettings.announcePace) && !isLoadingSettings && (
        <View style={styles.audioCuesInfoSection}>
          {runAudioSettings.announceDistance && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {runAudioSettings.distanceInterval} {runAudioSettings.distanceUnit} alerts
              </Text>
            </View>
          )}
          {runAudioSettings.announcePace && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                Pace alerts enabled
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Stats Display */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Clock size={28} color={userSettingsRef.current?.raceGoal ? getRaceColor(userSettingsRef.current.raceGoal.type) : "#FFA500"} style={styles.statIcon} />
          <Text style={styles.statValue}>{formatDurationDisplay(duration)}</Text>
          <Text style={styles.statLabel}>Duration</Text>
        </View>
        <View style={styles.statCard}>
          <Target size={24} color={userSettingsRef.current?.raceGoal ? getRaceColor(userSettingsRef.current.raceGoal.type) : "#FFA500"} style={styles.statIcon} />
          <Text style={styles.statValue}>{formatDistanceDisplay(distance, userSettingsRef.current?.displayUnit === 'mi' ? 'miles' : 'km')}</Text>
          <Text style={styles.statLabel}>Distance</Text>
        </View>
        <View style={styles.statCard}>
          <MapPin size={24} color={userSettingsRef.current?.raceGoal ? getRaceColor(userSettingsRef.current.raceGoal.type) : "#FFA500"} style={styles.statIcon} />
          <Text style={styles.statValue}>{currentPace !== null ? formatPaceDisplay(currentPace, userSettingsRef.current?.displayUnit === 'mi' ? 'miles' : 'km') : '--:--'}</Text>
          <Text style={styles.statLabel}>Current Pace</Text>
        </View>
        <View style={styles.statCard}>
          <Zap size={24} color={userSettingsRef.current?.raceGoal ? getRaceColor(userSettingsRef.current.raceGoal.type) : "#FFA500"} style={styles.statIcon} />
          <Text style={styles.statValue}>{avgPace !== null ? formatPaceDisplay(avgPace, userSettingsRef.current?.displayUnit === 'mi' ? 'miles' : 'km') : '--:--'}</Text>
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
          <Text style={styles.countdownText}>{countdownValue}</Text>
          <Text style={styles.buttonText}>Starting soon...</Text>
        </View>
      ) : !isTracking ? (
        <TouchableOpacity
          onPress={initiateCountdown}
          style={[styles.button, styles.startButton, userSettingsRef.current?.raceGoal && { backgroundColor: getRaceColor(userSettingsRef.current.raceGoal.type) }]}
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
      
      {/* Pedometer Tracking Mode Component */}
      {/* Show before tracking starts or during tracking */}
      <PedometerTrackingMode 
        isActive={isTracking && !isPaused}
        gpsDistanceKm={distance}
        onStepDistanceUpdate={handleStepDistanceUpdate}
        onHybridDistanceUpdate={handleHybridDistanceUpdate}
        gpsActive={gpsActive}
        onGpsActiveChange={handleGpsActiveChange}
      />

      {/* Settings Button - only shown when not tracking */}
      {!isTracking && (
        <TouchableOpacity 
          onPress={() => setShowAudioSettings(true)} 
          style={styles.userSettingsButtonContainer}
        >
          <Settings size={22} color={userSettingsRef.current?.raceGoal ? getRaceColor(userSettingsRef.current.raceGoal.type) : "#FFA500"} />
          <Text style={styles.userSettingsButtonText}>Audio Cue Settings</Text>
        </TouchableOpacity>
      )}

      {/* Coaching Tips */}
      {isTracking && !isPaused && (
        <View style={styles.coachTipCard}>
          <View style={styles.coachTipHeader}>
            <Target size={20} color={userSettingsRef.current?.raceGoal ? getRaceColor(userSettingsRef.current.raceGoal.type) : "#FFA500"} style={styles.buttonIcon} />
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
  userSettingsButton: {
    padding: 8,
  },
  userSettingsButtonContainer: {
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
  userSettingsButtonText: {
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
    marginTop: 10
  },
  statCard: {
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#333',
    width: '48%',
    marginBottom: 8
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

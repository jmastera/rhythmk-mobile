/// <reference path="../hooks/useLocation.d.ts" />
/// <reference path="../utils/PaceCalculator.d.ts" />
/// <reference path="../utils/TimeFormatter.d.ts" />

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Alert,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { TablesInsert } from '../types/supabase';
import { Coordinate, Split, WorkoutEntry, WORKOUT_HISTORY_KEY } from '../types/workoutTypes';
import { TrainingPlan } from '../types/trainingPlanTypes';
import AudioCueSettings from './AudioCueSettings';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  formatPaceDisplay,
  formatDurationDisplay,
  formatDistanceDisplay,
} from '../utils/PaceCalculator';
import {
  Play,
  Pause,
  StopCircle,
  Square,
  Settings,
  MapPin,
  Zap,
  Target,
  Clock,
  ChevronUp,
  ChevronDown,
  Volume2,
  VolumeX,
  Watch,
  Navigation,
  Footprints,
  Headphones,
  X,
} from 'lucide-react-native';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigationTypes';
import { useAudioCues } from '../hooks/useAudioCues';
import { AudioCueSettingsData } from '../types/audioTypes';
import { useUserSettings } from '../hooks/useUserSettings';

import { useStepCounter } from '../hooks/useStepCounter';
import { getRaceColor } from '../utils/raceColors';
import { HeaderSafeArea } from './HeaderSafeArea';
import PedometerTrackingMode from './PedometerTrackingMode';
import WorkoutStatsGrid from './WorkoutStatsGrid';
import WorkoutControls from './WorkoutControls';
import CoachTipsDisplay from './CoachTipsDisplay';
import WorkoutMapDisplay from './WorkoutMapDisplay';
import WorkoutNotesInput from './WorkoutNotesInput';
import PedometerModeDisplay from './PedometerModeDisplay';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import * as Speech from 'expo-speech';
import { v4 as uuidv4 } from 'uuid'; // For generating unique workout IDs
import { useKeepAwake } from 'expo-keep-awake';
import { CoachTip } from './CoachTipsDisplay'; // Assuming CoachTipsDisplay.tsx is in the same directory
import { supabase } from '../lib/supabase'; // Import Supabase client

const DEFAULT_USER_WEIGHT_KG = 70;
const SPLIT_DISTANCE_KM = 1;

// Define the possible states for a workout
export type WorkoutState =
  | 'idle'
  | 'countdown'
  | 'tracking'
  | 'paused'
  | 'saving'
  | 'finished';

// Helper function to convert SplitData to Split for display
interface SplitData {
  distance: number; // in km
  time: number; // in seconds
  pace: number; // in min/km
  timestamp: number;
}

const convertToSplit = (splitData: SplitData, index: number, displayUnit?: 'km' | 'mi'): Split => {
  return {
    splitNumber: index + 1,
    distance: splitData.distance,
    duration: splitData.time,
    pace: typeof splitData.pace === 'number'
      ? formatPaceDisplay(splitData.pace, displayUnit === 'mi' ? 'miles' : 'km')
      : String(splitData.pace),
  };
};

// Helper function to calculate distance between two lat/lng points (Haversine formula)
const haversine = (coord1: Location.LocationObjectCoords, coord2: Location.LocationObjectCoords): number => {
  const R = 6371; // Radius of the Earth in km
  const dLat = (coord2.latitude - coord1.latitude) * Math.PI / 180;
  const dLon = (coord2.longitude - coord1.longitude) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(coord1.latitude * Math.PI / 180) * Math.cos(coord2.latitude * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1C1C1E', // Dark theme background
    position: 'relative', // For absolute positioning of FAB
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 120, // Extra padding to account for FABs and Notes section
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

  fabContainer: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    zIndex: 10,
    paddingVertical: 8,
    backgroundColor: 'transparent',
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFA500',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  leftFab: {
    alignSelf: 'flex-start',
  },
  rightFab: {
    alignSelf: 'flex-end',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1E1E1E',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
  },
  closeButton: {
    padding: 8,
  },
  pedometerContent: {
    paddingBottom: 20,
  },
});

// Helper to format race type for display (if not already available elsewhere)
const formatRaceType = (type: string): string => {
  if (!type) return 'Run';
  switch (type.toLowerCase()) {
    case '5k': return '5K Race';
    case '10k': return '10K Race';
    case 'half_marathon': return 'Half Marathon';
    case 'full_marathon': return 'Full Marathon';
    case 'custom': return 'Custom Goal';
    default: return type.charAt(0).toUpperCase() + type.slice(1);
  }
};

type WorkoutTrackerScreenRouteProp = RouteProp<RootStackParamList, 'WorkoutTracker'>;

interface WorkoutTrackerProps {
  route: WorkoutTrackerScreenRouteProp;
  navigation: any;
  onWorkoutComplete: (workoutData: WorkoutEntry) => void;
}

const WorkoutTracker = ({ route, navigation, onWorkoutComplete }: WorkoutTrackerProps): React.ReactElement => {
  const insets = useSafeAreaInsets();
  const currentPlan: TrainingPlan | undefined = route?.params?.currentPlan;
  const { settings, isLoadingSettings } = useUserSettings();

  // Workout Lifecycle State
  const [workoutState, setWorkoutState] = useState<WorkoutState>('idle');

  // Core Workout Data
  const [startTime, setStartTime] = useState<number | null>(null);
  const [duration, setDuration] = useState(0); // in seconds
  const [distance, setDistance] = useState(0); // in km
  const [currentPace, setCurrentPace] = useState(0); // min/km
  const [avgPace, setAvgPace] = useState(0); // min/km
  const [routeCoordinates, setRouteCoordinates] = useState<Coordinate[]>([]);
  const [estimatedCalories, setEstimatedCalories] = useState(0);
  const [totalElevationGain, setTotalElevationGain] = useState(0);
  const [workoutNotes, setWorkoutNotes] = useState('');
  
  // UI and Interaction State
  const [countdownValue, setCountdownValue] = useState(0);
  const [showAudioSettings, setShowAudioSettings] = useState(false);
  const [showPedometerModal, setShowPedometerModal] = useState(false);
  const [currentCoachTip, setCurrentCoachTip] = useState<CoachTip | null>(null);

  // GPS and Pedometer
  const [lastPosition, setLastPosition] = useState<Location.LocationObject | null>(null);
  const [gpsActive, setGpsActive] = useState(true); // User can toggle this in PedometerTrackingMode
  const [pedometerDistance, setPedometerDistance] = useState(0);
  const [hybridDistance, setHybridDistance] = useState(0);

  // Refs for values needed in callbacks or intervals
  const lastPositionRef = useRef<Location.LocationObject | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const locationSubscriptionRef = useRef<Location.LocationSubscription | null>(null);
  const userSettingsRef = useRef(settings); // To access latest settings in callbacks

  // Derived booleans from workoutState for convenience
  const currentIsTracking = workoutState === 'tracking';
  const currentIsPaused = workoutState === 'paused';
  const currentIsCountingDown = workoutState === 'countdown';

  // Refs for audio cues dependencies
  const isTrackingRef = useRef(currentIsTracking);
  const isPausedRef = useRef(currentIsPaused);

  useEffect(() => { isTrackingRef.current = currentIsTracking; }, [currentIsTracking]);
  useEffect(() => { isPausedRef.current = currentIsPaused; }, [currentIsPaused]);
  useEffect(() => { userSettingsRef.current = settings; }, [settings]);

  // Audio Cues Integration
  const {
    announceWorkoutStart,
    announceWorkoutEnd,
    checkPaceCue: performPaceCueCheck,
    checkDistanceCue: performDistanceCueCheck,
  } = useAudioCues({
    isTracking: currentIsTracking,
    isPausedRef: isPausedRef, // Changed to pass the ref for isPaused
    settings: settings.audioCueDefaults, // Pass the specific audio cue settings
    currentPace: currentPace,
    distance: distance,
    targetPace: currentPlan?.targetPace ?? undefined,
    targetDistance: currentPlan?.targetDistance ?? undefined,
    workoutType: currentPlan?.type || 'run', // Default to 'run' if no plan type
  });

  useEffect(() => {
    if (currentIsTracking && !currentIsPaused && settings.audioCueDefaults?.enabled && performPaceCueCheck && currentPace > 0 && avgPace > 0 && settings.displayUnit) {
      performPaceCueCheck(formatPaceDisplay(currentPace, settings.displayUnit), formatPaceDisplay(avgPace, settings.displayUnit));
    }
  }, [currentPace, avgPace, currentIsTracking, currentIsPaused, settings.audioCueDefaults, settings.displayUnit, performPaceCueCheck]);

  useEffect(() => {
    if (currentIsTracking && !currentIsPaused && settings.audioCueDefaults?.enabled && performDistanceCueCheck) {
      performDistanceCueCheck(distance);
    }
  }, [distance, currentIsTracking, currentIsPaused, settings.audioCueDefaults, performDistanceCueCheck]);

  // Pedometer Integration
  const handleStepDistanceUpdate = useCallback((stepDistKm: number) => {
    if (currentIsTracking && !currentIsPaused && !gpsActive) { // Only use if GPS is off
      setDistance(stepDistKm);
      setPedometerDistance(stepDistKm);
    }
  }, [currentIsTracking, currentIsPaused, gpsActive]);

  const handleHybridDistanceUpdate = useCallback((hybridDistKm: number) => {
    if (currentIsTracking && !currentIsPaused && gpsActive) { // Only use if GPS is on
      // Do NOT set the main 'distance' state here, as GPS is active and should control it.
      // Only update the specific hybridDistance state if needed for other logic or display.
      setHybridDistance(hybridDistKm);
    }
  }, [currentIsTracking, currentIsPaused, gpsActive]);

  const { steps, distance: stepCounterDistance, hybridDistance: stepCounterHybridDistance } = useStepCounter({
    enabled: currentIsTracking && !currentIsPaused && (settings.usePedometer ?? true),
    isRunning: true, // Assuming running
    userHeightCm: settings.userHeight || 170,
    onDistanceChange: handleStepDistanceUpdate,
    onHybridDistanceChange: handleHybridDistanceUpdate,
    gpsDistanceMeters: gpsActive ? distance * 1000 : 0, // Provide GPS distance only if active
    isGpsActive: gpsActive,
  });

  // Calorie Calculation Effect
  useEffect(() => {
    if (currentIsTracking && duration > 0) {
      const userWeight = settings.userWeight || DEFAULT_USER_WEIGHT_KG;
      // MET value for running (approx 9.8 for moderate pace) - can be refined
      const MET = 9.8;
      const calories = (MET * userWeight * (duration / 3600));
      setEstimatedCalories(calories);
    }
  }, [duration, currentIsTracking, settings.userWeight]);

  // Pace Calculation Effect
  useEffect(() => {
    if (distance > 0 && duration > 0) {
      const pace = (duration / 60) / distance; // min/km
      setAvgPace(pace);
    } else {
      setAvgPace(0);
    }
  }, [distance, duration]);

  const resetTrackingState = async () => {
    console.log('WorkoutTracker: Resetting tracking state...');
    setDistance(0);
    setDuration(0);
    setCurrentPace(0);
    setAvgPace(0);
    setEstimatedCalories(0);
    setRouteCoordinates([]);
    setLastPosition(null);
    lastPositionRef.current = null;
    setTotalElevationGain(0);
    setStartTime(null);
    setWorkoutNotes('');
    setPedometerDistance(0);
    setHybridDistance(0);

    if (locationSubscriptionRef.current) {
      locationSubscriptionRef.current.remove();
      locationSubscriptionRef.current = null;
    }
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    console.log('WorkoutTracker: Tracking state reset complete.');
  };

  const startTracking = async () => {
    console.log('WorkoutTracker: Attempting to start tracking...');
    await resetTrackingState();

    const permStatus = await Location.getForegroundPermissionsAsync();
    if (!permStatus.granted) {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to track workouts.');
        setWorkoutState('idle');
        return;
      }
    }

    try {
      setWorkoutState('tracking');
      setStartTime(Date.now());
      if (settings.audioCueDefaults?.enabled && announceWorkoutStart) announceWorkoutStart();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = setInterval(() => {
        setDuration(d => d + 1);
      }, 1000);

      if (gpsActive) {
        console.log('[WorkoutTracker DEBUG] startTracking: Setting up Location.watchPositionAsync. gpsActive:', gpsActive);
        const sub = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.BestForNavigation,
          },
          (location) => {
            console.log('[WorkoutTracker DEBUG] Location Callback Fired. Location:', location.coords.latitude, location.coords.longitude);
            if (!isTrackingRef.current || isPausedRef.current) {
              console.log('[WorkoutTracker DEBUG] Location Callback: Not updating distance because isTrackingRef.current is', isTrackingRef.current, 'or isPausedRef.current is', isPausedRef.current);
              return;
            }
            
            // Ensure location.coords exists and has latitude/longitude
            if (!location || !location.coords) {
              console.warn('[WorkoutTracker DEBUG] Location Callback: Invalid location object received.');
              return;
            }

            const newCoordinate = {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            };
            setRouteCoordinates((prevCoords) => [...prevCoords, newCoordinate]);

            // Current location object (includes coords and timestamp)
            const currentFullLocation: Location.LocationObject = location; 

            if (lastPositionRef.current) { 
              const prevFullLocation: Location.LocationObject = lastPositionRef.current;

              // Calculate distance increment
              const distanceIncrementKm = haversine(prevFullLocation.coords, currentFullLocation.coords);
              console.log('[WorkoutTracker DEBUG] Location Callback: Distance increment (km):', distanceIncrementKm);
              
              setDistance((prevDistance) => prevDistance + distanceIncrementKm);

              // Calculate time increment
              const currentTimeMs = typeof currentFullLocation.timestamp === 'number' ? currentFullLocation.timestamp : Date.now();
              const prevTimeMs = typeof prevFullLocation.timestamp === 'number' ? prevFullLocation.timestamp : (currentTimeMs - 1000); // Default to 1s ago if prev timestamp is bad
              const timeIncrementSec = (currentTimeMs - prevTimeMs) / 1000;
              console.log('[WorkoutTracker DEBUG] Location Callback: Time increment (sec):', timeIncrementSec);

              // Calculate and set current pace
              if (timeIncrementSec > 0.1) { // Min 0.1s interval to avoid instability
                if (distanceIncrementKm > 0.0001) { // Min 0.1m distance change
                  const currentPaceMinPerKm = (timeIncrementSec / 60) / distanceIncrementKm;
                  console.log('[WorkoutTracker DEBUG] Location Callback: Calculated currentPace (min/km):', currentPaceMinPerKm);
                  setCurrentPace(currentPaceMinPerKm);
                } else {
                  // No significant distance covered, but time passed (likely stationary or very slow)
                  setCurrentPace(0); 
                  console.log('[WorkoutTracker DEBUG] Location Callback: Stationary or very slow (distanceIncrementKm too small), setting currentPace to 0.');
                }
              } else {
                // Time increment is not positive or too small, avoid division by zero or nonsensical pace.
                console.warn('[WorkoutTracker DEBUG] Location Callback: Time increment too small or not positive. Current pace not updated. timeIncrementSec:', timeIncrementSec);
              }
              
              // Altitude gain calculation
              if (currentFullLocation.coords.altitude != null && prevFullLocation.coords.altitude != null) { // Check for null/undefined as altitude can be 0
                const altitudeChange = currentFullLocation.coords.altitude - prevFullLocation.coords.altitude;
                if (altitudeChange > 0) {
                  console.log('[WorkoutTracker DEBUG] Location Callback: Altitude change:', altitudeChange);
                  setTotalElevationGain(prevGain => prevGain + altitudeChange);
                }
              }
            } else {
              console.log('[WorkoutTracker DEBUG] Location Callback: First location update. Setting initial position. No pace calculation yet.');
              // For the very first point, currentPace remains 0 or its initial state until the next point.
            }

            setLastPosition(currentFullLocation);     // Update UI state with the full location object
            lastPositionRef.current = currentFullLocation; // Update ref for the next calculation
          }
        );
        locationSubscriptionRef.current = sub;
      }
      console.log('WorkoutTracker: Tracking started.');
    } catch (error) {
      console.error('WorkoutTracker: Error starting tracking:', error);
      Alert.alert('Error', 'Could not start tracking. Please try again.');
      setWorkoutState('idle');
      await resetTrackingState(); // Ensure cleanup on error
    }
  };

  const initiateCountdown = () => {
    console.log('WorkoutTracker: Initiating countdown...');
    setWorkoutState('countdown');
    const initialCountdown = settings.countdownDuration ?? 3;
    setCountdownValue(initialCountdown);

    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

    if (initialCountdown > 0 && settings.audioCueDefaults?.enabled && Speech) {
      Speech.speak(initialCountdown.toString(), { language: 'en-US' });
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    countdownIntervalRef.current = setInterval(() => {
      setCountdownValue((val) => {
        const nextVal = val - 1;
        if (nextVal > 0) {
          if (settings.audioCueDefaults?.enabled && Speech) {
            Speech.speak(nextVal.toString(), { language: 'en-US' });
          }
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          return nextVal;
        } else {
          if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
          if (settings.audioCueDefaults?.enabled && Speech) {
            Speech.speak('Go!', { language: 'en-US' });
          }
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          startTracking();
          return 0;
        }
      });
    }, 1000);
  };

  const pauseTracking = () => {
    if (workoutState === 'tracking') {
      setWorkoutState('paused');
      if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
      if (settings.audioCueDefaults?.enabled && Speech) Speech.speak('Workout paused', { language: 'en-US', rate: 0.9 });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      console.log('WorkoutTracker: Tracking paused.');
    } else if (workoutState === 'paused') {
      setWorkoutState('tracking');
      // Restart duration timer
      if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = setInterval(() => {
        setDuration(d => d + 1);
      }, 1000);
      if (settings.audioCueDefaults?.enabled && Speech) Speech.speak('Workout resumed', { language: 'en-US', rate: 0.9 });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      console.log('WorkoutTracker: Tracking resumed.');
    }
  };

  const stopTracking = async () => {
    console.log('WorkoutTracker: Stopping tracking...');
    setWorkoutState('saving');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const finalDurationForCue = duration;
    const finalDistanceForCue = distance;
    const finalAvgPaceForCue = finalDistanceForCue > 0 ? (finalDurationForCue / 60) / finalDistanceForCue : 0;

    try {
      // Announce workout end inside the try block to prevent blocking
      if (settings.audioCueDefaults?.enabled && announceWorkoutEnd) {
        announceWorkoutEnd(finalDurationForCue, finalDistanceForCue, formatPaceDisplay(finalAvgPaceForCue, userSettingsRef.current.displayUnit));
      }

      const workoutId = uuidv4();
      const endTime = Date.now();

      // 1. Create the local WorkoutEntry object for local state and AsyncStorage
      const workoutData: WorkoutEntry = {
        id: workoutId,
        date: startTime ? new Date(startTime).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        user_id: '', // Will be set later
        startTime: startTime ? new Date(startTime).toISOString() : new Date().toISOString(),
        endTime: new Date(endTime).toISOString(),
        duration: duration,
        distance: distance,
        avgPace: avgPace,
        calories: estimatedCalories,
        coordinates: routeCoordinates,
        notes: workoutNotes,
        totalElevationGain: totalElevationGain,
        type: currentPlan?.type || 'Run',
        planId: currentPlan?.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data: { user } } = await supabase.auth.getUser();
      workoutData.user_id = user?.id || '';

      console.log('WorkoutTracker: Saving workout to AsyncStorage...');
      const history = await AsyncStorage.getItem(WORKOUT_HISTORY_KEY);
      const newHistory = history ? JSON.parse(history) : [];
      newHistory.unshift(workoutData);
      await AsyncStorage.setItem(WORKOUT_HISTORY_KEY, JSON.stringify(newHistory));
      console.log('WorkoutTracker: Workout saved to AsyncStorage.');

      if (user?.id) {
        // Map to Supabase schema - ensure all numeric fields are properly formatted
        const supabasePayload: TablesInsert<'workouts'> = {
          id: workoutId,
          user_id: user.id,
          date: workoutData.date,
          endTime: workoutData.endTime,
          duration: Math.round(workoutData.duration || 0),
          distance: Math.round((workoutData.distance || 0) * 1000), // Convert km to meters and round
          avgPace: workoutData.avgPace ? parseFloat(workoutData.avgPace.toFixed(2)) : null,
          calories: Math.round(workoutData.calories || 0),
          coordinates: workoutData.coordinates as any,
          notes: workoutData.notes,
          totalElevationGain: workoutData.totalElevationGain ? Math.round(workoutData.totalElevationGain) : null,
          type: workoutData.type,
          planId: workoutData.planId,
          created_at: workoutData.created_at,
          steps: workoutData.steps ? Math.round(workoutData.steps) : null,
          trackingMode: workoutData.trackingMode,
          avgHeartRate: workoutData.avgHeartRate ? Math.round(workoutData.avgHeartRate) : null,
          totalElevationLoss: workoutData.totalElevationLoss ? Math.round(workoutData.totalElevationLoss) : null
        };

        console.log('WorkoutTracker: Preparing to save to Supabase with payload:', supabasePayload);
        const { error: supabaseError } = await supabase.from('workouts').insert(supabasePayload);

        if (supabaseError) {
          console.error('WorkoutTracker: Supabase insert error:', supabaseError);
          throw supabaseError; // Rethrow to be caught by the outer try-catch
        }
        console.log('WorkoutTracker: Workout saved to Supabase.');
      } else {
        console.warn('WorkoutTracker: User not logged in, skipping Supabase save.');
        Alert.alert("Not Logged In", "Your workout was saved locally, but please log in to sync with the server.");
      }

      // Moved success alert and callback here, after all save attempts
      // Format the workout summary
      const formattedDistance = formatDistanceDisplay(distance * 1000, settings.displayUnit);
      const formattedDuration = formatDurationDisplay(duration);
      const formattedPace = avgPace > 0 ? formatPaceDisplay(avgPace, settings.displayUnit) : '--:--';
      const formattedCalories = Math.round(estimatedCalories);

      Alert.alert(
        'Workout Complete! ✅',
        `\nDistance: ${formattedDistance}\n` +
        `Duration: ${formattedDuration}\n` +
        `Avg Pace: ${formattedPace}/km\n` +
        `Calories: ${formattedCalories} kcal`,
        [
          {
            text: 'OK',
            style: 'default',
          },
        ],
        {
          cancelable: true,
          userInterfaceStyle: 'dark',
        }
      );
      if (onWorkoutComplete) onWorkoutComplete(workoutData);

    } catch (error) {
      console.error('WorkoutTracker: Failed to save workout:', error);
      Alert.alert('Save Error', 'Failed to save workout data. It has been saved locally.');
    } finally {
      console.log('WorkoutTracker: Entering finally block of stopTracking.');
      try {
        await resetTrackingState();
        console.log('WorkoutTracker: resetTrackingState completed successfully.');
      } catch (resetError) {
        console.error('WorkoutTracker: Error during resetTrackingState:', resetError);
      }
      setWorkoutState('idle');
      console.log('WorkoutTracker: State definitively set to idle.');
    }
  };

  const handleGpsActiveChange = (isActive: boolean) => {
    setGpsActive(isActive);
    console.log('WorkoutTracker: GPS Active toggled to:', isActive);
    if (!isActive && locationSubscriptionRef.current) {
      locationSubscriptionRef.current.remove();
      locationSubscriptionRef.current = null;
      console.log('WorkoutTracker: Location subscription removed due to GPS deactivation.');
    } else if (isActive && currentIsTracking && !locationSubscriptionRef.current) {
      // If GPS is re-enabled during tracking, re-initialize watchPositionAsync
      // This part of startTracking logic would need to be callable separately
      // For simplicity, this might require a brief pause/resume or a more complex re-init
      console.warn('WorkoutTracker: GPS re-enabled during tracking. Location watch may need restart.');
      // Consider re-calling the watchPositionAsync part of startTracking()
      // This might involve temporarily pausing, re-init GPS, then resuming.
      // For now, we'll log and the user might need to pause/resume to fully re-engage GPS.
    }
  };

  // UI Rendering
  const displayDistance = useMemo(() => {
    const distanceInMeters = distance * 1000; // Convert km to meters
    return formatDistanceDisplay(distanceInMeters, settings.displayUnit);
  }, [distance, settings.displayUnit]);
  const displayPace = useMemo(() => currentPace > 0 ? formatPaceDisplay(currentPace, settings.displayUnit) : '--:--', [currentPace, settings.displayUnit]);
  const displayAvgPace = useMemo(() => avgPace > 0 ? formatPaceDisplay(avgPace, settings.displayUnit) : '--:--', [avgPace, settings.displayUnit]);
  const displayDuration = useMemo(() => formatDurationDisplay(duration), [duration]);
  const displayCalories = useMemo(() => `${Math.round(estimatedCalories)} kcal`, [estimatedCalories]);

  if (isLoadingSettings) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#FFA500" />
        <Text style={[styles.title, { marginTop: 10 }]}>Loading Settings...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={{ flex: 1, paddingTop: insets.top }}
        contentContainerStyle={[
          styles.contentContainer,
          (workoutState === 'tracking' || workoutState === 'paused') && {
            paddingBottom: 160, // Extra padding when Notes section is visible
          },
        ]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
      <HeaderSafeArea />
      <View style={styles.headerSection}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>{currentPlan?.name || 'Quick Run'}</Text>
          <Text style={styles.subtitle}>{currentPlan?.type ? formatRaceType(currentPlan.type) : 'Track your workout'}</Text>
        </View>
      </View>

      <View style={{ height: 250, marginBottom: 20 }}>
        <WorkoutMapDisplay 
          settings={{ ...settings, showMap: true }}
          routeCoordinates={routeCoordinates}
          currentLocation={lastPosition}
          workoutState={workoutState}
        />
      </View>
      
      <WorkoutStatsGrid
        displayDistance={displayDistance}
        displayDuration={displayDuration}
        displayPace={displayPace}
        displayAvgPace={displayAvgPace}
        displayCalories={displayCalories}
        totalElevationGain={totalElevationGain}
        settings={settings} // Pass the whole settings object
      />

      <WorkoutControls
        workoutState={workoutState}
        countdownValue={countdownValue}
        initiateCountdown={initiateCountdown}
        pauseTracking={pauseTracking}
        stopTracking={stopTracking}
        currentRaceGoalName={currentPlan?.name}
      />

      <CoachTipsDisplay 
        settings={settings}
        currentCoachTip={currentCoachTip}
        workoutState={workoutState}
      />

      <WorkoutNotesInput 
        workoutState={workoutState}
        workoutNotes={workoutNotes}
        setWorkoutNotes={setWorkoutNotes}
      />


      <Modal
        animationType="slide"
        transparent={true}
        visible={showAudioSettings}
        onRequestClose={() => setShowAudioSettings(false)}
      >
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <View style={{ backgroundColor: '#1E1E1E', padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: Dimensions.get('window').height * 0.8 }}>
                <AudioCueSettings
                    currentSettings={settings.audioCueDefaults}
                    onClose={() => setShowAudioSettings(false)}
                    onSave={(newSettings) => {
                        // This should be handled by useUserSettings hook now
                        // updateAudioCueDefaults(newSettings); 
                        console.log("AudioCueSettings modal save - settings should be updated via context");
                        setShowAudioSettings(false);
                    }}
                />
            </View>
        </View>
      </Modal>

      {/* Pedometer Mode Modal */}
      <Modal
        visible={showPedometerModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPedometerModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pedometer Mode</Text>
              <TouchableOpacity 
                onPress={() => setShowPedometerModal(false)}
                style={styles.closeButton}
              >
                <X size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <View style={styles.pedometerContent}>
              <PedometerModeDisplay
                isActive={currentIsTracking && !currentIsPaused}
                gpsDistanceKm={distance}
                onStepDistanceUpdate={setPedometerDistance}
                onHybridDistanceUpdate={setHybridDistance}
                gpsActive={gpsActive}
                onGpsActiveChange={handleGpsActiveChange}
                usePedometer={settings.usePedometer ?? true}
              />
            </View>
          </View>
        </View>
      </Modal>

      </ScrollView>

      {/* FABs */}
      <View style={styles.fabContainer}>
        {/* Audio Cue Settings FAB */}
        <TouchableOpacity 
          style={[styles.fab, styles.leftFab]}
          onPress={() => setShowAudioSettings(true)}
        >
          <Headphones size={24} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Pedometer Mode FAB */}
        <TouchableOpacity 
          style={[styles.fab, styles.rightFab, showPedometerModal && {backgroundColor: '#FF8C00'}]}
          onPress={() => setShowPedometerModal(!showPedometerModal)}
        >
          <Footprints size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
};



export default WorkoutTracker;
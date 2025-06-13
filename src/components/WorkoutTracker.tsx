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
import BackgroundTimer from 'react-native-background-timer';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { TablesInsert } from '../types/supabase';
import { Split, WorkoutEntry, WORKOUT_HISTORY_KEY, Coordinate } from '../types/workoutTypes';
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
  TrendingUp,
} from 'lucide-react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigationTypes';
import { WorkoutState } from '../types/workoutTypes';
import MapView, { Polyline, Marker } from 'react-native-maps';
import { Route, RoutePoint } from '../types/routeTypes';
import { useAudioCues } from '../hooks/useAudioCues';
import { AudioCueSettingsData } from '../types/audioTypes';
import { useUserSettings } from '../hooks/useUserSettings';
import { useRoutes } from '../contexts/RouteContext';
import { NewRoute } from '../types/routeTypes';
import { useWorkout } from '../contexts/WorkoutContext';

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
const haversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1C1C1E', // Dark theme background
    position: 'relative', // For absolute positioning of FAB
  },
  mapContainer: {
    flex: 1,
    backgroundColor: '#1C1C1E',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 120, // Extra padding to account for FABs and Notes section
  },
  headerTextContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
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
  routeInfoContainer: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 10,
    padding: 12,
  },
  routeInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  routeName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  routeDistance: {
    color: '#9ca3af',
    fontSize: 16,
    marginHorizontal: 10,
  },
  routeDetails: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  routeStat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeStatText: {
    color: '#9ca3af',
    fontSize: 14,
    marginLeft: 4,
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#3b82f6',
  },
  nextTurnContainer: {
    marginTop: 10,
    padding: 8,
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderRadius: 6,
    alignItems: 'center',
  },
  nextTurnText: {
    color: '#fff',
    fontWeight: '500',
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

type WorkoutTrackerScreenRouteProp = RouteProp<
  {
    WorkoutTracker: {
      routeToFollow?: Route;
      currentPlan?: TrainingPlan;
    };
  },
  'WorkoutTracker'
>;

interface WorkoutTrackerProps {
  route: WorkoutTrackerScreenRouteProp;
  navigation: any;
  onWorkoutComplete: (workoutData: WorkoutEntry) => void;
}

const WorkoutTracker = ({ route, navigation, onWorkoutComplete }: WorkoutTrackerProps): React.ReactElement => {
  const insets = useSafeAreaInsets();
  const currentPlan: TrainingPlan | undefined = route?.params?.currentPlan;
  const { settings, isLoadingSettings, updateAudioCueDefaults } = useUserSettings();
  const { saveRoute } = useRoutes();
  const { startWorkout, pauseWorkout, resumeWorkout, stopWorkout, currentWorkout } = useWorkout();
  const navigationRoute = useRoute<RouteProp<RootStackParamList, 'WorkoutTracker'>>();
  const { routeToFollow: initialRoute } = route.params || {};
  const [routeToFollow, setRouteToFollow] = useState<Route | null>(initialRoute || null);
  const [showRouteDetails, setShowRouteDetails] = useState(false);

  // Workout Lifecycle State
  const [workoutState, setWorkoutState] = useState<WorkoutState>('idle');

  // Core Workout Data
  const [startTime, setStartTime] = useState<number | null>(null);
  const [duration, setDuration] = useState(0); // in seconds
  const [distance, setDistance] = useState(0); // in km
  const [currentPace, setCurrentPace] = useState(0); // min/km
  const [avgPace, setAvgPace] = useState(0); // min/km
  const [routeCoordinates, setRouteCoordinates] = useState<Coordinate[]>([]);
  const [userPathCoordinates, setUserPathCoordinates] = useState<Coordinate[]>([]); // Tracks user's actual path
  const [estimatedCalories, setEstimatedCalories] = useState(0);
  const [totalElevationGain, setTotalElevationGain] = useState(0);
  const [workoutNotes, setWorkoutNotes] = useState('');
  
  // UI and Interaction State
  const [countdownValue, setCountdownValue] = useState(0);
  const [showAudioSettings, setShowAudioSettings] = useState(false);
  const [showPedometerModal, setShowPedometerModal] = useState(false);
  const [currentCoachTip, setCurrentCoachTip] = useState<CoachTip | null>(null);
  const [nextTurnInstruction, setNextTurnInstruction] = useState<string>('');
  const [distanceToNextTurn, setDistanceToNextTurn] = useState<number | null>(null);
  const [routeProgress, setRouteProgress] = useState(0); // 0-100%

  // GPS and Pedometer
  const [lastPosition, setLastPosition] = useState<Location.LocationObject | null>(null);
  const [gpsActive, setGpsActive] = useState(true); // User can toggle this in PedometerTrackingMode
  const [pedometerDistance, setPedometerDistance] = useState(0);
  const [hybridDistance, setHybridDistance] = useState(0);

  // Refs for values needed in callbacks or intervals
  const mapRef = useRef<MapView>(null);
  const currentRoutePointIndex = useRef<number>(0);
  const distanceToNextPoint = useRef<number | null>(null);
  const nextTurn = useRef<any>(null);
  const currentTurn = useRef<any>(null);
  
  // Initialize route to follow from navigation params
  useEffect(() => {
    if (routeToFollow?.waypoints?.length) {
      // Set initial region to show the entire route
      const lats = routeToFollow.waypoints.map((wp: RoutePoint) => wp.latitude);
      const lngs = routeToFollow.waypoints.map((wp: RoutePoint) => wp.longitude);
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      const minLng = Math.min(...lngs);
      const maxLng = Math.max(...lngs);
      
      // Convert waypoints to coordinates for the map
      const coordinates = routeToFollow.waypoints.map((wp: RoutePoint) => ({
        latitude: wp.latitude,
        longitude: wp.longitude,
      }));
      
      // Update the route coordinates state
      setRouteCoordinates(coordinates);
      
      // Focus the map on the route
      mapRef.current?.fitToCoordinates(coordinates, {
        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
        animated: true,
      });
    } else {
      // Clear route coordinates if no route to follow
      setRouteCoordinates([]);
    }
  }, [routeToFollow]);
  
  // Refs for values needed in callbacks or intervals
  const lastPositionRef = useRef<Location.LocationObject | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | number | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | number | null>(null);
  const locationSubscriptionRef = useRef<Location.LocationSubscription | null>(null);
  const userSettingsRef = useRef(settings); // To access latest settings in callbacks

  // Derived booleans from workoutState for convenience
  const currentIsTracking = workoutState === 'active';
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
    setUserPathCoordinates([]); // Reset user's path
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
    // Clear duration interval
    if (durationIntervalRef.current !== null) {
      if (typeof durationIntervalRef.current === 'number') {
        BackgroundTimer.clearInterval(durationIntervalRef.current);
      } else {
        clearInterval(durationIntervalRef.current);
      }
      durationIntervalRef.current = null;
    }
    
    // Clear countdown interval
    if (countdownIntervalRef.current !== null) {
      if (typeof countdownIntervalRef.current === 'number') {
        BackgroundTimer.clearInterval(countdownIntervalRef.current);
      } else {
        clearInterval(countdownIntervalRef.current);
      }
      countdownIntervalRef.current = null;
    }
    console.log('WorkoutTracker: Tracking state reset complete.');
  };

  const startTracking = async () => {
    console.log('WorkoutTracker: Attempting to start tracking...');
    
    // Save the current route coordinates if we're following a route
    const currentRouteCoords = [...routeCoordinates];
    
    await resetTrackingState();
    
    // Restore the route coordinates if we're following a route
    if (routeToFollow?.waypoints?.length) {
      setRouteCoordinates(currentRouteCoords);
    }

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
      setWorkoutState('active');
      setStartTime(Date.now());
      if (settings.audioCueDefaults?.enabled && announceWorkoutStart) announceWorkoutStart();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      if (durationIntervalRef.current) {
        if (typeof durationIntervalRef.current === 'number') {
          BackgroundTimer.clearInterval(durationIntervalRef.current);
        } else {
          clearInterval(durationIntervalRef.current);
        }
      }
      durationIntervalRef.current = BackgroundTimer.setInterval(() => {
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
            
            // Update user's path
            setUserPathCoordinates(prevCoords => [...prevCoords, newCoordinate]);
            
            // Only update route coordinates if we're not following a predefined route
            if (!routeToFollow?.waypoints?.length) {
              setRouteCoordinates(prevCoords => [...prevCoords, newCoordinate]);
            }

            // Current location object (includes coords and timestamp)
            const currentFullLocation: Location.LocationObject = location; 

            if (lastPositionRef.current) { 
              const prevFullLocation: Location.LocationObject = lastPositionRef.current;

              // Calculate distance increment
              const distanceIncrementKm = haversineDistance(
                prevFullLocation.coords.latitude,
                prevFullLocation.coords.longitude,
                currentFullLocation.coords.latitude,
                currentFullLocation.coords.longitude
              );
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

    if (countdownIntervalRef.current) {
      if (typeof countdownIntervalRef.current === 'number') {
        BackgroundTimer.clearInterval(countdownIntervalRef.current);
      } else {
        clearInterval(countdownIntervalRef.current);
      }
    }

    if (initialCountdown > 0 && settings.audioCueDefaults?.enabled && Speech) {
      Speech.speak(initialCountdown.toString(), { language: 'en-US' });
    }

    countdownIntervalRef.current = BackgroundTimer.setInterval(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setCountdownValue((val) => {
        const nextVal = val - 1;
        if (nextVal > 0) {
          if (settings.audioCueDefaults?.enabled && Speech) {
            Speech.speak(nextVal.toString(), { language: 'en-US' });
          }
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          return nextVal;
        } else {
          if (countdownIntervalRef.current) {
            if (typeof countdownIntervalRef.current === 'number') {
              BackgroundTimer.clearInterval(countdownIntervalRef.current);
            } else {
              clearInterval(countdownIntervalRef.current);
            }
          }
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
    if (workoutState === 'active') {
      setWorkoutState('paused');
      if (durationIntervalRef.current) {
        if (typeof durationIntervalRef.current === 'number') {
          BackgroundTimer.clearInterval(durationIntervalRef.current);
        } else {
          clearInterval(durationIntervalRef.current);
        }
      }
      if (settings.audioCueDefaults?.enabled && Speech) Speech.speak('Workout paused', { language: 'en-US', rate: 0.9 });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      console.log('WorkoutTracker: Tracking paused.');
    } else if (workoutState === 'paused') {
      setWorkoutState('active');
      // Restart duration timer
      if (durationIntervalRef.current) {
        if (typeof durationIntervalRef.current === 'number') {
          BackgroundTimer.clearInterval(durationIntervalRef.current);
        } else {
          clearInterval(durationIntervalRef.current);
        }
      }
      durationIntervalRef.current = BackgroundTimer.setInterval(() => {
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

      // Save the route if we have enough coordinates
      if (routeCoordinates.length >= 2) {
        try {
          const routeName = `Run on ${new Date().toLocaleDateString()}`;
          const waypoints = routeCoordinates.map(coord => {
            const waypoint: Coordinate = {
              latitude: coord.latitude,
              longitude: coord.longitude
            };
            
            // Only include optional properties if they exist
            if (coord.altitude !== undefined) waypoint.altitude = coord.altitude;
            if (coord.timestamp !== undefined) waypoint.timestamp = new Date(coord.timestamp).getTime();
            if (coord.accuracy !== undefined) waypoint.accuracy = coord.accuracy;
            if (coord.speed !== undefined) waypoint.speed = coord.speed;
            if (coord.heading !== undefined) waypoint.heading = coord.heading;
            
            return waypoint;
          });
          
          const newRoute: NewRoute = {
            name: routeName,
            waypoints,
            distance: distance * 1000, // Convert to meters
            elevationGain: totalElevationGain || 0,
            isFavorite: false,
            averagePace: avgPace,
            maxSpeed: Math.max(...routeCoordinates.map(c => c.speed || 0)),
            duration: duration,
            caloriesBurned: estimatedCalories,
            // These are optional in NewRoute but we provide them
            createdAt: Date.now(),
            updatedAt: Date.now()
          };
          
          await saveRoute(newRoute);
          console.log('Route saved successfully');
        } catch (routeError) {
          console.error('Failed to save route:', routeError);
          // Don't show an error to the user for route saving
        }
      }

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

  // Map View
  const renderMap = () => (
    <View style={styles.mapContainer}>
      <MapView
        ref={mapRef}
        style={styles.map}
        showsUserLocation
        followsUserLocation
        showsMyLocationButton={false}
        initialRegion={{
          latitude: 37.7749,
          longitude: -122.4194,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
      >
        {routeToFollow?.waypoints && routeToFollow.waypoints.length > 0 && (
          <>
            <Polyline
              coordinates={routeToFollow.waypoints.map((wp: RoutePoint) => ({
                latitude: wp.latitude,
                longitude: wp.longitude,
              }))}
              strokeColor="#3b82f6"
              strokeWidth={4}
            />
            {/* Start marker */}
            {routeToFollow.waypoints[0] && (
              <Marker
                coordinate={{
                  latitude: routeToFollow.waypoints[0].latitude,
                  longitude: routeToFollow.waypoints[0].longitude,
                }}
                title="Start"
                pinColor="#10b981"
              />
            )}
            {/* End marker */}
            {routeToFollow.waypoints.length > 0 && (
              <Marker
                coordinate={{
                  latitude: routeToFollow.waypoints[routeToFollow.waypoints.length - 1].latitude,
                  longitude: routeToFollow.waypoints[routeToFollow.waypoints.length - 1].longitude,
                }}
                title="End"
                pinColor="#ef4444"
              />
            )}
          </>
        )}
      </MapView>
      
      {/* Route info overlay */}
      {routeToFollow?.waypoints && routeToFollow.waypoints.length > 0 && (
        <View style={styles.routeInfoContainer}>
          <TouchableOpacity 
            onPress={() => setShowRouteDetails(!showRouteDetails)}
            style={styles.routeInfoHeader}
          >
            <Text style={styles.routeName}>{routeToFollow.name || 'Unnamed Route'}</Text>
            <Text style={styles.routeDistance}>
              {formatDistanceDisplay((routeToFollow.distance || 0) / 1000, 'km')}
            </Text>
            {showRouteDetails ? (
              <ChevronUp size={20} color="#fff" />
            ) : (
              <ChevronDown size={20} color="#fff" />
            )}
          </TouchableOpacity>
          
          {showRouteDetails && (
            <View style={styles.routeDetails}>
              <View style={styles.routeStat}>
                <Clock size={16} color="#9ca3af" />
                <Text style={styles.routeStatText}>
                  {formatDurationDisplay(routeToFollow.duration || 0)}
                </Text>
              </View>
              {routeToFollow.elevationGain !== undefined && (
                <View style={styles.routeStat}>
                  <TrendingUp size={16} color="#9ca3af" />
                  <Text style={styles.routeStatText}>
                    {Math.round(routeToFollow.elevationGain)}m
                  </Text>
                </View>
              )}
            </View>
          )}
          
          {/* Progress bar */}
          <View style={styles.progressBarContainer}>
            <View 
              style={[
                styles.progressBar,
                { width: `${routeProgress}%` }
              ]} 
            />
          </View>
          
          {/* Next turn indicator */}
          {nextTurnInstruction && (
            <View style={styles.nextTurnContainer}>
              <Text style={styles.nextTurnText}>
                {nextTurnInstruction}{' '}
                {distanceToNextTurn && `in ${Math.round(distanceToNextTurn)}m`}
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );

  if (isLoadingSettings) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#FFA500" />
        <Text style={[styles.headerTitle, { marginTop: 10 }]}>Loading rhythms...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={{ flex: 1, paddingTop: insets.top }}
        contentContainerStyle={[
          styles.contentContainer,
          (workoutState === 'active' || workoutState === 'paused') && {
            paddingBottom: 160, // Extra padding when Notes section is visible
          },
        ]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
      <HeaderSafeArea />
      <View style={styles.headerTextContainer}>
        <Text style={styles.headerTitle}>{currentPlan?.name || 'Quick Run'}</Text>
        {currentPlan?.type && (
          <Text style={styles.headerSubtitle}>
            {formatRaceType(currentPlan.type)}
          </Text>
        )}
      </View>

      <View style={{ height: 250, marginBottom: 20 }}>
        <WorkoutMapDisplay 
          settings={{ ...settings, showMap: true }}
          routeCoordinates={routeToFollow?.waypoints?.length 
            ? routeToFollow.waypoints.map(wp => ({
                latitude: wp.latitude,
                longitude: wp.longitude
              })) 
            : routeCoordinates}
          userPathCoordinates={userPathCoordinates}
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
                    onSave={async (newSettings) => {
                      try {
                        // Update the audio cue settings via the context
                        const success = await updateAudioCueDefaults(newSettings);
                        if (success) {
                          console.log("Audio cue settings saved successfully");
                        } else {
                          console.warn("Failed to save audio cue settings");
                        }
                      } catch (error) {
                        console.error("Error saving audio cue settings:", error);
                      } finally {
                        // Always close the modal
                        setShowAudioSettings(false);
                      }
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
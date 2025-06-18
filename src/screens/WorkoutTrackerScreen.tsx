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
import { Headphones, Footprints } from 'lucide-react-native';
import BackgroundTimer from 'react-native-background-timer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import { v4 as uuidv4 } from 'uuid';
import { useKeepAwake } from 'expo-keep-awake';

// Types
import { TablesInsert } from '../types/supabase';
import { Split, WorkoutEntry, WORKOUT_HISTORY_KEY, Coordinate } from '../types/workoutTypes';
import { TrainingPlan } from '../types/trainingPlanTypes';
import { Route as RouteType, RoutePoint } from '../types/routeTypes';
import { AudioCueSettingsData } from '../types/audioTypes';
import { RootStackParamList } from '../types/navigationTypes';

// Components
import AudioCueSettings from '../components/AudioCueSettings';
import { HeaderSafeArea } from '../components/HeaderSafeArea';
import PedometerTrackingMode from '../components/PedometerTrackingMode';
import WorkoutStatsGrid from '../components/WorkoutStatsGrid';
import WorkoutControls from '../components/WorkoutControls';
import CoachTipsDisplay, { CoachTip } from '../components/CoachTipsDisplay';
import WorkoutMapDisplay from '../components/WorkoutMapDisplay';
import WorkoutNotesInput from '../components/WorkoutNotesInput';
import PedometerModeDisplay from '../components/PedometerModeDisplay';

// Hooks
import { useAudioCues } from '../hooks/useAudioCues';
import { useUserSettings } from '../hooks/useUserSettings';
import { useRoutes } from '../contexts/RouteContext';
import { useStepCounter } from '../hooks/useStepCounter';
import { useWorkout } from '../contexts/WorkoutContext';

// Utils
import { formatPaceDisplay, formatDurationDisplay, formatDistanceDisplay } from '../utils/PaceCalculator';
import { getRaceColor } from '../utils/raceColors';
import { supabase } from '../lib/supabase';

// Icons
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
  X,
  TrendingUp,
} from 'lucide-react-native';

const DEFAULT_USER_WEIGHT_KG = 70;
const SPLIT_DISTANCE_KM = 1;

// Types for the component props
interface WorkoutTrackerScreenProps {
  route: WorkoutTrackerScreenRouteProp;
  navigation: any;
  onWorkoutComplete?: (workoutData: WorkoutEntry) => void;
}

// Helper function to convert SplitData to Split for display
interface SplitData {
  distance: number; // in km
  time: number; // in seconds
  pace: number; // in min/km
  timestamp: number;
}

const convertToSplit = (splitData: SplitData, index: number, displayUnit?: 'km' | 'mi'): Split => ({
  splitNumber: index + 1,
  distance: splitData.distance,
  duration: splitData.time,
  pace: typeof splitData.pace === 'number'
    ? formatPaceDisplay(splitData.pace, displayUnit === 'mi' ? 'miles' : 'km')
    : String(splitData.pace),
});

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

// Helper to format race type for display (if not already available elsewhere)
const formatRaceType = (type: string): string => {
  if (!type) return 'Run';
  const typeMap: Record<string, string> = {
    '5k': '5K Race',
    '10k': '10K Race',
    half_marathon: 'Half Marathon',
    full_marathon: 'Full Marathon',
    custom: 'Custom Goal',
  };
  return typeMap[type.toLowerCase()] || type.charAt(0).toUpperCase() + type.slice(1);
};

// Format duration in seconds to HH:MM:SS or MM:SS
const formatDuration = (totalSeconds: number): string => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

// Format pace in seconds per kilometer to MM:SS/km
const formatPace = (paceInSeconds: number): string => {
  if (!paceInSeconds || isNaN(paceInSeconds) || !isFinite(paceInSeconds)) return '--:--';
  
  const minutes = Math.floor(paceInSeconds / 60);
  const seconds = Math.floor(paceInSeconds % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

type WorkoutTrackerScreenRouteProp = RouteProp<
  {
    WorkoutTracker: {
      routeToFollow?: RouteType;
      currentPlan?: TrainingPlan;
    };
  },
  'WorkoutTracker'
>;

type WorkoutState = 'idle' | 'countdown' | 'active' | 'paused' | 'saving' | 'finished';

const WorkoutTrackerScreen: React.FC<WorkoutTrackerScreenProps> = ({ route, navigation, onWorkoutComplete }) => {
  // Hooks
  const { settings, isLoadingSettings, updateAudioCueDefaults } = useUserSettings();
  const { saveRoute } = useRoutes();
  const { 
    startWorkout, 
    pauseWorkout, 
    resumeWorkout, 
    stopWorkout, 
    currentWorkout,
    workoutState,
    distance: contextDistance,
    duration: contextDuration,
    currentPace: contextCurrentPace,
    avgPace: contextAvgPace,
    elevationGain: contextElevationGain,
    caloriesBurned: contextCaloriesBurned
  } = useWorkout();
  const insets = useSafeAreaInsets();
  useKeepAwake();
  
  // Update user path coordinates when positions change
  useEffect(() => {
    if (currentWorkout?.positions && currentWorkout.positions.length > 0) {
      const newPath = currentWorkout.positions.map((pos: { latitude: number; longitude: number; }) => ({
        latitude: pos.latitude,
        longitude: pos.longitude
      }));
      setUserPathCoordinates(newPath);
    }
  }, [currentWorkout?.positions]);
  
  // Get route params
  const { routeToFollow: initialRoute, currentPlan } = route?.params || {};
  
  // State
  const [routeToFollow, setRouteToFollow] = useState<RouteType | null>(initialRoute || null);
  const [showRouteDetails, setShowRouteDetails] = useState(false);
  const [routeCoordinates, setRouteCoordinates] = useState<Coordinate[]>([]);
  const [userPathCoordinates, setUserPathCoordinates] = useState<Coordinate[]>([]);
  const [workoutNotes, setWorkoutNotes] = useState('');
  const [countdownValue, setCountdownValue] = useState<number | null>(null);
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [showAudioSettings, setShowAudioSettings] = useState(false);
  const [showPedometerModal, setShowPedometerModal] = useState(false);
  const [currentCoachTip, setCurrentCoachTip] = useState<{ id: string; title: string; tip: string } | null>(null);
  const [nextTurnInstruction, setNextTurnInstruction] = useState<string>('');
  const [distanceToNextTurn, setDistanceToNextTurn] = useState<number | null>(null);
  const [routeProgress, setRouteProgress] = useState(0); // 0-100%
  const [lastPosition, setLastPosition] = useState<Location.LocationObject | null>(null);
  const [gpsActive, setGpsActive] = useState(true);
  const [pedometerDistance, setPedometerDistance] = useState(0);
  const [hybridDistance, setHybridDistance] = useState(0);
  const [isMounted, setIsMounted] = useState(true);
  
  // Sync local state with context state
  const distance = contextDistance / 1000; // Convert meters to km
  const duration = contextDuration;
  const currentPace = contextCurrentPace || 0;
  const avgPace = contextAvgPace || 0;
  const estimatedCalories = Math.round(contextCaloriesBurned);
  const totalElevationGain = contextElevationGain;

  // Refs
  const mapRef = useRef<any>(null);
  const currentRoutePointIndex = useRef<number>(0);
  const distanceToNextPoint = useRef<number | null>(null);
  const nextTurn = useRef<any>(null);
  const currentTurn = useRef<any>(null);
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);
  const isTrackingRef = useRef(false);
  const isPausedRef = useRef(false);
  const lastPositionRef = useRef<Location.LocationObject | null>(null);
  const lastLocationUpdateTime = useRef<number>(0);
  const lastLocation = useRef<Location.LocationObject | null>(null);
  const lastPaceUpdateTime = useRef<number>(0);
  const lastPaceDistance = useRef<number>(0);
  const lastPaceTimestamp = useRef<number>(0);
  const splits = useRef<SplitData[]>([]);
  const lastSplitDistance = useRef<number>(0);
  const lastCalorieUpdateTime = useRef<number>(0);
  const lastCalorieDistance = useRef<number>(0);
  const lastCalorieTimestamp = useRef<number>(0);
  const lastAudioCueTime = useRef<{ [key: string]: number }>({});
  const nextTurnRef = useRef<any>(null);
  const currentTurnRef = useRef<any>(null);
  const routeToFollowRef = useRef<RouteType | null>(initialRoute || null);
  const routeCoordinatesRef = useRef<Coordinate[]>([]);
  const userPathCoordinatesRef = useRef<Coordinate[]>([]);
  const distanceRef = useRef(0);
  const durationRef = useRef(0);
  const startTimeRef = useRef<number | null>(null);
  const workoutTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);
  const audioCueSettingsRef = useRef<AudioCueSettingsData>({
    enabled: true,
    volume: 0.8,
    distanceUnit: settings.audioCueDefaults?.distanceUnit || 'km',
    announceDistance: true,
    distanceInterval: 1,
    announceTime: true,
    timeInterval: 5,
    announcePace: true,
    announceCalories: false,
    splitAnnouncementsEnabled: true
  });

  // Handle GPS active state changes
  const handleGpsActiveChange = useCallback((active: boolean) => {
    if (workoutState === 'active') {
      Alert.alert(
        'Warning',
        'Changing GPS tracking mode during a workout may affect accuracy.',
        [{ text: 'OK' }],
        { cancelable: true }
      );
    }
    setGpsActive(active);
    setShowPedometerModal(false);
    
    // Note: The actual distance tracking is now handled by the WorkoutContext
    // The gpsActive state is only used to determine which distance source to display
  }, [workoutState]);

  // Pedometer Integration
  const handleStepDistanceUpdate = useCallback((stepDistKm: number) => {
    if (workoutState === 'active' && !isPausedRef.current && !gpsActive) {
      // Update the pedometer distance which will be used for display
      setPedometerDistance(stepDistKm);
      // Note: The actual distance is managed by the WorkoutContext
    }
  }, [gpsActive, workoutState]);

  const handleHybridDistanceUpdate = useCallback((hybridDistKm: number) => {
    if (workoutState === 'active' && !isPausedRef.current && gpsActive) {
      // Update the hybrid distance which will be used for display
      setHybridDistance(hybridDistKm);
      // Note: The actual distance is managed by the WorkoutContext
    }
  }, [gpsActive, workoutState]);

  // Initialize step counter
  const { steps, distance: stepCounterDistance, hybridDistance: stepCounterHybridDistance } = useStepCounter({
    enabled: workoutState === 'active' && !isPausedRef.current && (settings.usePedometer ?? true),
    isRunning: true, // Assuming running
    userHeightCm: settings.userHeight || 170,
    onDistanceChange: handleStepDistanceUpdate,
    onHybridDistanceChange: handleHybridDistanceUpdate,
    gpsDistanceMeters: gpsActive ? distance * 1000 : 0, // Convert km to meters for GPS distance
    isGpsActive: gpsActive,
  });

  // Initialize audio cues hook
  useAudioCues({
    isTracking: isTrackingRef.current,
    isPausedRef: isPausedRef,
    currentPace,
    distance,
    // Add other required props based on useAudioCues interface
  });

  // Handle countdown timer
  const startCountdown = useCallback(() => {
    const countdownDuration = settings.countdownDuration || 3; // Default to 3 seconds if not set
    let currentCount = countdownDuration;
    
    // Set initial countdown value
    setCountdownValue(currentCount);
    setIsCountingDown(true);
    
    // Start the countdown
    const countdownInterval = setInterval(() => {
      currentCount--;
      
      if (currentCount > 0) {
        setCountdownValue(currentCount);
        // Add haptic feedback
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } else {
        // Countdown finished
        clearInterval(countdownInterval);
        setCountdownValue(null);
        setIsCountingDown(false);
        // Start the actual workout
        startWorkout();
      }
    }, 1000);
    
    // Cleanup interval on unmount
    return () => clearInterval(countdownInterval);
  }, [settings.countdownDuration, startWorkout]);
  
  // Update workout state refs when workoutState changes
  useEffect(() => {
    isTrackingRef.current = workoutState === 'active' || workoutState === 'paused';
    isPausedRef.current = workoutState === 'paused';
  }, [workoutState]);

  // Handle audio cues
  const handleAudioCue = useCallback((message: string) => {
    if (audioCueSettingsRef.current.enabled) {
      Speech.speak(message, {
        rate: 0.9,
        pitch: 1.0,
      });
    }
  }, []);

  // ... rest of the component code will go here ...

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Countdown overlay */}
      {isCountingDown && countdownValue !== null && (
        <View style={styles.countdownOverlay}>
          <Text style={styles.countdownText}>{countdownValue}</Text>
        </View>
      )}
      
      <HeaderSafeArea />
      
      {/* Header */}
      <View style={styles.headerTextContainer}>
        <Text style={styles.headerTitle}>{currentPlan?.name || 'Quick Run'}</Text>
        {currentPlan?.type && (
          <Text style={styles.headerSubtitle}>
            {formatRaceType(currentPlan.type)}
          </Text>
        )}
      </View>

      {/* Map View */}
      <View style={styles.mapContainer}>
        <WorkoutMapDisplay
          settings={settings}
          routeCoordinates={routeCoordinates}
          userPathCoordinates={userPathCoordinates}
          currentLocation={lastPosition}
          workoutState={workoutState}
        />
      </View>

      {/* Main Content */}
      <ScrollView style={styles.contentContainer}>
        {/* Workout Stats Grid */}
        <WorkoutStatsGrid 
          displayDistance={`${(distance / 1000).toFixed(2)} km`}
          displayDuration={formatDuration(duration)}
          displayPace={`${formatPace(currentPace)}/km`}
          displayAvgPace={`${formatPace(avgPace)}/km`}
          displayCalories={`${Math.round(estimatedCalories)}`}
          totalElevationGain={0} // TODO: Add elevation gain calculation if needed
          settings={settings}
        />

        {/* Coach Tips */}
        {currentCoachTip && (
          <CoachTipsDisplay 
            settings={settings}
            currentCoachTip={currentCoachTip}
            workoutState={workoutState}
          />
        )}

        {/* Next Turn Info */}
        {nextTurnInstruction && (
          <View style={styles.nextTurnContainer}>
            <Text style={styles.nextTurnText}>
              {nextTurnInstruction}{distanceToNextTurn ? ` in ${distanceToNextTurn.toFixed(2)} km` : ''}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Controls */}
      <View style={styles.controlsContainer}>
        <WorkoutControls
          workoutState={workoutState}
          countdownValue={countdownValue}
          initiateCountdown={startCountdown}
          pauseTracking={workoutState === 'paused' ? resumeWorkout : pauseWorkout}
          stopTracking={stopWorkout}
          currentRaceGoalName={currentPlan?.name}
          onAudioPress={() => setShowAudioSettings(true)}
          onPedometerPress={() => setShowPedometerModal(true)}
        />
      </View>

      {/* Audio Settings Modal */}
      <Modal
        visible={showAudioSettings}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAudioSettings(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Audio Cue Settings</Text>
              <TouchableOpacity 
                onPress={() => setShowAudioSettings(false)} 
                style={styles.closeButton}
                hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
              >
                <X size={24} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
            <AudioCueSettings
              currentSettings={audioCueSettingsRef.current}
              onSave={(newSettings: AudioCueSettingsData) => {
                audioCueSettingsRef.current = newSettings;
                // Save settings if needed
              }}
            />
          </View>
        </View>
      </Modal>

    {/* Pedometer Mode Modal */}
    <Modal
      visible={showPedometerModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowPedometerModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Pedometer Mode</Text>
            <TouchableOpacity 
              onPress={() => setShowPedometerModal(false)} 
              style={styles.closeButton}
              hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
            >
              <X size={24} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
          <PedometerTrackingMode
            isActive={workoutState === 'active' && !isPausedRef.current}
            gpsDistanceKm={distance}
            onStepDistanceUpdate={handleStepDistanceUpdate}
            onHybridDistanceUpdate={handleHybridDistanceUpdate}
            gpsActive={gpsActive}
            onGpsActiveChange={handleGpsActiveChange}
          />
        </View>
      </View>
    </Modal>
  </View>
  );
};

const styles = StyleSheet.create({
  countdownOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  countdownText: {
    fontSize: 120,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingBottom: 70, // Add padding to account for bottom tab bar
  },
  headerTextContainer: {
    paddingHorizontal: 24,
    paddingTop: 0, // Reduced from 16 to move content up
    paddingBottom: 12, // Slight bottom padding for spacing
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
  mapContainer: {
    height: '40%', // Slightly reduce map height
    backgroundColor: 'transparent',
  },
  contentContainer: {
    flex: 1,
    padding: 8,
    paddingTop: 0,
    paddingBottom: 70, // Add padding to account for controls
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1F2937', // Dark gray background
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingTop: 16,
    paddingBottom: 30,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#374151', // Slightly lighter gray for the divider
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    marginLeft: 24, // Balance the close button on the right
  },
  closeButton: {
    padding: 4,
    backgroundColor: '#374151',
    borderRadius: 20,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },

  controlsContainer: {
    position: 'absolute',
    bottom: 70, // Position above the bottom tab bar
    left: 16,
    right: 16,
    padding: 16,
    backgroundColor: 'transparent',
    zIndex: 10, // Ensure it's above other content
  },
  nextTurnContainer: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
  },
  nextTurnText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default WorkoutTrackerScreen;

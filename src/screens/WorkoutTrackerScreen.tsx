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
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { 
  Headphones, 
  Footprints, 
  Clock as ClockIcon, 
  Ruler, 
  Flame, 
  Edit2, 
  Calendar
} from 'lucide-react-native';
import BackgroundTimer from 'react-native-background-timer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useTheme } from '@react-navigation/native';
import { lightTheme, darkTheme } from '../theme/theme';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import { v4 as uuidv4 } from 'uuid';
import { useKeepAwake } from 'expo-keep-awake';
import DateTimePicker from '@react-native-community/datetimepicker';
// Context
import { useWorkout } from '../contexts/WorkoutContext';
// Types
import { TablesInsert } from '../types/supabase';
import { Split, WorkoutEntry, WORKOUT_HISTORY_KEY, Coordinate } from '../types/workoutTypes';
import { TrainingPlan } from '../types/trainingPlanTypes';
import { Route as RouteType, RoutePoint } from '../types/routeTypes';
import { AudioCueSettingsData } from '../types/audioTypes';
import { RootStackParamList } from '../types/navigationTypes';
import { ActivityType, isGpsActivity, ACTIVITY_TYPES, WORKOUT_TYPE_DISPLAY_NAMES as WORKOUT_DISPLAY_NAMES } from '../constants/workoutConstants';

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
import WorkoutTypeDropdown from '../components/WorkoutTypeDropdown';

// Hooks
import { useAudioCues } from '../hooks/useAudioCues';
import { useUserSettings } from '../hooks/useUserSettings';
import { useRoutes } from '../contexts/RouteContext';
import { useStepCounter } from '../hooks/useStepCounter';
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
  initialActivityType?: ActivityType; // Allow passing initial activity type from navigation
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

// Format pace based on user settings
const formatPaceForDisplay = (pace: number | null): string => {
  if (pace === null) return '--:--';
  // Convert pace to seconds per km or mile based on settings
  const paceInSeconds = pace;
  return formatPace(paceInSeconds);
};

// Calculate pace in min/km or min/mile based on settings
const calculatePace = (distance: number, duration: number): number | null => {
  if (distance <= 0 || duration <= 0) return null;
  const paceInSeconds = (duration / 60) / (distance / 1000); // Convert to min/km
  return paceInSeconds;
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

const WorkoutTrackerScreen: React.FC<WorkoutTrackerScreenProps> = ({ 
  route, 
  navigation, 
  onWorkoutComplete,
  initialActivityType = 'Run' // Default to Run if not specified
}) => {
  // Hooks
  const { settings, isLoadingSettings, updateAudioCueDefaults } = useUserSettings();
  const { saveRoute } = useRoutes();
  const { startWorkout, pauseWorkout, resumeWorkout, stopWorkout, currentWorkout } = useWorkout();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const currentTheme = theme.dark ? darkTheme : lightTheme;
  const { colors } = currentTheme;
  useKeepAwake();
  
  // Get route params
  const { routeToFollow: initialRoute, currentPlan } = route?.params || {};
  
  // State
  const [routeToFollow, setRouteToFollow] = useState<RouteType | null>(initialRoute || null);
  const [showRouteDetails, setShowRouteDetails] = useState(false);
  const [workoutState, setWorkoutState] = useState<WorkoutState>('idle');
  const [startTime, setStartTime] = useState<number | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<Coordinate[]>([]);
  const [userPathCoordinates, setUserPathCoordinates] = useState<Coordinate[]>([]);
  const [estimatedCalories, setEstimatedCalories] = useState(0);
  const [totalElevationGain, setTotalElevationGain] = useState(0);
  const [workoutNotes, setWorkoutNotes] = useState('');
  const [countdownValue, setCountdownValue] = useState(0);
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
  const [manualDistance, setManualDistance] = useState('');
  const [distance, setDistance] = useState(0);
  const [manualDuration, setManualDuration] = useState<number>(0);
  const [manualCalories, setManualCalories] = useState<number>(0);
  const [workoutStats, setWorkoutStats] = useState<any>(null);
  const [workoutDate, setWorkoutDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [notes, setNotes] = useState(''); // State for workout notes
  
  // Toggle date picker visibility
  const toggleDatePicker = useCallback((): void => {
    setShowDatePicker((prev: boolean) => !prev);
  }, []);
  
  // Handle date change from date picker
  const handleDateChange = useCallback((event: any, selectedDate?: Date): void => {
    const currentDate = selectedDate || workoutDate;
    setShowDatePicker(Platform.OS === 'ios'); // Keep picker open on iOS
    setWorkoutDate(currentDate);
  }, [workoutDate]);
  
  // Handle step distance update from pedometer
  const handleStepDistanceUpdate = useCallback((distanceInKm: number) => {
    setPedometerDistance(distanceInKm * 1000); // Convert km to meters
  }, []);
  
  // Handle hybrid distance update (combination of GPS and pedometer)
  const handleHybridDistanceUpdate = useCallback((distanceInKm: number) => {
    setHybridDistance(distanceInKm * 1000); // Convert km to meters
  }, []);
  
  // Handle GPS active state change
  const handleGpsActiveChange = useCallback((active: boolean) => {
    setGpsActive(active);
  }, []);
  
  // Handler for audio settings button press
  const handleAudioSettingsPress = useCallback(() => {
    setShowAudioSettings(true);
  }, []);
  
  // Handler for distance change in manual entry form
  const handleDistanceChange = (distance: string) => {
    setManualDistance(distance);
    // Parse the distance string to a number and update the distance state
    const distanceNum = parseFloat(distance) || 0;
    setDistance(distanceNum);
  };
  
  // Handler for calories change in manual entry form
  const handleCaloriesChange = (calories: string) => {
    // Parse the calories string to a number
    const caloriesNum = parseInt(calories, 10) || 0;
    setEstimatedCalories(caloriesNum);
  };
  
  // Format workout stats for display
  const formatStatsForDisplay = useCallback(() => {
    return {
      distance: distanceRef.current,
      duration: durationRef.current,
      pace: calculatePace(distanceRef.current, durationRef.current),
      calories: estimatedCalories,
      elevation: totalElevationGain,
      date: new Date()
    };
  }, [estimatedCalories, totalElevationGain]);
  
  // Handler for starting tracking
  const startTracking = useCallback(() => {
    setWorkoutState('active');
    isTrackingRef.current = true;
    isPausedRef.current = false;
    // Additional start logic here
  }, []);

  // Handler for pausing workout
  const pauseTracking = useCallback(() => {
    setWorkoutState('paused');
    isPausedRef.current = true;
    isTrackingRef.current = false;
    // Additional pause logic here
  }, []);
  
  // Handler for stopping workout
  const stopTracking = useCallback(() => {
    setWorkoutState('saving');
    isTrackingRef.current = false;
    isPausedRef.current = false;
    // Additional stop logic here
    // When done saving, transition to 'finished' state
    setTimeout(() => {
      setWorkoutState('finished');
    }, 1000);
  }, []);
  
  // Handler for initiating countdown
  const initiateCountdown = useCallback(() => {
    setWorkoutState('countdown');
    
    // Start countdown from 3
    let count = 3;
    setCountdownValue(count);
    
    const countdownInterval = setInterval(() => {
      count--;
      setCountdownValue(count);
      
      if (count <= 0) {
        clearInterval(countdownInterval);
        startTracking();
      }
    }, 1000);
    
    return () => clearInterval(countdownInterval);
  }, [startTracking]);

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
  // State for activity type and workout data
  const [activityType, setActivityType] = useState<ActivityType>(initialActivityType);
  const [isGpsBased, setIsGpsBased] = useState<boolean>(isGpsActivity(initialActivityType));
  
  // Derived state for workout tracking
  const isTracking = workoutState === 'active' || workoutState === 'paused';
  const isPaused = workoutState === 'paused';
  const isCountingDown = workoutState === 'countdown';



  // Render manual entry form for non-GPS activities
  const renderManualEntryForm = () => (
    <View style={styles.manualEntryContainer}>
      {/* Duration Picker */}
      <View style={styles.inputContainer}>
        <View style={styles.inputIcon}>
          <Clock size={20} color={currentTheme.colors.text.primary} />
        </View>
        <TextInput
          style={[styles.input, { color: currentTheme.colors.text.primary }]}
          placeholder="Duration (minutes)"
          placeholderTextColor={currentTheme.colors.text.secondary}
          keyboardType="numeric"
          value={manualDuration > 0 ? manualDuration.toString() : ''}
          onChangeText={(text) => setManualDuration(parseInt(text) || 0)}
        />
      </View>

      {/* Distance Input */}
      <View style={styles.inputContainer}>
        <View style={styles.inputIcon}>
          <Ruler size={20} color={currentTheme.colors.text.primary} />
        </View>
        <TextInput
          style={[styles.input, { color: currentTheme.colors.text.primary }]}
          placeholder="Distance (km)"
          placeholderTextColor={currentTheme.colors.text.secondary}
          keyboardType="numeric"
          value={manualDistance}
          onChangeText={handleDistanceChange}
        />
      </View>

      {/* Calories Input */}
      <View style={styles.inputContainer}>
        <View style={styles.inputIcon}>
          <Flame size={20} color={currentTheme.colors.text.primary} />
        </View>
        <TextInput
          style={[styles.input, { color: currentTheme.colors.text.primary }]}
          placeholder="Calories (optional)"
          placeholderTextColor={currentTheme.colors.text.secondary}
          keyboardType="numeric"
          value={manualCalories > 0 ? manualCalories.toString() : ''}
          onChangeText={(text) => setManualCalories(parseInt(text) || 0)}
        />
      </View>

      {/* Date Picker */}
      <TouchableOpacity 
        style={styles.inputContainer}
        onPress={toggleDatePicker}
      >
        <View style={styles.inputIcon}>
          <Calendar size={20} color={typeof currentTheme.colors.text === 'string' ? currentTheme.colors.text : currentTheme.colors.text.primary} />
        </View>
        <Text style={[styles.input, { color: typeof currentTheme.colors.text === 'string' ? currentTheme.colors.text : currentTheme.colors.text.primary }]}>
          {workoutDate.toLocaleDateString()}
        </Text>
      </TouchableOpacity>

      {showDatePicker && (
        <DateTimePicker
          value={workoutDate}
          mode="date"
          display="default"
          onChange={handleDateChange}
          maximumDate={new Date()}
        />
      )}
    </View>
  );

  // Render GPS-based workout UI
  const renderGpsWorkoutUI = () => (
    <View style={{ flex: 1 }}>
      {/* Map and Stats Section */}
      <View style={styles.mapContainer}>
        <WorkoutMapDisplay 
          settings={settings}
          routeCoordinates={routeToFollow?.waypoints || []}
          userPathCoordinates={userPathCoordinates}
          currentLocation={lastPosition}
          workoutState={workoutState}
        />
      </View>
      
      {/* Workout Stats Grid */}
      <WorkoutStatsGrid
        displayDistance={formatDistanceDisplay(distanceRef.current, settings.useMiles ? 'miles' : 'km')}
        displayDuration={formatDurationDisplay(durationRef.current)}
        displayPace={formatPaceForDisplay(calculatePace(distanceRef.current, durationRef.current))}
        displayAvgPace={formatPaceForDisplay(calculatePace(distanceRef.current, durationRef.current))}
        displayCalories={Math.round(estimatedCalories).toString()}
        totalElevationGain={totalElevationGain}
        settings={settings}
      />
      
      <View style={styles.controlsContainer}>
        <WorkoutControls 
          workoutState={workoutState}
          countdownValue={countdownValue}
          initiateCountdown={initiateCountdown}
          pauseTracking={pauseTracking}
          stopTracking={stopTracking}
          currentRaceGoalName={currentPlan?.name}
          onAudioPress={handleAudioSettingsPress}
          onPedometerPress={() => setShowPedometerModal(true)}
        />
      </View>
    </View>
  );

  useEffect(() => {
    setWorkoutStats(formatStatsForDisplay());
  }, [formatStatsForDisplay]);

  // Use the getStyles function defined at the end of the file
  const styles = getStyles(currentTheme);

  return (
    <View style={styles.container}>
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
              <Text style={styles.modalTitle}>Pedometer Settings</Text>
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
              gpsDistanceKm={distanceRef.current / 1000}
              onStepDistanceUpdate={handleStepDistanceUpdate}
              onHybridDistanceUpdate={handleHybridDistanceUpdate}
              gpsActive={gpsActive}
              onGpsActiveChange={handleGpsActiveChange}
            />
          </View>
        </View>
      </Modal>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
      >
        <HeaderSafeArea />
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Activity Type Selector */}
          <View style={styles.workoutTypeContainer}>
            <Text style={styles.workoutTypeLabel}>Activity Type</Text>
            <WorkoutTypeDropdown
              selectedActivity={activityType}
              onSelect={setActivityType}
              disabled={isTrackingRef.current || isPausedRef.current}
            />
          </View>

          {/* Dynamic Content Based on Activity Type */}
          {isGpsBased ? renderGpsWorkoutUI() : renderManualEntryForm()}

          {/* Notes Section */}
          <WorkoutNotesInput 
            workoutState={workoutState}
            workoutNotes={notes}
            setWorkoutNotes={setNotes}
            style={{ color: typeof currentTheme.colors.text === 'string' ? currentTheme.colors.text : currentTheme.colors.text.primary }}
          />
        </ScrollView>

      </KeyboardAvoidingView>
    </View>
  );
};

// Get styles based on current theme
const getStyles = (currentTheme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: currentTheme.colors.background,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: currentTheme.colors.text.primary,
    textAlign: 'center',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: currentTheme.colors.text.secondary,
    textAlign: 'center',
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerButton: {
    marginLeft: 16,
  },
  headerTextContainer: {
    paddingHorizontal: 24,
    paddingTop: 0,
    paddingBottom: 12,
    alignItems: 'center',
  },
  mapContainer: {
    height: '40%',
    backgroundColor: 'transparent',
    marginBottom: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  controlsContainer: {
    paddingTop: 16,
    paddingBottom: 16,
  },
  workoutTypeContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  workoutTypeLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: currentTheme.colors.text.primary,
  },
  manualEntryContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  contentContainer: {
    flex: 1,
    padding: 8,
    paddingTop: 0,
    paddingBottom: 70,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: currentTheme.colors.background.secondary,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: currentTheme.colors.border.primary,
  },
  inputIcon: {
    marginRight: 12,
    color: currentTheme.colors.text.primary,
  },
  input: {
    flex: 1,
    height: 48,
    color: currentTheme.colors.text.primary,
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: currentTheme.colors.background.modal,
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

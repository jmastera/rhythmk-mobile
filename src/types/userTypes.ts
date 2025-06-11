// User settings and preferences types

import { AudioCueSettingsData } from './audioTypes';

export type DisplayUnit = 'km' | 'miles';

export interface RaceGoalData {
  type: string; // e.g., '5k', '10k', 'Half Marathon', 'Full Marathon', 'Custom Distance', 'Custom Time'
  distance?: number; // in km or miles, depending on unit preference
  time?: string; // hh:mm:ss or mm:ss
  // Potentially add targetPace here too if it's part of the goal itself
}

export interface RaceGoal {
  type: '5k' | '10k' | 'half_marathon' | 'marathon' | 'custom';
  targetTime?: number; // In seconds
  targetDate?: string; // ISO string
}

export interface UserSettings {
  // User information
  userId?: string;
  displayName?: string;
  email?: string;
  birthYear?: number;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  
  // Fitness information
  fitnessLevel?: 'beginner' | 'intermediate' | 'advanced';
  raceGoal?: RaceGoalData;
  preferredRunningDays?: number[]; // 0-6 for days of week
  
  // Measurements
  userWeight?: number; // In kg
  userHeight?: number; // In cm
  userHeightFeet?: number; // For display only when using imperial units
  userHeightInches?: number; // For display only when using imperial units
  
  // Units
  displayUnit: DisplayUnit; // 'km' or 'mi'
  heightUnit: 'cm' | 'ft-in';
  weightUnit: 'kg' | 'lb';
  
  // App settings
  darkMode?: boolean;
  audioPrompts?: boolean;
  notificationsEnabled?: boolean;
  showMap?: boolean;
  showCoachTips?: boolean;
  showCalories?: boolean; // Added for WorkoutStatsGrid
  showElevation?: boolean; // Added for WorkoutStatsGrid
  countdownDuration?: number; // Added for WorkoutTracker countdown
  usePedometer?: boolean; // Added for PedometerModeDisplay and WorkoutTracker
  
  // Audio settings
  audioCueDefaults: AudioCueSettingsData;
  
  // Debug settings
  showDebugInfo?: boolean;
  renderMapsDebug?: boolean;
  
  // Workout card display settings
  workoutCardSettings?: {
    distance: boolean;
    duration: boolean;
    pace: boolean;
    steps: boolean;
    calories: boolean;
    stride: boolean;
    cadence: boolean;
    speed: boolean;
    elevationGain: boolean;
    caloriesPerKm: boolean;
  };
}

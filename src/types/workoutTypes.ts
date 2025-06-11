// Workout tracking related types

export const WORKOUT_HISTORY_KEY = 'rhythmk_workout_history';

export type WorkoutState = 
  | 'idle' 
  | 'countdown' 
  | 'tracking' 
  | 'paused' 
  | 'saving' 
  | 'finished';

export interface Coordinate {
  latitude: number;
  longitude: number;
  altitude?: number | null;
  timestamp?: number;
}

export interface TrackingPosition {
  coords: {
    latitude: number;
    longitude: number;
    altitude: number | null;
    accuracy: number;
    altitudeAccuracy: number | null;
    heading: number | null;
    speed: number | null;
  };
  timestamp: number;
}

export interface Split {
  splitNumber: number;
  distance: number; // Distance of this split in meters
  duration: number; // Duration of this split in seconds
  pace: string; // Formatted pace (e.g. "5:30")
}

export interface WorkoutEntry {
  id: string; // Unique ID, e.g., timestamp of completion or a UUID
  date: string; // ISO string for the date of the workout
  startTime: string; // ISO string for when the workout started
  endTime?: string; // ISO string for when the workout ended
  duration: number; // in seconds
  distance: number; // in meters
  avgPace: number | undefined; // decimal minutes per kilometer
  coordinates: Array<{ latitude: number; longitude: number; altitude?: number | null; timestamp?: number }>; // Added optional altitude and timestamp to coordinates
  user_id?: string; // ID of the user who performed the workout
  created_at?: string; // Timestamp of when the record was created in the database
  updated_at?: string; // Timestamp of when the record was last updated in the database
  
  // New detailed fields
  planName?: string; // Optional: name of the training plan if applicable (e.g., '5K Run')
  planId?: string; // Optional: ID of the training plan
  type?: string; // e.g., 'Run', 'Cycle', 'Walk', from TrainingPlan or default
  notes?: string; // User-added notes for the workout
  calories?: number; // Estimated calories burned
  avgHeartRate?: number; // Average heart rate in BPM
  totalElevationGain?: number; // in meters
  totalElevationLoss?: number; // in meters
  splits?: Split[]; // Array of split data
  trackingMode?: 'gps' | 'pedometer' | 'hybrid'; // Added for step counter integration
  steps?: number; // Total steps recorded during the workout
}

// Card types that can be toggled
export type WorkoutCardType = 'distance' | 'duration' | 'pace' | 'steps' | 'calories' | 'stride' | 'cadence' | 'speed' | 'elevationGain' | 'caloriesPerKm';

export interface WorkoutCardSettings {
  [key: string]: boolean;
}

// Tracking mode options
export type TrackingMode = 'gps' | 'pedometer' | 'hybrid';

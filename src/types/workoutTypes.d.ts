// Type declarations for workoutTypes.ts
export const WORKOUT_HISTORY_KEY = 'rhythmk_workout_history';

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
  id: string;
  date: string; // ISO string
  duration: number; // In seconds
  distance: number; // In meters
  avgPace?: number; // In decimal minutes per km
  coordinates: Coordinate[];
  planName?: string; // Type of plan or race goal
  totalElevationGain?: number; // In meters
  totalElevationLoss?: number; // In meters
  notes?: string; // User notes
  calories?: number; // Estimated calories burned
  avgHeartRate?: number; // Avg heart rate if available
  splits?: Split[]; // Array of split data
  trackingMode?: 'gps' | 'pedometer' | 'hybrid'; // Added for step counter integration
  steps?: number; // Total steps recorded during the workout
}

// Tracking mode options
export type TrackingMode = 'gps' | 'pedometer' | 'hybrid';

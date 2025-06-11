export interface Split {
  splitNumber: number;
  distance: number; // in meters for consistency with how distance is often tracked per split
  duration: number; // in seconds
  pace: string; // formatted as "MM:SS" min/km for this split
}

export interface WorkoutEntry {
  id: string; // Unique ID, e.g., timestamp of completion or a UUID
  date: string; // ISO string for the date of the workout
  duration: number; // in seconds
  distance: number; // in meters (Note: This was previously documented as km, changing to meters for consistency with coordinates and split distance)
  avgPace: number | undefined; // decimal minutes per kilometer
  coordinates: Array<{ latitude: number; longitude: number; altitude?: number | null; timestamp?: number }>; // Added optional altitude and timestamp to coordinates

  // New detailed fields
  planName?: string; // Optional: name of the training plan if applicable (e.g., '5K Run')
  notes?: string; // User-added notes for the workout
  calories?: number; // Estimated calories burned
  avgHeartRate?: number; // Average heart rate in BPM
  totalElevationGain?: number; // in meters
  totalElevationLoss?: number; // in meters
  splits?: Split[]; // Array of split data
  steps?: number; // Total steps recorded during the workout
}

export const WORKOUT_HISTORY_KEY = '@workoutHistory';

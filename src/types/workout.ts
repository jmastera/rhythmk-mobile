export interface Coordinate {
  latitude: number;
  longitude: number;
  timestamp: number; // Unix timestamp (milliseconds)
  altitude?: number | null; // Optional: In meters
  accuracy?: number | null; // Optional: In meters
  altitudeAccuracy?: number | null; // Optional: In meters
  heading?: number | null; // Optional: Degrees from true north
  speed?: number | null; // Optional: Meters per second
}

export interface Split {
  splitNumber: number;
  distance: number; // meters
  duration: number; // seconds
  pace: string; // The web version had '5:23/km', but number (seconds per km) is better for calculations. Let's stick to string for now to match web, can refine later.
  avgHeartRate?: number;
  elevationGain?: number;
  elevationLoss?: number;
}

export interface Workout {
  id: string;
  userId: string;
  date: string; // ISO 8601 date string
  type: string; // e.g., 'Easy Run', 'Tempo', 'Intervals', 'Long Run', 'Recovery'
  distance: number; // meters
  duration: number; // seconds
  pace: string; // e.g., '5:30/km'
  avgHeartRate?: number;
  calories?: number;
  notes?: string;
  routeCoordinates?: Coordinate[];
  splits?: Split[];
  totalElevationGain?: number;
  totalElevationLoss?: number;
  // Potentially add fields from the training plan context if linked
  plannedDistance?: number;
  plannedDuration?: number;
  workoutPlanId?: string;
}

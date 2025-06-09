// Type declarations for useLocation.ts
import { TrackingPosition } from '../types/workoutTypes';

export interface UseLocationOptions {
  onLocationChange?: (position: TrackingPosition) => void;
  accuracy?: 'high' | 'balanced' | 'low' | 'passive';
}

export interface UseLocationResult {
  location: TrackingPosition | null;
  startTracking: () => Promise<boolean>;
  stopTracking: () => void;
  hasLocationPermission: boolean;
  requestPermission: () => Promise<boolean>;
  locationErrorMsg: string | null;
}

export function useLocation(options?: UseLocationOptions): UseLocationResult;

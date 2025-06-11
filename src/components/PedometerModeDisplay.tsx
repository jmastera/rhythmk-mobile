import React from 'react';
import PedometerTrackingMode from './PedometerTrackingMode'; // Assuming PedometerTrackingModeProps is exported or define props inline
import { UserSettings } from '../types/userTypes'; // Adjust path if necessary

// Re-define or import PedometerTrackingModeProps if not directly exportable
// For now, let's define the props this component expects, mirroring PedometerTrackingMode's usage
interface PedometerModeDisplayProps {
  isActive: boolean;
  gpsDistanceKm: number;
  onStepDistanceUpdate: (distance: number) => void;
  onHybridDistanceUpdate: (distance: number) => void;
  gpsActive: boolean;
  onGpsActiveChange: (isActive: boolean) => void;
  usePedometer: boolean; // Derived from settings.usePedometer ?? true
  // Add any other props that PedometerTrackingMode might need if passed from WorkoutTracker
}

const PedometerModeDisplay: React.FC<PedometerModeDisplayProps> = (props) => {
  if (!props.usePedometer) {
    return null; // Don't render if pedometer is not set to be used
  }

  return <PedometerTrackingMode {...props} />;
};

export default PedometerModeDisplay;

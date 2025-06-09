import { useState, useEffect, useRef } from 'react';
import { StepCounter, estimateStrideLength } from '../utils/StepCounter';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Constants
const STRIDE_LENGTH_KEY = 'rhythmk_stride_length';
const DEFAULT_HEIGHT_CM = 170; // Default height in cm

interface UseStepCounterOptions {
  enabled: boolean;
  isRunning?: boolean;
  userHeightCm?: number;
  onDistanceChange?: (distanceMeters: number) => void;
  // For hybrid distance tracking
  onHybridDistanceChange?: (distanceMeters: number) => void;
  // For GPS calibration
  gpsDistanceMeters?: number;
  isGpsActive?: boolean;
}

export const useStepCounter = ({
  enabled,
  isRunning = true,
  userHeightCm,
  onDistanceChange,
  gpsDistanceMeters = 0,
  isGpsActive = false,
  onHybridDistanceChange
}: UseStepCounterOptions) => {
  const [steps, setSteps] = useState<number>(0);
  const [distance, setDistance] = useState<number>(0); // distance in meters
  const [hybridDistance, setHybridDistance] = useState<number>(0); // combined GPS+step distance
  const [calibrationData, setCalibrationData] = useState<{
    lastGpsDistance: number;
    lastStepDistance: number;
    calibrationFactor: number;
  }>({ 
    lastGpsDistance: 0, 
    lastStepDistance: 0, 
    calibrationFactor: 1.0
  });
  const [strideLength, setStrideLength] = useState<number | null>(null);
  const [isCalibrated, setIsCalibrated] = useState<boolean>(false);
  const [isActive, setIsActive] = useState<boolean>(false);
  
  const stepCounterRef = useRef<StepCounter | null>(null);
  
  // Load saved stride length on mount
  useEffect(() => {
    const loadStrideLength = async () => {
      try {
        const savedStrideLength = await AsyncStorage.getItem(STRIDE_LENGTH_KEY);
        
        if (savedStrideLength) {
          setStrideLength(parseFloat(savedStrideLength));
          setIsCalibrated(true);
        } else {
          // Use estimate if no saved value
          const height = userHeightCm || DEFAULT_HEIGHT_CM;
          setStrideLength(estimateStrideLength(height, isRunning));
          setIsCalibrated(false);
        }
      } catch (error) {
        console.error('Error loading stride length:', error);
        // Fallback to estimated stride length
        const height = userHeightCm || DEFAULT_HEIGHT_CM;
        setStrideLength(estimateStrideLength(height, isRunning));
        setIsCalibrated(false);
      }
    };
    
    loadStrideLength();
    
    // Cleanup on unmount
    return () => {
      if (stepCounterRef.current) {
        stepCounterRef.current.stop();
      }
    };
  }, [userHeightCm, isRunning]);
  
  // Auto-calibrate when both GPS and step counter are active
  useEffect(() => {
    if (!isGpsActive || !isActive || steps === 0) return;
    
    // Only calibrate when we have enough GPS distance to get meaningful data
    const MIN_CALIBRATION_DISTANCE = 200; // 200 meters
    
    // Only update calibration when we've accumulated significant new distance
    const newGpsDistance = gpsDistanceMeters - calibrationData.lastGpsDistance;
    const newStepDistance = distance - calibrationData.lastStepDistance;
    
    if (newGpsDistance > MIN_CALIBRATION_DISTANCE && newStepDistance > 0) {
      // Calculate new calibration factor
      const newCalibrationFactor = newGpsDistance / newStepDistance;
      
      // Only accept reasonable calibration factors (0.7-1.3)
      if (newCalibrationFactor > 0.7 && newCalibrationFactor < 1.3) {
        // Update with weighted average (favor recent calibration slightly)
        const updatedFactor = calibrationData.calibrationFactor * 0.7 + newCalibrationFactor * 0.3;
        
        console.log(`Auto-calibration: GPS=${newGpsDistance.toFixed(1)}m, Steps=${newStepDistance.toFixed(1)}m, Factor=${updatedFactor.toFixed(3)}`);
        
        setCalibrationData({
          lastGpsDistance: gpsDistanceMeters,
          lastStepDistance: distance,
          calibrationFactor: updatedFactor
        });
      }
    }
    
    // Calculate hybrid distance
    let newHybridDistance = 0;
    
    if (isGpsActive) {
      // When GPS is active, use a weighted blend
      // Base weight on GPS quality (simplified here - could use actual accuracy)
      const gpsWeight = 0.7; // Assume GPS is 70% weight
      const stepWeight = 0.3; // Steps are 30% weight
      
      const calibratedStepDistance = distance * calibrationData.calibrationFactor;
      newHybridDistance = (gpsDistanceMeters * gpsWeight) + (calibratedStepDistance * stepWeight);
    } else {
      // When GPS is not active, use calibrated step distance
      newHybridDistance = distance * calibrationData.calibrationFactor;
    }
    
    console.log(`🔄 Hybrid distance calculated: ${newHybridDistance.toFixed(1)}m (steps=${distance.toFixed(1)}m, gps=${gpsDistanceMeters.toFixed(1)}m, factor=${calibrationData.calibrationFactor.toFixed(2)})`);
    
    setHybridDistance(newHybridDistance);
    
    // Call the hybrid distance change callback if provided
    if (onHybridDistanceChange) {
      onHybridDistanceChange(newHybridDistance);
    }
  }, [isGpsActive, gpsDistanceMeters, distance, isActive, steps, calibrationData, onHybridDistanceChange]);

  // Start/stop step counter when enabled changes
  useEffect(() => {
    if (enabled && strideLength && !stepCounterRef.current) {
      // Start step counter
      stepCounterRef.current = new StepCounter({
        strideLength: strideLength,
        onStep: (newSteps, newDistance) => {
          setSteps(newSteps);
          setDistance(newDistance);
          
          if (onDistanceChange) {
            onDistanceChange(newDistance);
          }
        }
      });
      setIsActive(true);
    } else if (!enabled && stepCounterRef.current) {
      // Stop step counter
      stepCounterRef.current.stop();
      stepCounterRef.current = null;
      setIsActive(false);
    }
  }, [enabled, strideLength, onDistanceChange]);
  
  // Calibrate stride length with a known distance
  const calibrateStride = async (knownDistanceMeters: number) => {
    if (steps > 0) {
      const newStrideLength = knownDistanceMeters / steps;
      
      // Save new stride length
      try {
        await AsyncStorage.setItem(STRIDE_LENGTH_KEY, newStrideLength.toString());
        setStrideLength(newStrideLength);
        setIsCalibrated(true);
        
        // Update current distance based on new stride length
        setDistance(steps * newStrideLength);
        return true;
      } catch (error) {
        console.error('Error saving stride length:', error);
        return false;
      }
    }
    return false;
  };
  
  // Reset step counter
  const resetCounter = () => {
    if (stepCounterRef.current) {
      stepCounterRef.current.reset();
      setSteps(0);
      setDistance(0);
    }
  };
  
  return {
    steps,
    distance, // raw step-based distance in meters
    distanceKm: distance / 1000, // convenience conversion to km
    hybridDistance, // combined/calibrated distance in meters
    hybridDistanceKm: hybridDistance / 1000, // combined distance in km
    calibrationFactor: calibrationData.calibrationFactor,
    isActive,
    isCalibrated,
    resetCounter,
    calibrateStride,
    // Expose the enabled state management
    enabled: isActive,
    setEnabled: (value: boolean) => {
      // This will ensure the useEffect that manages step counter responds to this
      if (value) {
        setIsActive(true);
      } else {
        setIsActive(false);
      }
    }
  };
};

import React, { createContext, useContext, useReducer, useCallback, useEffect, useRef } from 'react';
import { Workout, WorkoutState, TrackingPosition } from '../types/workoutTypes';
import { useLocationTracking } from '../hooks/useLocationTracking';
import { haversine } from '../utils/geolocationUtils';

type WorkoutContextType = {
  startWorkout: () => void;
  pauseWorkout: () => void;
  resumeWorkout: () => void;
  stopWorkout: () => void;
  currentWorkout: Workout | null;
  workoutState: WorkoutState;
  distance: number;
  duration: number;
  avgPace: number | null;
  currentPace: number | null;
  elevationGain: number;
  caloriesBurned: number;
  heartRate: number | null;
  steps: number;
};

const WorkoutContext = createContext<WorkoutContextType | undefined>(undefined);

type WorkoutAction =
  | { type: 'START_WORKOUT' }
  | { type: 'PAUSE_WORKOUT' }
  | { type: 'RESUME_WORKOUT' }
  | { type: 'STOP_WORKOUT' }
  | { type: 'ADD_POSITION'; payload: { latitude: number; longitude: number; altitude: number | null } }
  | { type: 'UPDATE_HEART_RATE'; payload: number }
  | { type: 'INCREMENT_STEPS' };

const workoutReducer = (state: any, action: WorkoutAction) => {
  switch (action.type) {
    case 'START_WORKOUT':
      return {
        ...state,
        workoutState: 'active',
        startTime: Date.now(),
        pausedTime: null,
        positions: [],
        distance: 0,
        duration: 0,
        avgPace: null,
        currentPace: null,
        elevationGain: 0,
        caloriesBurned: 0,
        steps: 0,
      };
    case 'PAUSE_WORKOUT':
      return {
        ...state,
        workoutState: 'paused',
        pausedTime: Date.now(),
      };
    case 'RESUME_WORKOUT':
      return {
        ...state,
        workoutState: 'active',
        startTime: Date.now() - (state.pausedTime - state.startTime),
        pausedTime: null,
      };
    case 'STOP_WORKOUT':
      return {
        ...state,
        workoutState: 'idle',
        endTime: Date.now(),
      };
    case 'ADD_POSITION':
      const { latitude, longitude, altitude } = action.payload;
      const newPositions = [...state.positions, { latitude, longitude, altitude, timestamp: Date.now() }];
      
      // Calculate distance
      let newDistance = state.distance;
      if (state.positions.length > 0) {
        const lastPos = state.positions[state.positions.length - 1];
        const segmentDistance = haversine(
          lastPos.latitude,
          lastPos.longitude,
          latitude,
          longitude
        );
        newDistance = state.distance + segmentDistance;
      }

      // Calculate elevation gain
      let newElevationGain = state.elevationGain;
      if (altitude !== null && state.positions.length > 0) {
        const lastAlt = state.positions[state.positions.length - 1].altitude;
        if (lastAlt !== null && altitude > lastAlt) {
          newElevationGain += altitude - lastAlt;
        }
      }

      // Calculate current pace (in seconds per km)
      let currentPace = null;
      if (newPositions.length > 1) {
        const lastPos = newPositions[newPositions.length - 1];
        const timeDiff = (lastPos.timestamp - newPositions[0].timestamp) / 1000; // in seconds
        if (timeDiff > 0 && newDistance > 0) {
          currentPace = (timeDiff / 60) / (newDistance / 1000); // min/km
        }
      }

      return {
        ...state,
        positions: newPositions,
        distance: newDistance,
        duration: (Date.now() - state.startTime) / 1000, // in seconds
        avgPace: newDistance > 0 ? ((Date.now() - state.startTime) / 60000) / (newDistance / 1000) : null, // min/km
        currentPace,
        elevationGain: newElevationGain,
      };
    case 'UPDATE_HEART_RATE':
      return {
        ...state,
        heartRate: action.payload,
      };
    case 'INCREMENT_STEPS':
      return {
        ...state,
        steps: state.steps + 1,
      };
    default:
      return state;
  }
};

export const WorkoutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(workoutReducer, {
    workoutState: 'idle' as WorkoutState,
    startTime: 0,
    pausedTime: null as number | null,
    endTime: 0,
    positions: [] as Array<{ latitude: number; longitude: number; altitude: number | null; timestamp: number }>,
    distance: 0,
    duration: 0,
    avgPace: null as number | null,
    currentPace: null as number | null,
    elevationGain: 0,
    caloriesBurned: 0,
    heartRate: null as number | null,
    steps: 0,
  });

  const { workoutState, startTime, pausedTime, positions, distance, duration, avgPace, currentPace, elevationGain, caloriesBurned, heartRate, steps } = state;
  const handleLocationUpdate = useCallback((newLocation: TrackingPosition) => {
    if (workoutState === 'active' && newLocation) {
      dispatch({
        type: 'ADD_POSITION',
        payload: {
          latitude: newLocation.coords.latitude,
          longitude: newLocation.coords.longitude,
          altitude: newLocation.coords.altitude,
        },
      });
    }
  }, [workoutState]);

  const { location, errorMsg, hasPermission } = useLocationTracking({
    enabled: workoutState === 'active',
    distanceInterval: 5, // meters
    timeInterval: 3000, // milliseconds
    onLocationUpdate: handleLocationUpdate,
  });
  const positionUpdateInterval = useRef<NodeJS.Timeout | null>(null);

  // Update position when location changes
  useEffect(() => {
    if (workoutState === 'active' && location) {
      dispatch({
        type: 'ADD_POSITION',
        payload: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          altitude: location.coords.altitude || null,
        },
      });
    }
  }, [location, workoutState]);

  // Log any location errors
  useEffect(() => {
    if (errorMsg) {
      console.error('Location error:', errorMsg);
    }
  }, [errorMsg]);

  // Update duration every second when workout is active
  useEffect(() => {
    if (workoutState === 'active') {
      positionUpdateInterval.current = setInterval(() => {
        dispatch({
          type: 'ADD_POSITION',
          payload: positions.length > 0 
            ? positions[positions.length - 1] 
            : { latitude: 0, longitude: 0, altitude: null },
        });
      }, 1000);
    }

    return () => {
      if (positionUpdateInterval.current) {
        clearInterval(positionUpdateInterval.current);
      }
    };
  }, [workoutState, positions]);

  const startWorkout = useCallback(() => {
    dispatch({ type: 'START_WORKOUT' });
  }, []);

  const pauseWorkout = useCallback(() => {
    dispatch({ type: 'PAUSE_WORKOUT' });
  }, []);

  const resumeWorkout = useCallback(() => {
    dispatch({ type: 'RESUME_WORKOUT' });
  }, []);

  const stopWorkout = useCallback(() => {
    dispatch({ type: 'STOP_WORKOUT' });
  }, []);

  // Calculate calories burned (simplified formula)
  const weight = 70; // kg (should come from user settings)
  const caloriesPerMinute = 0.1 * weight * (heartRate ? heartRate / 60 : 1);
  const totalCaloriesBurned = Math.round(caloriesPerMinute * (duration / 60));

  const value = {
    startWorkout,
    pauseWorkout,
    resumeWorkout,
    stopWorkout,
    currentWorkout: {
      id: 'current',
      startTime,
      endTime: 0,
      duration,
      distance,
      avgPace,
      currentPace,
      elevationGain,
      caloriesBurned: totalCaloriesBurned,
      heartRate,
      steps,
      positions,
    },
    workoutState,
    distance,
    duration,
    avgPace,
    currentPace,
    elevationGain,
    caloriesBurned: totalCaloriesBurned,
    heartRate,
    steps,
  };

  return (
    <WorkoutContext.Provider value={value}>
      {children}
    </WorkoutContext.Provider>
  );
};

export const useWorkout = (): WorkoutContextType => {
  const context = useContext(WorkoutContext);
  if (context === undefined) {
    throw new Error('useWorkout must be used within a WorkoutProvider');
  }
  return context;
};

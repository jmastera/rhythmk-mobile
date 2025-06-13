import { useState, useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import { Coordinate, TrackingPosition } from '../types/workoutTypes';

interface UseLocationOptions {
  enabled: boolean;
  distanceInterval?: number;
  timeInterval?: number;
  onLocationUpdate?: (location: TrackingPosition) => void;
}

export const useLocationTracking = ({
  enabled,
  distanceInterval = 5, // meters
  timeInterval = 3000, // milliseconds
  onLocationUpdate
}: UseLocationOptions) => {
  const [location, setLocation] = useState<TrackingPosition | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const subscriberRef = useRef<Location.LocationSubscription | null>(null);

  // Request permissions and setup location tracking
  useEffect(() => {
    let isMounted = true;

    const setupLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        
        if (isMounted) {
          setHasPermission(status === 'granted');
        }
        
        if (status !== 'granted') {
          if (isMounted) {
            setErrorMsg('Permission to access location was denied');
          }
          return;
        }

        // Configure accuracy
        // setAccuracyAsync is deprecated, using requestPermissionsAsync with higher accuracy instead
        await Location.requestForegroundPermissionsAsync();
        
      } catch (error) {
        if (isMounted) {
          setErrorMsg('Error requesting location permissions');
          console.error('Permission error:', error);
        }
      }
    };

    setupLocation();

    return () => {
      isMounted = false;
    };
  }, []);

  // Subscribe/unsubscribe to location updates based on enabled state
  useEffect(() => {
    let isMounted = true;

    const startLocationTracking = async () => {
      if (!hasPermission) return;

      try {
        // Stop any existing subscription
        if (subscriberRef.current) {
          subscriberRef.current.remove();
          subscriberRef.current = null;
        }

        // Start new subscription if enabled
        if (enabled) {
          const subscription = await Location.watchPositionAsync(
            {
              accuracy: Location.Accuracy.BestForNavigation,
              distanceInterval,
              timeInterval,
            },
            (newLocation) => {
              if (!isMounted) return;

              const newTrackingPosition: TrackingPosition = {
                timestamp: new Date().getTime(),
                coords: {
                  latitude: newLocation.coords.latitude,
                  longitude: newLocation.coords.longitude,
                  altitude: newLocation.coords.altitude || null,
                  speed: newLocation.coords.speed || null,
                  accuracy: newLocation.coords.accuracy || 0, // Accuracy cannot be null, default to 0
                  altitudeAccuracy: newLocation.coords.altitudeAccuracy || null,
                  heading: newLocation.coords.heading || null,
                }
              };

              setLocation(newTrackingPosition);
              
              if (onLocationUpdate) {
                onLocationUpdate(newTrackingPosition);
              }
            }
          );

          subscriberRef.current = subscription;
        }
      } catch (error) {
        if (isMounted) {
          setErrorMsg('Error tracking location');
          console.error('Location tracking error:', error);
        }
      }
    };

    startLocationTracking();

    // Cleanup on unmount or when enabled changes
    return () => {
      isMounted = false;
      if (subscriberRef.current) {
        subscriberRef.current.remove();
        subscriberRef.current = null;
      }
    };
  }, [enabled, hasPermission, distanceInterval, timeInterval, onLocationUpdate]);

  return {
    location,
    errorMsg,
    hasPermission,
    subscriberRef
  };
};

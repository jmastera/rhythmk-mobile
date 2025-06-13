import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, Text, Platform, Alert } from 'react-native';
import MapView, { Polyline, Marker, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { UserSettings } from '../types/userTypes';
import { Coordinate, WorkoutState } from '../types/workoutTypes';

interface WorkoutMapDisplayProps {
  settings: UserSettings;
  routeCoordinates: Coordinate[];  // Predefined route (orange)
  userPathCoordinates: Coordinate[]; // User's actual path (blue)
  currentLocation: Location.LocationObject | null;
  workoutState: WorkoutState;
}

const WorkoutMapDisplay: React.FC<WorkoutMapDisplayProps> = ({
  settings,
  routeCoordinates,
  userPathCoordinates,
  currentLocation,
  workoutState
}) => {
  const [mapReady, setMapReady] = useState(false);
  const [region, setRegion] = useState<Region | null>(null);
  const [locationPermission, setLocationPermission] = useState<boolean | null>(null);

  // Request location permissions and get current location
  const getLocation = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationPermission(false);
        Alert.alert('Permission Denied', 'Location permission is required to show your current location on the map.');
        return;
      }
      
      setLocationPermission(true);
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
      });
      
      const newRegion = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      };
      setRegion(newRegion);
    } catch (error) {
      console.error('Error getting location:', error);
      setLocationPermission(false);
    }
  }, []);

  // Get location when component mounts
  useEffect(() => {
    getLocation();
  }, [getLocation]);

  // Update region when current location changes from parent
  useEffect(() => {
    if (currentLocation) {
      const newRegion = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      };
      setRegion(newRegion);
    }
  }, [currentLocation]);

  const handleMapReady = () => {
    setMapReady(true);
  };
  // Default region (only used as fallback)
  const defaultRegion = {
    latitude: 0,
    longitude: 0,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };

  // Use the current region or default to (0,0) if no location available
  const mapRegion = region || defaultRegion;

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        region={mapRegion}
        onMapReady={handleMapReady}
        showsUserLocation={true}
        followsUserLocation={true}
        showsMyLocationButton={true}
        loadingEnabled={true}
        loadingIndicatorColor="#666666"
        loadingBackgroundColor="#1C1C1E"
      >
        {/* Predefined route (orange) */}
        {routeCoordinates.length > 1 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor="#FFA500"
            strokeWidth={4}
          />
        )}
        
        {/* User's actual path (blue) */}
        {userPathCoordinates.length > 1 && (
          <Polyline
            coordinates={userPathCoordinates}
            strokeColor="#007AFF"
            strokeWidth={3}
          />
        )}
        {currentLocation && (
          <Marker
            coordinate={{
              latitude: currentLocation.coords.latitude,
              longitude: currentLocation.coords.longitude,
            }}
            title="Your Position"
          >
            <View style={styles.currentLocationMarker} />
          </Marker>
        )}
      </MapView>
      
      {!mapReady && (
        <View style={styles.loadingOverlay}>
          <Text style={styles.loadingText}>Loading map...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 250,
    marginBottom: 20,
    borderRadius: 15,
    overflow: 'hidden',
    backgroundColor: '#1C1C1E',
    borderWidth: 1,
    borderColor: '#333333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  currentLocationMarker: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FFA500',
    borderColor: '#FFFFFF',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(28, 28, 30, 0.9)',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    marginTop: 10,
  },
});

export default WorkoutMapDisplay;

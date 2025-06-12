import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, Platform } from 'react-native';
import MapView, { Polyline, Marker, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { UserSettings } from '../types/userTypes';
import { Coordinate } from '../types/workoutTypes';

interface WorkoutMapDisplayProps {
  settings: UserSettings;
  routeCoordinates: Coordinate[];
  currentLocation: Location.LocationObject | null;
  workoutState: 'idle' | 'countdown' | 'tracking' | 'paused' | 'saving' | 'finished';
}

const WorkoutMapDisplay: React.FC<WorkoutMapDisplayProps> = ({
  settings,
  routeCoordinates,
  currentLocation,
  workoutState
}) => {
  const [mapReady, setMapReady] = useState(false);
  const [region, setRegion] = useState<Region | null>(null);

  // Update region when current location changes
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
  // Default region (San Francisco coordinates - will be overridden by actual location)
  const defaultRegion = {
    latitude: 37.7749,
    longitude: -122.4194,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };

  // Use the current region or default to San Francisco
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
        {routeCoordinates.length > 1 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor="#FFA500"
            strokeWidth={4}
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

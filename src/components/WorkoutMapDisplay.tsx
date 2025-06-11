import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import MapView, { Polyline, Marker } from 'react-native-maps';
import { UserSettings } from '../types/userTypes'; // Adjust path if necessary
import { Coordinate } from '../types/workoutTypes'; // Adjust path if necessary
import * as Location from 'expo-location';

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
  if (!settings.showMap) {
    return null; // Don't render map if setting is off
  }

  const mapRegion = currentLocation
    ? {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        latitudeDelta: 0.005, // Zoom level for latitude
        longitudeDelta: 0.005, // Zoom level for longitude
      }
    : routeCoordinates.length > 0 
    ? {
        latitude: routeCoordinates[routeCoordinates.length -1].latitude,
        longitude: routeCoordinates[routeCoordinates.length -1].longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
    }
    : null; // Default region or null if no location data

  return (
    <View style={styles.mapContainer}>
      {mapRegion ? (
        <MapView style={styles.map} region={mapRegion} showsUserLocation={false} scrollEnabled={false} pitchEnabled={false} zoomEnabled={false}>
          {routeCoordinates.length > 1 && (
            <Polyline
              coordinates={routeCoordinates}
              strokeColor="#FFA500" // Orange color for the route
              strokeWidth={5}
            />
          )}
          {currentLocation && (workoutState === 'tracking' || workoutState === 'paused') && (
            <Marker
              coordinate={{
                latitude: currentLocation.coords.latitude,
                longitude: currentLocation.coords.longitude,
              }}
              title="Current Position"
            >
              <View style={styles.currentLocationMarker} />
            </Marker>
          )}
        </MapView>
      ) : (
        <View style={styles.mapPlaceholder}>
          <Text style={styles.mapPlaceholderText}>Waiting for location data to display map...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  mapContainer: {
    height: 250,
    marginBottom: 20,
    borderRadius: 15,
    overflow: 'hidden',
    backgroundColor: '#2C2C2E', // Dark background for placeholder
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  currentLocationMarker: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 122, 255, 0.9)', // Bright blue with some transparency
    borderColor: '#FFFFFF',
    borderWidth: 2,
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapPlaceholderText: {
    color: '#A0A0A0',
    fontSize: 14,
  },
});

export default WorkoutMapDisplay;

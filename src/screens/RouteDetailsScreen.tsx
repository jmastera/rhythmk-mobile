import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HeaderSafeArea } from '../components/HeaderSafeArea';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ChevronLeft } from 'lucide-react-native';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import MapView, { Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import { formatDistanceDisplay, formatDurationDisplay } from '../utils/PaceCalculator';
import { RootStackParamList } from '../navigation/types';
import { useRoutes } from '../contexts/RouteContext';

type RouteDetailsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'RouteDetails'>;
type RouteDetailsScreenRouteProp = NativeStackScreenProps<RootStackParamList, 'RouteDetails'>['route'];

const RouteDetailsScreen = () => {
  const route = useRoute<RouteDetailsScreenRouteProp>();
  const navigation = useNavigation<RouteDetailsScreenNavigationProp>();
  const { routeId } = route.params;
  const { getRouteById } = useRoutes();
  
  const [routeData, setRouteData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [region, setRegion] = useState({
    latitude: 0,
    longitude: 0,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  useEffect(() => {
    const loadRoute = async () => {
      try {
        const route = await getRouteById(routeId);
        if (route) {
          setRouteData(route);
          
          // Calculate region to show the entire route
          if (route.waypoints?.length > 0) {
            const lats = route.waypoints.map(wp => wp.latitude);
            const lngs = route.waypoints.map(wp => wp.longitude);
            
            const minLat = Math.min(...lats);
            const maxLat = Math.max(...lats);
            const minLng = Math.min(...lngs);
            const maxLng = Math.max(...lngs);
            
            const padding = 0.01; // Padding around the route
            
            setRegion({
              latitude: (minLat + maxLat) / 2,
              longitude: (minLng + maxLng) / 2,
              latitudeDelta: (maxLat - minLat) + padding,
              longitudeDelta: (maxLng - minLng) + padding,
            });
          }
        }
      } catch (error) {
        console.error('Failed to load route:', error);
        Alert.alert('Error', 'Failed to load route details');
      } finally {
        setLoading(false);
      }
    };

    loadRoute();
  }, [routeId, getRouteById]);

  const handleStartRoute = () => {
    if (routeData) {
      // Navigate to WorkoutTracker with the route data
      navigation.navigate('WorkoutTracker', { routeToFollow: routeData });
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!routeData) {
    return (
      <View style={styles.centered}>
        <Text>Route not found</Text>
      </View>
    );
  }

  // Convert waypoints to the format expected by Polyline
  const coordinates = routeData.waypoints.map((wp: any) => ({
    latitude: wp.latitude,
    longitude: wp.longitude,
  }));

  return (
    <SafeAreaView style={styles.safeArea}>
      <HeaderSafeArea />
      <View style={styles.headerTextContainer}>
        <Text style={styles.headerTitle}>Route Details</Text>
      </View>

      <View style={styles.container}>
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            region={region}
            scrollEnabled={true}
            zoomEnabled={true}
            rotateEnabled={true}
          >
            {coordinates.length > 0 && (
              <Polyline
                coordinates={coordinates}
                strokeColor="#3B82F6"
                strokeWidth={4}
                lineCap="round"
                lineJoin="round"
              />
            )}
          </MapView>
        </View>


        <ScrollView style={styles.detailsContainer}>
          <View style={styles.routeInfo}>
            <Text style={styles.title}>{routeData.name}</Text>
            <Text style={styles.date}>
              {new Date(routeData.createdAt).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </Text>

            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {formatDistanceDisplay(routeData.distance)}
                </Text>
                <Text style={styles.statLabel}>Distance</Text>
              </View>
              
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {formatDurationDisplay(routeData.duration || 0)}
                </Text>
                <Text style={styles.statLabel}>Duration</Text>
              </View>
              
              {routeData.averagePace ? (
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    {formatDistanceDisplay(1000 / routeData.averagePace * 60, 'km')}/km
                  </Text>
                  <Text style={styles.statLabel}>Avg Pace</Text>
                </View>
              ) : null}
              
              {routeData.elevationGain > 0 && (
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    {Math.round(routeData.elevationGain)}m
                  </Text>
                  <Text style={styles.statLabel}>Elevation</Text>
                </View>
              )}
            </View>

            <TouchableOpacity 
              style={styles.startButton}
              onPress={handleStartRoute}
            >
              <Text style={styles.startButtonText}>Start This Route</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#111827',
  },
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  headerTextContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  mapContainer: {
    height: 250,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  detailsContainer: {
    flex: 1,
    padding: 16,
  },
  routeInfo: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  date: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statItem: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#3B82F6',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  startButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111827',
  },
});

export default RouteDetailsScreen;

import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import MapView, { Polyline } from 'react-native-maps';
import { useUserSettings } from '../hooks/useUserSettings';
import { formatPaceDisplay, formatDistanceDisplay, formatDurationDisplay } from '../utils/units';
import { DisplayUnit } from '../types/userTypes';
import { WorkoutEntry, Split } from '../types/history'; // Adjusted path for WorkoutEntry
import { Calendar, MapPin, Clock, Zap, Heart, Flame, Edit3, TrendingUp, ChevronsDown, ChevronsUp } from 'lucide-react-native';

interface WorkoutDetailProps {
  workout: WorkoutEntry;
  onEditNotes?: (workoutId: string, currentNotes: string | undefined) => void;
}

const WorkoutDetail: React.FC<WorkoutDetailProps> = ({ workout, onEditNotes }) => {
  const { settings } = useUserSettings();
  const mapRef = useRef<MapView | null>(null);

  const validCoords = workout.coordinates && Array.isArray(workout.coordinates)
    ? workout.coordinates
        .filter(c => typeof c.latitude === 'number' && typeof c.longitude === 'number' && isFinite(c.latitude) && isFinite(c.longitude))
        .map(c => ({ latitude: c.latitude, longitude: c.longitude }))
    : [];

  useEffect(() => {
    // Only attempt to fit coordinates if maps are enabled and coordinates exist
      if ((settings.renderMapsDebug ?? true) && mapRef.current && validCoords.length > 0) {
      // A slight delay can help ensure the map is ready, especially on initial load
      const timer = setTimeout(() => {
        mapRef.current?.fitToCoordinates(validCoords, {
          edgePadding: {
            top: 50,
            right: 50,
            bottom: 50,
            left: 50,
          },
          animated: true,
        });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [workout.coordinates, settings.renderMapsDebug, validCoords]); // Add validCoords to dependency array

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.section}>
        <View style={styles.detailRow}>
          <Calendar size={18} color="#f97316" style={styles.icon} />
          <Text style={styles.detailLabel}>Date:</Text>
          <Text style={styles.detailValue}>{workout.date && !isNaN(new Date(workout.date).getTime()) ? new Date(workout.date).toLocaleDateString([], { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Invalid Date'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Zap size={18} color="#f97316" style={styles.icon} />
          <Text style={styles.detailLabel}>Plan:</Text>
          <Text style={styles.detailValue}>
            {(() => {
              // Format the plan name based on its type
              if (!workout.planName || workout.planName === 'Free Run') {
                return 'Free Run';
              }
              
              // For race goals like 5k, 10k, etc.
              if (workout.planName.toLowerCase() === '5k') return '5K';
              if (workout.planName.toLowerCase() === '10k') return '10K';
              if (workout.planName.toLowerCase() === 'half marathon') return 'Half Marathon';
              if (workout.planName.toLowerCase() === 'full marathon') return 'Full Marathon';
              
              // For other plan names, capitalize each word
              return workout.planName
                .split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
            })()}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Performance</Text>
        <View style={styles.gridContainer}>
          {settings.workoutCardSettings?.distance !== false && (
            <View style={styles.gridItem}>
              <Text style={[styles.gridValue, {fontSize: 24, marginBottom: 4}]}>📍</Text>
              <Text style={styles.gridValue}>
  {typeof workout.distance === 'number' && isFinite(workout.distance) 
    ? formatDistanceDisplay(workout.distance, settings.displayUnit as DisplayUnit) 
    : 'N/A'}
</Text>
              <Text style={styles.gridLabel}>Distance</Text>
            </View>
          )}
          
          {settings.workoutCardSettings?.duration !== false && (
            <View style={styles.gridItem}>
              <Text style={[styles.gridValue, {fontSize: 24, marginBottom: 4}]}>⏱️</Text>
              <Text style={styles.gridValue}>{typeof workout.duration === 'number' && isFinite(workout.duration) ? formatDurationDisplay(workout.duration) : 'N/A'}</Text>
              <Text style={styles.gridLabel}>Duration</Text>
            </View>
          )}
          
          {settings.workoutCardSettings?.pace !== false && (
            <View style={styles.gridItem}>
              <Text style={[styles.gridValue, {fontSize: 24, marginBottom: 4}]}>🏃</Text>
              <Text style={styles.gridValue}>
  {typeof workout.avgPace === 'number' && isFinite(workout.avgPace) 
    ? formatPaceDisplay(workout.avgPace, settings.displayUnit as DisplayUnit) 
    : `--:-- /${settings.displayUnit}`}
</Text>
              <Text style={styles.gridLabel}>Avg Pace</Text>
            </View>
          )}
          
          {settings.workoutCardSettings?.steps !== false && (
            <View style={styles.gridItem}>
              <Text style={[styles.gridValue, {fontSize: 24, marginBottom: 4}]}>👟</Text>
              <Text style={styles.gridValue}>{workout.steps || '--'}</Text>
              <Text style={styles.gridLabel}>Steps</Text>
            </View>
          )}
          
          {settings.workoutCardSettings?.calories !== false && (
            <View style={styles.gridItem}>
              <Text style={[styles.gridValue, {fontSize: 24, marginBottom: 4}]}>🔥</Text>
              <Text style={styles.gridValue}>{workout.calories != null && workout.calories > 0 ? workout.calories : '--'}</Text>
              <Text style={styles.gridLabel}>Calories</Text>
            </View>
          )}
          
          {settings.workoutCardSettings?.stride !== false && (
            <View style={styles.gridItem}>
              <Text style={[styles.gridValue, {fontSize: 24, marginBottom: 4}]}>🦿</Text>
              <Text style={styles.gridValue}>
                {workout.steps && workout.steps > 0 && workout.distance > 0 
                  ? `${((workout.distance / workout.steps) * 100).toFixed(0)} cm`
                  : '--'}
              </Text>
              <Text style={styles.gridLabel}>Stride</Text>
            </View>
          )}
          
          {settings.workoutCardSettings?.cadence !== false && workout.steps && workout.duration > 0 && (
            <View style={styles.gridItem}>
              <Text style={[styles.gridValue, {fontSize: 24, marginBottom: 4}]}>👣</Text>
              <Text style={styles.gridValue}>
                {Math.round((workout.steps / (workout.duration / 60)) * 10) / 10} spm
              </Text>
              <Text style={styles.gridLabel}>Cadence</Text>
            </View>
          )}
          
          {settings.workoutCardSettings?.speed !== false && workout.distance > 0 && workout.duration > 0 && (
            <View style={styles.gridItem}>
              <Text style={[styles.gridValue, {fontSize: 24, marginBottom: 4}]}>🏃‍♂️</Text>
              <Text style={styles.gridValue}>
                {((workout.distance / (workout.duration / 3600)) * (settings.displayUnit === 'mi' ? 0.621371 : 1)).toFixed(1)} {settings.displayUnit === 'mi' ? 'mph' : 'km/h'}
              </Text>
              <Text style={styles.gridLabel}>Avg Speed</Text>
            </View>
          )}
          
          {settings.workoutCardSettings?.elevationGain !== false && workout.totalElevationGain !== undefined && workout.totalElevationGain > 0 && (
            <View style={styles.gridItem}>
              <Text style={[styles.gridValue, {fontSize: 24, marginBottom: 4}]}>⛰️</Text>
              <Text style={styles.gridValue}>{(workout.totalElevationGain || 0).toFixed(0)} m</Text>
              <Text style={styles.gridLabel}>Elevation Gain</Text>
            </View>
          )}
          
          {settings.workoutCardSettings?.caloriesPerKm !== false && workout.calories && workout.distance > 0 && (
            <View style={styles.gridItem}>
              <Text style={[styles.gridValue, {fontSize: 24, marginBottom: 4}]}>🔥</Text>
              <Text style={styles.gridValue}>
                {(workout.calories / (workout.distance / (settings.displayUnit === 'mi' ? 1.60934 : 1))).toFixed(0)} cal/{settings.displayUnit}
              </Text>
              <Text style={styles.gridLabel}>Cal/{settings.displayUnit}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Additional Stats</Text>
        <View style={styles.detailRow}>
          <ChevronsUp size={18} color="#34d399" style={styles.icon} />
          <Text style={styles.detailLabel}>Elevation Gain:</Text>
          <Text style={styles.detailValue}>{workout.totalElevationGain != null ? `${workout.totalElevationGain.toFixed(0)} m` : 'N/A'}</Text>
        </View>
        <View style={styles.detailRow}>
          <ChevronsDown size={18} color="#fb7185" style={styles.icon} />
          <Text style={styles.detailLabel}>Elevation Loss:</Text>
          <Text style={styles.detailValue}>{workout.totalElevationLoss != null ? `${workout.totalElevationLoss.toFixed(0)} m` : 'N/A'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Heart size={18} color="#ef4444" style={styles.icon} />
          <Text style={styles.detailLabel}>Avg Heart Rate:</Text>
          <Text style={styles.detailValue}>{workout.avgHeartRate != null && workout.avgHeartRate > 0 ? `${workout.avgHeartRate} bpm` : 'N/A'}</Text>
        </View>
        <View style={[styles.detailRow, { marginTop: 8, justifyContent: 'space-between' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Edit3 size={18} color="#a78bfa" style={styles.icon} />
            <Text style={styles.detailLabel}>Notes:</Text>
          </View>
          {onEditNotes && (
            <TouchableOpacity 
              onPress={() => onEditNotes(workout.id, workout.notes)}
              style={styles.editButton}
            >
              <Text style={styles.editButtonText}>Edit Notes</Text>
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.notesText}>{workout.notes || 'No notes added.'}</Text>
      </View>

      {/* --- SPLITS SECTION TEMPORARILY COMMENTED OUT FOR DEBUGGING --- 
      {workout.splits && workout.splits.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Splits</Text>
          <View style={styles.splitHeader}>
            <Text style={[styles.splitHeaderText, styles.splitHeaderNumber]}>#</Text>
            <Text style={[styles.splitHeaderText, styles.splitHeaderDistance]}>Distance</Text>
            <Text style={[styles.splitHeaderText, styles.splitHeaderDuration]}>Time</Text>
            <Text style={[styles.splitHeaderText, styles.splitHeaderPace]}>Pace</Text>
          </View>
          {workout.splits.map((split: Split, index: number) => (
            <View key={index} style={styles.splitItem}>
              <Text style={[styles.splitDetail, styles.splitNumber]}>{index + 1}</Text>
              <Text style={[styles.splitDetail, styles.splitDistance]}>
                {formatDistanceDisplay(split.distance, settings.displayUnit as DisplayUnit)}
              </Text>
              <Text style={[styles.splitDetail, styles.splitDuration]}>
                {formatDurationDisplay(split.duration)}
              </Text>
              <Text style={[styles.splitDetail, styles.splitPace]}>
                {formatPaceDisplay(split.pace, settings.displayUnit as DisplayUnit)}
              </Text>
            </View>
          ))}
        </View>
      )}
      --- END OF TEMPORARILY COMMENTED OUT SPLITS SECTION --- */}

      {/* Map Section */}
      {/* Conditionally render the entire map section based on debug setting */}
      {(settings.renderMapsDebug ?? true) && validCoords.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Route Map</Text>
          <View style={styles.mapContainer}>
            <MapView
              ref={mapRef}
              style={styles.map}
              provider={undefined} // Use default provider
            >
              <Polyline
                coordinates={validCoords}
                strokeColor="#f97316" // orange
                strokeWidth={4}
              />
            </MapView>
          </View>
        </View>
      )}
      {/* Also apply the debug setting condition to the 'no route data' message for consistency */}
      {(settings.renderMapsDebug ?? true) && validCoords.length === 0 && (
         <View style={styles.section}>
          <Text style={styles.sectionTitle}>Route Map</Text>
          <Text style={styles.detailValue}>No route data available for this workout.</Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    // flex: 1, // Temporarily removed for testing modal display
  },
  editButton: {
    backgroundColor: '#a855f7', // purple-600
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 4,
  },
  editButtonText: {
    color: '#f9fafb', // gray-50
    fontSize: 12,
    fontWeight: '500',
  },
  contentContainer: {
    paddingVertical: 16,
    paddingHorizontal: 8, // Reduced horizontal padding for modal context
  },
  section: {
    backgroundColor: '#27272a', // zinc-800
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e4e4e7', // zinc-200
    marginBottom: 12,
  },
  sectionTitleNoMargin: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e4e4e7', // zinc-200
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailRowAlt: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailRowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  icon: {
    marginRight: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#a1a1aa', // zinc-400
    marginRight: 6,
  },
  detailValue: {
    fontSize: 14,
    color: '#e4e4e7', // zinc-200
    flexShrink: 1, // Allow text to wrap
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItem: {
    alignItems: 'center',
    backgroundColor: '#3f3f46', // zinc-700
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 8,
    width: '31%', // Adjust for spacing, roughly 3 items per row
    marginBottom: 12,
  },
  gridIcon: {
    marginBottom: 6,
  },
  gridValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f4f4f5', // zinc-100
    marginBottom: 2,
  },
  gridLabel: {
    fontSize: 12,
    color: '#a1a1aa', // zinc-400
  },
  elevationItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notesText: {
    fontSize: 14,
    color: '#d4d4d8', // zinc-300
    lineHeight: 20,
  },
  splitItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#3f3f46', // zinc-700
  },
  splitNumber: {
    fontSize: 14,
    color: '#a1a1aa', // zinc-400
    flex: 0.5, // Give it a small portion of space
  },
  splitDistance: {
    flex: 1.5, // More space for distance
  },
  splitDuration: {
    flex: 1.5, // More space for duration
  },
  splitPace: {
    flex: 1.5, // More space for pace
    textAlign: 'right', // Align pace to the right
  },
  splitDetail: {
    fontSize: 14,
    color: '#e4e4e7', // zinc-200
  },
  splitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#52525b', // zinc-600
    marginBottom: 4,
  },
  splitHeaderText: {
    fontSize: 12,
    color: '#a1a1aa', // zinc-400
    fontWeight: 'bold',
  },
  splitHeaderNumber: { flex: 0.5 },
  splitHeaderDistance: { flex: 1.5 },
  splitHeaderDuration: { flex: 1.5 },
  splitHeaderPace: { flex: 1.5, textAlign: 'right' },
  mapContainer: {
    height: 300,
    borderRadius: 8,
    overflow: 'hidden', // Ensures map respects border radius
    marginTop: 8,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
});

export default WorkoutDetail;

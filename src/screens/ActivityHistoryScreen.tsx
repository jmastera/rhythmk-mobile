import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Button, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getActivities, deleteActivity } from '../utils/Database';

// Define a type for our activity items for better type safety
interface Activity {
  id: number;
  activityType: string;
  customActivityName?: string | null;
  date: string;
  durationMinutes: number;
  intensity?: string | null;
  notes?: string | null;
  caloriesBurned?: number | null;
  // No changes needed to the Activity interface itself for delete
}

const ActivityHistoryScreen = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadActivities = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const result = await getActivities();
    if (result.success && result.data) {
      setActivities(result.data);
    } else {
      setError(result.error || 'Failed to load activities.');
      Alert.alert('Error', result.error || 'Could not fetch activities.');
    }
    setIsLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadActivities();
    }, [loadActivities])
  );

  const handleDeleteActivity = async (id: number) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this activity?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          onPress: async () => {
            const result = await deleteActivity(id);
            if (result.success) {
              Alert.alert('Success', 'Activity deleted successfully.');
              loadActivities(); // Refresh the list
            } else {
              Alert.alert('Error', result.error || 'Failed to delete activity.');
            }
          },
          style: 'destructive',
        },
      ],
      { cancelable: true }
    );
  };

  const renderActivityItem = ({ item }: { item: Activity }) => (
    <View style={styles.itemContainer}>
      <Text style={styles.itemTitle}>{item.customActivityName || item.activityType}</Text>
      <Text style={styles.itemDetail}>Date: {new Date(item.date).toLocaleDateString()}</Text>
      <Text style={styles.itemDetail}>Duration: {item.durationMinutes} minutes</Text>
      {item.intensity && <Text style={styles.itemDetail}>Intensity: {item.intensity}</Text>}
      {item.caloriesBurned !== null && item.caloriesBurned !== undefined && (
        <Text style={styles.itemDetail}>Calories: {item.caloriesBurned}</Text>
      )}
      {item.notes && <Text style={styles.itemNotes}>Notes: {item.notes}</Text>}
      <View style={styles.buttonContainer}>
        <Button title="Delete" onPress={() => handleDeleteActivity(item.id)} color="#ef4444" />
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.centeredMessageContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text>Loading activities...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centeredMessageContainer}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <Button title="Retry" onPress={loadActivities} color="#3b82f6" />
      </View>
    );
  }

  if (activities.length === 0) {
    return (
      <View style={styles.centeredMessageContainer}>
        <Text>No activities logged yet.</Text>
        <Text>Go log your first activity!</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={activities}
      renderItem={renderActivityItem}
      keyExtractor={(item) => item.id.toString()}
      contentContainerStyle={styles.listContainer}
      ListHeaderComponent={<Text style={styles.headerTitle}>Activity History</Text>}
    />
  );
};

const styles = StyleSheet.create({
  listContainer: {
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: '#111827', // Dark gray
  },
  itemContainer: {
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e3a8a', // Dark blue
    marginBottom: 5,
  },
  itemDetail: {
    fontSize: 14,
    color: '#374151', // Medium gray
    marginBottom: 3,
  },
  itemNotes: {
    fontSize: 14,
    color: '#4b5563', // Lighter gray
    marginTop: 5,
    fontStyle: 'italic',
  },
  centeredMessageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  buttonContainer: {
    marginTop: 10,
    alignSelf: 'flex-end',
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
    textAlign: 'center',
  },
});

export default ActivityHistoryScreen;

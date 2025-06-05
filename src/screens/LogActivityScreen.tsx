import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { addActivity } from '../utils/Database'; // Assuming Database.js is in src/utils
import { useNavigation } from '@react-navigation/native';

// We might want to define a more specific type for navigation props if needed
// type LogActivityScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'LogActivity'>;

const LogActivityScreen = () => {
  const navigation = useNavigation();
  const [activityType, setActivityType] = useState('');
  const [customActivityName, setCustomActivityName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]); // Default to today YYYY-MM-DD
  const [durationMinutes, setDurationMinutes] = useState('');
  const [intensity, setIntensity] = useState(''); // e.g., 'Low', 'Medium', 'High'
  const [notes, setNotes] = useState('');
  const [caloriesBurned, setCaloriesBurned] = useState('');

  // Predefined activity types - you can expand this list
  const activityTypes = ['Run', 'Strength Training', 'Cycling', 'Yoga', 'Swimming', 'HIIT', 'Walk', 'Other'];

  const handleSaveActivity = async () => {
    if (!activityType || !date || !durationMinutes) {
      Alert.alert('Error', 'Activity Type, Date, and Duration are required.');
      return;
    }

    const durationNum = parseInt(durationMinutes, 10);
    if (isNaN(durationNum) || durationNum <= 0) {
      Alert.alert('Error', 'Please enter a valid duration in minutes.');
      return;
    }

    let caloriesNum = null;
    if (caloriesBurned) {
      const parsedCalories = parseInt(caloriesBurned, 10);
      if (isNaN(parsedCalories) || parsedCalories < 0) {
        Alert.alert('Error', 'Please enter a valid positive number for calories burned or leave it blank.');
        return;
      }
      caloriesNum = parsedCalories;
    }

    const result = await addActivity({
      activityType: activityType === 'Other' && customActivityName ? customActivityName : activityType,
      customActivityName: activityType === 'Other' ? customActivityName : null, // Store custom name if 'Other'
      date,
      durationMinutes: durationNum,
      intensity,
      notes,
      caloriesBurned: caloriesNum, // Now correctly passes null or a number
    });

    if (result.success) {
      Alert.alert('Success', 'Activity logged successfully!');
      // navigation.goBack(); // Or navigate to a history screen
    } else {
      Alert.alert('Error', `Failed to log activity: ${result.error || result.message}`);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Activity Type:</Text>
      {/* Replace with a Picker/Dropdown later */}
      <TextInput
        style={styles.input}
        placeholder="e.g., Strength Training, Cycling (Use 'Other' for custom)"
        value={activityType}
        onChangeText={setActivityType}
      />
      {activityType === 'Other' && (
        <TextInput
          style={styles.input}
          placeholder="Custom Activity Name"
          value={customActivityName}
          onChangeText={setCustomActivityName}
        />
      )}

      <Text style={styles.label}>Date:</Text>
      {/* Replace with a DatePicker later */}
      <TextInput
        style={styles.input}
        placeholder="YYYY-MM-DD"
        value={date}
        onChangeText={setDate}
        keyboardType="numeric" // Basic validation, ideally a date picker
      />

      <Text style={styles.label}>Duration (minutes):</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g., 60"
        value={durationMinutes}
        onChangeText={setDurationMinutes}
        keyboardType="numeric"
      />

      <Text style={styles.label}>Intensity (Optional):</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g., Low, Medium, High"
        value={intensity}
        onChangeText={setIntensity}
      />

      <Text style={styles.label}>Notes (Optional):</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Any details..."
        value={notes}
        onChangeText={setNotes}
        multiline
      />

      <Text style={styles.label}>Calories Burned (Optional):</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g., 300"
        value={caloriesBurned}
        onChangeText={setCaloriesBurned}
        keyboardType="numeric"
      />

      <Button title="Save Activity" onPress={handleSaveActivity} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
});

export default LogActivityScreen;

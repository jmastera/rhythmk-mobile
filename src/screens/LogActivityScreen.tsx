import React, { useState } from 'react';
import { Platform } from 'react-native'; // Import Platform
import { View, Text, TextInput, Button, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { addActivity } from '../utils/Database'; // Assuming Database.js is in src/utils
import { useNavigation } from '@react-navigation/native';

// We might want to define a more specific type for navigation props if needed
// type LogActivityScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'LogActivity'>;

const LogActivityScreen = () => {
  const navigation = useNavigation();
  const [activityType, setActivityType] = useState('');
  const [customActivityName, setCustomActivityName] = useState('');
  const [date, setDate] = useState(new Date()); // Store as Date object
  const [showDatePicker, setShowDatePicker] = useState(false);
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
      date: date.toISOString().split('T')[0], // Format date to YYYY-MM-DD string for DB
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

  const onChangeDate = (event: DateTimePickerEvent, selectedDate?: Date) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(Platform.OS === 'ios'); // Keep open on iOS until user dismisses
    setDate(currentDate);
  };

  const showMode = () => {
    setShowDatePicker(true);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Activity Type:</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={activityType}
          onValueChange={(itemValue) => setActivityType(itemValue)}
          style={styles.picker}
        >
          <Picker.Item label="Select an activity type..." value="" />
          {activityTypes.map((type) => (
            <Picker.Item key={type} label={type} value={type} />
          ))}
        </Picker>
      </View>
      {activityType === 'Other' && (
        <TextInput
          style={styles.input}
          placeholder="Custom Activity Name"
          value={customActivityName}
          onChangeText={setCustomActivityName}
        />
      )}

      <Text style={styles.label}>Date:</Text>
      <TouchableOpacity onPress={showMode} style={styles.inputLikeButton}>
        <Text style={styles.dateText}>{date.toLocaleDateString()}</Text>
      </TouchableOpacity>
      {showDatePicker && (
        <DateTimePicker
          testID="dateTimePicker"
          value={date}
          mode={'date'}
          is24Hour={true}
          display="default"
          onChange={onChangeDate}
        />
      )}

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
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginBottom: 10,
  },
  picker: {
    height: 50, 
    // width: '100%', // Not always needed, depends on container
  },
  inputLikeButton: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
    justifyContent: 'center',
    height: 50, // Match input height
  },
  dateText: {
    fontSize: 16, // Match input text size
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

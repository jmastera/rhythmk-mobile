import React, { useState } from 'react';
import { Platform, ScrollView, KeyboardAvoidingView, Modal, FlatList, View, Text, TextInput, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { addActivity, updateActivity } from '../utils/Database';
import { WorkoutEntry, WORKOUT_HISTORY_KEY } from '../types/history';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { HeaderSafeArea } from '../components/HeaderSafeArea';
import { LinearGradient } from 'expo-linear-gradient';

// Define props interface for CustomDropdown
interface CustomDropdownProps {
  options: string[];
  value: string;
  onSelect: (option: string) => void;
  placeholder: string;
}

// Component for more attractive dropdown
const CustomDropdown = ({ options, value, onSelect, placeholder }: CustomDropdownProps) => {
  const [showOptions, setShowOptions] = useState(false);

  const toggleOptions = () => setShowOptions(!showOptions);

  const handleSelect = (option: string) => {
    onSelect(option);
    setShowOptions(false);
  };

  return (
    <View style={{ marginBottom: 10 }}>
      <TouchableOpacity onPress={toggleOptions} style={styles.dropdownButton}>
        <Text style={styles.dropdownButtonText}>
          {value || placeholder}
        </Text>
      </TouchableOpacity>

      <Modal
        visible={showOptions}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowOptions(false)}
      >
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}
          activeOpacity={1}
          onPress={() => setShowOptions(false)}
        >
          <View style={styles.dropdownModal}>
            <FlatList
              data={options}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={[
                    styles.optionItem,
                    value === item && styles.selectedOption
                  ]} 
                  onPress={() => handleSelect(item)}
                >
                  <Text style={styles.optionText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

// Activity types
const activityTypes = [
  'Walking', 
  'Cycling', 
  'Swimming', 
  'Hiking', 
  'Yoga', 
  'Weightlifting',
  'HIIT',
  'Pilates',
  'Tennis',
  'Basketball',
  'Soccer',
  'Other'
];

// Define navigation stack param list
type RootStackParamList = {
  LogActivity: {
    editMode?: boolean;
    activityId?: number;
    activityType?: string;
    customActivityName?: string;
    date?: string;
    duration?: number;
    intensity?: string;
    notes?: string;
    caloriesBurned?: number;
    isRunNotesEdit?: boolean;
    workoutId?: string; // For editing tracked run notes
  };
};

// Define the route prop type
type LogActivityRouteProp = RouteProp<RootStackParamList, 'LogActivity'>;

const LogActivityScreen = () => {
  // Navigation
  const route = useRoute<LogActivityRouteProp>();
  const navigation = useNavigation();
  // Ensure params exists with a default empty object
  const params = route.params || {};
  
  // Check if we're in edit mode - safely access properties
  const isEditing = params?.editMode === true;
  const activityId = params?.activityId;
  const isRunNotesEdit = params?.isRunNotesEdit === true;
  
  // States for form fields - safely access properties
  const [activityType, setActivityType] = useState(params?.activityType || '');
  const [customActivityName, setCustomActivityName] = useState(params?.customActivityName || '');
  const [date, setDate] = useState(params?.date ? new Date(params.date) : new Date());
  const [durationMinutes, setDurationMinutes] = useState(
    params?.duration ? String(Math.floor(params.duration / 60)) : ''
  );
  const [intensity, setIntensity] = useState(params?.intensity || 'Medium');
  const [notes, setNotes] = useState(params?.notes || '');
  const [caloriesBurned, setCaloriesBurned] = useState(
    params?.caloriesBurned ? String(params.caloriesBurned) : ''
  );
  
  // Date picker state
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // Calculate duration in hours and minutes for display
  const [selectedIntensity, setSelectedIntensity] = useState(params.intensity || 'Medium');
  
  // Intensity options
  const intensityLevels = ['Low', 'Medium', 'High', 'Very High'];

  const handleSaveActivity = async () => {
    // Special case for editing run notes
    if (isRunNotesEdit && params.workoutId) {
      await updateRunNotes(params.workoutId as string, notes);
      return;
    }
    
    // Regular activity validation and saving
    // Validate required fields
    if (!activityType || !date || !durationMinutes) {
      Alert.alert('Error', 'Activity Type, Date, and Duration are required.');
      return;
    }
    
    // Validate custom activity name for 'Other' type
    if (activityType === 'Other' && !customActivityName.trim()) {
      Alert.alert('Error', 'Please enter a custom activity name');
      return;
    }
    
    // Prepare data for saving
    const durationInSeconds = Number(durationMinutes) * 60;
    let result;
    
    // Prepare activity data
    const activityData: any = {
      activityType: activityType === 'Other' ? 'Other' : activityType,
      customActivityName: activityType === 'Other' ? customActivityName : null,
      date: date.toISOString(),
      duration: durationInSeconds,
      intensity: selectedIntensity,
      notes,
    };
    
    // Add calories if provided
    if (caloriesBurned && !isNaN(Number(caloriesBurned))) {
      activityData.caloriesBurned = Number(caloriesBurned);
    }
    
    if (isEditing && activityId) {
      // Update existing activity
      result = await updateActivity(activityId, activityData);
      if (result.success) {
        Alert.alert('Success', 'Activity updated successfully!');
        navigation.goBack();
      } else {
        Alert.alert('Error', `Failed to update activity: ${result.error || 'Unknown error'}`);
      }
    } else {
      // Add new activity
      result = await addActivity(activityData);
      if (result.success) {
        Alert.alert('Success', 'Activity logged successfully!');
        navigation.goBack();
      } else {
        Alert.alert('Error', `Failed to log activity: ${result.error || 'Unknown error'}`);
      }
    }
  };

  const updateRunNotes = async (workoutId: string, notes: string) => {
    try {
      // Get existing workouts
      const workoutsJson = await AsyncStorage.getItem(WORKOUT_HISTORY_KEY);
      if (workoutsJson) {
        const workouts: WorkoutEntry[] = JSON.parse(workoutsJson);
        
        // Find and update the specific workout
        const updatedWorkouts = workouts.map(workout => {
          if (workout.id === workoutId) {
            return { ...workout, notes };
          }
          return workout;
        });
        
        // Save back to storage
        await AsyncStorage.setItem(WORKOUT_HISTORY_KEY, JSON.stringify(updatedWorkouts));
        
        Alert.alert('Success', 'Workout notes updated successfully!');
        navigation.goBack();
        return true;
      }
    } catch (error) {
      console.error('Error updating workout notes:', error);
      Alert.alert('Error', 'Failed to update workout notes. Please try again.');
    }
    return false;
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
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.scrollViewContainer} contentContainerStyle={styles.contentContainer}>
        <HeaderSafeArea />
        
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>
            {isRunNotesEdit ? 'Edit Run Notes' : isEditing ? 'Edit Activity' : 'Log Activity'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {isRunNotesEdit ? 'Update notes for this run' : 
             isEditing ? 'Update your existing activity details' : 
             'Log your non-running workouts'}
          </Text>
        </View>

        {isRunNotesEdit ? (
          // Simplified UI for editing run notes - only show notes field
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Run Notes</Text>
            <Text style={styles.label}>Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Add notes about your run..."
              placeholderTextColor="#71717a"
              multiline={true}
              numberOfLines={4}
            />
          </View>
        ) : (
          // Regular activity UI with all fields
          <>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Activity Details</Text>
              
              <Text style={styles.label}>Activity Type</Text>
              <CustomDropdown
                options={activityTypes}
                value={activityType}
                onSelect={setActivityType}
                placeholder="Select an activity..."
              />
              
              {activityType === 'Other' && (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Custom Activity Name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter custom activity"
                    placeholderTextColor="#6B7280"
                    value={customActivityName}
                    onChangeText={setCustomActivityName}
                  />
                </View>
              )}

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Date</Text>
                <TouchableOpacity onPress={showMode} style={styles.dateButton}>
                  <Text style={styles.dateText}>
                    {date.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                  </Text>
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
              </View>
            </View>

            {/* Workout Stats Card */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Workout Stats</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Duration (minutes)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter minutes"
                  placeholderTextColor="#6B7280"
                  value={durationMinutes}
                  onChangeText={setDurationMinutes}
                  keyboardType="number-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Intensity</Text>
                <CustomDropdown
                  options={intensityLevels}
                  value={intensity}
                  onSelect={setIntensity}
                  placeholder="Select intensity level"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Calories Burned (optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter calories"
                  placeholderTextColor="#6B7280"
                  value={caloriesBurned}
                  onChangeText={setCaloriesBurned}
                  keyboardType="number-pad"
                />
              </View>
            </View>

            {/* Notes Card */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Additional Information</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Notes (optional)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Add notes about your workout"
                  placeholderTextColor="#6B7280"
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                />
              </View>
            </View>
          </>
        )}

        {/* Save Button */}
        <TouchableOpacity onPress={handleSaveActivity}>
          <LinearGradient
            colors={['#f97316', '#fb923c']} // orange-500 and orange-400
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.saveButton}
          >
            <Text style={styles.saveButtonText}>
              {isRunNotesEdit ? 'Save Notes' : isEditing ? 'Update Activity' : 'Save Activity'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  // Container styles
  container: {
    flex: 1,
    backgroundColor: '#111827', // Dark background matching other screens
  },
  scrollViewContainer: {
    flex: 1,
    backgroundColor: '#111827', // Dark background
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40, // Extra padding at bottom for scrollview
  },
  
  // Dropdown styles
  dropdownButton: {
    backgroundColor: '#1f2937',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#374151',
  },
  dropdownButtonText: {
    color: '#d1d5db',
    fontSize: 16,
  },
  dropdownModal: {
    margin: 20,
    marginTop: 'auto',
    marginBottom: 80,
    backgroundColor: '#1f2937',
    borderRadius: 16,
    padding: 16,
    maxHeight: 300,
  },
  optionItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  optionText: {
    color: '#d1d5db',
    fontSize: 16,
  },
  selectedOption: {
    backgroundColor: '#374151',
    borderRadius: 8,
  },

  // Header styles
  headerTextContainer: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: 'white',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#9ca3af', // Gray-400
  },

  // Card styles
  card: {
    backgroundColor: '#1f2937', // Gray-800
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#374151', // Gray-700
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginBottom: 16,
  },

  // Input styles
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    color: '#d1d5db', // Gray-300
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#374151', // Gray-700
    borderRadius: 8,
    padding: 12,
    color: 'white',
    fontSize: 16,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  dateButton: {
    backgroundColor: '#374151',
    borderRadius: 8,
    padding: 12,
  },
  dateText: {
    color: 'white',
    fontSize: 16,
  },

  // Button styles
  saveButton: {
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default LogActivityScreen;

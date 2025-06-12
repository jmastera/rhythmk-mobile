import React, { useState } from 'react';
import { Platform, ScrollView, KeyboardAvoidingView, Modal, FlatList, View, Text, TextInput, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { addActivity, updateActivity, ActivityData } from '../lib/supabase';
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
  const [distance, setDistance] = useState(''); // Distance in kilometers or miles (user's preference)
  const [distanceUnit, setDistanceUnit] = useState('km'); // 'km' or 'mi'
  
  // Activity types that should show the distance input
  const ACTIVITIES_WITH_DISTANCE = [
    'Walking',
    'Running',
    'Cycling',
    'Swimming',
    'Hiking',
    // Add other activity types that should have distance
  ];

  // Check if the current activity type should show distance field
  const shouldShowDistance = ACTIVITIES_WITH_DISTANCE.includes(activityType) || 
                          (activityType === 'Other' && ACTIVITIES_WITH_DISTANCE.includes(customActivityName));

  // Date picker state
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // Calculate duration in hours and minutes for display
  const [selectedIntensity, setSelectedIntensity] = useState(params.intensity || 'Medium');
  
  // Intensity options
  const intensityLevels = ['Low', 'Medium', 'High', 'Very High'];

  const handleSaveActivity = async () => {
    // Special case for editing run notes first
    if (isRunNotesEdit && params.workoutId) {
      try {
        await updateRunNotes(params.workoutId as string, notes);
        // Alert and navigation are handled within updateRunNotes or can be added here if needed
      } catch (error) {
        console.error('Error in handleSaveActivity while updating run notes:', error);
        Alert.alert('Error', 'Failed to save run notes.');
      }
      return;
    }

    // Regular activity validation and saving
    if (!activityType) {
      Alert.alert('Error', 'Please select an activity type.');
      return;
    }
    if (activityType === 'Other' && (!customActivityName || customActivityName.trim() === '')) {
      Alert.alert('Error', 'Please enter a name for your custom activity.');
      return;
    }
    if (!durationMinutes || parseInt(durationMinutes, 10) <= 0) {
      Alert.alert('Error', 'Please enter a valid duration (must be greater than 0).');
      return;
    }

    // Validate distance if it's a distance-based activity
    if (shouldShowDistance && distance && isNaN(parseFloat(distance))) {
      Alert.alert('Error', 'Please enter a valid distance');
      return;
    }

    // Prepare data for saving
    const finalActivityType = activityType === 'Other' ? (customActivityName.trim() || 'Other') : activityType;
    const durationInSeconds = parseInt(durationMinutes, 10) * 60;
    const finalCalories = caloriesBurned ? parseInt(caloriesBurned, 10) : null;

    // Convert distance to meters if provided (storing in meters for consistency with other activities)
    const distanceInMeters = shouldShowDistance && distance 
      ? distanceUnit === 'km' ? parseFloat(distance) * 1000 : parseFloat(distance) * 1609.34
      : undefined; // Use undefined instead of null for consistency with ActivityData type

    // Create base payload without distance
    const activityPayload: ActivityData = {
      type: finalActivityType,
      // customActivityName is part of 'type' if 'Other', and handled in supabase.ts for notes
      customActivityName: activityType === 'Other' ? customActivityName.trim() : null,
      date: date.toISOString(),
      duration: durationInSeconds,
      intensity: selectedIntensity || null,
      notes: notes || null,
      calories: finalCalories,
    };

    // Add distance only if it's a distance-based activity and a value was provided
    if (shouldShowDistance && distance && distanceInMeters !== undefined) {
      (activityPayload as any).distance = Math.round(distanceInMeters);
    }

    try {
      if (isEditing && typeof activityId === 'number') {
        // Update existing activity
        const updatedActivity = await updateActivity(activityId, activityPayload);
        if (updatedActivity) {
          Alert.alert('Success', 'Activity updated successfully!');
          navigation.goBack();
        } else {
          // Error is logged within updateActivity, show generic message
          Alert.alert('Error', 'Failed to update activity. Please try again.');
        }
      } else {
        // Add new activity
        const newActivity = await addActivity(activityPayload);
        if (newActivity) {
          Alert.alert('Success', 'Activity logged successfully!');
          navigation.goBack();
        } else {
          // Error is logged within addActivity, show generic message
          Alert.alert('Error', 'Failed to log activity. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error saving activity:', error);
      Alert.alert('Error', 'An unexpected error occurred while saving the activity.');
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
             'Log your non-plan workouts'}
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

              {shouldShowDistance && (
                <>
                  <Text style={styles.label}>Distance ({distanceUnit})</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TextInput
                      style={[styles.input, { flex: 1, marginRight: 10 }]}
                      value={distance}
                      onChangeText={setDistance}
                      placeholder="e.g., 5.2"
                      keyboardType="decimal-pad"
                      returnKeyType="done"
                    />
                    <TouchableOpacity 
                      style={[styles.unitButton, distanceUnit === 'km' && styles.unitButtonActive]}
                      onPress={() => setDistanceUnit('km')}
                    >
                      <Text style={[styles.unitButtonText, distanceUnit === 'km' && styles.unitButtonTextActive]}>
                        km
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.unitButton, distanceUnit === 'mi' && styles.unitButtonActive, { marginLeft: 5 }]}
                      onPress={() => setDistanceUnit('mi')}
                    >
                      <Text style={[styles.unitButtonText, distanceUnit === 'mi' && styles.unitButtonTextActive]}>
                        mi
                      </Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}

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

        {/* Save Activity FAB */}
        <View style={styles.fabContainer}>
          <TouchableOpacity 
            onPress={handleSaveActivity}
            activeOpacity={0.8}
            style={styles.fab}
          >
            <Text style={styles.fabText}>
              {isRunNotesEdit ? 'Save Notes' : isEditing ? 'Update' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  // FAB styles
  fabContainer: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  fab: {
    backgroundColor: '#f97316',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 28,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  fabText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
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
    paddingBottom: 100, // Extra padding at bottom for FAB
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
    alignItems: 'center',
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
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Styles for distance unit toggle buttons
  unitButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#f8f9fa',
  },
  unitButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  unitButtonText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '500',
  },
  unitButtonTextActive: {
    color: '#fff',
  },
});

export default LogActivityScreen;

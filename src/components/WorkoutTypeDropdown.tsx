import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList, Platform } from 'react-native';
import { ChevronDown } from 'lucide-react-native';
import { ActivityType, ACTIVITY_TYPES, WORKOUT_TYPE_DISPLAY_NAMES } from '../constants/workoutConstants';
import { useTheme } from '../theme/ThemeProvider';

interface WorkoutTypeDropdownProps {
  selectedActivity: ActivityType;
  onSelect: (activity: ActivityType) => void;
  disabled?: boolean;
  style?: object;
}

const WorkoutTypeDropdown: React.FC<WorkoutTypeDropdownProps> = ({
  selectedActivity,
  onSelect,
  disabled = false,
  style,
}) => {
  const [showOptions, setShowOptions] = useState(false);
  const theme = useTheme();
  const styles = createStyles(theme);
  
  // Filter to only show the specified activity types
  const filteredActivityTypes = ACTIVITY_TYPES.filter(type => 
    ['Run', 'Walk', 'Hike', 'Cycle', 'Trail Run', 'Mountain Bike'].includes(type)
  );

  const toggleOptions = useCallback(() => {
    if (!disabled) {
      setShowOptions(prev => !prev);
    }
  }, [disabled]);

  const handleSelect = useCallback((activity: ActivityType) => {
    onSelect(activity);
    setShowOptions(false);
  }, [onSelect]);

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity 
        onPress={toggleOptions} 
        style={[
          styles.dropdownButton,
          disabled && styles.disabledButton,
        ]}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <Text style={styles.selectedText} numberOfLines={1}>
          {WORKOUT_TYPE_DISPLAY_NAMES[selectedActivity]}
        </Text>
        <ChevronDown 
          size={20} 
          color={theme.colors.text.primary} 
          style={styles.dropdownIcon}
        />
      </TouchableOpacity>

      <Modal
        visible={showOptions}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowOptions(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowOptions(false)}
        >
          <View style={styles.modalContent}>
            <FlatList
              data={filteredActivityTypes}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={[
                    styles.optionItem,
                    selectedActivity === item && styles.selectedOption
                  ]} 
                  onPress={() => handleSelect(item as ActivityType)}
                >
                  <Text 
                    style={[
                      styles.optionText,
                      selectedActivity === item && styles.selectedOptionText
                    ]}
                  >
                    {WORKOUT_TYPE_DISPLAY_NAMES[item as ActivityType]}
                  </Text>
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.optionsList}
              showsVerticalScrollIndicator={false}
              initialNumToRender={10}
              maxToRenderPerBatch={20}
              windowSize={10}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 8,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: theme.colors.background.secondary,
    borderWidth: 1,
    borderColor: theme.colors.border.primary,
  },
  disabledButton: {
    opacity: 0.6,
  },
  selectedText: {
    fontSize: 16,
    color: theme.colors.text.primary,
    fontWeight: '500',
    flex: 1,
  },
  dropdownIcon: {
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    maxHeight: '60%',
    backgroundColor: theme.colors.background.primary,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border.primary,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  optionsList: {
    paddingBottom: 8,
  },
  optionItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginVertical: 2,
    backgroundColor: theme.colors.background.secondary + '80',
  },
  selectedOption: {
    backgroundColor: theme.colors.primary + '20',
  },
  optionText: {
    fontSize: 16,
    color: theme.colors.text.primary,
  },
  selectedOptionText: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
});

export default React.memo(WorkoutTypeDropdown);

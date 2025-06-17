import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '../theme/ThemeProvider';

// Import screens
import HistoryScreen from '../screens/HistoryScreen';
import ActivityHistoryScreen from '../screens/ActivityHistoryScreen';

// Import types
import { RootStackParamList } from './types';

// Create a stack navigator for the History tab
const Stack = createNativeStackNavigator<RootStackParamList>();

export const HistoryStack = () => {
  const theme = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: theme.colors.background,
        },
        headerTintColor: theme.colors.text.primary,
        headerTitleStyle: {
          fontWeight: '600',
        },
        contentStyle: { 
          backgroundColor: theme.colors.background 
        },
      }}
    >
      <Stack.Screen 
        name="HistoryList" 
        component={HistoryScreen} 
        options={{ 
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="ActivityHistory" 
        component={ActivityHistoryScreen} 
        options={({ route }) => ({
          title: 'Activity Details',
          // You can add more options here if needed
        })}
      />
    </Stack.Navigator>
  );
};

export default HistoryStack;

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '../theme/ThemeProvider';
import TrainingPlanScreen from '../screens/TrainingPlanScreen';
import { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const TrainingPlanStack = () => {
  const theme = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <Stack.Screen 
        name="TrainingPlanMain" 
        component={TrainingPlanScreen as React.ComponentType<any>}
        options={{
          headerShown: false, // Hide the stack header since we have a custom one in the component
          title: 'Training Plan'
        }}
      />
    </Stack.Navigator>
  );
};

export default TrainingPlanStack;

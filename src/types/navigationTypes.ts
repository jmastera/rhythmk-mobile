// Navigation types for the Rhythmk app
import { TrainingPlan } from '../types/planTypes';

export type RootStackParamList = {
  Home: undefined;
  History: undefined;
  Progress: undefined;
  Settings: undefined;
  RaceGoal: undefined;
  WorkoutDetail: { 
    workoutId: string;
  };
  WorkoutTracker: { 
    currentPlan?: TrainingPlan;
  };
};

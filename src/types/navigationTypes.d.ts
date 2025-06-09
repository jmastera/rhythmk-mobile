// Type declarations for navigationTypes.ts
import { TrainingPlan } from './planTypes';

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

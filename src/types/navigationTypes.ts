// Navigation types for the Rhythmk app
import { TrainingPlan } from '../types/planTypes';
import { Route } from './routeTypes';

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
    routeToFollow?: Route;
  };
};

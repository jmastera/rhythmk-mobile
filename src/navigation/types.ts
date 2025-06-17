import { Route } from '../types/routeTypes';
import { TrainingPlan } from '../types/planTypes';

// Main Tab Navigator Params
export type BottomTabParamList = {
  Home: undefined;
  StartRun: undefined;
  Routes: undefined;
  Progress: undefined;
  RaceGoal: undefined;
  TrainingPlan: undefined;
  History: undefined;
  Settings: undefined;
};

// Root Stack Navigator Params
export type RootStackParamList = {
  // Auth Flow
  Auth: undefined;
  
  // Main Tabs
  MainTabs: undefined;
  
  // Tab Screens
  StartRun: undefined;
  
  // Start Run Flow
  ReadyToRun: undefined;
  WorkoutTracker: { 
    routeToFollow?: Route;
    currentPlan?: TrainingPlan;
  };
  
  // Home Stack
  Index: undefined;
  LogActivity: undefined;
  
  // Progress Stack
  Progress: undefined;
  ProgressMain: undefined;
  
  // History Stack
  HistoryList: undefined;
  ActivityHistory: { activityId: string };
  
  // Routes Stack
  Routes: undefined; // Keep for backward compatibility
  RoutesList: undefined;
  RouteDetails: { routeId: string };
  RaceGoal: undefined; // For the tab
  
  // Main screens for tabs with stack navigators
  TrainingPlanMain: undefined;
  SettingsMain: undefined;
  RaceGoalMain: { 
    goalId?: string;
  };
  
  // Settings Stack
  Settings: undefined;
  TrainingPlan: {
    fitnessLevel: string;
    raceType: string;
    isPreview?: boolean;
  };
  
  // Other Screens
  NotFound: undefined;
};

// Combine all navigation params for type safety
export type NavigationParamList = RootStackParamList & BottomTabParamList;

// Navigation prop types for type-safe navigation
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}

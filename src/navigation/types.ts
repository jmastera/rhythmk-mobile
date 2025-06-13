import { Route } from '../types/routeTypes';

export type RootStackParamList = {
  Index: undefined;
  Home: undefined;
  Settings: undefined;
  Routes: undefined;
  RouteDetails: { routeId: string };
  WorkoutTracker: { routeToFollow?: Route };
  RaceGoal: undefined;
  Progress: undefined;
  History: undefined;
  LogActivity: undefined;
  NotFound: undefined;
};

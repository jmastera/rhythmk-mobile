// User settings and preferences types

export type DisplayUnit = 'km' | 'miles';

export interface RaceGoal {
  type: '5k' | '10k' | 'half_marathon' | 'marathon' | 'custom';
  targetTime?: number; // In seconds
  targetDate?: string; // ISO string
}

export interface UserSettings {
  userId?: string;
  displayName?: string;
  email?: string;
  displayUnit: DisplayUnit;
  fitnessLevel?: 'beginner' | 'intermediate' | 'advanced';
  raceGoal?: RaceGoal;
  preferredRunningDays?: number[]; // 0-6 for days of week
  userWeight?: number; // In kg
  userHeight?: number; // In cm
  birthYear?: number;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  darkMode?: boolean;
  audioPrompts?: boolean;
  notificationsEnabled?: boolean;
}

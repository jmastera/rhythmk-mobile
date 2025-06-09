// Training plan related types

export type RaceType = '5k' | '10k' | 'half_marathon' | 'marathon' | 'custom';
export type FitnessLevel = 'beginner' | 'intermediate' | 'advanced';

export interface TrainingPlan {
  id: string;
  name: string;
  raceType: RaceType;
  fitnessLevel: FitnessLevel;
  weeks: number;
  sessions: number;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PlanSession {
  id: string;
  planId: string;
  day: number; // 0-6 for days of week
  week: number; // 1-based week number
  sessionType: string; // e.g., "easy", "tempo", "intervals", "long"
  distance?: number; // in meters
  duration?: number; // in seconds
  description: string;
  completed?: boolean;
}

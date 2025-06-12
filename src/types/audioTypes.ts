export type AudioCueFrequency = '1km' | '0.5km' | '0.25km' | '2km' | '5km' | 'manual';

export interface AudioCueSettingsData {
  // Audio cues general settings
  enabled: boolean;
  volume: number; // 0-1
  distanceUnit: 'km' | 'miles';
  
  // Distance announcements
  announceDistance: boolean;
  distanceInterval: number;
  
  // Time announcements
  announceTime: boolean;
  timeInterval: number; // in minutes
  
  // Pace announcements
  announcePace: boolean;
  targetPace?: string; // mm:ss format
  paceTolerance?: number; // seconds
  
  // Additional announcements
  announceCalories: boolean;
  splitAnnouncementsEnabled: boolean;
  
  // Internal fields
  id?: string;
  user_id?: string;
  name?: string;
  frequency?: AudioCueFrequency;
  content?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

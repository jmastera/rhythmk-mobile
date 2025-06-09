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
  splitAnnouncementsEnabled?: boolean;
}

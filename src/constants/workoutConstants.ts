// Activity types that support GPS tracking
export const GPS_ACTIVITIES = [
  'Run',
  'Walk',
  'Hike',
  'Cycle',
  'Trail Run',
  'Mountain Bike',
  'Nordic Ski',
  'Alpine Ski',
  'Snowboard',
  'Kayak',
  'Rowing',
  'Stand Up Paddle',
  'Kitesurfing',
  'Windsurfing',
  'Swim'
] as const;

// Activity types that require manual entry
export const MANUAL_ACTIVITIES = [
  'Yoga',
  'Weight Training',
  'HIIT',
  'Pilates',
  'CrossFit',
  'Elliptical',
  'Stair Stepper',
  'Rowing Machine',
  'Swim (Indoor)',
  'Boxing',
  'Martial Arts',
  'Dance',
  'Barre',
  'Climbing',
  'Other'
] as const;

// All activity types
export const ACTIVITY_TYPES = [
  ...GPS_ACTIVITIES,
  ...MANUAL_ACTIVITIES
] as const;

export type ActivityType = typeof ACTIVITY_TYPES[number];

// Default activity type
const DEFAULT_ACTIVITY: ActivityType = 'Run';

export const WORKOUT_TYPE_DISPLAY_NAMES: Record<ActivityType, string> = {
  'Run': 'Run',
  'Walk': 'Walk',
  'Hike': 'Hike',
  'Cycle': 'Cycle',
  'Trail Run': 'Trail Run',
  'Mountain Bike': 'Mountain Bike',
  'Nordic Ski': 'Nordic Ski',
  'Alpine Ski': 'Alpine Ski',
  'Snowboard': 'Snowboard',
  'Kayak': 'Kayak',
  'Rowing': 'Rowing',
  'Stand Up Paddle': 'Stand Up Paddle',
  'Kitesurfing': 'Kitesurfing',
  'Windsurfing': 'Windsurfing',
  'Swim': 'Open Water Swim',
  'Yoga': 'Yoga',
  'Weight Training': 'Weight Training',
  'HIIT': 'HIIT',
  'Pilates': 'Pilates',
  'CrossFit': 'CrossFit',
  'Elliptical': 'Elliptical',
  'Stair Stepper': 'Stair Stepper',
  'Rowing Machine': 'Rowing Machine',
  'Swim (Indoor)': 'Swim (Indoor)',
  'Boxing': 'Boxing',
  'Martial Arts': 'Martial Arts',
  'Dance': 'Dance',
  'Barre': 'Barre',
  'Climbing': 'Climbing',
  'Other': 'Other'
};

// Check if an activity type is GPS-based
export const isGpsActivity = (activity: ActivityType): boolean => {
  return (GPS_ACTIVITIES as readonly string[]).includes(activity);
};

// Get the default activity type based on screen context
export const getDefaultActivity = (defaultType: ActivityType = DEFAULT_ACTIVITY): ActivityType => {
  return defaultType;
};

export interface TrainingPlan {
  id: string; // Unique identifier for the plan
  name: string; // e.g., "Beginner 5K", "Marathon Prep"
  type?: string; // e.g., "5K", "10K", "Half Marathon", "Marathon", "Custom"
  targetDistance?: number; // in meters
  targetPace?: number; // decimal minutes per km or mile, depending on user settings context
  // Consider adding other plan details like description, duration (weeks), etc.
}

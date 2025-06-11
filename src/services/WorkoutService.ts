import { supabase } from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid';

export interface Workout {
  id?: string;
  date: string;
  duration: number;
  distance: number;
  avgPace?: number | null;
  coordinates: any[];
  planName?: string | null;
  totalElevationGain?: number;
  totalElevationLoss?: number;
  notes?: string | null;
  calories?: number | null;
  avgHeartRate?: number | null;
  splits: any[];
  trackingMode?: string | null;
  steps?: number;
  user_id?: string; // Will be set by Supabase RLS
}

const TABLE_NAME = 'workouts';

export const WorkoutService = {
  // Create a new workout
  async createWorkout(workoutData: any): Promise<Workout> {
    try {
      console.log('Creating workout in Supabase with data:', JSON.stringify(workoutData, null, 2));
      
      // Ensure required fields are present
      if (!workoutData.user_id) {
        throw new Error('User ID is required');
      }
      
      if (workoutData.distance === undefined || workoutData.duration === undefined) {
        throw new Error('Distance and duration are required');
      }
      
      // Prepare the workout data for Supabase
      const workoutToSave = {
        ...workoutData,
        id: uuidv4(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      console.log('Saving to Supabase:', JSON.stringify(workoutToSave, null, 2));

      // Insert the workout
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .insert(workoutToSave)
        .select()
        .single();

      if (error) {
        console.error('Supabase insert error:', error);
        throw new Error(`Failed to save workout: ${error.message}`);
      }
      
      if (!data) {
        throw new Error('No data returned from Supabase insert');
      }
      
      console.log('✅ Workout created successfully in Supabase');
      return data as Workout;
      
    } catch (error) {
      console.error('❌ Error in createWorkout:', error);
      throw error;
    }
  },

  // Get all workouts
  async getWorkouts(): Promise<Workout[]> {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .order('date', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Get a single workout by ID
  async getWorkoutById(id: string): Promise<Workout | null> {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return data;
  },

  // Update a workout
  async updateWorkout(id: string, updates: Partial<Workout>): Promise<Workout> {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .update(updates)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // Delete a workout
  async deleteWorkout(id: string): Promise<void> {
    const { error } = await supabase
      .from(TABLE_NAME)
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Subscribe to real-time updates
  subscribeToWorkouts(callback: (payload: any) => void) {
    const subscription = supabase
      .channel('workouts')
      .on('postgres_changes', { event: '*', schema: 'public', table: TABLE_NAME }, callback)
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  },
};

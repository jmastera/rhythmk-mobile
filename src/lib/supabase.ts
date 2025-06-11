import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Database } from '../types/database.types';

// These should be moved to environment variables
const supabaseUrl = 'https://isetreoiidnzqrgclvgu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzZXRyZW9paWRuenFyZ2Nsdmd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1OTg5NDAsImV4cCI6MjA2NTE3NDk0MH0.Bvj6LnI_vPAGHfWim_yvTHSV6WKs9v8OtU7Id6o3L_o';

// Create a single supabase client for interacting with your database
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Helper type for our settings
export type UserProfile = Database['public']['Tables']['profiles']['Row'];
export type UserPreferences = Database['public']['Tables']['user_preferences']['Row'];
export type AudioCueSetting = Database['public']['Tables']['audio_cue_settings']['Row'];
// Profile functions
export const getProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
    
  if (error) throw error;
  return data;
};

export const updateProfile = async (userId: string, updates: Partial<UserProfile>) => {
  // First try to update the existing profile
  const { data: updatedData, error: updateError } = await supabase
    .from('profiles')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select()
    .single();
    
  // If the update fails because the row doesn't exist, create it
  if (updateError?.code === 'PGRST116' || updateError?.code === 'PGRST110') {
    // Get the current session to access user email
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Error getting auth session:', sessionError);
      throw sessionError;
    }
    
    const userEmail = session?.user?.email;
    
    if (!userEmail) {
      throw new Error('User email not found in session');
    }
    
    // Create the profile with the required email field
    const { data: newData, error: createError } = await supabase
      .from('profiles')
      .insert([
        {
          id: userId,
          email: userEmail,
          ...updates,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      ])
      .select()
      .single();
      
    if (createError) {
      console.error('Error creating profile:', createError);
      throw createError;
    }
    return newData;
  }
  
  if (updateError) {
    console.error('Error updating profile:', updateError);
    throw updateError;
  }
  
  return updatedData;
};

// Preferences functions
export const getPreferences = async (userId: string) => {
  // Verify we have a valid session
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error('No active session. User must be authenticated to get preferences.');
  }

  const { data, error } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', userId)
    .single();
    
  if (error) {
    if (error.code === 'PGRST116') { // No rows returned
      try {
        // Create default preferences if they don't exist
        const { data: newPrefs, error: createError } = await supabase
          .from('user_preferences')
          .insert({
            user_id: userId,
            display_unit: 'km',
            height_unit: 'cm',
            weight_unit: 'kg',
            show_debug_info: false,
            render_maps: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();
          
        if (createError) {
          console.error('Error creating default preferences:', createError);
          throw createError;
        }
        return newPrefs;
      } catch (err) {
        console.error('Failed to create default preferences:', err);
        // Return default preferences object if creation fails
        return {
          user_id: userId,
          display_unit: 'km',
          height_unit: 'cm',
          weight_unit: 'kg',
          show_debug_info: false,
          render_maps: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      }
    }
    console.error('Error fetching preferences:', error);
    // Return default preferences on error
    return {
      user_id: userId,
      display_unit: 'km',
      height_unit: 'cm',
      weight_unit: 'kg',
      show_debug_info: false,
      render_maps: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }
  return data;
};

export const updatePreferences = async (userId: string, updates: Partial<UserPreferences>) => {
  // First, verify we have a valid session
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error('No active session. User must be authenticated to update preferences.');
  }

  // First, try to update the existing record
  const { data: updatedData, error: updateError } = await supabase
    .from('user_preferences')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .select()
    .single();
    
  // If the update fails because the record doesn't exist, create it
  if (updateError?.code === 'PGRST116' || updateError?.code === 'PGRST110') {
    try {
      const { data: newPrefs, error: createError } = await supabase
        .from('user_preferences')
        .insert({
          user_id: userId,
          ...updates,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
        
      if (createError) {
        console.error('Error creating preferences:', createError);
        // If we can't create, return the updates as if they were saved
        return { user_id: userId, ...updates } as UserPreferences;
      }
      return newPrefs;
    } catch (err) {
      console.error('Failed to create preferences:', err);
      // Return the updates as if they were saved
      return { user_id: userId, ...updates } as UserPreferences;
    }
  }
  
  if (updateError) {
    console.error('Error updating preferences:', updateError);
    // Return the updates as if they were saved
    return { user_id: userId, ...updates } as UserPreferences;
  }
  
  return updatedData || { user_id: userId, ...updates } as UserPreferences;
};

// Audio Cue functions
export const getAudioCueSettings = async (userId: string) => {
  const { data, error } = await supabase
    .from('audio_cue_settings')
    .select('*')
    .eq('user_id', userId);
    
  if (error) throw error;
  return data;
};

export const updateAudioCueSetting = async (id: string, updates: Partial<AudioCueSetting>) => {
  const { data, error } = await supabase
    .from('audio_cue_settings')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();
    
  if (error) throw error;
  return data;
};

export const createAudioCueSetting = async (setting: Omit<AudioCueSetting, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('audio_cue_settings')
    .insert(setting)
    .select()
    .single();
    
  if (error) throw error;
  return data;
};

export const deleteAudioCueSetting = async (id: string) => {
  const { error } = await supabase
    .from('audio_cue_settings')
    .delete()
    .eq('id', id);
    
  if (error) throw error;
  return true;
};

// Check if workouts table exists and has required columns
export const ensureWorkoutsTable = async () => {
  try {
    console.log('🔍 Checking if workouts table exists...');
    
    // First, try a simple query to check table existence
    const { data, error, status } = await supabase
      .from('workouts')
      .select('id', { count: 'exact', head: true });
      
    console.log('📊 Table check status:', status);
    
    if (error) {
      if (error.code === '42P01') { // Table doesn't exist
        console.error('❌ Workouts table does not exist in the database');
        return { 
          success: false, 
          error: 'Workouts table does not exist',
          code: 'TABLE_NOT_FOUND'
        };
      }
      
      console.error('❌ Error checking workouts table:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      
      return { 
        success: false, 
        error: `Database error: ${error.message}`,
        code: error.code || 'UNKNOWN_ERROR'
      };
    }
    
    console.log('✅ Workouts table exists and is accessible');
    console.log('ℹ️ Table row count:', data?.length || 0);
    
    return { 
      success: true,
      rowCount: data?.length || 0
    };
    
  } catch (error) {
    console.error('❌ Unexpected error checking workouts table:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      code: 'UNEXPECTED_ERROR'
    };
  }
};

// Test the connection with detailed feedback
export const testConnection = async () => {
  try {
    console.log('🔌 Testing Supabase connection...');
    
    // 1. First test basic connectivity
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.error('❌ Auth error:', authError);
      return { 
        connected: false,
        error: 'Authentication failed',
        details: authError.message,
        code: authError.status || 'AUTH_ERROR'
      };
    }
    
    console.log('✅ Authentication successful');
    
    // 2. Test database access
    console.log('🔍 Testing database connection...');
    const { data, error, status, count } = await supabase
      .from('workouts')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.error('❌ Database query error:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      
      return { 
        connected: false, 
        error: 'Database query failed',
        details: error.message,
        code: error.code || 'QUERY_ERROR',
        status
      };
    }
    
    console.log(`✅ Database connection successful. Found ${count || 0} workout records`);
    
    return { 
      connected: true, 
      status,
      rowCount: count || 0,
      user: authData.session?.user?.email || 'No active session',
      data: data || [] 
    };
  } catch (error: any) {
    console.error('Supabase connection error:', error);
    return { 
      connected: false, 
      error: error.message || 'Unknown error occurred',
      details: error.toString()
    };
  }
};

export const getActivities = async () => {
  try {
    // Get the current user's ID
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.log('No user logged in, cannot fetch activities');
      return [];
    }

    const { data, error } = await supabase
      .from('workouts')
      .select('*')
      .eq('user_id', user.id) // Only fetch activities for the current user
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching activities:', error);
      return [];
    }

    console.log(`Fetched ${data.length} activities for user ${user.id}`);
    return data;
  } catch (error) {
    console.error('Unexpected error fetching activities:', error);
    return [];
  }
};

// Define the structure for activity data based on LogActivityScreen and Supabase schema
export interface ActivityData {
  type: string; // Mapped from activityType
  customActivityName?: string | null; // Will be prepended to notes
  date: string; // ISO string
  duration: number; // in seconds
  intensity?: string | null; // Optional: Supabase table might need this column
  notes?: string | null;
  calories?: number | null; // Mapped from caloriesBurned
  // Fields not typically set by manual log, will be null or default in DB:
  // distance, avgPace, coordinates, planName, totalElevationGain, totalElevationLoss,
  // avgHeartRate, splits, trackingMode, steps, endTime, planId
}

export const addActivity = async (activityData: Omit<ActivityData, 'customActivityName'> & { customActivityName?: string | null }) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    let combinedNotes = activityData.notes || '';
    if (activityData.customActivityName) {
      combinedNotes = activityData.customActivityName + (combinedNotes ? `\n\n${combinedNotes}` : '');
    }

    const { customActivityName, ...dataToInsert } = activityData; // Exclude customActivityName from direct insert

    const { data, error } = await supabase
      .from('workouts')
      .insert([
        {
          ...dataToInsert,
          notes: combinedNotes || null,
          user_id: user.id,
          // Ensure other fields required by DB but not in ActivityData have defaults or are nullable
          distance: null,
          avgPace: null,
          coordinates: null,
          planName: null, // Manually logged activities usually don't have a planName from a training plan
          totalElevationGain: null,
          totalElevationLoss: null,
          avgHeartRate: null,
          splits: null,
          trackingMode: null,
          steps: null,
          endTime: null, // Can be same as date if needed, or null
          planId: null,
        },
      ])
      .select();

    if (error) {
      console.error('Error adding activity:', error.message, error.details);
      throw error;
    }
    return data ? data[0] : null;
  } catch (error) {
    console.error('Unexpected error in addActivity:', error);
    throw error;
  }
};

export const updateActivity = async (id: number, activityData: Omit<ActivityData, 'customActivityName'> & { customActivityName?: string | null }) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    let combinedNotes = activityData.notes || '';
    if (activityData.customActivityName) {
      combinedNotes = activityData.customActivityName + (combinedNotes ? `\n\n${combinedNotes}` : '');
    }
    
    const { customActivityName, ...dataToUpdate } = activityData; // Exclude customActivityName from direct update object

    const { data, error } = await supabase
      .from('workouts')
      .update({
        ...dataToUpdate,
        notes: combinedNotes || null,
        // user_id should not change on update typically
      })
      .match({ id, user_id: user.id }) // Ensure user can only update their own activities
      .select();

    if (error) {
      console.error('Error updating activity:', error.message, error.details);
      throw error;
    }
    return data ? data[0] : null;
  } catch (error) {
    console.error('Unexpected error in updateActivity:', error);
    throw error;
  }
};

export const deleteActivity = async (id: number) => {
  try {
    const { error } = await supabase
      .from('workouts')
      .delete()
      .match({ id });

    if (error) {
      console.error('Error deleting activity:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Unexpected error deleting activity:', error);
    return false;
  }
};

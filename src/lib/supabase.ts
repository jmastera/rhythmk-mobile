import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// These should be moved to environment variables
const supabaseUrl = 'https://isetreoiidnzqrgclvgu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzZXRyZW9paWRuenFyZ2Nsdmd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1OTg5NDAsImV4cCI6MjA2NTE3NDk0MH0.Bvj6LnI_vPAGHfWim_yvTHSV6WKs9v8OtU7Id6o3L_o';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

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

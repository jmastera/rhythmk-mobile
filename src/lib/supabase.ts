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

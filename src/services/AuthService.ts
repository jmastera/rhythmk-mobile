import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

export const AuthService = {
  async signUp(email: string, password: string) {
    console.log('Attempting to sign up with email:', email);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    
    if (error) {
      console.error('Sign up error:', error);
      throw error;
    }
    
    console.log('Sign up successful:', data);
    return data;
  },

  async signIn(email: string, password: string) {
    console.log('Attempting to sign in with email:', email);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      console.error('Sign in error:', error);
      throw error;
    }
    
    console.log('Sign in successful');
    return data;
  },

  async signOut() {
    console.log('Signing out...');
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('Sign out error:', error);
      throw error;
    }
    
    console.log('Sign out successful');
  },

  async getCurrentUser() {
    console.log('Fetching current user...');
    const { data: authData, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('Error fetching current user:', authError);
      throw authError;
    }
    
    if (!authData.user) {
      return { user: null };
    }
    
    // Fetch the user's profile data
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();
    
    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      // Don't throw error here, as the user is still logged in
      // Just return the auth user without the profile data
      return { user: authData.user };
    }
    
    // Merge the auth user with the profile data
    const userWithProfile = {
      ...authData.user,
      user_metadata: {
        ...authData.user.user_metadata,
        ...profileData
      }
    };
    
    console.log('Current user with profile:', userWithProfile.email);
    return { user: userWithProfile };
  },

  onAuthStateChange(callback: (event: string, session: any) => void) {
    console.log('Setting up auth state change listener');
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
      
      if (session?.user) {
        // Fetch the user's profile data
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
          
        if (!error && profileData) {
          // Merge the auth user with the profile data
          session.user = {
            ...session.user,
            user_metadata: {
              ...session.user.user_metadata,
              ...profileData
            }
          };
        }
      }
      
      callback(event, session);
    });
    
    return { subscription };
  },

  // Password reset
  async resetPassword(email: string) {
    console.log('Initiating password reset for:', email);
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    
    if (error) {
      console.error('Password reset error:', error);
      throw error;
    }
    
    console.log('Password reset email sent');
  },

  // Update user profile
  async updateProfile(updates: { 
    fullName?: string; 
    avatarUrl?: string;
    firstName?: string;
    lastName?: string;
    displayName?: string;
    birthDate?: string;
    gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
    data?: Record<string, any>;
  }) {
    console.log('Updating user profile:', updates);
    const { fullName, avatarUrl, data, ...profileUpdates } = updates;
    
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    try {
      // Prepare auth updates
      const authUpdates: { data?: Record<string, any> } = {};
      const authData: Record<string, any> = {};
      
      // Add fullName and avatarUrl to auth data
      if (fullName !== undefined) authData.fullName = fullName;
      if (avatarUrl !== undefined) authData.avatarUrl = avatarUrl;
      
      // Add any additional data to auth data
      if (data) {
        Object.assign(authData, data);
      }
      
      // Only include data in auth updates if there are any
      if (Object.keys(authData).length > 0) {
        authUpdates.data = authData;
      }
      
      // Update auth data if there are any updates
      if (Object.keys(authUpdates).length > 0) {
        const { error: authError } = await supabase.auth.updateUser(authUpdates);
        if (authError) throw authError;
      }
      
      // Update profiles table if there are profile updates
      if (Object.keys(profileUpdates).length > 0) {
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            email: user.email,
            ...profileUpdates,
            updated_at: new Date().toISOString(),
          });
          
        if (profileError) throw profileError;
      }
      
      console.log('Profile updated successfully');
      return { user };
      
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  },

  // Get session
  async getSession() {
    console.log('Fetching current session...');
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Error fetching session:', error);
      throw error;
    }
    
    console.log('Session retrieved:', data.session ? 'valid' : 'no session');
    return data;
  }
};

export type { User };

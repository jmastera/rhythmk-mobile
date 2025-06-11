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
    const { data, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('Error fetching current user:', error);
      throw error;
    }
    
    console.log('Current user:', data.user?.email);
    return { user: data.user };
  },

  onAuthStateChange(callback: (event: string, session: any) => void) {
    console.log('Setting up auth state change listener');
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
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
  async updateProfile(updates: { fullName?: string; avatarUrl?: string }) {
    console.log('Updating user profile:', updates);
    const { data, error } = await supabase.auth.updateUser({
      data: updates
    });
    
    if (error) {
      console.error('Profile update error:', error);
      throw error;
    }
    
    console.log('Profile updated successfully');
    return data;
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

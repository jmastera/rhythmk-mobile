// src/types/database.types.ts
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          first_name: string | null;
          last_name: string | null;
          display_name: string | null;
          email: string;
          birth_date: string | null;
          gender: 'male' | 'female' | 'other' | 'prefer_not_to_say' | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          first_name?: string | null;
          last_name?: string | null;
          display_name?: string | null;
          email: string;
          birth_date?: string | null;
          gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say' | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          first_name?: string | null;
          last_name?: string | null;
          display_name?: string | null;
          email?: string;
          birth_date?: string | null;
          gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say' | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_preferences: {
        Row: {
          user_id: string;
          display_unit: 'km' | 'miles';
          height_unit: 'cm' | 'ft-in';
          weight_unit: 'kg' | 'lb';
          user_weight_kg: number | null;
          user_height_cm: number | null;
          dark_mode: boolean;
          audio_prompts: boolean;
          notifications_enabled: boolean;
          show_map: boolean;
          show_coach_tips: boolean;
          show_calories: boolean;
          show_elevation: boolean;
          countdown_duration: number;
          use_pedometer: boolean;
          show_debug_info: boolean;
          render_maps_debug: boolean;
          workout_card_settings: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          display_unit?: 'km' | 'miles';
          height_unit?: 'cm' | 'ft-in';
          weight_unit?: 'kg' | 'lb';
          user_weight_kg?: number | null;
          user_height_cm?: number | null;
          dark_mode?: boolean;
          audio_prompts?: boolean;
          notifications_enabled?: boolean;
          show_map?: boolean;
          show_coach_tips?: boolean;
          show_calories?: boolean;
          show_elevation?: boolean;
          countdown_duration?: number;
          use_pedometer?: boolean;
          show_debug_info?: boolean;
          render_maps_debug?: boolean;
          workout_card_settings?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          display_unit?: 'km' | 'miles';
          height_unit?: 'cm' | 'ft-in';
          weight_unit?: 'kg' | 'lb';
          user_weight_kg?: number | null;
          user_height_cm?: number | null;
          dark_mode?: boolean;
          audio_prompts?: boolean;
          notifications_enabled?: boolean;
          show_map?: boolean;
          show_coach_tips?: boolean;
          show_calories?: boolean;
          show_elevation?: boolean;
          countdown_duration?: number;
          use_pedometer?: boolean;
          show_debug_info?: boolean;
          render_maps_debug?: boolean;
          workout_card_settings?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      audio_cue_settings: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          enabled: boolean;
          volume: number;
          frequency: '0.25km' | '0.5km' | '1km' | '2km' | '5km' | 'manual';
          content: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          enabled?: boolean;
          volume?: number;
          frequency?: '0.25km' | '0.5km' | '1km' | '2km' | '5km' | 'manual';
          content?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          enabled?: boolean;
          volume?: number;
          frequency?: '0.25km' | '0.5km' | '1km' | '2km' | '5km' | 'manual';
          content?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
import { Platform } from 'react-native';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

// Custom storage that works in SSR context (no window)
const createStorage = () => {
  // During SSR/node rendering, provide a no-op storage
  if (typeof window === 'undefined') {
    return {
      getItem: async (_key: string) => null,
      setItem: async (_key: string, _value: string) => {},
      removeItem: async (_key: string) => {},
    };
  }

  // In browser/native context, use AsyncStorage
  // Lazy import to avoid SSR issues
  const AsyncStorage = require('@react-native-async-storage/async-storage').default;
  return AsyncStorage;
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: createStorage(),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          full_name: string;
          email: string;
          phone: string | null;
          role: 'customer' | 'chef';
          profile_photo_url: string | null;
          city: string | null;
          area: string | null;
          created_at: string;
          is_verified: boolean;
          is_active: boolean;
        };
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['users']['Insert']>;
      };
      chef_profiles: {
        Row: {
          id: string;
          user_id: string;
          kitchen_name: string;
          bio: string | null;
          specialty_tags: string[];
          cover_photo_url: string | null;
          rating_average: number;
          total_reviews: number;
          total_orders_fulfilled: number;
          response_rate: number;
          is_open: boolean;
          delivery_radius_km: number;
          latitude: number | null;
          longitude: number | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['chef_profiles']['Row'], 'id' | 'created_at' | 'rating_average' | 'total_reviews' | 'total_orders_fulfilled' | 'response_rate'>;
        Update: Partial<Database['public']['Tables']['chef_profiles']['Insert']>;
      };
      daily_posts: {
        Row: {
          id: string;
          chef_id: string;
          title: string;
          description: string | null;
          photos: string[];
          price: number;
          available_quantity: number;
          remaining_quantity: number;
          order_deadline: string;
          delivery_available: boolean;
          pickup_available: boolean;
          preorder_allowed: boolean;
          is_sold_out: boolean;
          is_active: boolean;
          created_at: string;
          date: string;
        };
        Insert: Omit<Database['public']['Tables']['daily_posts']['Row'], 'id' | 'created_at' | 'is_sold_out'>;
        Update: Partial<Database['public']['Tables']['daily_posts']['Insert']>;
      };
      orders: {
        Row: {
          id: string;
          customer_id: string;
          chef_id: string;
          post_id: string;
          quantity: number;
          unit_price: number;
          total_price: number;
          customer_note: string | null;
          delivery_type: 'delivery' | 'pickup';
          delivery_address: string | null;
          payment_method: 'card' | 'cash';
          payment_status: 'paid' | 'pending';
          order_status: 'received' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered' | 'cancelled';
          scheduled_time: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['orders']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['orders']['Insert']>;
      };
      reviews: {
        Row: {
          id: string;
          order_id: string;
          customer_id: string;
          chef_id: string;
          post_id: string;
          overall_rating: number;
          taste_rating: number;
          packaging_rating: number;
          accuracy_rating: number;
          comment: string | null;
          photos: string[];
          chef_reply: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['reviews']['Row'], 'id' | 'created_at' | 'chef_reply'>;
        Update: Partial<Database['public']['Tables']['reviews']['Insert']>;
      };
      addresses: {
        Row: {
          id: string;
          user_id: string;
          label: string;
          full_address: string;
          latitude: number;
          longitude: number;
          is_default: boolean;
        };
        Insert: Omit<Database['public']['Tables']['addresses']['Row'], 'id'>;
        Update: Partial<Database['public']['Tables']['addresses']['Insert']>;
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          title: string;
          body: string;
          reference_id: string | null;
          reference_type: string | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['notifications']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['notifications']['Insert']>;
      };
      saved_items: {
        Row: {
          id: string;
          user_id: string;
          type: 'chef' | 'dish';
          reference_id: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['saved_items']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['saved_items']['Insert']>;
      };
    };
  };
};

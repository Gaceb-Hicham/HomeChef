import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type { Session, User } from '@supabase/supabase-js';

export type UserRole = 'customer' | 'chef';

export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  profile_photo_url: string | null;
  city: string | null;
  area: string | null;
  is_verified: boolean;
  is_active: boolean;
}

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isOnboarded: boolean;
  selectedRole: UserRole | null;
  hasSeenOnboarding: boolean;
  isDemoMode: boolean;

  // Actions
  setSession: (session: Session | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  setSelectedRole: (role: UserRole) => void;
  setHasSeenOnboarding: (seen: boolean) => void;
  setIsLoading: (loading: boolean) => void;

  signUp: (email: string, password: string, fullName: string, phone: string, role: UserRole) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  verifyOtp: (email: string, token: string) => Promise<{ error: string | null }>;
  fetchProfile: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error: string | null }>;
  demoLogin: (role: UserRole) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  profile: null,
  isLoading: true,
  isOnboarded: false,
  selectedRole: null,
  hasSeenOnboarding: false,
  isDemoMode: false,

  setSession: (session) => set({ session, user: session?.user ?? null }),
  setProfile: (profile) => set({ profile }),
  setSelectedRole: (role) => set({ selectedRole: role }),
  setHasSeenOnboarding: (seen) => set({ hasSeenOnboarding: seen }),
  setIsLoading: (loading) => set({ isLoading: loading }),

  signUp: async (email, password, fullName, phone, role) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, phone, role },
        },
      });
      if (error) return { error: error.message };

      // Create user profile record
      if (data.user) {
        const { error: profileError } = await supabase.from('users').insert({
          id: data.user.id,
          full_name: fullName,
          email,
          phone,
          role,
          is_verified: false,
          is_active: true,
        });
        if (profileError) return { error: profileError.message };
      }

      return { error: null };
    } catch (e: any) {
      return { error: e.message || 'An unexpected error occurred' };
    }
  },

  signIn: async (email, password) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { error: error.message };
      await get().fetchProfile();
      return { error: null };
    } catch (e: any) {
      return { error: e.message || 'An unexpected error occurred' };
    }
  },

  signOut: async () => {
    if (!get().isDemoMode) {
      await supabase.auth.signOut();
    }
    set({ session: null, user: null, profile: null, isDemoMode: false });
  },

  resetPassword: async (email) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) return { error: error.message };
      return { error: null };
    } catch (e: any) {
      return { error: e.message || 'An unexpected error occurred' };
    }
  },

  verifyOtp: async (email, token) => {
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'signup',
      });
      if (error) return { error: error.message };
      // Mark user as verified
      const profile = get().profile;
      if (profile) {
        await supabase.from('users').update({ is_verified: true }).eq('id', profile.id);
        set({ profile: { ...profile, is_verified: true } });
      }
      await get().fetchProfile();
      return { error: null };
    } catch (e: any) {
      return { error: e.message || 'Verification failed' };
    }
  },

  fetchProfile: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profile) {
      set({ profile: profile as UserProfile });
    }
  },

  updateProfile: async (updates) => {
    const profile = get().profile;
    if (!profile) return { error: 'No profile found' };

    const { error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', profile.id);

    if (error) return { error: error.message };

    set({ profile: { ...profile, ...updates } });
    return { error: null };
  },

  demoLogin: (role) => {
    const demoProfile: UserProfile = {
      id: 'demo-user-001',
      full_name: role === 'chef' ? 'Chef Ahmed' : 'Sarah Foodie',
      email: role === 'chef' ? 'chef@demo.homechef' : 'sarah@demo.homechef',
      phone: '+213 555 1234',
      role,
      profile_photo_url: null,
      city: 'Algiers',
      area: 'Bab El Oued',
      is_verified: true,
      is_active: true,
    };
    set({
      profile: demoProfile,
      selectedRole: role,
      isLoading: false,
      isOnboarded: true,
      isDemoMode: true,
    });
  },
}));

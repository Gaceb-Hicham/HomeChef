import { create } from 'zustand';
import { postsApi } from '@/lib/api';
import type { Database } from '@/lib/supabase';

type Post = Database['public']['Tables']['daily_posts']['Row'];

interface PostWithChef extends Post {
  chef?: {
    id: string;
    full_name: string;
    profile_photo_url: string | null;
    city: string | null;
    area: string | null;
  };
  chef_profile?: {
    kitchen_name: string;
    rating_average: number;
    total_reviews: number;
    is_open: boolean;
  };
  reviews?: any[];
}

interface PostsState {
  feed: PostWithChef[];
  currentPost: PostWithChef | null;
  chefArchive: Post[];
  searchResults: PostWithChef[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;

  // Actions
  fetchFeed: (city?: string) => Promise<void>;
  refreshFeed: (city?: string) => Promise<void>;
  fetchPostById: (id: string) => Promise<void>;
  fetchChefArchive: (chefId: string) => Promise<void>;
  searchPosts: (query: string) => Promise<void>;
  createPost: (post: any) => Promise<{ error: string | null }>;
  updatePost: (postId: string, updates: any) => Promise<{ error: string | null }>;
  deletePost: (postId: string) => Promise<{ error: string | null }>;
  handleRealtimeUpdate: (payload: any) => void;
  clearSearch: () => void;
}

export const usePostsStore = create<PostsState>((set, get) => ({
  feed: [],
  currentPost: null,
  chefArchive: [],
  searchResults: [],
  isLoading: false,
  isRefreshing: false,
  error: null,

  fetchFeed: async (city) => {
    set({ isLoading: true, error: null });
    const { data, error } = await postsApi.getFeed(city);
    set({ feed: data as PostWithChef[], isLoading: false, error });
  },

  refreshFeed: async (city) => {
    set({ isRefreshing: true });
    const { data, error } = await postsApi.getFeed(city);
    set({ feed: data as PostWithChef[], isRefreshing: false, error });
  },

  fetchPostById: async (id) => {
    set({ isLoading: true, error: null });
    const { data, error } = await postsApi.getPostById(id);
    set({ currentPost: data as PostWithChef, isLoading: false, error });
  },

  fetchChefArchive: async (chefId) => {
    set({ isLoading: true });
    const { data, error } = await postsApi.getChefArchive(chefId);
    set({ chefArchive: data, isLoading: false, error });
  },

  searchPosts: async (query) => {
    if (!query.trim()) {
      set({ searchResults: [] });
      return;
    }
    set({ isLoading: true });
    const { data, error } = await postsApi.searchPosts(query);
    set({ searchResults: data as PostWithChef[], isLoading: false, error });
  },

  createPost: async (post) => {
    set({ isLoading: true });
    const { error } = await postsApi.createPost(post);
    set({ isLoading: false });
    if (!error) {
      // Refresh chef's archive
      if (post.chef_id) await get().fetchChefArchive(post.chef_id);
    }
    return { error };
  },

  updatePost: async (postId, updates) => {
    const { error } = await postsApi.updatePost(postId, updates);
    if (!error) {
      // Update local state
      set({
        feed: get().feed.map((p) => (p.id === postId ? { ...p, ...updates } : p)),
      });
    }
    return { error };
  },

  deletePost: async (postId) => {
    const { error } = await postsApi.deletePost(postId);
    if (!error) {
      set({
        feed: get().feed.filter((p) => p.id !== postId),
        chefArchive: get().chefArchive.filter((p) => p.id !== postId),
      });
    }
    return { error };
  },

  handleRealtimeUpdate: (payload) => {
    const { eventType, new: newRecord, old: oldRecord } = payload;
    const feed = get().feed;

    switch (eventType) {
      case 'INSERT':
        set({ feed: [newRecord as PostWithChef, ...feed] });
        break;
      case 'UPDATE':
        set({
          feed: feed.map((p) => (p.id === newRecord.id ? { ...p, ...newRecord } : p)),
        });
        // Also update current post if viewing
        if (get().currentPost?.id === newRecord.id) {
          set({ currentPost: { ...get().currentPost!, ...newRecord } });
        }
        break;
      case 'DELETE':
        set({ feed: feed.filter((p) => p.id !== oldRecord.id) });
        break;
    }
  },

  clearSearch: () => set({ searchResults: [] }),
}));

import { create } from 'zustand';
import { notificationsApi, savedApi, followersApi, chefApi } from '@/lib/api';

// ========================
// NOTIFICATIONS STORE
// ========================
interface NotificationsState {
  notifications: any[];
  unreadCount: number;
  isLoading: boolean;

  fetch: (userId: string) => Promise<void>;
  markAsRead: (notifId: string) => Promise<void>;
  markAllAsRead: (userId: string) => Promise<void>;
  fetchUnreadCount: (userId: string) => Promise<void>;
  addNotification: (notif: any) => void;
}

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  fetch: async (userId) => {
    set({ isLoading: true });
    const { data } = await notificationsApi.getNotifications(userId);
    const { count } = await notificationsApi.getUnreadCount(userId);
    set({ notifications: data, unreadCount: count, isLoading: false });
  },

  markAsRead: async (notifId) => {
    await notificationsApi.markAsRead(notifId);
    set({
      notifications: get().notifications.map((n) =>
        n.id === notifId ? { ...n, is_read: true } : n
      ),
      unreadCount: Math.max(0, get().unreadCount - 1),
    });
  },

  markAllAsRead: async (userId) => {
    await notificationsApi.markAllAsRead(userId);
    set({
      notifications: get().notifications.map((n) => ({ ...n, is_read: true })),
      unreadCount: 0,
    });
  },

  fetchUnreadCount: async (userId) => {
    const { count } = await notificationsApi.getUnreadCount(userId);
    set({ unreadCount: count });
  },

  addNotification: (notif) => {
    set({
      notifications: [notif, ...get().notifications],
      unreadCount: get().unreadCount + 1,
    });
  },
}));

// ========================
// SAVED ITEMS STORE
// ========================
interface SavedState {
  savedDishes: any[];
  savedChefs: any[];
  savedIds: Set<string>;
  isLoading: boolean;

  fetchSaved: (userId: string) => Promise<void>;
  toggleSave: (userId: string, type: 'chef' | 'dish', refId: string) => Promise<boolean>;
  isSaved: (refId: string) => boolean;
}

export const useSavedStore = create<SavedState>((set, get) => ({
  savedDishes: [],
  savedChefs: [],
  savedIds: new Set(),
  isLoading: false,

  fetchSaved: async (userId) => {
    set({ isLoading: true });
    const [dishes, chefs] = await Promise.all([
      savedApi.getSavedItems(userId, 'dish'),
      savedApi.getSavedItems(userId, 'chef'),
    ]);

    const allIds = new Set([
      ...(dishes.data || []).map((d: any) => d.reference_id),
      ...(chefs.data || []).map((c: any) => c.reference_id),
    ]);

    set({
      savedDishes: dishes.data || [],
      savedChefs: chefs.data || [],
      savedIds: allIds,
      isLoading: false,
    });
  },

  toggleSave: async (userId, type, refId) => {
    const { saved } = await savedApi.toggleSaved(userId, type, refId);
    const ids = new Set(get().savedIds);

    if (saved) {
      ids.add(refId);
    } else {
      ids.delete(refId);
    }

    set({ savedIds: ids });

    // Refresh lists
    await get().fetchSaved(userId);
    return saved;
  },

  isSaved: (refId) => get().savedIds.has(refId),
}));

// ========================
// CHEF PROFILE STORE
// ========================
interface ChefProfileState {
  chefProfile: any | null;
  isLoading: boolean;

  fetchProfile: (userId: string) => Promise<void>;
  createProfile: (profile: any) => Promise<{ error: string | null }>;
  updateProfile: (userId: string, updates: any) => Promise<{ error: string | null }>;
  toggleKitchen: (userId: string, isOpen: boolean) => Promise<void>;
}

export const useChefProfileStore = create<ChefProfileState>((set, get) => ({
  chefProfile: null,
  isLoading: false,

  fetchProfile: async (userId) => {
    set({ isLoading: true });
    const { data } = await chefApi.getChefProfile(userId);
    set({ chefProfile: data, isLoading: false });
  },

  createProfile: async (profile) => {
    set({ isLoading: true });
    const { data, error } = await chefApi.createChefProfile(profile);
    set({ chefProfile: data, isLoading: false });
    return { error };
  },

  updateProfile: async (userId, updates) => {
    const { error } = await chefApi.updateChefProfile(userId, updates);
    if (!error && get().chefProfile) {
      set({ chefProfile: { ...get().chefProfile, ...updates } });
    }
    return { error };
  },

  toggleKitchen: async (userId, isOpen) => {
    await chefApi.toggleKitchen(userId, isOpen);
    if (get().chefProfile) {
      set({ chefProfile: { ...get().chefProfile, is_open: isOpen } });
    }
  },
}));

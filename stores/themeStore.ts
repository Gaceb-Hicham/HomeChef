import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeMode = 'system' | 'light' | 'dark';

interface ThemeState {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  loadSavedMode: () => Promise<void>;
}

const STORAGE_KEY = '@homechef_theme_mode';

export const useThemeStore = create<ThemeState>((set) => ({
  mode: 'system',

  setMode: async (mode) => {
    set({ mode });
    try {
      await AsyncStorage.setItem(STORAGE_KEY, mode);
    } catch {}
  },

  loadSavedMode: async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved && ['system', 'light', 'dark'].includes(saved)) {
        set({ mode: saved as ThemeMode });
      }
    } catch {}
  },
}));

import { create } from 'zustand';
import { prepMenuApi, prepRequestsApi, specialtiesApi } from '@/lib/api';

// ========================
// PREP MENU STORE
// ========================
interface PrepMenuItem {
  id: string;
  chef_id: string;
  title: string;
  description: string;
  photos: string[];
  base_price: number;
  price_negotiable: boolean;
  min_order_qty: number;
  min_notice_hours: number;
  is_active: boolean;
  sort_order: number;
}

interface PrepMenuState {
  items: PrepMenuItem[];
  isLoading: boolean;
  fetchByChef: (chefId: string) => Promise<void>;
  createItem: (item: any) => Promise<{ error: string | null }>;
  updateItem: (id: string, updates: any) => Promise<{ error: string | null }>;
  removeItem: (id: string) => Promise<{ error: string | null }>;
}

export const usePrepMenuStore = create<PrepMenuState>((set, get) => ({
  items: [],
  isLoading: false,

  fetchByChef: async (chefId) => {
    set({ isLoading: true });
    const { data, error } = await prepMenuApi.getByChef(chefId);
    set({ items: data || [], isLoading: false });
  },

  createItem: async (item) => {
    const { data, error } = await prepMenuApi.create(item);
    if (!error && data) {
      set({ items: [...get().items, data] });
    }
    return { error };
  },

  updateItem: async (id, updates) => {
    const { data, error } = await prepMenuApi.update(id, updates);
    if (!error && data) {
      set({ items: get().items.map(i => i.id === id ? { ...i, ...data } : i) });
    }
    return { error };
  },

  removeItem: async (id) => {
    const { error } = await prepMenuApi.remove(id);
    if (!error) {
      set({ items: get().items.filter(i => i.id !== id) });
    }
    return { error };
  },
}));

// ========================
// PREP REQUESTS STORE
// ========================
interface PrepRequest {
  id: string;
  customer_id: string;
  chef_id: string;
  menu_item_id: string;
  requested_date: string;
  quantity: number;
  offered_price: number;
  note: string;
  status: 'pending' | 'accepted' | 'rejected' | 'countered';
  chef_response_note?: string;
  counter_price?: number;
  counter_date?: string;
  created_at: string;
  menu_item?: any;
  customer?: any;
  chef?: any;
}

interface PrepRequestsState {
  requests: PrepRequest[];
  isLoading: boolean;
  fetchByCustomer: (customerId: string) => Promise<void>;
  fetchByChef: (chefId: string) => Promise<void>;
  createRequest: (request: any) => Promise<{ data: any; error: string | null }>;
  respondToRequest: (id: string, response: any) => Promise<{ error: string | null }>;
}

export const usePrepRequestsStore = create<PrepRequestsState>((set, get) => ({
  requests: [],
  isLoading: false,

  fetchByCustomer: async (customerId) => {
    set({ isLoading: true });
    const { data } = await prepRequestsApi.getByCustomer(customerId);
    set({ requests: data || [], isLoading: false });
  },

  fetchByChef: async (chefId) => {
    set({ isLoading: true });
    const { data } = await prepRequestsApi.getByChef(chefId);
    set({ requests: data || [], isLoading: false });
  },

  createRequest: async (request) => {
    const { data, error } = await prepRequestsApi.create(request);
    if (!error && data) {
      set({ requests: [data, ...get().requests] });
    }
    return { data, error };
  },

  respondToRequest: async (id, response) => {
    const { data, error } = await prepRequestsApi.respond(id, response);
    if (!error && data) {
      set({ requests: get().requests.map(r => r.id === id ? { ...r, ...data } : r) });
    }
    return { error };
  },
}));

// ========================
// SPECIALTIES STORE
// ========================
interface Specialty {
  id: string;
  chef_id: string;
  title: string;
  description: string;
  photos: string[];
  price_range_min: number;
  price_range_max: number;
  prep_time_hours: number;
  availability: 'always' | 'seasonal' | 'on_request';
  category: string;
  is_active: boolean;
}

interface SpecialtiesState {
  specialties: Specialty[];
  isLoading: boolean;
  fetchByChef: (chefId: string) => Promise<void>;
  createSpecialty: (item: any) => Promise<{ error: string | null }>;
  updateSpecialty: (id: string, updates: any) => Promise<{ error: string | null }>;
  removeSpecialty: (id: string) => Promise<{ error: string | null }>;
}

export const useSpecialtiesStore = create<SpecialtiesState>((set, get) => ({
  specialties: [],
  isLoading: false,

  fetchByChef: async (chefId) => {
    set({ isLoading: true });
    const { data } = await specialtiesApi.getByChef(chefId);
    set({ specialties: data || [], isLoading: false });
  },

  createSpecialty: async (item) => {
    const { data, error } = await specialtiesApi.create(item);
    if (!error && data) {
      set({ specialties: [...get().specialties, data] });
    }
    return { error };
  },

  updateSpecialty: async (id, updates) => {
    const { data, error } = await specialtiesApi.update(id, updates);
    if (!error && data) {
      set({ specialties: get().specialties.map(s => s.id === id ? { ...s, ...data } : s) });
    }
    return { error };
  },

  removeSpecialty: async (id) => {
    const { error } = await specialtiesApi.remove(id);
    if (!error) {
      set({ specialties: get().specialties.filter(s => s.id !== id) });
    }
    return { error };
  },
}));

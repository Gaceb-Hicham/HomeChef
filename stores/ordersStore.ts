import { create } from 'zustand';
import { ordersApi } from '@/lib/api';
import type { Database } from '@/lib/supabase';

type Order = Database['public']['Tables']['orders']['Row'];

interface OrderWithDetails extends Order {
  post?: { title: string; photos: string[]; price: number };
  chef?: { full_name: string; profile_photo_url: string | null; phone?: string };
  customer?: { full_name: string; profile_photo_url: string | null; phone?: string };
  review?: { id: string; overall_rating: number; comment: string } | null;
}

interface EarningsData {
  total: number;
  count: number;
  orders: { total_price: number; created_at: string }[];
}

interface OrdersState {
  // Customer
  customerOrders: OrderWithDetails[];
  activeOrders: OrderWithDetails[];
  pastOrders: OrderWithDetails[];

  // Chef
  chefOrders: OrderWithDetails[];

  // Shared
  currentOrder: OrderWithDetails | null;
  isLoading: boolean;
  error: string | null;

  // Earnings
  dailyEarnings: EarningsData | null;
  weeklyEarnings: EarningsData | null;
  monthlyEarnings: EarningsData | null;

  // Customer actions
  fetchCustomerOrders: (customerId: string, status?: string) => Promise<void>;
  placeOrder: (order: any) => Promise<{ data: any; error: string | null }>;

  // Chef actions
  fetchChefOrders: (chefId: string, status?: string) => Promise<void>;
  updateOrderStatus: (orderId: string, status: string) => Promise<{ error: string | null }>;

  // Shared actions
  fetchOrderById: (orderId: string) => Promise<void>;
  fetchEarnings: (chefId: string) => Promise<void>;
  handleRealtimeOrderUpdate: (payload: any) => void;
  handleNewChefOrder: (order: any) => void;
}

const ACTIVE_STATUSES = ['received', 'preparing', 'ready', 'out_for_delivery'];
const PAST_STATUSES = ['delivered', 'cancelled'];

export const useOrdersStore = create<OrdersState>((set, get) => ({
  customerOrders: [],
  activeOrders: [],
  pastOrders: [],
  chefOrders: [],
  currentOrder: null,
  isLoading: false,
  error: null,
  dailyEarnings: null,
  weeklyEarnings: null,
  monthlyEarnings: null,

  fetchCustomerOrders: async (customerId, status) => {
    set({ isLoading: true, error: null });
    const { data, error } = await ordersApi.getCustomerOrders(customerId, status);
    const orders = data as OrderWithDetails[];

    set({
      customerOrders: orders,
      activeOrders: orders.filter((o) => ACTIVE_STATUSES.includes(o.order_status)),
      pastOrders: orders.filter((o) => PAST_STATUSES.includes(o.order_status)),
      isLoading: false,
      error,
    });
  },

  placeOrder: async (order) => {
    set({ isLoading: true });
    const { data, error } = await ordersApi.placeOrder(order);
    set({ isLoading: false });
    return { data, error };
  },

  fetchChefOrders: async (chefId, status) => {
    set({ isLoading: true, error: null });
    const { data, error } = await ordersApi.getChefOrders(chefId, status);
    set({ chefOrders: data as OrderWithDetails[], isLoading: false, error });
  },

  updateOrderStatus: async (orderId, status) => {
    const { error } = await ordersApi.updateOrderStatus(orderId, status);
    if (!error) {
      // Update local state immediately for optimistic UI
      set({
        chefOrders: get().chefOrders.map((o) =>
          o.id === orderId ? { ...o, order_status: status as any } : o
        ),
      });
    }
    return { error };
  },

  fetchOrderById: async (orderId) => {
    set({ isLoading: true });
    const { data, error } = await ordersApi.getOrderById(orderId);
    set({ currentOrder: data as OrderWithDetails, isLoading: false, error });
  },

  fetchEarnings: async (chefId) => {
    const [daily, weekly, monthly] = await Promise.all([
      ordersApi.getChefEarnings(chefId, 'day'),
      ordersApi.getChefEarnings(chefId, 'week'),
      ordersApi.getChefEarnings(chefId, 'month'),
    ]);

    set({
      dailyEarnings: daily,
      weeklyEarnings: weekly,
      monthlyEarnings: monthly,
    });
  },

  handleRealtimeOrderUpdate: (payload) => {
    const newOrder = payload.new as OrderWithDetails;
    if (!newOrder) return;

    // Update in customer orders
    set({
      customerOrders: get().customerOrders.map((o) =>
        o.id === newOrder.id ? { ...o, ...newOrder } : o
      ),
      activeOrders: get().activeOrders.map((o) =>
        o.id === newOrder.id ? { ...o, ...newOrder } : o
      ).filter((o) => ACTIVE_STATUSES.includes(o.order_status)),
    });

    // Update current order if tracking
    if (get().currentOrder?.id === newOrder.id) {
      set({ currentOrder: { ...get().currentOrder!, ...newOrder } });
    }
  },

  handleNewChefOrder: (order) => {
    set({ chefOrders: [order as OrderWithDetails, ...get().chefOrders] });
  },
}));

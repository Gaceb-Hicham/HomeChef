import { create } from 'zustand';

export interface CartItem {
  postId: string;
  chefId: string;
  chefName: string;
  title: string;
  photo: string;
  price: number;
  quantity: number;
  maxQuantity: number;
}

interface CartState {
  items: CartItem[];
  promoCode: string | null;
  promoDiscount: number;

  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (postId: string) => void;
  updateQuantity: (postId: string, quantity: number) => void;
  clearCart: () => void;
  applyPromo: (code: string, discount: number) => void;
  removePromo: () => void;
  getSubtotal: () => number;
  getTotal: () => number;
  getItemCount: () => number;
  getItemsByChef: () => Record<string, CartItem[]>;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  promoCode: null,
  promoDiscount: 0,

  addItem: (item) => {
    const existing = get().items.find((i) => i.postId === item.postId);
    if (existing) {
      if (existing.quantity < item.maxQuantity) {
        set({
          items: get().items.map((i) =>
            i.postId === item.postId ? { ...i, quantity: i.quantity + 1 } : i
          ),
        });
      }
    } else {
      set({ items: [...get().items, { ...item, quantity: 1 }] });
    }
  },

  removeItem: (postId) => {
    set({ items: get().items.filter((i) => i.postId !== postId) });
  },

  updateQuantity: (postId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(postId);
      return;
    }
    set({
      items: get().items.map((i) =>
        i.postId === postId ? { ...i, quantity: Math.min(quantity, i.maxQuantity) } : i
      ),
    });
  },

  clearCart: () => set({ items: [], promoCode: null, promoDiscount: 0 }),

  applyPromo: (code, discount) => set({ promoCode: code, promoDiscount: discount }),

  removePromo: () => set({ promoCode: null, promoDiscount: 0 }),

  getSubtotal: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),

  getTotal: () => {
    const subtotal = get().getSubtotal();
    return Math.max(0, subtotal - get().promoDiscount);
  },

  getItemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

  getItemsByChef: () => {
    return get().items.reduce((acc, item) => {
      if (!acc[item.chefId]) acc[item.chefId] = [];
      acc[item.chefId].push(item);
      return acc;
    }, {} as Record<string, CartItem[]>);
  },
}));

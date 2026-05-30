/**
 * App-wide constants to replace magic strings throughout the codebase.
 */

export const ORDER_STATUS = {
  RECEIVED: 'received',
  PREPARING: 'preparing',
  READY: 'ready',
  OUT_FOR_DELIVERY: 'out_for_delivery',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
} as const;

export type OrderStatus = typeof ORDER_STATUS[keyof typeof ORDER_STATUS];

export const ACTIVE_ORDER_STATUSES: OrderStatus[] = [
  ORDER_STATUS.RECEIVED,
  ORDER_STATUS.PREPARING,
  ORDER_STATUS.READY,
  ORDER_STATUS.OUT_FOR_DELIVERY,
];

export const DELIVERY_TYPE = {
  DELIVERY: 'delivery',
  PICKUP: 'pickup',
} as const;

export const SUBSCRIPTION_STATUS = {
  PENDING: 'pending',
  ACTIVE: 'active',
  PAUSED: 'paused',
  CANCELLED: 'cancelled',
} as const;

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 15,
  FEED_PAGE_SIZE: 10,
  ORDERS_PAGE_SIZE: 20,
  SEARCH_PAGE_SIZE: 15,
  REVIEWS_PAGE_SIZE: 20,
} as const;

export const CACHE_TTL = {
  FEED: 5 * 60 * 1000,       // 5 min
  PROFILE: 15 * 60 * 1000,   // 15 min
  NOTIFICATIONS: 2 * 60 * 1000, // 2 min
} as const;

export const TIME_SLOTS = [
  '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30',
  '20:00', '20:30', '21:00',
];

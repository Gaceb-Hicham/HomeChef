import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

let channelCounter = 0;
function uniqueChannelName(base: string) {
  return `${base}-${Date.now()}-${++channelCounter}`;
}

/**
 * Subscribe to real-time changes on daily_posts table.
 * Updates the feed when new posts appear or quantities change.
 */
export function useRealtimeFeed(onUpdate: (payload: any) => void) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const callbackRef = useRef(onUpdate);
  callbackRef.current = onUpdate;

  useEffect(() => {
    // Clean up any existing channel first
    if (channelRef.current) {
      try { supabase.removeChannel(channelRef.current); } catch (_) {}
      channelRef.current = null;
    }

    try {
      const channel = supabase
        .channel(uniqueChannelName('feed-updates'))
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'daily_posts',
            filter: 'is_active=eq.true',
          },
          (payload) => {
            callbackRef.current(payload);
          }
        )
        .subscribe();

      channelRef.current = channel;
    } catch (e) {
      console.warn('[useRealtimeFeed] Subscription error:', e);
    }

    return () => {
      if (channelRef.current) {
        try { supabase.removeChannel(channelRef.current); } catch (_) {}
        channelRef.current = null;
      }
    };
  }, []);
}

/**
 * Subscribe to order status changes for a specific order.
 * Used in the tracking screen.
 */
export function useRealtimeOrder(orderId: string, onStatusChange: (newStatus: string) => void) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const callbackRef = useRef(onStatusChange);
  callbackRef.current = onStatusChange;

  useEffect(() => {
    if (!orderId) return;

    if (channelRef.current) {
      try { supabase.removeChannel(channelRef.current); } catch (_) {}
      channelRef.current = null;
    }

    try {
      const channel = supabase
        .channel(uniqueChannelName(`order-${orderId}`))
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'orders',
            filter: `id=eq.${orderId}`,
          },
          (payload) => {
            const newStatus = payload.new?.order_status;
            if (newStatus) callbackRef.current(newStatus);
          }
        )
        .subscribe();

      channelRef.current = channel;
    } catch (e) {
      console.warn('[useRealtimeOrder] Subscription error:', e);
    }

    return () => {
      if (channelRef.current) {
        try { supabase.removeChannel(channelRef.current); } catch (_) {}
        channelRef.current = null;
      }
    };
  }, [orderId]);
}

/**
 * Subscribe to incoming orders for a chef.
 * Used in the chef dashboard to get live notifications.
 */
export function useRealtimeChefOrders(chefId: string, onNewOrder: (order: any) => void) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const callbackRef = useRef(onNewOrder);
  callbackRef.current = onNewOrder;

  useEffect(() => {
    if (!chefId) return;

    if (channelRef.current) {
      try { supabase.removeChannel(channelRef.current); } catch (_) {}
      channelRef.current = null;
    }

    try {
      const channel = supabase
        .channel(uniqueChannelName(`chef-orders-${chefId}`))
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'orders',
            filter: `chef_id=eq.${chefId}`,
          },
          (payload) => {
            callbackRef.current(payload.new);
          }
        )
        .subscribe();

      channelRef.current = channel;
    } catch (e) {
      console.warn('[useRealtimeChefOrders] Subscription error:', e);
    }

    return () => {
      if (channelRef.current) {
        try { supabase.removeChannel(channelRef.current); } catch (_) {}
        channelRef.current = null;
      }
    };
  }, [chefId]);
}

/**
 * Subscribe to notifications for the current user.
 */
export function useRealtimeNotifications(userId: string, onNotification: (notif: any) => void) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const callbackRef = useRef(onNotification);
  callbackRef.current = onNotification;

  useEffect(() => {
    if (!userId) return;

    if (channelRef.current) {
      try { supabase.removeChannel(channelRef.current); } catch (_) {}
      channelRef.current = null;
    }

    try {
      const channel = supabase
        .channel(uniqueChannelName(`notif-${userId}`))
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            callbackRef.current(payload.new);
          }
        )
        .subscribe();

      channelRef.current = channel;
    } catch (e) {
      console.warn('[useRealtimeNotifications] Subscription error:', e);
    }

    return () => {
      if (channelRef.current) {
        try { supabase.removeChannel(channelRef.current); } catch (_) {}
        channelRef.current = null;
      }
    };
  }, [userId]);
}

/**
 * Generic hook for subscribing to any table changes.
 */
export function useRealtimeSubscription(
  table: string,
  event: 'INSERT' | 'UPDATE' | 'DELETE' | '*',
  filter: string | undefined,
  callback: (payload: any) => void,
) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if (channelRef.current) {
      try { supabase.removeChannel(channelRef.current); } catch (_) {}
      channelRef.current = null;
    }

    const config: any = {
      event,
      schema: 'public',
      table,
    };

    if (filter) config.filter = filter;

    try {
      const channel = supabase
        .channel(uniqueChannelName(`${table}-${event}-${filter || 'all'}`))
        .on('postgres_changes', config, (payload) => callbackRef.current(payload))
        .subscribe();

      channelRef.current = channel;
    } catch (e) {
      console.warn('[useRealtimeSubscription] Subscription error:', e);
    }

    return () => {
      if (channelRef.current) {
        try { supabase.removeChannel(channelRef.current); } catch (_) {}
        channelRef.current = null;
      }
    };
  }, [table, event, filter]);
}

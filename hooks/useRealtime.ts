import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Subscribe to real-time changes on daily_posts table.
 * Updates the feed when new posts appear or quantities change.
 */
export function useRealtimeFeed(onUpdate: (payload: any) => void) {
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    const channel = supabase
      .channel('feed-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'daily_posts',
          filter: 'is_active=eq.true',
        },
        (payload) => {
          onUpdate(payload);
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
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

  useEffect(() => {
    if (!orderId) return;

    const channel = supabase
      .channel(`order-${orderId}`)
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
          if (newStatus) onStatusChange(newStatus);
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
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

  useEffect(() => {
    if (!chefId) return;

    const channel = supabase
      .channel(`chef-orders-${chefId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
          filter: `chef_id=eq.${chefId}`,
        },
        (payload) => {
          onNewOrder(payload.new);
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [chefId]);
}

/**
 * Subscribe to notifications for the current user.
 */
export function useRealtimeNotifications(userId: string, onNotification: (notif: any) => void) {
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`notif-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          onNotification(payload.new);
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
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

  useEffect(() => {
    const channelName = `${table}-${event}-${filter || 'all'}`;

    const config: any = {
      event,
      schema: 'public',
      table,
    };

    if (filter) config.filter = filter;

    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', config, callback)
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [table, event, filter]);
}

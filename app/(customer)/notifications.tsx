import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/stores/authStore';
import { useNotificationsStore } from '@/stores/appStores';
import { useRealtimeNotifications } from '@/hooks/useRealtime';
import { ScreenWrapper } from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';

const NOTIF_ICONS: Record<string, { icon: string; bg: string; color: string }> = {
  order: { icon: 'receipt', bg: '#e0f2fe', color: '#0369a1' },
  review: { icon: 'star', bg: '#fef3c7', color: '#b45309' },
  promo: { icon: 'pricetag', bg: '#dcfce7', color: '#15803d' },
  follow: { icon: 'heart', bg: '#fce7f3', color: '#be185d' },
  system: { icon: 'notifications', bg: '#ede9fe', color: '#7c3aed' },
};



export default function NotificationsScreen() {
  const router = useRouter();
  const { colors, shadows } = useTheme();
  const profile = useAuthStore((s) => s.profile);
  const { notifications, fetch, markAsRead, markAllAsRead, addNotification } = useNotificationsStore();

  // Fetch on mount
  useEffect(() => {
    if (profile?.id) fetch(profile.id);
  }, [profile?.id]);

  // Subscribe to realtime notifications
  useRealtimeNotifications(profile?.id || '', addNotification);

  const notifs = notifications;

  const getTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <ScreenWrapper padded={false}>
      <View style={[styles.header, { paddingHorizontal: 20 }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.onBackground }]}>Notifications</Text>
        <TouchableOpacity onPress={() => profile?.id && markAllAsRead(profile.id)}>
          <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '600' }}>Read all</Text>
        </TouchableOpacity>
      </View>

      <FlatList data={notifs} keyExtractor={(i: any) => i.id}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 8, paddingBottom: 24 }}
        renderItem={({ item }: { item: any }) => {
          const ni = NOTIF_ICONS[item.type] || NOTIF_ICONS.system;
          return (
            <TouchableOpacity
              onPress={() => markAsRead(item.id)}
              style={[styles.card, {
                backgroundColor: item.is_read ? colors.surfaceContainerLowest : colors.primaryFixed,
                ...shadows.sm,
              }]}>
              <View style={[styles.iconBg, { backgroundColor: ni.bg }]}>
                <Ionicons name={ni.icon as any} size={20} color={ni.color} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.titleRow}>
                  <Text style={[styles.notifTitle, { color: colors.onSurface }]}>{item.title}</Text>
                  {!item.is_read && <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />}
                </View>
                <Text style={[styles.notifBody, { color: colors.onSurfaceVariant }]} numberOfLines={2}>{item.body}</Text>
                <Text style={[styles.notifTime, { color: colors.outline }]}>{getTimeAgo(item.created_at)}</Text>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingTop: 60 }}>
            <Text style={{ fontSize: 40 }}>🔔</Text>
            <Text style={{ color: colors.onSurfaceVariant, marginTop: 8 }}>No notifications yet</Text>
          </View>
        }
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, marginBottom: 16 },
  title: { fontFamily: 'NotoSerif-Bold', fontSize: 22, fontWeight: '700' },
  card: { flexDirection: 'row', padding: 16, borderRadius: 14, gap: 12 },
  iconBg: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  unreadDot: { width: 7, height: 7, borderRadius: 4 },
  notifTitle: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 14, fontWeight: '600' },
  notifBody: { fontFamily: 'PlusJakartaSans-Regular', fontSize: 13, marginTop: 3, lineHeight: 18 },
  notifTime: { fontFamily: 'PlusJakartaSans-Regular', fontSize: 11, marginTop: 4 },
});

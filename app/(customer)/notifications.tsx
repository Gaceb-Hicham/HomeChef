import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { ScreenWrapper } from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';

const NOTIFS = [
  { id: '1', type: 'order', title: 'Order Preparing', body: 'Sarah K. is preparing your Couscous Royal', time: '2m ago', read: false, icon: '🍲' },
  { id: '2', type: 'promo', title: 'New Special!', body: 'Ahmed M. just posted Baklava Box', time: '1h ago', read: false, icon: '🍰' },
  { id: '3', type: 'review', title: 'Review Response', body: 'Sarah K. replied to your review', time: '3h ago', read: true, icon: '⭐' },
  { id: '4', type: 'order', title: 'Order Delivered', body: 'Your Grilled Chicken has been delivered', time: 'Yesterday', read: true, icon: '✅' },
];

export default function NotificationsScreen() {
  const router = useRouter();
  const { colors, shadows } = useTheme();

  return (
    <ScreenWrapper>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.onBackground }]}>Notifications</Text>
        <TouchableOpacity><Text style={{ color: colors.primary, fontSize: 13, fontWeight: '600' }}>Mark all read</Text></TouchableOpacity>
      </View>

      <FlatList data={NOTIFS} keyExtractor={(i) => i.id} showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity style={[styles.notifCard, !item.read && { backgroundColor: colors.primaryFixed }, { ...shadows.sm }]}>
            <View style={[styles.notifIcon, { backgroundColor: colors.surfaceContainerHigh }]}>
              <Text style={{ fontSize: 22 }}>{item.icon}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.notifTitle, { color: colors.onSurface }]}>{item.title}</Text>
              <Text style={[styles.notifBody, { color: colors.onSurfaceVariant }]} numberOfLines={2}>{item.body}</Text>
              <Text style={[styles.notifTime, { color: colors.outline }]}>{item.time}</Text>
            </View>
            {!item.read && <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />}
          </TouchableOpacity>
        )}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, marginTop: 8 },
  title: { fontFamily: 'NotoSerif-Bold', fontSize: 22, fontWeight: '700' },
  notifCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, marginBottom: 8, gap: 12 },
  notifIcon: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  notifTitle: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 15, fontWeight: '600' },
  notifBody: { fontFamily: 'PlusJakartaSans-Regular', fontSize: 13, marginTop: 2, lineHeight: 19 },
  notifTime: { fontFamily: 'PlusJakartaSans-Regular', fontSize: 11, marginTop: 4 },
  unreadDot: { width: 10, height: 10, borderRadius: 5 },
});

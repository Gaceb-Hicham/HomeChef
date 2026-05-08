import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/stores/authStore';
import { postsApi } from '@/lib';
import { ScreenWrapper } from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';

// Mock data for demo mode
const MOCK_ARCHIVE = [
  { id: '1', title: 'Couscous Royal', price: 850, created_at: '2026-04-28T12:00:00Z', available_quantity: 15, remaining_quantity: 3 },
  { id: '2', title: 'Baklava Box', price: 600, created_at: '2026-04-27T10:00:00Z', available_quantity: 20, remaining_quantity: 0 },
  { id: '3', title: 'Chicken Tagine', price: 950, created_at: '2026-04-26T09:00:00Z', available_quantity: 12, remaining_quantity: 5 },
  { id: '4', title: 'Makroud', price: 400, created_at: '2026-04-25T11:00:00Z', available_quantity: 30, remaining_quantity: 8 },
  { id: '5', title: 'Chorba Frik', price: 500, created_at: '2026-04-24T08:00:00Z', available_quantity: 10, remaining_quantity: 0 },
  { id: '6', title: 'Bourak', price: 350, created_at: '2026-04-23T14:00:00Z', available_quantity: 25, remaining_quantity: 2 },
];

export default function ArchiveScreen() {
  const router = useRouter();
  const { colors, shadows } = useTheme();
  const profile = useAuthStore((s) => s.profile);
  const isDemoMode = useAuthStore((s) => s.isDemoMode);
  const [archive, setArchive] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadArchive();
  }, [profile?.id]);

  const loadArchive = async () => {
    // For demo users or when no profile, use mock data
    if (isDemoMode || !profile?.id || profile.id.startsWith('demo')) {
      setArchive(MOCK_ARCHIVE);
      setLoading(false);
      return;
    }

    try {
      const { data } = await postsApi.getChefArchive(profile.id, 50);
      if (data && data.length > 0) {
        setArchive(data);
      } else {
        setArchive(MOCK_ARCHIVE);
      }
    } catch (e) {
      setArchive(MOCK_ARCHIVE);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <ScreenWrapper>
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 60 }} />
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.onBackground }]}>Kitchen Archive</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList data={archive} keyExtractor={(i: any) => i.id} numColumns={2} columnWrapperStyle={{ gap: 12 }}
        contentContainerStyle={{ gap: 12 }} showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingTop: 40 }}>
            <Text style={{ fontSize: 40 }}>📋</Text>
            <Text style={{ color: colors.onSurfaceVariant, marginTop: 8, fontSize: 15 }}>No posts yet. Start by posting today's special!</Text>
          </View>
        }
        renderItem={({ item }: { item: any }) => (
          <View style={[styles.card, { backgroundColor: colors.surfaceContainerLowest, ...shadows.sm }]}>
            <View style={[styles.cardImg, { backgroundColor: colors.surfaceContainerHigh }]}>
              <Text style={{ fontSize: 36 }}>🍽️</Text>
            </View>
            <View style={{ padding: 10 }}>
              <Text style={[styles.cardTitle, { color: colors.onSurface }]} numberOfLines={1}>{item.title}</Text>
              <Text style={[styles.cardPrice, { color: colors.primary }]}>{item.price} DA</Text>
              <View style={styles.cardMeta}>
                <Text style={[styles.cardDate, { color: colors.outline }]}>{new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</Text>
                <Text style={[styles.cardOrders, { color: colors.onSurfaceVariant }]}>{item.available_quantity - item.remaining_quantity} sold</Text>
              </View>
            </View>
          </View>
        )}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, marginTop: 8 },
  title: { fontFamily: 'NotoSerif-Bold', fontSize: 22, fontWeight: '700' },
  card: { flex: 1, borderRadius: 14, overflow: 'hidden' },
  cardImg: { height: 100, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 14, fontWeight: '600' },
  cardPrice: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 14, fontWeight: '700', marginTop: 2 },
  cardMeta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  cardDate: { fontFamily: 'PlusJakartaSans-Regular', fontSize: 11 },
  cardOrders: { fontFamily: 'PlusJakartaSans-Regular', fontSize: 11 },
});


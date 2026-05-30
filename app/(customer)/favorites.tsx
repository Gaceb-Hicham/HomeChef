import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/stores/authStore';
import { ScreenWrapper, PostImage, AvatarImage } from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';
import { savedApi } from '@/lib/api';

export default function FavoritesScreen() {
  const router = useRouter();
  const { colors, shadows } = useTheme();
  const profile = useAuthStore((s) => s.profile);
  const [tab, setTab] = useState<'dishes' | 'chefs'>('dishes');
  const [savedDishes, setSavedDishes] = useState<any[]>([]);
  const [savedChefs, setSavedChefs] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!profile?.id) return;
    const [dishesRes, chefsRes] = await Promise.all([
      savedApi.getSavedDishes(profile.id),
      savedApi.getSavedChefs(profile.id),
    ]);
    setSavedDishes(dishesRes.data);
    setSavedChefs(chefsRes.data);
  }, [profile?.id]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const handleUnsave = async (type: 'dish' | 'chef', id: string) => {
    if (!profile?.id) return;
    await savedApi.toggleSaved(profile.id, type, id);
    load();
  };

  return (
    <ScreenWrapper>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.onSurface} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.onBackground }]}>❤️ Favorites</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Tabs */}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
          {(['dishes', 'chefs'] as const).map(t => (
            <TouchableOpacity key={t} onPress={() => setTab(t)}
              style={[styles.tab, { backgroundColor: tab === t ? colors.primary : colors.surfaceContainerLow }]}>
              <Ionicons name={t === 'dishes' ? 'restaurant' : 'people'} size={16} color={tab === t ? '#fff' : colors.onSurface} />
              <Text style={{ color: tab === t ? '#fff' : colors.onSurface, fontWeight: '600', fontSize: 13, marginLeft: 6 }}>
                {t === 'dishes' ? `Dishes (${savedDishes.length})` : `Chefs (${savedChefs.length})`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Dishes */}
        {tab === 'dishes' && (
          savedDishes.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="heart-outline" size={48} color={colors.outline} />
              <Text style={{ color: colors.outline, marginTop: 12 }}>No saved dishes yet</Text>
              <Text style={{ color: colors.outline, fontSize: 13, marginTop: 4 }}>Tap ❤️ on any dish to save it here</Text>
            </View>
          ) : (
            savedDishes.map(dish => (
              <TouchableOpacity key={dish.id}
                onPress={() => router.push(`/(customer)/offer/${dish.id}`)}
                style={[styles.card, { backgroundColor: colors.surfaceContainerLowest, ...shadows.sm }]}>
                <PostImage photos={dish.photos} height={50} borderRadius={12} style={{ width: 50 }} showCarousel={false} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={{ color: colors.onSurface, fontWeight: '700', fontSize: 15 }}>{dish.title}</Text>
                  <Text style={{ color: colors.onSurfaceVariant, fontSize: 12 }}>by {dish.chef?.full_name}</Text>
                </View>
                <Text style={{ color: colors.primary, fontWeight: '700', marginRight: 8 }}>{dish.price} DA</Text>
                <TouchableOpacity onPress={() => handleUnsave('dish', dish.id)}>
                  <Ionicons name="heart" size={22} color="#dc2626" />
                </TouchableOpacity>
              </TouchableOpacity>
            ))
          )
        )}

        {/* Chefs */}
        {tab === 'chefs' && (
          savedChefs.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="people-outline" size={48} color={colors.outline} />
              <Text style={{ color: colors.outline, marginTop: 12 }}>No saved chefs yet</Text>
            </View>
          ) : (
            savedChefs.map(chef => {
              const cp = chef.chef_profiles?.[0] || chef.chef_profiles;
              return (
                <TouchableOpacity key={chef.id}
                  onPress={() => router.push(`/(customer)/chef/${chef.id}`)}
                  style={[styles.card, { backgroundColor: colors.surfaceContainerLowest, ...shadows.sm }]}>
                  <AvatarImage uri={chef.profile_photo_url} size={44} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Text style={{ color: colors.onSurface, fontWeight: '700', fontSize: 15 }}>{chef.full_name}</Text>
                      {cp?.is_verified && (
                        <Ionicons name="checkmark-circle" size={16} color="#2563eb" />
                      )}
                    </View>
                    <Text style={{ color: colors.onSurfaceVariant, fontSize: 12 }}>{cp?.kitchen_name || ''}</Text>
                    {cp?.rating_average && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 }}>
                        <Ionicons name="star" size={12} color="#f59e0b" />
                        <Text style={{ color: colors.onSurfaceVariant, fontSize: 11 }}>
                          {Number(cp.rating_average).toFixed(1)} ({cp.total_reviews})
                        </Text>
                      </View>
                    )}
                  </View>
                  <TouchableOpacity onPress={() => handleUnsave('chef', chef.id)}>
                    <Ionicons name="heart" size={22} color="#dc2626" />
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            })
          )
        )}

        <View style={{ height: 30 }} />
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, marginTop: 8 },
  title: { fontFamily: 'NotoSerif-Bold', fontSize: 22, fontWeight: '700' },
  tab: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, flex: 1, justifyContent: 'center' },
  card: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 14, marginBottom: 10 },
  empty: { alignItems: 'center', paddingVertical: 60 },
});

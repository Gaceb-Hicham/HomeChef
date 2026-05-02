import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/stores/authStore';
import { useSavedStore } from '@/stores/appStores';
import { ScreenWrapper } from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';

const MOCK_DISHES = [
  { id: 'd1', title: 'Couscous Royal', chef: 'Sarah K.', price: 850, emoji: '🍲' },
  { id: 'd2', title: 'Baklava Box', chef: 'Ahmed M.', price: 450, emoji: '🍰' },
  { id: 'd3', title: 'Tajine Zitoune', chef: 'Fatima Z.', price: 700, emoji: '🥘' },
];

const MOCK_CHEFS = [
  { id: 'c1', name: 'Sarah K.', specialty: 'Traditional Algerian', rating: 4.8, emoji: '👩‍🍳' },
  { id: 'c2', name: 'Ahmed M.', specialty: 'Pastries & Desserts', rating: 4.6, emoji: '👨‍🍳' },
];

export default function SavedScreen() {
  const router = useRouter();
  const { colors, shadows } = useTheme();
  const profile = useAuthStore((s) => s.profile);
  const { savedDishes, savedChefs, fetchSaved, toggleSave } = useSavedStore();
  const [tab, setTab] = useState<'dishes' | 'chefs'>('dishes');

  useEffect(() => {
    if (profile?.id) fetchSaved(profile.id);
  }, [profile?.id]);

  const dishes = savedDishes.length > 0 ? savedDishes : MOCK_DISHES;
  const chefs = savedChefs.length > 0 ? savedChefs : MOCK_CHEFS;

  return (
    <ScreenWrapper padded={false}>
      <View style={[styles.header, { paddingHorizontal: 20 }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.onBackground }]}>Saved</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Tabs */}
      <View style={[styles.tabs, { paddingHorizontal: 20, marginBottom: 16 }]}>
        {(['dishes', 'chefs'] as const).map((t) => (
          <TouchableOpacity key={t} onPress={() => setTab(t)}
            style={[styles.tab, { borderBottomColor: tab === t ? colors.primary : 'transparent' }]}>
            <Text style={[styles.tabText, { color: tab === t ? colors.primary : colors.onSurfaceVariant }]}>
              {t === 'dishes' ? `Dishes (${dishes.length})` : `Chefs (${chefs.length})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'dishes' ? (
        <FlatList data={dishes} keyExtractor={(i: any) => i.id || i.reference_id}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 10, paddingBottom: 24 }}
          renderItem={({ item }: { item: any }) => (
            <View style={[styles.card, { backgroundColor: colors.surfaceContainerLowest, ...shadows.sm }]}>
              <View style={[styles.cardImg, { backgroundColor: colors.surfaceContainerHigh }]}>
                <Text style={{ fontSize: 28 }}>{item.emoji || '🍽️'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: colors.onSurface }]}>{item.title || 'Saved Dish'}</Text>
                <Text style={[styles.cardSub, { color: colors.onSurfaceVariant }]}>by {item.chef || 'Chef'}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                {item.price && <Text style={[styles.cardPrice, { color: colors.primary }]}>{item.price} DA</Text>}
                <TouchableOpacity
                  onPress={() => profile?.id && toggleSave(profile.id, 'dish', item.id || item.reference_id)}
                  style={styles.heartBtn}>
                  <Ionicons name="heart" size={20} color={colors.error} />
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      ) : (
        <FlatList data={chefs} keyExtractor={(i: any) => i.id || i.reference_id}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 10, paddingBottom: 24 }}
          renderItem={({ item }: { item: any }) => (
            <TouchableOpacity
              onPress={() => router.push(`/(customer)/chef/${item.id || item.reference_id}`)}
              style={[styles.card, { backgroundColor: colors.surfaceContainerLowest, ...shadows.sm }]}>
              <View style={[styles.chefAvatar, { backgroundColor: colors.surfaceContainerHigh }]}>
                <Text style={{ fontSize: 28 }}>{item.emoji || '👨‍🍳'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: colors.onSurface }]}>{item.name || 'Chef'}</Text>
                <Text style={[styles.cardSub, { color: colors.onSurfaceVariant }]}>{item.specialty || ''}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                {item.rating && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                    <Ionicons name="star" size={14} color="#f59e0b" />
                    <Text style={{ color: colors.onSurface, fontWeight: '600', fontSize: 13 }}>{item.rating}</Text>
                  </View>
                )}
                <TouchableOpacity
                  onPress={() => profile?.id && toggleSave(profile.id, 'chef', item.id || item.reference_id)}
                  style={styles.heartBtn}>
                  <Ionicons name="heart" size={20} color={colors.error} />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, marginBottom: 12 },
  title: { fontFamily: 'NotoSerif-Bold', fontSize: 22, fontWeight: '700' },
  tabs: { flexDirection: 'row', gap: 20 },
  tab: { paddingBottom: 8, borderBottomWidth: 2.5 },
  tabText: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 15, fontWeight: '600' },
  card: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, gap: 12 },
  cardImg: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  chefAvatar: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 15, fontWeight: '600' },
  cardSub: { fontFamily: 'PlusJakartaSans-Regular', fontSize: 12, marginTop: 2 },
  cardPrice: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 15, fontWeight: '700' },
  heartBtn: { marginTop: 4, padding: 4 },
});

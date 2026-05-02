import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { ScreenWrapper } from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';

const SAVED_CHEFS = [
  { id: '1', name: 'Sarah K.', kitchen: "Mama's Kitchen", rating: 4.9, emoji: '👩‍🍳' },
  { id: '2', name: 'Ahmed M.', kitchen: 'Sweet Delights', rating: 4.8, emoji: '👨‍🍳' },
];
const SAVED_DISHES = [
  { id: '1', title: 'Couscous Royal', chef: 'Sarah K.', price: 850, emoji: '🍲' },
  { id: '2', title: 'Baklava Box', chef: 'Ahmed M.', price: 450, emoji: '🍰' },
  { id: '3', title: 'Chorba Frik', chef: 'Sarah K.', price: 400, emoji: '🍜' },
];

export default function SavedScreen() {
  const router = useRouter();
  const { colors, shadows } = useTheme();
  const [tab, setTab] = useState<'chefs' | 'dishes'>('dishes');

  return (
    <ScreenWrapper>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.onBackground }]}>Saved</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={[styles.tabs, { backgroundColor: colors.surfaceContainerLow }]}>
        {(['dishes', 'chefs'] as const).map((t) => (
          <TouchableOpacity key={t} onPress={() => setTab(t)}
            style={[styles.tab, tab === t && { backgroundColor: colors.surfaceContainerLowest }]}>
            <Text style={{ color: tab === t ? colors.primary : colors.outline, fontSize: 14, fontWeight: '600' }}>
              {t === 'dishes' ? '🍽️ Dishes' : '👨‍🍳 Chefs'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'dishes' ? (
        <FlatList data={SAVED_DISHES} keyExtractor={(i) => i.id} showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity style={[styles.card, { backgroundColor: colors.surfaceContainerLowest, ...shadows.sm }]}
              onPress={() => router.push(`/(customer)/offer/${item.id}`)}>
              <View style={[styles.cardImg, { backgroundColor: colors.surfaceContainerHigh }]}>
                <Text style={{ fontSize: 30 }}>{item.emoji}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: colors.onSurface }]}>{item.title}</Text>
                <Text style={[styles.cardSub, { color: colors.onSurfaceVariant }]}>{item.chef}</Text>
              </View>
              <Text style={[styles.cardPrice, { color: colors.primary }]}>{item.price} DA</Text>
              <TouchableOpacity><Ionicons name="heart" size={22} color="#ef4444" /></TouchableOpacity>
            </TouchableOpacity>
          )}
        />
      ) : (
        <FlatList data={SAVED_CHEFS} keyExtractor={(i) => i.id} showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity style={[styles.card, { backgroundColor: colors.surfaceContainerLowest, ...shadows.sm }]}
              onPress={() => router.push(`/(customer)/chef/${item.id}`)}>
              <View style={[styles.chefAvatar, { backgroundColor: colors.surfaceContainerHigh }]}>
                <Text style={{ fontSize: 28 }}>{item.emoji}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: colors.onSurface }]}>{item.name}</Text>
                <Text style={[styles.cardSub, { color: colors.onSurfaceVariant }]}>{item.kitchen}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="star" size={14} color="#F59E0B" />
                <Text style={{ color: colors.onSurface, fontWeight: '600' }}>{item.rating}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, marginTop: 8 },
  title: { fontFamily: 'NotoSerif-Bold', fontSize: 22, fontWeight: '700' },
  tabs: { flexDirection: 'row', borderRadius: 12, padding: 4, marginBottom: 16 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  card: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, marginBottom: 8, gap: 12 },
  cardImg: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  chefAvatar: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 15, fontWeight: '600' },
  cardSub: { fontFamily: 'PlusJakartaSans-Regular', fontSize: 12, marginTop: 2 },
  cardPrice: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 15, fontWeight: '700', marginRight: 8 },
});

import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { ScreenWrapper } from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';

const RECENT = ['Couscous', 'Baklava', 'Pizza', 'Crepes'];
const TRENDING = [
  { id: '1', name: 'Bourek', emoji: '🥟', count: 42 },
  { id: '2', name: 'Msemen', emoji: '🫓', count: 38 },
  { id: '3', name: 'Chorba', emoji: '🍲', count: 35 },
  { id: '4', name: 'Makrout', emoji: '🍯', count: 29 },
];
const NEARBY_CHEFS = [
  { id: '1', name: 'Mama Fatima', specialty: 'Traditional Algerian', rating: 4.9, emoji: '👩‍🍳' },
  { id: '2', name: 'Chef Youcef', specialty: 'French Pastries', rating: 4.8, emoji: '👨‍🍳' },
  { id: '3', name: 'Nadia Cooks', specialty: 'Healthy Bowls', rating: 4.7, emoji: '👩‍🍳' },
];

export default function SearchScreen() {
  const { colors, shadows, spacing } = useTheme();
  const router = useRouter();
  const [query, setQuery] = useState('');

  return (
    <ScreenWrapper>
      <Text style={[styles.title, { color: colors.onBackground }]}>Explore</Text>
      {/* Search bar */}
      <View style={[styles.searchBar, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.outlineVariant }]}>
        <Ionicons name="search" size={20} color={colors.outline} />
        <TextInput style={[styles.searchInput, { color: colors.onSurface }]}
          placeholder="Search dishes, chefs..." placeholderTextColor={colors.outline}
          value={query} onChangeText={setQuery} />
        {query ? (
          <TouchableOpacity onPress={() => setQuery('')}>
            <Ionicons name="close-circle" size={20} color={colors.outline} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity><Ionicons name="options-outline" size={20} color={colors.primary} /></TouchableOpacity>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Recent searches */}
        <Text style={[styles.section, { color: colors.onBackground }]}>Recent Searches</Text>
        <View style={styles.tagsRow}>
          {RECENT.map((r) => (
            <TouchableOpacity key={r} style={[styles.tag, { backgroundColor: colors.surfaceContainerLow }]}>
              <Ionicons name="time-outline" size={14} color={colors.outline} />
              <Text style={[styles.tagText, { color: colors.onSurfaceVariant }]}>{r}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Trending */}
        <Text style={[styles.section, { color: colors.onBackground }]}>🔥 Trending Now</Text>
        {TRENDING.map((t) => (
          <TouchableOpacity key={t.id} style={[styles.trendRow, { borderBottomColor: colors.outlineVariant }]}>
            <Text style={{ fontSize: 28 }}>{t.emoji}</Text>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.trendName, { color: colors.onSurface }]}>{t.name}</Text>
              <Text style={[styles.trendCount, { color: colors.outline }]}>{t.count} orders today</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.outline} />
          </TouchableOpacity>
        ))}

        {/* Nearby Chefs */}
        <Text style={[styles.section, { color: colors.onBackground, marginTop: 24 }]}>📍 Nearby Chefs</Text>
        {NEARBY_CHEFS.map((c) => (
          <TouchableOpacity key={c.id} onPress={() => router.push(`/(customer)/chef/${c.id}`)}
            style={[styles.chefCard, { backgroundColor: colors.surfaceContainerLowest, ...shadows.sm }]}>
            <View style={[styles.chefAvatar, { backgroundColor: colors.surfaceContainerHigh }]}>
              <Text style={{ fontSize: 30 }}>{c.emoji}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.chefCardName, { color: colors.onSurface }]}>{c.name}</Text>
              <Text style={[styles.chefSpec, { color: colors.onSurfaceVariant }]}>{c.specialty}</Text>
            </View>
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={14} color="#F59E0B" />
              <Text style={[styles.ratingText, { color: colors.onSurface }]}>{c.rating}</Text>
            </View>
          </TouchableOpacity>
        ))}
        <View style={{ height: 24 }} />
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: 'NotoSerif-Bold', fontSize: 28, fontWeight: '700', marginTop: 8, marginBottom: 16 },
  searchBar: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, height: 50, gap: 10, marginBottom: 24 },
  searchInput: { flex: 1, fontSize: 15, fontFamily: 'PlusJakartaSans-Regular' },
  section: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 16, fontWeight: '600', marginBottom: 12 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 28 },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  tagText: { fontFamily: 'PlusJakartaSans-Regular', fontSize: 13 },
  trendRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 0.5 },
  trendName: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 15, fontWeight: '600' },
  trendCount: { fontFamily: 'PlusJakartaSans-Regular', fontSize: 12, marginTop: 2 },
  chefCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 16, marginBottom: 10, gap: 12 },
  chefAvatar: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  chefCardName: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 15, fontWeight: '600' },
  chefSpec: { fontFamily: 'PlusJakartaSans-Regular', fontSize: 12, marginTop: 2 },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 14, fontWeight: '600' },
});

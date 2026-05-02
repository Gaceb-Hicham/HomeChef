import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { usePostsStore } from '@/stores/postsStore';
import { ScreenWrapper } from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';

const RECENT = ['Couscous', 'Baklava', 'Tajine', 'Chorba'];
const TRENDING = [
  { id: 't1', title: 'Homemade Bread', emoji: '🍞', count: '125 chefs' },
  { id: 't2', title: 'Friday Couscous', emoji: '🍲', count: '98 chefs' },
  { id: 't3', title: 'Ramadan Specials', emoji: '🌙', count: '87 chefs' },
  { id: 't4', title: 'Birthday Cakes', emoji: '🎂', count: '64 chefs' },
];

const NEARBY_CHEFS = [
  { id: 'n1', name: 'Sarah K.', distance: '0.5 km', rating: 4.8, specialty: 'Traditional', emoji: '👩‍🍳' },
  { id: 'n2', name: 'Ahmed M.', distance: '1.2 km', rating: 4.6, specialty: 'Pastries', emoji: '👨‍🍳' },
  { id: 'n3', name: 'Fatima Z.', distance: '2.1 km', rating: 4.9, specialty: 'Healthy', emoji: '👩‍🍳' },
];

export default function SearchScreen() {
  const router = useRouter();
  const { colors, shadows } = useTheme();
  const { searchResults, searchPosts, isLoading, clearSearch } = usePostsStore();
  const [query, setQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState(RECENT);

  const handleSearch = useCallback((text: string) => {
    setQuery(text);
    if (text.trim().length >= 2) {
      searchPosts(text);
    } else {
      clearSearch();
    }
  }, []);

  const handleRecentTap = (term: string) => {
    setQuery(term);
    searchPosts(term);
  };

  const isSearching = query.trim().length >= 2;

  return (
    <ScreenWrapper padded={false}>
      {/* Search bar */}
      <View style={[styles.searchBar, { paddingHorizontal: 20 }]}>
        <View style={[styles.searchInput, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.outlineVariant }]}>
          <Ionicons name="search" size={20} color={colors.outline} />
          <TextInput
            value={query}
            onChangeText={handleSearch}
            placeholder="Search dishes, chefs..."
            placeholderTextColor={colors.outline}
            style={[styles.input, { color: colors.onSurface }]}
            autoCapitalize="none"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => { setQuery(''); clearSearch(); }}>
              <Ionicons name="close-circle" size={20} color={colors.outline} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {isSearching ? (
        /* Search results */
        <FlatList data={searchResults} keyExtractor={(i: any) => i.id}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 10, paddingBottom: 24 }}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingTop: 40 }}>
              <Text style={{ fontSize: 40 }}>🔍</Text>
              <Text style={{ color: colors.onSurfaceVariant, marginTop: 8, fontSize: 15 }}>
                {isLoading ? 'Searching...' : 'No results found'}
              </Text>
            </View>
          }
          renderItem={({ item }: { item: any }) => (
            <TouchableOpacity
              onPress={() => router.push(`/(customer)/offer/${item.id}`)}
              style={[styles.resultCard, { backgroundColor: colors.surfaceContainerLowest, ...shadows.sm }]}>
              <View style={[styles.resultImg, { backgroundColor: colors.surfaceContainerHigh }]}>
                <Text style={{ fontSize: 28 }}>🍽️</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.resultTitle, { color: colors.onSurface }]}>{item.title}</Text>
                <Text style={[styles.resultChef, { color: colors.onSurfaceVariant }]}>
                  by {item.chef?.full_name || 'Chef'}
                </Text>
              </View>
              <Text style={[styles.resultPrice, { color: colors.primary }]}>{item.price} DA</Text>
            </TouchableOpacity>
          )}
        />
      ) : (
        <FlatList
          data={[]}
          renderItem={null}
          ListHeaderComponent={
            <View style={{ paddingHorizontal: 20 }}>
              {/* Recent searches */}
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.onBackground }]}>Recent</Text>
                <TouchableOpacity onPress={() => setRecentSearches([])}>
                  <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '600' }}>Clear</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.tagsRow}>
                {recentSearches.map((term) => (
                  <TouchableOpacity key={term} onPress={() => handleRecentTap(term)}
                    style={[styles.recentChip, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.outlineVariant }]}>
                    <Ionicons name="time-outline" size={14} color={colors.outline} />
                    <Text style={{ color: colors.onSurfaceVariant, fontSize: 13 }}>{term}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Trending */}
              <Text style={[styles.sectionTitle, { color: colors.onBackground, marginTop: 20 }]}>🔥 Trending</Text>
              {TRENDING.map((t) => (
                <TouchableOpacity key={t.id} onPress={() => handleRecentTap(t.title)}
                  style={[styles.trendRow, { borderBottomColor: colors.outlineVariant }]}>
                  <Text style={{ fontSize: 24 }}>{t.emoji}</Text>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[styles.trendTitle, { color: colors.onSurface }]}>{t.title}</Text>
                    <Text style={{ color: colors.outline, fontSize: 12 }}>{t.count}</Text>
                  </View>
                  <Ionicons name="trending-up" size={18} color={colors.primary} />
                </TouchableOpacity>
              ))}

              {/* Nearby chefs */}
              <Text style={[styles.sectionTitle, { color: colors.onBackground, marginTop: 20 }]}>📍 Nearby Chefs</Text>
              {NEARBY_CHEFS.map((c) => (
                <TouchableOpacity key={c.id}
                  onPress={() => router.push(`/(customer)/chef/${c.id}`)}
                  style={[styles.chefRow, { backgroundColor: colors.surfaceContainerLowest, ...shadows.sm }]}>
                  <View style={[styles.chefAvatar, { backgroundColor: colors.surfaceContainerHigh }]}>
                    <Text style={{ fontSize: 24 }}>{c.emoji}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.chefName, { color: colors.onSurface }]}>{c.name}</Text>
                    <Text style={{ color: colors.onSurfaceVariant, fontSize: 12 }}>{c.specialty} • {c.distance}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                    <Ionicons name="star" size={14} color="#f59e0b" />
                    <Text style={{ color: colors.onSurface, fontWeight: '600', fontSize: 13 }}>{c.rating}</Text>
                  </View>
                </TouchableOpacity>
              ))}
              <View style={{ height: 24 }} />
            </View>
          }
        />
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  searchBar: { paddingTop: 8, marginBottom: 16 },
  searchInput: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, borderRadius: 14, borderWidth: 1, gap: 10 },
  input: { flex: 1, fontFamily: 'PlusJakartaSans-Regular', fontSize: 15 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 17, fontWeight: '600' },
  tagsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  recentChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  trendRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 0.5 },
  trendTitle: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 15, fontWeight: '600' },
  chefRow: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, gap: 12, marginBottom: 8 },
  chefAvatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  chefName: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 15, fontWeight: '600' },
  resultCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, gap: 12 },
  resultImg: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  resultTitle: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 15, fontWeight: '600' },
  resultChef: { fontFamily: 'PlusJakartaSans-Regular', fontSize: 12, marginTop: 2 },
  resultPrice: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 15, fontWeight: '700' },
});

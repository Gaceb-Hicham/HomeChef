import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { usePostsStore } from '@/stores/postsStore';
import { chefApi } from '@/lib';
import { ScreenWrapper, PostImage, AvatarImage } from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '@/hooks/useLanguage';

// Category suggestions (not fake data — these are search helpers)
const CATEGORIES = [
  { id: 't1', title: 'Homemade Bread', emoji: '🍞' },
  { id: 't2', title: 'Couscous', emoji: '🍲' },
  { id: 't3', title: 'Desserts', emoji: '🍰' },
  { id: 't4', title: 'Grilled', emoji: '🍗' },
];

export default function SearchScreen() {
  const router = useRouter();
  const { colors, shadows } = useTheme();
  const { t } = useLanguage();
  const { searchResults, searchPosts, isLoading, clearSearch } = usePostsStore();
  const [query, setQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [nearbyChefs, setNearbyChefs] = useState<any[]>([]);
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());

  const toggleFilter = (f: string) => {
    setActiveFilters(prev => {
      const next = new Set(prev);
      next.has(f) ? next.delete(f) : next.add(f);
      return next;
    });
  };

  // Apply filters to search results
  const filteredResults = searchResults.filter((item: any) => {
    if (activeFilters.has('under500') && item.price >= 500) return false;
    if (activeFilters.has('500-1000') && (item.price < 500 || item.price > 1000)) return false;
    if (activeFilters.has('1000+') && item.price < 1000) return false;
    if (activeFilters.has('4stars') && (item.chef?.rating_average || 0) < 4) return false;
    if (activeFilters.has('delivery') && !item.delivery_available) return false;
    if (activeFilters.has('pickup') && !item.pickup_available) return false;
    return true;
  });

  useEffect(() => {
    loadNearbyChefs();
  }, []);

  const loadNearbyChefs = async () => {
    try {
      const { data } = await chefApi.getNearbyChefs();
      if (data) setNearbyChefs(data.slice(0, 5));
    } catch (e) {}
  };

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = useCallback((text: string) => {
    setQuery(text);

    // Clear previous debounce
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (text.trim().length >= 2) {
      // Debounce 300ms to avoid hammering the API
      debounceRef.current = setTimeout(() => {
        searchPosts(text);
        // Add to recent searches
        setRecentSearches(prev => {
          const filtered = prev.filter(s => s !== text);
          return [text, ...filtered].slice(0, 6);
        });
      }, 300);
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
        /* Filter chips */
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 8, marginBottom: 12, alignItems: 'center' }}>
            {[
              { key: 'under500', label: 'Under 500 DA', icon: 'pricetag-outline' },
              { key: '500-1000', label: '500-1000 DA', icon: 'pricetag-outline' },
              { key: '1000+', label: '1000+ DA', icon: 'pricetag-outline' },
              { key: '4stars', label: '⭐ 4+', icon: 'star-outline' },
              { key: 'delivery', label: '🚗 Delivery', icon: 'car-outline' },
              { key: 'pickup', label: '🏠 Pickup', icon: 'storefront-outline' },
            ].map((f) => (
              <TouchableOpacity key={f.key} onPress={() => toggleFilter(f.key)}
                style={[styles.filterChip, {
                  backgroundColor: activeFilters.has(f.key) ? colors.primary : colors.surfaceContainerLow,
                  borderColor: activeFilters.has(f.key) ? colors.primary : colors.outlineVariant,
                }]}>
                <Text style={{ color: activeFilters.has(f.key) ? '#fff' : colors.onSurfaceVariant, fontSize: 13, fontWeight: '600' }}>{f.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        {/* Search results */}
        <FlatList data={filteredResults} keyExtractor={(i: any) => i.id}
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
              <PostImage photos={item.photos} height={52} borderRadius={14} fallbackSize={28} style={{ width: 52 }} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.resultTitle, { color: colors.onSurface }]}>{item.title}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                  <Text style={[styles.resultChef, { color: colors.onSurfaceVariant }]}>
                    by {item.chef?.full_name || 'Chef'}
                  </Text>
                  {item.chef?.chef_profiles?.is_verified && (
                    <Ionicons name="checkmark-circle" size={13} color="#2563eb" />
                  )}
                </View>
              </View>
              <Text style={[styles.resultPrice, { color: colors.primary }]}>{item.price} DA</Text>
            </TouchableOpacity>
          )}
        />
        </>
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

              {/* Popular categories */}
              <Text style={[styles.sectionTitle, { color: colors.onBackground, marginTop: 20 }]}>🔥 Popular Categories</Text>
              {CATEGORIES.map((t) => (
                <TouchableOpacity key={t.id} onPress={() => handleRecentTap(t.title)}
                  style={[styles.trendRow, { borderBottomColor: colors.outlineVariant }]}>
                  <Text style={{ fontSize: 24 }}>{t.emoji}</Text>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[styles.trendTitle, { color: colors.onSurface }]}>{t.title}</Text>
                  </View>
                  <Ionicons name="search" size={18} color={colors.primary} />
                </TouchableOpacity>
              ))}

              {/* Nearby chefs */}
              {nearbyChefs.length > 0 && (
                <>
                  <Text style={[styles.sectionTitle, { color: colors.onBackground, marginTop: 28, marginBottom: 12 }]}>📍 Chefs Near You</Text>
                  {nearbyChefs.map((c: any) => (
                    <TouchableOpacity key={c.id || c.user_id}
                      onPress={() => router.push(`/(customer)/chef/${c.user_id}`)}
                      style={[styles.chefRow, { backgroundColor: colors.surfaceContainerLowest, ...shadows.sm }]}>
                      <AvatarImage uri={c.cover_photo_url} size={48} emoji="👨‍🍳" />
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <Text style={[styles.chefName, { color: colors.onSurface }]}>{c.kitchen_name}</Text>
                          {c.is_verified && <Ionicons name="checkmark-circle" size={14} color="#2563eb" />}
                        </View>
                        <Text style={{ color: colors.onSurfaceVariant, fontSize: 12 }}>{(c.specialty_tags || []).join(' • ')}</Text>
                      </View>
                      {c.rating_average > 0 && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                          <Ionicons name="star" size={14} color="#f59e0b" />
                          <Text style={{ color: colors.onSurface, fontWeight: '600', fontSize: 13 }}>{c.rating_average}</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </>
              )}
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
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
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

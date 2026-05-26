import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { ScreenWrapper, PostImage, AvatarImage } from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';

const RECENT_SEARCHES_KEY = 'recent_searches';

export default function SearchScreen() {
  const router = useRouter();
  const { colors, shadows } = useTheme();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ dishes: any[]; chefs: any[] }>({ dishes: [], chefs: [] });
  const [isSearching, setIsSearching] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [tab, setTab] = useState<'dishes' | 'chefs'>('dishes');

  const popularTags = ['🍲 Couscous', '🍰 Dessert', '🥗 Salad', '🍗 Grilled', '🍞 Bread', '☕ Coffee'];

  const handleSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) { setResults({ dishes: [], chefs: [] }); return; }
    setIsSearching(true);

    // Search dishes
    const { data: dishes } = await supabase
      .from('daily_posts')
      .select('id, title, price, photos, quantity_available, cuisine_type, chef:users!daily_posts_chef_id_fkey(full_name, profile_photo_url, chef_profiles(kitchen_name, is_open))')
      .ilike('title', `%${q.trim()}%`)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(20);

    // Search chefs
    const { data: chefs } = await supabase
      .from('users')
      .select('id, full_name, profile_photo_url, chef_profiles(kitchen_name, is_open, cuisine_tags, delivery_radius_km)')
      .ilike('full_name', `%${q.trim()}%`)
      .eq('role', 'chef')
      .limit(15);

    setResults({ dishes: dishes || [], chefs: chefs || [] });
    setIsSearching(false);

    // Save to recent
    setRecentSearches(prev => {
      const updated = [q.trim(), ...prev.filter(s => s !== q.trim())].slice(0, 8);
      return updated;
    });
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => { if (query.length >= 2) handleSearch(query); }, 400);
    return () => clearTimeout(timer);
  }, [query]);

  const renderDish = ({ item }: { item: any }) => {
    const chef = item.chef;
    const isOpen = chef?.chef_profiles?.is_open !== false;
    return (
      <TouchableOpacity
        onPress={() => router.push(`/(customer)/offer/${item.id}`)}
        style={[styles.dishCard, { backgroundColor: colors.surfaceContainerLowest, ...shadows.sm }]}>
        <PostImage photos={item.photos} height={52} borderRadius={12} fallbackSize={24} showCarousel={false} style={{ width: 52 }} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text numberOfLines={1} style={{ color: colors.onSurface, fontWeight: '700', fontSize: 15 }}>{item.title}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
            <Text style={{ color: colors.onSurfaceVariant, fontSize: 12 }}>
              {chef?.chef_profiles?.kitchen_name || chef?.full_name || 'Chef'}
            </Text>
            <View style={[styles.openDot, { backgroundColor: isOpen ? '#16a34a' : '#dc2626' }]} />
          </View>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ color: colors.primary, fontWeight: '800', fontSize: 15 }}>{item.price} DA</Text>
          <Text style={{ color: colors.outline, fontSize: 11, marginTop: 2 }}>{item.quantity_available} left</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderChef = ({ item }: { item: any }) => {
    const cp = item.chef_profiles;
    const isOpen = cp?.is_open !== false;
    const tags = cp?.cuisine_tags || [];
    return (
      <TouchableOpacity
        onPress={() => router.push(`/(customer)/chef/${item.id}`)}
        style={[styles.chefCard, { backgroundColor: colors.surfaceContainerLowest, ...shadows.sm }]}>
        <AvatarImage uri={item.profile_photo_url} size={56} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{ color: colors.onSurface, fontWeight: '700', fontSize: 16 }}>{item.full_name}</Text>
            <View style={[styles.openBadge, { backgroundColor: isOpen ? '#dcfce7' : '#fee2e2' }]}>
              <Text style={{ color: isOpen ? '#16a34a' : '#dc2626', fontSize: 10, fontWeight: '700' }}>
                {isOpen ? 'OPEN' : 'CLOSED'}
              </Text>
            </View>
          </View>
          {cp?.kitchen_name && (
            <Text style={{ color: colors.onSurfaceVariant, fontSize: 13, marginTop: 2 }}>{cp.kitchen_name}</Text>
          )}
          {tags.length > 0 && (
            <View style={{ flexDirection: 'row', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
              {tags.slice(0, 3).map((tag: string) => (
                <View key={tag} style={[styles.tagChip, { backgroundColor: colors.surfaceContainerLow }]}>
                  <Text style={{ color: colors.onSurfaceVariant, fontSize: 11 }}>{tag}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.outline} />
      </TouchableOpacity>
    );
  };

  const hasResults = results.dishes.length > 0 || results.chefs.length > 0;
  const currentData = tab === 'dishes' ? results.dishes : results.chefs;

  return (
    <ScreenWrapper>
      {/* Search bar */}
      <View style={[styles.searchBar, { backgroundColor: colors.surfaceContainerLow }]}>
        <Ionicons name="search" size={20} color={colors.outline} />
        <TextInput
          style={[styles.searchInput, { color: colors.onSurface }]}
          placeholder="Search dishes, chefs..."
          placeholderTextColor={colors.outline}
          value={query}
          onChangeText={setQuery}
          autoFocus
          returnKeyType="search"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => { setQuery(''); setResults({ dishes: [], chefs: [] }); }}>
            <Ionicons name="close-circle" size={20} color={colors.outline} />
          </TouchableOpacity>
        )}
      </View>

      {/* No query — show popular & recent */}
      {!hasResults && query.length < 2 && (
        <View style={{ marginTop: 20 }}>
          {recentSearches.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.onBackground }]}>Recent</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                {recentSearches.map(s => (
                  <TouchableOpacity key={s} onPress={() => setQuery(s)}
                    style={[styles.recentChip, { backgroundColor: colors.surfaceContainerLow }]}>
                    <Ionicons name="time-outline" size={14} color={colors.outline} />
                    <Text style={{ color: colors.onSurface, fontSize: 13, marginLeft: 4 }}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
          <Text style={[styles.sectionTitle, { color: colors.onBackground }]}>Popular</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {popularTags.map(tag => (
              <TouchableOpacity key={tag} onPress={() => setQuery(tag.replace(/^[^\s]+\s/, ''))}
                style={[styles.tagChip, { backgroundColor: colors.surfaceContainerLow, paddingHorizontal: 14, paddingVertical: 8 }]}>
                <Text style={{ color: colors.onSurface, fontSize: 14 }}>{tag}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Results tabs */}
      {hasResults && (
        <>
          <View style={[styles.tabs, { marginTop: 12 }]}>
            <TouchableOpacity onPress={() => setTab('dishes')}
              style={[styles.tab, { borderBottomColor: tab === 'dishes' ? colors.primary : 'transparent' }]}>
              <Text style={{ color: tab === 'dishes' ? colors.primary : colors.onSurfaceVariant, fontWeight: '600' }}>
                Dishes ({results.dishes.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setTab('chefs')}
              style={[styles.tab, { borderBottomColor: tab === 'chefs' ? colors.primary : 'transparent' }]}>
              <Text style={{ color: tab === 'chefs' ? colors.primary : colors.onSurfaceVariant, fontWeight: '600' }}>
                Chefs ({results.chefs.length})
              </Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={currentData}
            renderItem={tab === 'dishes' ? renderDish : renderChef}
            keyExtractor={(i: any) => i.id}
            contentContainerStyle={{ gap: 10, paddingTop: 12, paddingBottom: 24 }}
            ListEmptyComponent={
              <View style={{ alignItems: 'center', paddingTop: 40 }}>
                <Text style={{ color: colors.outline, fontSize: 14 }}>No {tab} found</Text>
              </View>
            }
          />
        </>
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  searchBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, gap: 8 },
  searchInput: { flex: 1, fontSize: 16, fontFamily: 'PlusJakartaSans-Regular', paddingVertical: 4 },
  sectionTitle: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 16, fontWeight: '600', marginBottom: 10 },
  tabs: { flexDirection: 'row', gap: 20 },
  tab: { paddingBottom: 8, borderBottomWidth: 2.5 },
  dishCard: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 14 },
  chefCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 16 },
  tagChip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  recentChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  openDot: { width: 6, height: 6, borderRadius: 3 },
  openBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
});

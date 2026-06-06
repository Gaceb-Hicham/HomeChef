import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/stores/authStore';
import { chefApi } from '@/lib/api';
import { ScreenWrapper, AvatarImage } from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';

export default function ChefsDirectoryScreen() {
  const router = useRouter();
  const { colors, shadows } = useTheme();
  const profile = useAuthStore((s) => s.profile);

  const [chefs, setChefs] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const LIMIT = 20;

  const loadChefs = useCallback(async (reset = false) => {
    const newOffset = reset ? 0 : offset;
    if (reset) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }

    const { data, hasMore: more } = await chefApi.browseChefs(
      profile?.city || undefined,
      LIMIT,
      newOffset
    );

    if (reset) {
      setChefs(data);
    } else {
      setChefs((prev) => [...prev, ...data]);
    }
    setHasMore(more);
    setOffset(newOffset + data.length);
    setIsLoading(false);
    setIsLoadingMore(false);
  }, [offset, profile?.city]);

  useEffect(() => {
    loadChefs(true);
  }, []);

  // Debounced search
  const [debounceTimer, setDebounceTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    if (debounceTimer) clearTimeout(debounceTimer);

    if (text.trim().length >= 2) {
      const timer = setTimeout(async () => {
        setIsLoading(true);
        const { data } = await chefApi.searchChefs(text);
        setChefs(data);
        setHasMore(false);
        setIsLoading(false);
      }, 300);
      setDebounceTimer(timer);
    } else if (text.trim().length === 0) {
      loadChefs(true);
    }
  };

  const loadMore = () => {
    if (!hasMore || isLoadingMore || searchQuery.trim().length >= 2) return;
    loadChefs(false);
  };

  const renderChef = ({ item }: { item: any }) => {
    const cp = Array.isArray(item.chef_profiles) ? item.chef_profiles[0] : item.chef_profiles;
    if (!cp) return null;

    return (
      <TouchableOpacity
        onPress={() => router.push(`/(customer)/chef/${item.id}`)}
        style={[styles.chefCard, { backgroundColor: colors.surfaceContainerLowest, ...shadows.sm }]}
      >
        <AvatarImage uri={item.profile_photo_url} size={56} emoji="👨‍🍳" />
        <View style={styles.chefInfo}>
          <View style={styles.nameRow}>
            <Text style={[styles.chefName, { color: colors.onSurface }]} numberOfLines={1}>
              {item.full_name}
            </Text>
            {cp.is_verified && (
              <Ionicons name="checkmark-circle" size={15} color="#2563eb" />
            )}
            <View
              style={[
                styles.statusDot,
                { backgroundColor: cp.is_open ? '#16a34a' : '#dc2626' },
              ]}
            />
          </View>

          <Text style={{ color: colors.onSurfaceVariant, fontSize: 13 }} numberOfLines={1}>
            {cp.kitchen_name}
            {item.area ? ` · ${item.area}` : ''}
          </Text>

          {cp.specialty_tags && cp.specialty_tags.length > 0 && (
            <View style={styles.tagsRow}>
              {cp.specialty_tags.slice(0, 3).map((tag: string, i: number) => (
                <View key={i} style={[styles.tagChip, { backgroundColor: colors.surfaceContainerLow }]}>
                  <Text style={{ color: colors.onSurfaceVariant, fontSize: 11 }}>{tag}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.ratingCol}>
          {cp.rating_average > 0 && (
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={14} color="#f59e0b" />
              <Text style={[styles.ratingText, { color: colors.onSurface }]}>
                {Number(cp.rating_average).toFixed(1)}
              </Text>
            </View>
          )}
          <Text style={{ color: colors.outline, fontSize: 11 }}>
            {cp.total_reviews || 0} reviews
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ScreenWrapper padded={false}>
        {/* Header */}
        <View style={[styles.header, { paddingHorizontal: 20 }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.onSurface} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.onBackground }]}>Chef Directory</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Search */}
        <View style={{ paddingHorizontal: 20, marginBottom: 12 }}>
          <View style={[styles.searchInput, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.outlineVariant }]}>
            <Ionicons name="search" size={18} color={colors.outline} />
            <TextInput
              value={searchQuery}
              onChangeText={handleSearch}
              placeholder="Search by chef or kitchen name..."
              placeholderTextColor={colors.outline}
              style={[styles.input, { color: colors.onSurface }]}
              autoCapitalize="none"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => { setSearchQuery(''); loadChefs(true); }}>
                <Ionicons name="close-circle" size={18} color={colors.outline} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Chef List */}
        <FlatList
          data={chefs}
          keyExtractor={(item) => item.id}
          renderItem={renderChef}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24, gap: 10 }}
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={
            !isLoading ? (
              <View style={{ alignItems: 'center', paddingTop: 60 }}>
                <Text style={{ fontSize: 48 }}>👨‍🍳</Text>
                <Text style={{ color: colors.onSurfaceVariant, marginTop: 12, fontSize: 15 }}>
                  No chefs found
                </Text>
              </View>
            ) : null
          }
          ListFooterComponent={
            isLoadingMore ? (
              <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 16 }} />
            ) : null
          }
        />

        {isLoading && chefs.length === 0 && (
          <View style={{ position: 'absolute', top: '50%', left: 0, right: 0, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        )}
      </ScreenWrapper>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 20,
    fontWeight: '700',
  },
  searchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  input: {
    flex: 1,
    fontFamily: 'PlusJakartaSans-Regular',
    fontSize: 14,
  },
  chefCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    gap: 12,
  },
  chefInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  chefName: {
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontSize: 15,
    fontWeight: '600',
    flexShrink: 1,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  tagsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
  },
  tagChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  ratingCol: {
    alignItems: 'flex-end',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingText: {
    fontWeight: '700',
    fontSize: 14,
  },
});

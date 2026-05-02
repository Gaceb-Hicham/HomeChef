import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, FlatList,
  TouchableOpacity, RefreshControl, Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/stores/authStore';
import { usePostsStore } from '@/stores/postsStore';
import { useNotificationsStore } from '@/stores/appStores';
import { useRealtimeFeed } from '@/hooks/useRealtime';
import { ScreenWrapper } from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const CATEGORIES = ['All', '🍲 Meals', '🍰 Desserts', '🥗 Salads', '🍞 Bakery', '🥤 Drinks'];

// Fallback mock data when Supabase isn't configured
const MOCK_CHEFS = [
  { id: '1', name: 'Sarah K.', avatar: '👩‍🍳', hasStory: true },
  { id: '2', name: 'Ahmed M.', avatar: '👨‍🍳', hasStory: true },
  { id: '3', name: 'Fatima Z.', avatar: '👩‍🍳', hasStory: true },
  { id: '4', name: 'Karim B.', avatar: '👨‍🍳', hasStory: false },
];

const MOCK_POSTS = [
  { id: '1', title: 'Couscous Royal', chef_name: 'Sarah K.', chefAvatar: '👩‍🍳', price: 850, remaining_quantity: 5, order_deadline: '14:00', emoji: '🍲', category: 'Meals' },
  { id: '2', title: 'Baklava Box', chef_name: 'Ahmed M.', chefAvatar: '👨‍🍳', price: 450, remaining_quantity: 12, order_deadline: '16:00', emoji: '🍰', category: 'Desserts' },
  { id: '3', title: 'Fresh Baguettes', chef_name: 'Fatima Z.', chefAvatar: '👩‍🍳', price: 150, remaining_quantity: 20, order_deadline: '11:00', emoji: '🍞', category: 'Bakery' },
  { id: '4', title: 'Grilled Chicken Plate', chef_name: 'Karim B.', chefAvatar: '👨‍🍳', price: 750, remaining_quantity: 3, order_deadline: '13:30', emoji: '🍗', category: 'Meals' },
  { id: '5', title: 'Mille-feuille', chef_name: 'Sarah K.', chefAvatar: '👩‍🍳', price: 350, remaining_quantity: 8, order_deadline: '15:00', emoji: '🧁', category: 'Desserts' },
];

export default function HomeScreen() {
  const router = useRouter();
  const { colors, shadows, spacing } = useTheme();
  const profile = useAuthStore((s) => s.profile);
  const { feed, isLoading, isRefreshing, fetchFeed, refreshFeed, handleRealtimeUpdate } = usePostsStore();
  const unreadCount = useNotificationsStore((s) => s.unreadCount);

  const [activeCategory, setActiveCategory] = useState('All');

  // Subscribe to realtime feed updates
  useRealtimeFeed(handleRealtimeUpdate);

  // Fetch feed on mount
  useEffect(() => {
    fetchFeed(profile?.city || undefined);
  }, [profile?.city]);

  // Fetch unread notification count
  useEffect(() => {
    if (profile?.id) {
      useNotificationsStore.getState().fetchUnreadCount(profile.id);
    }
  }, [profile?.id]);

  const onRefresh = useCallback(() => {
    refreshFeed(profile?.city || undefined);
  }, [profile?.city]);

  // Use real data if available, otherwise mock
  const posts = feed.length > 0 ? feed : MOCK_POSTS;

  const filteredPosts = activeCategory === 'All'
    ? posts
    : posts.filter((p: any) => {
        const cat = activeCategory.split(' ').pop();
        return p.category === cat || p.title?.toLowerCase().includes(cat?.toLowerCase() || '');
      });

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const renderStory = ({ item }: { item: typeof MOCK_CHEFS[0] }) => (
    <TouchableOpacity style={styles.storyItem}>
      <View style={[styles.storyRing, { borderColor: item.hasStory ? colors.primary : colors.outlineVariant }]}>
        <View style={[styles.storyAvatar, { backgroundColor: colors.surfaceContainerHigh }]}>
          <Text style={{ fontSize: 26 }}>{item.avatar}</Text>
        </View>
      </View>
      <Text style={[styles.storyName, { color: colors.onSurface }]} numberOfLines={1}>
        {item.name.split(' ')[0]}
      </Text>
    </TouchableOpacity>
  );

  const renderPostCard = ({ item }: { item: any }) => {
    const chefName = item.chef?.full_name || item.chef_name || 'Chef';
    const remaining = item.remaining_quantity;
    const deadline = typeof item.order_deadline === 'string' && item.order_deadline.includes('T')
      ? new Date(item.order_deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : item.order_deadline;

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => router.push(`/(customer)/offer/${item.id}`)}
        style={[styles.postCard, { backgroundColor: colors.surfaceContainerLowest, ...shadows.md }]}
      >
        <View style={[styles.postImage, { backgroundColor: colors.surfaceContainerHigh }]}>
          {item.photos && item.photos.length > 0 ? (
            <Text style={{ fontSize: 56 }}>🍽️</Text>
          ) : (
            <Text style={{ fontSize: 56 }}>{item.emoji || '🍽️'}</Text>
          )}
          <View style={[styles.remainingBadge, { backgroundColor: colors.tertiaryContainer }]}>
            <Text style={[styles.remainingText, { color: colors.onTertiaryContainer }]}>
              {remaining} left
            </Text>
          </View>
        </View>

        <View style={styles.postContent}>
          <View style={styles.chefRow}>
            <View style={[styles.chefMiniAvatar, { backgroundColor: colors.surfaceContainerHigh }]}>
              <Text style={{ fontSize: 14 }}>{item.chefAvatar || '👨‍🍳'}</Text>
            </View>
            <Text style={[styles.chefName, { color: colors.onSurfaceVariant }]}>{chefName}</Text>
            <View style={{ flex: 1 }} />
            <Ionicons name="time-outline" size={14} color={colors.outline} />
            <Text style={[styles.deadline, { color: colors.outline }]}> {deadline}</Text>
          </View>

          <Text style={[styles.postTitle, { color: colors.onSurface }]}>{item.title}</Text>

          <View style={styles.postFooter}>
            <Text style={[styles.price, { color: colors.primary }]}>
              {item.price} <Text style={styles.currency}>DA</Text>
            </Text>
            <TouchableOpacity style={[styles.addButton, { backgroundColor: colors.primary }]}>
              <Ionicons name="add" size={20} color={colors.onPrimary} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScreenWrapper padded={false}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Header */}
        <View style={[styles.header, { paddingHorizontal: spacing.xl }]}>
          <View>
            <Text style={[styles.greeting, { color: colors.onSurfaceVariant }]}>
              {getGreeting()} 👋
            </Text>
            <Text style={[styles.userName, { color: colors.onBackground }]}>
              {profile?.full_name || 'Foodie'}
            </Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[styles.iconBtn, { backgroundColor: colors.surfaceContainerLow }]}
              onPress={() => router.push('/(customer)/notifications')}
            >
              <Ionicons name="notifications-outline" size={22} color={colors.onSurface} />
              {unreadCount > 0 && <View style={[styles.notifDot, { backgroundColor: colors.error }]} />}
            </TouchableOpacity>
            <TouchableOpacity style={[styles.iconBtn, { backgroundColor: colors.surfaceContainerLow }]}
              onPress={() => router.push('/(customer)/saved')}>
              <Ionicons name="heart-outline" size={22} color={colors.onSurface} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Stories row */}
        <FlatList data={MOCK_CHEFS} renderItem={renderStory} keyExtractor={(i) => i.id}
          horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: spacing.xl, gap: 16, marginBottom: 20 }} />

        {/* Categories */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: spacing.xl, gap: 8, marginBottom: 20 }}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity key={cat} onPress={() => setActiveCategory(cat)}
              style={[styles.chip, {
                backgroundColor: activeCategory === cat ? colors.primary : colors.surfaceContainerLow,
                borderColor: activeCategory === cat ? colors.primary : colors.outlineVariant,
              }]}>
              <Text style={[styles.chipText, {
                color: activeCategory === cat ? colors.onPrimary : colors.onSurfaceVariant,
              }]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Section title */}
        <View style={[styles.sectionHeader, { paddingHorizontal: spacing.xl }]}>
          <Text style={[styles.sectionTitle, { color: colors.onBackground }]}>Today's Specials</Text>
          <TouchableOpacity>
            <Text style={[styles.seeAll, { color: colors.primary }]}>See all</Text>
          </TouchableOpacity>
        </View>

        {/* Posts */}
        <FlatList data={filteredPosts} renderItem={renderPostCard} keyExtractor={(i: any) => i.id}
          scrollEnabled={false}
          contentContainerStyle={{ paddingHorizontal: spacing.xl, gap: 16, paddingBottom: 24 }} />
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, marginBottom: 20 },
  greeting: { fontFamily: 'PlusJakartaSans-Regular', fontSize: 14, marginBottom: 2 },
  userName: { fontFamily: 'NotoSerif-Bold', fontSize: 24, fontWeight: '700' },
  headerActions: { flexDirection: 'row', gap: 10 },
  iconBtn: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  notifDot: { position: 'absolute', top: 10, right: 10, width: 8, height: 8, borderRadius: 4 },
  storyItem: { alignItems: 'center', width: 68 },
  storyRing: { width: 64, height: 64, borderRadius: 32, borderWidth: 2.5, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  storyAvatar: { width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center' },
  storyName: { fontFamily: 'PlusJakartaSans-Regular', fontSize: 11 },
  chip: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20, borderWidth: 1 },
  chipText: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 13, fontWeight: '600' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontFamily: 'NotoSerif-Bold', fontSize: 20, fontWeight: '700' },
  seeAll: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 13, fontWeight: '600' },
  postCard: { borderRadius: 20, overflow: 'hidden' },
  postImage: { height: 180, alignItems: 'center', justifyContent: 'center', borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  remainingBadge: { position: 'absolute', top: 12, right: 12, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  remainingText: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 11, fontWeight: '600' },
  postContent: { padding: 16 },
  chefRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  chefMiniAvatar: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 6 },
  chefName: { fontFamily: 'PlusJakartaSans-Regular', fontSize: 12 },
  deadline: { fontFamily: 'PlusJakartaSans-Regular', fontSize: 12 },
  postTitle: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 17, fontWeight: '600', marginBottom: 10 },
  postFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  price: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 20, fontWeight: '700' },
  currency: { fontSize: 13, fontWeight: '400' },
  addButton: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});

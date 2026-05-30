import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, FlatList,
  TouchableOpacity, RefreshControl, Dimensions, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/stores/authStore';
import { usePostsStore } from '@/stores/postsStore';
import { useNotificationsStore } from '@/stores/appStores';
import { useOrdersStore } from '@/stores/ordersStore';
import { useRealtimeFeed } from '@/hooks/useRealtime';
import { ScreenWrapper, PostImage, AvatarImage, FeedSkeleton } from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '@/hooks/useLanguage';
import { flashSalesApi, teasersApi, groupOrdersApi } from '@/lib/api';

const { width } = Dimensions.get('window');

const CATEGORIES_EN = ['All', '🍲 Meals', '🍰 Desserts', '🥗 Salads', '🍞 Bakery', '🥤 Drinks'];

export default function HomeScreen() {
  const router = useRouter();
  const { colors, shadows, spacing } = useTheme();
  const { t } = useLanguage();
  const profile = useAuthStore((s) => s.profile);
  const { feed, isLoading, isRefreshing, isLoadingMore, hasMore, fetchFeed, refreshFeed, loadMoreFeed, handleRealtimeUpdate } = usePostsStore();
  const unreadCount = useNotificationsStore((s) => s.unreadCount);
  const { chefOrders, fetchChefOrders } = useOrdersStore();
  const [pastOrders, setPastOrders] = useState<any[]>([]);

  const [activeCategory, setActiveCategory] = useState('All');

  // New feature states
  const [flashSales, setFlashSales] = useState<any[]>([]);
  const [teasers, setTeasers] = useState<any[]>([]);
  const [groupOrders, setGroupOrders] = useState<any[]>([]);

  // Subscribe to realtime feed updates
  useRealtimeFeed(handleRealtimeUpdate);

  // Fetch feed on mount
  useEffect(() => {
    fetchFeed(profile?.city || undefined);
  }, [profile?.city]);

  // Fetch new features data
  useEffect(() => {
    loadExtras();
  }, []);

  const loadExtras = async () => {
    try {
      const [salesRes, teaserRes, groupRes] = await Promise.all([
        flashSalesApi.getActive(),
        teasersApi.getActive(),
        groupOrdersApi.getOpen(),
      ]);
      setFlashSales(salesRes.data || []);
      setTeasers(teaserRes.data || []);
      setGroupOrders(groupRes.data || []);
    } catch (e) {}
  };

  // Fetch profile-dependent data in a single effect
  useEffect(() => {
    if (!profile?.id) return;
    // Batch: notifications + past orders
    Promise.all([
      useNotificationsStore.getState().fetchUnreadCount(profile.id),
      (async () => {
        try {
          const { ordersApi } = require('@/lib');
          const { data } = await ordersApi.getCustomerOrders(profile.id);
          if (data) setPastOrders(data.filter((o: any) => o.order_status === 'delivered').slice(0, 6));
        } catch {}
      })(),
    ]);
  }, [profile?.id]);

  const onRefresh = useCallback(() => {
    refreshFeed(profile?.city || undefined);
    loadExtras();
  }, [profile?.city]);

  // Use real data only
  const posts = feed;

  const filteredPosts = activeCategory === 'All'
    ? posts
    : posts.filter((p: any) => {
        const cat = activeCategory.split(' ').pop();
        return p.category === cat || p.title?.toLowerCase().includes(cat?.toLowerCase() || '');
      });

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('home.good_morning');
    if (hour < 17) return t('home.good_afternoon');
    return t('home.good_evening');
  };

  const CATEGORIES = CATEGORIES_EN;

  // Extract unique chefs from feed for story row
  const feedChefs = posts.reduce((acc: any[], p: any) => {
    const chef = p.chef;
    if (chef && !acc.find((c: any) => c.id === chef.id)) {
      acc.push({ id: chef.id, name: chef.full_name || 'Chef', avatar: chef.profile_photo_url, hasStory: true });
    }
    return acc;
  }, []);

  const renderStory = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.storyItem} onPress={() => router.push(`/(customer)/chef/${item.id}`)}>
      <View style={[styles.storyRing, { borderColor: colors.primary }]}>
        <AvatarImage uri={item.avatar} size={54} emoji="👨‍🍳" />
      </View>
      <Text style={[styles.storyName, { color: colors.onSurface }]} numberOfLines={1}>
        {item.name.split(' ')[0]}
      </Text>
    </TouchableOpacity>
  );

  const renderPostCard = useCallback(({ item }: { item: any }) => {
    const chefName = item.chef?.full_name || item.chef_name || 'Chef';
    const remaining = item.remaining_quantity;
    const deadline = typeof item.order_deadline === 'string' && item.order_deadline.includes('T')
      ? new Date(item.order_deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : item.order_deadline;

    // Check if this post has an active flash sale
    const sale = flashSales.find((s: any) => s.post_id === item.id);
    const discountedPrice = sale ? Math.round(item.price * (1 - sale.discount_percentage / 100)) : null;

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => router.push(`/(customer)/offer/${item.id}`)}
        style={[styles.postCard, { backgroundColor: colors.surfaceContainerLowest, ...shadows.md }]}
      >
        <View style={styles.postImage}>
          <PostImage photos={item.photos} height={180} borderRadius={0} />
          <View style={[styles.remainingBadge, { backgroundColor: colors.tertiaryContainer }]}>
            <Text style={[styles.remainingText, { color: colors.onTertiaryContainer }]}>
              {remaining} {t('home.left')}
            </Text>
          </View>
          {sale && (
            <View style={styles.saleBadge}>
              <Ionicons name="flash" size={12} color="#fff" />
              <Text style={styles.saleBadgeText}>-{sale.discount_percentage}%</Text>
            </View>
          )}
        </View>

        <View style={styles.postContent}>
          <View style={styles.chefRow}>
            <AvatarImage uri={item.chef?.profile_photo_url} size={24} emoji="👨‍🍳" />
            <Text style={[styles.chefName, { color: colors.onSurfaceVariant }]}>{chefName}</Text>
            {item.chef?.chef_profiles?.is_verified && (
              <Ionicons name="checkmark-circle" size={14} color="#2563eb" style={{ marginLeft: 2 }} />
            )}
            <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: item.chef?.chef_profiles?.is_open !== false ? '#16a34a' : '#dc2626', marginLeft: 4 }} />
            <View style={{ flex: 1 }} />
            <Ionicons name="time-outline" size={14} color={colors.outline} />
            <Text style={[styles.deadline, { color: colors.outline }]}> {deadline}</Text>
          </View>

          <Text style={[styles.postTitle, { color: colors.onSurface }]}>{item.title}</Text>

          <View style={styles.postFooter}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {discountedPrice ? (
                <>
                  <Text style={[styles.price, { color: colors.primary }]}>
                    {discountedPrice} <Text style={styles.currency}>DA</Text>
                  </Text>
                  <Text style={styles.originalPrice}>{item.price} DA</Text>
                </>
              ) : (
                <Text style={[styles.price, { color: colors.primary }]}>
                  {item.price} <Text style={styles.currency}>DA</Text>
                </Text>
              )}
            </View>
            <TouchableOpacity style={[styles.addButton, { backgroundColor: colors.primary }]}
              onPress={() => router.push(`/(customer)/offer/${item.id}`)}>
              <Ionicons name="add" size={20} color={colors.onPrimary} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  }, [flashSales, colors, shadows, t]);

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
              onPress={() => router.push('/(customer)/search')}
            >
              <Ionicons name="search-outline" size={22} color={colors.onSurface} />
            </TouchableOpacity>
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

        {/* Stories row — from real feed chefs */}
        {feedChefs.length > 0 && (
          <FlatList data={feedChefs} renderItem={renderStory} keyExtractor={(i: any) => i.id}
            horizontal showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: spacing.xl, gap: 16, marginBottom: 20 }} />
        )}

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

        {/* ===== FLASH SALES SECTION ===== */}
        {flashSales.length > 0 && (
          <>
            <View style={[styles.sectionHeader, { paddingHorizontal: spacing.xl }]}>
              <Text style={[styles.sectionTitle, { color: colors.onBackground }]}>⚡ Flash Sales</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: spacing.xl, gap: 12, marginBottom: 20 }}>
              {flashSales.map((sale: any) => {
                const post = sale.post;
                if (!post) return null;
                const discounted = Math.round(post.price * (1 - sale.discount_percentage / 100));
                const endsIn = Math.max(0, Math.floor((new Date(sale.ends_at).getTime() - Date.now()) / 3600000));
                return (
                  <TouchableOpacity key={sale.id}
                    onPress={() => router.push(`/(customer)/offer/${post.id}`)}
                    style={[styles.flashCard, { backgroundColor: colors.surfaceContainerLowest, ...shadows.md }]}>
                    <PostImage photos={post.photos} height={110} borderRadius={0} fallbackSize={28} />
                    <View style={styles.flashBadge}>
                      <Ionicons name="flash" size={10} color="#fff" />
                      <Text style={styles.flashBadgeText}>-{sale.discount_percentage}%</Text>
                    </View>
                    <View style={{ padding: 10 }}>
                      <Text numberOfLines={1} style={{ color: colors.onSurface, fontWeight: '700', fontSize: 13 }}>
                        {post.title}
                      </Text>
                      <Text style={{ color: colors.onSurfaceVariant, fontSize: 11, marginTop: 2 }}>
                        {sale.post?.chef?.full_name || 'Chef'}
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                        <Text style={{ color: colors.primary, fontWeight: '800', fontSize: 15 }}>{discounted} DA</Text>
                        <Text style={styles.originalPrice}>{post.price} DA</Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                        <Ionicons name="time" size={11} color={endsIn < 2 ? '#dc2626' : colors.outline} />
                        <Text style={{ color: endsIn < 2 ? '#dc2626' : colors.outline, fontSize: 11, fontWeight: '600' }}>
                          {endsIn}h left
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </>
        )}

        {/* ===== TEASERS SECTION (Coming Soon) ===== */}
        {teasers.length > 0 && (
          <>
            <View style={[styles.sectionHeader, { paddingHorizontal: spacing.xl }]}>
              <Text style={[styles.sectionTitle, { color: colors.onBackground }]}>🎬 Coming Soon</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: spacing.xl, gap: 12, marginBottom: 20 }}>
              {teasers.map((teaser: any) => (
                <View key={teaser.id}
                  style={[styles.teaserCard, { backgroundColor: colors.surfaceContainerLowest, ...shadows.sm }]}>
                  <View style={styles.teaserBadge}>
                    <Ionicons name="time" size={10} color="#fff" />
                    <Text style={{ color: '#fff', fontSize: 10, fontWeight: '800', marginLeft: 3 }}>COMING SOON</Text>
                  </View>
                  <Text style={{ color: colors.onSurface, fontWeight: '700', fontSize: 15, marginTop: 8 }}>{teaser.title}</Text>
                  {teaser.description && (
                    <Text numberOfLines={2} style={{ color: colors.onSurfaceVariant, fontSize: 12, marginTop: 4, lineHeight: 17 }}>
                      {teaser.description}
                    </Text>
                  )}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }}>
                    <AvatarImage uri={teaser.chef?.profile_photo_url} size={20} emoji="👨‍🍳" />
                    <Text style={{ color: colors.onSurfaceVariant, fontSize: 11 }}>
                      {teaser.chef?.full_name || 'Chef'}
                    </Text>
                  </View>
                  {teaser.planned_date && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 }}>
                      <Ionicons name="calendar" size={12} color={colors.primary} />
                      <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '600' }}>{teaser.planned_date}</Text>
                    </View>
                  )}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 }}>
                    <Ionicons name="heart" size={14} color="#e11d48" />
                    <Text style={{ color: colors.onSurfaceVariant, fontSize: 12 }}>{teaser.interested_count || 0} interested</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </>
        )}

        {/* ===== GROUP ORDERS SECTION ===== */}
        {groupOrders.length > 0 && (
          <>
            <View style={[styles.sectionHeader, { paddingHorizontal: spacing.xl }]}>
              <Text style={[styles.sectionTitle, { color: colors.onBackground }]}>👥 Group Orders</Text>
              <TouchableOpacity onPress={() => router.push('/(customer)/group-orders')}>
                <Text style={[styles.seeAll, { color: colors.primary }]}>See all</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: spacing.xl, gap: 12, marginBottom: 20 }}>
              {groupOrders.slice(0, 5).map((g: any) => {
                const progress = Math.min(100, (g.current_quantity / g.target_quantity) * 100);
                const timeLeft = Math.max(0, Math.floor((new Date(g.deadline).getTime() - Date.now()) / 3600000));
                return (
                  <TouchableOpacity key={g.id}
                    onPress={() => router.push('/(customer)/group-orders')}
                    style={[styles.groupCard, { backgroundColor: colors.surfaceContainerLowest, ...shadows.sm }]}>
                    <Text numberOfLines={1} style={{ color: colors.onSurface, fontWeight: '700', fontSize: 14 }}>{g.title}</Text>
                    <Text style={{ color: colors.onSurfaceVariant, fontSize: 11, marginTop: 3 }}>
                      by {g.initiator?.full_name || 'Someone'}
                    </Text>
                    <View style={{ marginTop: 10 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                        <Text style={{ color: colors.onSurfaceVariant, fontSize: 11 }}>{g.current_quantity}/{g.target_quantity}</Text>
                        <Text style={{ color: progress >= 100 ? '#16a34a' : colors.primary, fontSize: 11, fontWeight: '700' }}>
                          {Math.round(progress)}%
                        </Text>
                      </View>
                      <View style={[styles.progressBg, { backgroundColor: colors.surfaceContainerLow }]}>
                        <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: progress >= 100 ? '#16a34a' : colors.primary }]} />
                      </View>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 }}>
                      <Ionicons name="time" size={11} color={timeLeft < 3 ? '#dc2626' : colors.outline} />
                      <Text style={{ color: timeLeft < 3 ? '#dc2626' : colors.outline, fontSize: 11, fontWeight: '600' }}>{timeLeft}h left</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </>
        )}

        {/* Order Again */}
        {pastOrders.length > 0 && (
          <>
            <View style={[styles.sectionHeader, { paddingHorizontal: spacing.xl }]}>
              <Text style={[styles.sectionTitle, { color: colors.onBackground }]}>🔄 Order Again</Text>
              <TouchableOpacity onPress={() => router.push('/(customer)/(tabs)/orders')}>
                <Text style={[styles.seeAll, { color: colors.primary }]}>History</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: spacing.xl, gap: 12, marginBottom: 20 }}>
              {pastOrders.map((o: any) => (
                <TouchableOpacity key={o.id}
                  onPress={() => router.push(`/(customer)/offer/${o.post_id}`)}
                  style={[styles.reorderCard, { backgroundColor: colors.surfaceContainerLowest, ...shadows.sm }]}>
                  <Text style={{ fontSize: 24, marginBottom: 6 }}>🍽️</Text>
                  <Text numberOfLines={1} style={{ color: colors.onSurface, fontWeight: '600', fontSize: 13, width: 100, textAlign: 'center' }}>
                    {o.post?.title || 'Dish'}
                  </Text>
                  <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 12, marginTop: 4 }}>
                    {o.total_price} DA
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        )}

        {/* Section title */}
        <View style={[styles.sectionHeader, { paddingHorizontal: spacing.xl }]}>
          <Text style={[styles.sectionTitle, { color: colors.onBackground }]}>Today's Specials</Text>
          <TouchableOpacity onPress={() => router.push('/(customer)/(tabs)/search')}>
            <Text style={[styles.seeAll, { color: colors.primary }]}>See all</Text>
          </TouchableOpacity>
        </View>

        {/* Posts */}
        {isLoading && filteredPosts.length === 0 ? (
          <View style={{ paddingHorizontal: spacing.xl }}>
            <FeedSkeleton count={3} />
          </View>
        ) : filteredPosts.length > 0 ? (
          <FlatList data={filteredPosts} renderItem={renderPostCard} keyExtractor={(i: any) => i.id}
            scrollEnabled={false}
            onEndReached={() => loadMoreFeed(profile?.city || undefined)}
            onEndReachedThreshold={0.5}
            contentContainerStyle={{ paddingHorizontal: spacing.xl, gap: 16, paddingBottom: 24 }}
            ListFooterComponent={isLoadingMore ? (
              <View style={{ paddingVertical: 16, alignItems: 'center' }}>
                <ActivityIndicator color={colors.primary} />
              </View>
            ) : null} />
        ) : (
          <View style={{ alignItems: 'center', paddingVertical: 60, paddingHorizontal: spacing.xl }}>
            <Text style={{ fontSize: 48, marginBottom: 16 }}>🍽️</Text>
            <Text style={{ fontFamily: 'NotoSerif-Bold', fontSize: 20, fontWeight: '700', color: colors.onSurface, marginBottom: 8, textAlign: 'center' }}>
              No dishes available yet
            </Text>
            <Text style={{ fontFamily: 'PlusJakartaSans-Regular', fontSize: 14, color: colors.onSurfaceVariant, textAlign: 'center', lineHeight: 22 }}>
              Home chefs haven't posted today's specials yet.{"\n"}Pull down to refresh or check back soon!
            </Text>
          </View>
        )}
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
  storyName: { fontFamily: 'PlusJakartaSans-Regular', fontSize: 11 },
  chip: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20, borderWidth: 1 },
  chipText: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 13, fontWeight: '600' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontFamily: 'NotoSerif-Bold', fontSize: 20, fontWeight: '700' },
  seeAll: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 13, fontWeight: '600' },
  postCard: { borderRadius: 20, overflow: 'hidden' },
  reorderCard: { width: 120, padding: 14, borderRadius: 16, alignItems: 'center' },
  postImage: { height: 180, overflow: 'hidden', borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  remainingBadge: { position: 'absolute', top: 12, right: 12, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  remainingText: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 11, fontWeight: '600' },
  saleBadge: { position: 'absolute', top: 12, left: 12, flexDirection: 'row', alignItems: 'center', backgroundColor: '#dc2626', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, gap: 3 },
  saleBadgeText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  postContent: { padding: 16 },
  chefRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  chefName: { fontFamily: 'PlusJakartaSans-Regular', fontSize: 12 },
  deadline: { fontFamily: 'PlusJakartaSans-Regular', fontSize: 12 },
  postTitle: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 17, fontWeight: '600', marginBottom: 10 },
  postFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  price: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 20, fontWeight: '700' },
  currency: { fontSize: 13, fontWeight: '400' },
  originalPrice: { fontSize: 13, color: '#9ca3af', textDecorationLine: 'line-through' },
  addButton: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  // Flash sale cards
  flashCard: { width: 160, borderRadius: 16, overflow: 'hidden' },
  flashBadge: { position: 'absolute', top: 8, left: 8, flexDirection: 'row', alignItems: 'center', backgroundColor: '#dc2626', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, gap: 2 },
  flashBadgeText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  // Teaser cards
  teaserCard: { width: 200, padding: 14, borderRadius: 16 },
  teaserBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', backgroundColor: '#8b5cf6', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  // Group order cards
  groupCard: { width: 180, padding: 14, borderRadius: 16 },
  progressBg: { height: 6, borderRadius: 3 },
  progressFill: { height: 6, borderRadius: 3 },
});

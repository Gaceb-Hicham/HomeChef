import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/stores/authStore';
import { chefApi, postsApi, followersApi, prepMenuApi, specialtiesApi, teasersApi, subscriptionsApi } from '@/lib';
import { infoAlert } from '@/lib/crossAlert';
import { ScreenWrapper, AvatarImage, PostImage, Input, Button } from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';
import { useToast } from '@/components/ui/Toast';

type TabKey = 'menu' | 'prep' | 'specialties' | 'teasers';

export default function ChefProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors, shadows } = useTheme();
  const profile = useAuthStore((s) => s.profile);
  const { showToast } = useToast();
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [chef, setChef] = useState<any>(null);
  const [archive, setArchive] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New feature states
  const [activeTab, setActiveTab] = useState<TabKey>('menu');
  const [prepItems, setPrepItems] = useState<any[]>([]);
  const [specialties, setSpecialties] = useState<any[]>([]);
  const [teasers, setTeasers] = useState<any[]>([]);

  useEffect(() => {
    if (!id) return;
    loadChef();
  }, [id]);

  const loadChef = async () => {
    setLoading(true);
    try {
      const { data: chefData } = await chefApi.getChefProfile(id!);
      if (chefData) setChef(chefData);

      const [postsRes, prepRes, specRes, teaserRes] = await Promise.all([
        postsApi.getChefArchive(id!, 20),
        prepMenuApi.getByChef(id!),
        specialtiesApi.getByChef(id!),
        teasersApi.getActive(id!),
      ]);

      if (postsRes.data) setArchive(postsRes.data);
      setPrepItems(prepRes.data || []);
      setSpecialties(specRes.data || []);
      setTeasers(teaserRes.data || []);

      // Load follow state & count
      const count = await followersApi.getFollowerCount(id!);
      setFollowerCount(count);
      if (profile?.id) {
        const following = await followersApi.isFollowing(profile.id, id!);
        setIsFollowing(following);
      }
    } catch (e) {
      console.log('Error loading chef:', e);
    }
    setLoading(false);
  };

  const handleFollowToggle = async () => {
    if (!profile?.id || !id) return;
    const { following } = await followersApi.toggleFollow(profile.id, id);
    setIsFollowing(following);
    setFollowerCount(prev => following ? prev + 1 : Math.max(0, prev - 1));
  };

  const handleTeaserInterest = async (teaserId: string) => {
    if (!profile?.id) return;
    const { interested } = await teasersApi.toggleInterest(teaserId, profile.id);
    showToast(interested ? 'Marked as interested!' : 'Interest removed', interested ? 'success' : 'info');
    // Refresh teasers
    const { data } = await teasersApi.getActive(id!);
    setTeasers(data || []);
  };

  if (loading) {
    return (
      <ScreenWrapper>
        <View style={{ alignItems: 'center', paddingTop: 100 }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ marginTop: 12, color: colors.onSurfaceVariant }}>Loading chef profile...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  if (!chef) {
    return (
      <ScreenWrapper>
        <View style={{ alignItems: 'center', paddingTop: 80 }}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>👨‍🍳</Text>
          <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 8, color: colors.onSurface }}>Chef not found</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={{ color: colors.primary, fontSize: 15, fontWeight: '600' }}>Go back</Text>
          </TouchableOpacity>
        </View>
      </ScreenWrapper>
    );
  }

  const chefProfile = chef;
  const kitchenName = chefProfile.kitchen_name || 'Kitchen';
  const chefName = chefProfile.user?.full_name || kitchenName;
  const bio = chefProfile.bio || 'Home chef on HomeChef.';
  const specialtyTags = chefProfile.specialty_tags || [];
  const rating = chefProfile.rating_average || 0;
  const totalOrders = chefProfile.total_orders_fulfilled || 0;
  const followers = followerCount;

  const TABS: { key: TabKey; label: string; icon: string; count: number }[] = [
    { key: 'menu', label: 'Menu', icon: 'fast-food-outline', count: archive.length },
    { key: 'prep', label: 'Prep Menu', icon: 'restaurant-outline', count: prepItems.length },
    { key: 'specialties', label: 'Specialties', icon: 'star-outline', count: specialties.length },
    { key: 'teasers', label: 'Coming Soon', icon: 'megaphone-outline', count: teasers.length },
  ];

  return (
    <ScreenWrapper padded={false} safeArea={false}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Cover */}
        <View style={[styles.cover, { backgroundColor: colors.primaryContainer }]}>
          <TouchableOpacity style={[styles.backBtn, { backgroundColor: 'rgba(0,0,0,0.3)' }]} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Profile card */}
        <View style={[styles.profileCard, { backgroundColor: colors.surfaceContainerLowest, ...shadows.md }]}>
          <View style={[styles.avatar, { backgroundColor: colors.primaryFixed }]}>
            <AvatarImage uri={chefProfile.user?.profile_photo_url || chefProfile.cover_photo_url} size={72} emoji="👨‍🍳" />
          </View>
          <Text style={[styles.name, { color: colors.onBackground }]}>{chefName}</Text>
          <Text style={[styles.kitchen, { color: colors.primary }]}>{kitchenName}</Text>

          {/* Stats */}
          <View style={styles.statRow}>
            {[{ n: totalOrders.toString(), l: 'Orders' }, { n: rating.toString(), l: 'Rating' }, { n: followers.toString(), l: 'Followers' }].map((s) => (
              <View key={s.l} style={styles.stat}>
                <Text style={[styles.statN, { color: colors.primary }]}>{s.n}</Text>
                <Text style={[styles.statL, { color: colors.onSurfaceVariant }]}>{s.l}</Text>
              </View>
            ))}
          </View>

          {/* Follow, Chat & Subscribe */}
          <View style={{ flexDirection: 'row', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <TouchableOpacity onPress={handleFollowToggle}
              style={[styles.followBtn, { backgroundColor: isFollowing ? colors.surfaceContainerLow : colors.primary, borderColor: isFollowing ? colors.outlineVariant : colors.primary }]}>
              <Ionicons name={isFollowing ? 'checkmark' : 'add'} size={18} color={isFollowing ? colors.onSurface : colors.onPrimary} />
              <Text style={{ color: isFollowing ? colors.onSurface : colors.onPrimary, fontWeight: '600', fontSize: 14 }}>
                {isFollowing ? 'Following' : 'Follow'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push({ pathname: '/(customer)/chat', params: { chefId: id, chefName } })}
              style={[styles.followBtn, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.outlineVariant }]}>
              <Ionicons name="chatbubble-outline" size={18} color={colors.onSurface} />
              <Text style={{ color: colors.onSurface, fontWeight: '600', fontSize: 14 }}>Chat</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push({ pathname: '/(customer)/subscriptions', params: { chefId: id, chefName: chefName } })}
              style={[styles.followBtn, { backgroundColor: '#dcfce7', borderColor: '#16a34a' }]}>
              <Ionicons name="repeat" size={18} color="#16a34a" />
              <Text style={{ color: '#16a34a', fontWeight: '600', fontSize: 14 }}>Subscribe</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.bio, { color: colors.onSurfaceVariant }]}>{bio}</Text>

          {/* Specialties */}
          {specialtyTags.length > 0 && (
            <View style={styles.tagsRow}>
              {specialtyTags.map((s: string) => (
                <View key={s} style={[styles.tag, { backgroundColor: colors.surfaceContainerLow }]}>
                  <Text style={{ color: colors.onSurfaceVariant, fontSize: 12, fontWeight: '500' }}>{s}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 8, marginBottom: 16 }}>
          {TABS.map((tab) => (
            <TouchableOpacity key={tab.key} onPress={() => setActiveTab(tab.key)}
              style={[styles.tabChip, {
                backgroundColor: activeTab === tab.key ? colors.primary : colors.surfaceContainerLow,
                borderColor: activeTab === tab.key ? colors.primary : colors.outlineVariant,
              }]}>
              <Ionicons name={tab.icon as any} size={16} color={activeTab === tab.key ? colors.onPrimary : colors.onSurfaceVariant} />
              <Text style={{ color: activeTab === tab.key ? colors.onPrimary : colors.onSurfaceVariant, fontWeight: '600', fontSize: 13 }}>
                {tab.label} {tab.count > 0 ? `(${tab.count})` : ''}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Tab Content */}
        <View style={{ padding: 20 }}>
          {/* Menu Archive Tab */}
          {activeTab === 'menu' && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.onBackground }]}>Menu Archive</Text>
              {archive.length > 0 ? (
                <View style={styles.grid}>
                  {archive.map((item: any) => (
                    <TouchableOpacity key={item.id} style={[styles.gridCard, { backgroundColor: colors.surfaceContainerLowest, ...shadows.sm }]}
                      onPress={() => router.push(`/(customer)/offer/${item.id}`)}>
                      <PostImage photos={item.photos} height={100} borderRadius={0} fallbackSize={32} />
                      <Text style={[styles.gridTitle, { color: colors.onSurface }]} numberOfLines={1}>{item.title}</Text>
                      <Text style={[styles.gridPrice, { color: colors.primary }]}>{item.price} DA</Text>
                      <Text style={[styles.gridDate, { color: colors.outline }]}>{new Date(item.created_at).toLocaleDateString()}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <View style={styles.emptyTab}>
                  <Text style={{ fontSize: 32, marginBottom: 8 }}>📋</Text>
                  <Text style={{ color: colors.onSurfaceVariant, fontSize: 14 }}>No dishes posted yet</Text>
                </View>
              )}
            </>
          )}

          {/* Prep Menu Tab */}
          {activeTab === 'prep' && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.onBackground }]}>Prep-on-Demand Menu</Text>
              <Text style={{ color: colors.onSurfaceVariant, fontSize: 13, marginBottom: 16, lineHeight: 19 }}>
                Request the chef to prepare any of these dishes for you on a custom date.
              </Text>
              {prepItems.length > 0 ? (
                prepItems.map((item: any) => (
                  <TouchableOpacity key={item.id}
                    onPress={() => router.push({
                      pathname: '/(customer)/prep-request',
                      params: {
                        itemId: item.id, chefId: id, title: item.title,
                        basePrice: String(item.base_price), negotiable: String(item.price_negotiable),
                        minQty: String(item.min_order_qty), minNotice: String(item.min_notice_hours),
                      },
                    })}
                    style={[styles.prepCard, { backgroundColor: colors.surfaceContainerLowest, ...shadows.sm, overflow: 'hidden' }]}>
                    {/* Show photo if available */}
                    {item.photos && item.photos.length > 0 && item.photos[0] ? (
                      <PostImage photos={item.photos} height={140} borderRadius={0} showCarousel={false} />
                    ) : null}
                    <View style={{ flex: 1, padding: item.photos?.length > 0 ? 14 : 16 }}>
                      <Text style={{ color: colors.onSurface, fontWeight: '700', fontSize: 16 }}>{item.title}</Text>
                      {item.description && (
                        <Text numberOfLines={2} style={{ color: colors.onSurfaceVariant, fontSize: 13, marginTop: 4 }}>{item.description}</Text>
                      )}
                      <View style={{ flexDirection: 'row', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                        <View style={[styles.prepChip, { backgroundColor: '#dcfce7' }]}>
                          <Text style={{ color: '#16a34a', fontSize: 12, fontWeight: '700' }}>{item.base_price} DA</Text>
                        </View>
                        <View style={[styles.prepChip, { backgroundColor: '#f1f5f9' }]}>
                          <Ionicons name="time-outline" size={11} color="#64748b" />
                          <Text style={{ color: '#64748b', fontSize: 11, marginLeft: 3 }}>{item.min_notice_hours}h notice</Text>
                        </View>
                        {item.min_order_qty > 1 && (
                          <View style={[styles.prepChip, { backgroundColor: '#ede9fe' }]}>
                            <Text style={{ color: '#7c3aed', fontSize: 11, fontWeight: '600' }}>Min {item.min_order_qty}</Text>
                          </View>
                        )}
                        {item.price_negotiable && (
                          <View style={[styles.prepChip, { backgroundColor: '#fef3c7' }]}>
                            <Text style={{ color: '#b45309', fontSize: 11, fontWeight: '600' }}>Negotiable</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.emptyTab}>
                  <Ionicons name="restaurant-outline" size={40} color={colors.outline} />
                  <Text style={{ color: colors.onSurfaceVariant, fontSize: 14, marginTop: 8 }}>No prep items available</Text>
                </View>
              )}
            </>
          )}

          {/* Specialties Tab */}
          {activeTab === 'specialties' && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.onBackground }]}>Chef's Specialties</Text>
              <Text style={{ color: colors.onSurfaceVariant, fontSize: 13, marginBottom: 16, lineHeight: 19 }}>
                Signature dishes you can pre-order for special occasions.
              </Text>
              {specialties.length > 0 ? (
                <View style={styles.grid}>
                  {specialties.map((item: any) => {
                    const availIcon = item.availability === 'always' ? 'checkmark-circle' : item.availability === 'seasonal' ? 'leaf' : 'chatbubble';
                    const availColor = item.availability === 'always' ? '#16a34a' : item.availability === 'seasonal' ? '#b45309' : '#4338ca';
                    return (
                      <TouchableOpacity key={item.id}
                        onPress={() => router.push({
                          pathname: '/(customer)/preorder',
                          params: {
                            specialtyId: item.id, chefId: id, title: item.title,
                            priceMin: String(item.price_range_min), priceMax: String(item.price_range_max),
                            prepTime: String(item.prep_time_hours),
                          },
                        })}
                        style={[styles.specialtyCard, { backgroundColor: colors.surfaceContainerLowest, ...shadows.sm, overflow: 'hidden' }]}>
                        {item.photos && item.photos.length > 0 ? (
                          <PostImage photos={item.photos} height={90} borderRadius={0} fallbackSize={24} showCarousel={false} />
                        ) : (
                          <View style={[styles.specialtyIcon, { backgroundColor: colors.surfaceContainerLow, margin: 14 }]}>
                            <Ionicons name="star" size={24} color={colors.primary} />
                          </View>
                        )}
                        <View style={{ paddingHorizontal: 10, paddingTop: 6, paddingBottom: 10 }}>
                          <Text numberOfLines={2} style={{ color: colors.onSurface, fontWeight: '700', fontSize: 14 }}>{item.title}</Text>
                          <Text style={{ color: colors.primary, fontWeight: '700', marginTop: 4 }}>{item.price_range_min}–{item.price_range_max} DA</Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 }}>
                            <Ionicons name={availIcon as any} size={12} color={availColor} />
                            <Text style={{ color: availColor, fontSize: 11, fontWeight: '600' }}>{item.availability}</Text>
                          </View>
                          <View style={[styles.prepChip, { backgroundColor: '#f1f5f9', marginTop: 6, alignSelf: 'flex-start' }]}>
                            <Ionicons name="time-outline" size={11} color="#64748b" />
                            <Text style={{ color: '#64748b', fontSize: 11, marginLeft: 3 }}>~{item.prep_time_hours}h</Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ) : (
                <View style={styles.emptyTab}>
                  <Ionicons name="star-outline" size={40} color={colors.outline} />
                  <Text style={{ color: colors.onSurfaceVariant, fontSize: 14, marginTop: 8 }}>No specialties listed</Text>
                </View>
              )}
            </>
          )}

          {/* Teasers Tab */}
          {activeTab === 'teasers' && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.onBackground }]}>Coming Soon</Text>
              <Text style={{ color: colors.onSurfaceVariant, fontSize: 13, marginBottom: 16, lineHeight: 19 }}>
                Upcoming dishes this chef is planning. Tap "I'm interested" to let them know!
              </Text>
              {teasers.length > 0 ? (
                teasers.map((teaser: any) => (
                  <View key={teaser.id} style={[styles.teaserCard, { backgroundColor: colors.surfaceContainerLowest, ...shadows.sm }]}>
                    <View style={styles.teaserBadge}>
                      <Ionicons name="time" size={10} color="#fff" />
                      <Text style={{ color: '#fff', fontSize: 10, fontWeight: '800', marginLeft: 3 }}>COMING SOON</Text>
                    </View>
                    <Text style={{ color: colors.onSurface, fontWeight: '700', fontSize: 17, marginTop: 10 }}>{teaser.title}</Text>
                    {teaser.description && (
                      <Text style={{ color: colors.onSurfaceVariant, fontSize: 13, marginTop: 6, lineHeight: 19 }}>{teaser.description}</Text>
                    )}
                    {teaser.planned_date && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 }}>
                        <Ionicons name="calendar" size={14} color={colors.primary} />
                        <Text style={{ color: colors.primary, fontWeight: '600' }}>{teaser.planned_date}</Text>
                      </View>
                    )}
                    <View style={[styles.teaserFooter, { borderTopColor: colors.outlineVariant }]}>
                      <TouchableOpacity
                        onPress={() => handleTeaserInterest(teaser.id)}
                        style={[styles.interestBtn, { backgroundColor: '#fef3c7' }]}>
                        <Ionicons name="heart" size={16} color="#e11d48" />
                        <Text style={{ color: '#b45309', fontWeight: '700', marginLeft: 6 }}>I'm Interested!</Text>
                      </TouchableOpacity>
                      <Text style={{ color: colors.outline, fontSize: 12 }}>{teaser.interested_count || 0} interested</Text>
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.emptyTab}>
                  <Ionicons name="megaphone-outline" size={40} color={colors.outline} />
                  <Text style={{ color: colors.onSurfaceVariant, fontSize: 14, marginTop: 8 }}>No upcoming dishes announced</Text>
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  cover: { height: 160 },
  backBtn: { position: 'absolute', top: 50, left: 20, width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  profileCard: { marginTop: -40, marginHorizontal: 20, borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 20 },
  avatar: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginTop: -60, marginBottom: 12 },
  name: { fontFamily: 'NotoSerif-Bold', fontSize: 24, fontWeight: '700', marginBottom: 2 },
  kitchen: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 14, fontWeight: '600', marginBottom: 16 },
  statRow: { flexDirection: 'row', gap: 32, marginBottom: 16 },
  stat: { alignItems: 'center' },
  statN: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 18, fontWeight: '700' },
  statL: { fontFamily: 'PlusJakartaSans-Regular', fontSize: 11, marginTop: 2 },
  followBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20, borderWidth: 1, marginBottom: 16 },
  bio: { fontFamily: 'PlusJakartaSans-Regular', fontSize: 14, textAlign: 'center', lineHeight: 21, marginBottom: 12 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' },
  tag: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12 },
  tabChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, borderWidth: 1 },
  sectionTitle: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 18, fontWeight: '600', marginBottom: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  gridCard: { width: '47%', borderRadius: 14, overflow: 'hidden' },
  gridTitle: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 14, fontWeight: '600', paddingHorizontal: 10, paddingTop: 8 },
  gridPrice: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 14, fontWeight: '700', paddingHorizontal: 10, marginTop: 2 },
  gridDate: { fontFamily: 'PlusJakartaSans-Regular', fontSize: 11, paddingHorizontal: 10, paddingBottom: 10, marginTop: 2 },
  emptyTab: { alignItems: 'center', paddingVertical: 40 },
  prepCard: { borderRadius: 16, marginBottom: 12 },
  prepChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  specialtyCard: { width: '47%', borderRadius: 16, minHeight: 180 },
  specialtyIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  teaserCard: { padding: 18, borderRadius: 16, marginBottom: 14 },
  teaserBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', backgroundColor: '#8b5cf6', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  teaserFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, paddingTop: 12, borderTopWidth: 1 },
  interestBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
});

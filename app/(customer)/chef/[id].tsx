import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/stores/authStore';
import { chefApi, postsApi, followersApi } from '@/lib';
import { ScreenWrapper, AvatarImage, PostImage } from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';

export default function ChefProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors, shadows } = useTheme();
  const profile = useAuthStore((s) => s.profile);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [chef, setChef] = useState<any>(null);
  const [archive, setArchive] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    loadChef();
  }, [id]);

  const loadChef = async () => {
    setLoading(true);
    try {
      const { data: chefData } = await chefApi.getChefProfile(id!);
      if (chefData) setChef(chefData);

      const { data: posts } = await postsApi.getChefArchive(id!, 20);
      if (posts) setArchive(posts);

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
  const specialties = chefProfile.specialty_tags || [];
  const rating = chefProfile.rating_average || 0;
  const totalOrders = chefProfile.total_orders_fulfilled || 0;
  const followers = followerCount;

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

          {/* Follow & Share */}
          <View style={{ flexDirection: 'row', gap: 10, justifyContent: 'center' }}>
            <TouchableOpacity onPress={handleFollowToggle}
              style={[styles.followBtn, { backgroundColor: isFollowing ? colors.surfaceContainerLow : colors.primary, borderColor: isFollowing ? colors.outlineVariant : colors.primary }]}>
              <Ionicons name={isFollowing ? 'checkmark' : 'add'} size={18} color={isFollowing ? colors.onSurface : colors.onPrimary} />
              <Text style={{ color: isFollowing ? colors.onSurface : colors.onPrimary, fontWeight: '600', fontSize: 14 }}>
                {isFollowing ? 'Following' : 'Follow'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => {
              const text = `👨‍🍳 Check out ${kitchenName} on HomeChef!\n⭐ ${rating} rating • ${totalOrders} orders\n${bio}`;
              if (typeof navigator !== 'undefined' && navigator.share) {
                navigator.share({ title: kitchenName, text }).catch(() => {});
              }
            }}
              style={[styles.followBtn, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.outlineVariant }]}>
              <Ionicons name="share-social-outline" size={18} color={colors.onSurface} />
              <Text style={{ color: colors.onSurface, fontWeight: '600', fontSize: 14 }}>Share</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.bio, { color: colors.onSurfaceVariant }]}>{bio}</Text>

          {/* Specialties */}
          {specialties.length > 0 && (
            <View style={styles.tagsRow}>
              {specialties.map((s: string) => (
                <View key={s} style={[styles.tag, { backgroundColor: colors.surfaceContainerLow }]}>
                  <Text style={{ color: colors.onSurfaceVariant, fontSize: 12, fontWeight: '500' }}>{s}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Archive */}
        <View style={{ padding: 24 }}>
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
            <View style={{ alignItems: 'center', paddingVertical: 30 }}>
              <Text style={{ fontSize: 32, marginBottom: 8 }}>📋</Text>
              <Text style={{ color: colors.onSurfaceVariant, fontSize: 14 }}>No dishes posted yet</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  cover: { height: 160 },
  backBtn: { position: 'absolute', top: 50, left: 20, width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  profileCard: { marginTop: -40, marginHorizontal: 20, borderRadius: 20, padding: 24, alignItems: 'center' },
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
  sectionTitle: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 18, fontWeight: '600', marginBottom: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  gridCard: { width: '47%', borderRadius: 14, overflow: 'hidden' },
  gridImg: { height: 100, alignItems: 'center', justifyContent: 'center' },
  gridTitle: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 14, fontWeight: '600', paddingHorizontal: 10, paddingTop: 8 },
  gridPrice: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 14, fontWeight: '700', paddingHorizontal: 10, marginTop: 2 },
  gridDate: { fontFamily: 'PlusJakartaSans-Regular', fontSize: 11, paddingHorizontal: 10, paddingBottom: 10, marginTop: 2 },
});

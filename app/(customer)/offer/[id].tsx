import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/stores/authStore';
import { usePostsStore } from '@/stores/postsStore';
import { useCartStore } from '@/stores/cartStore';
import { useSavedStore } from '@/stores/appStores';
import { ScreenWrapper, Button, PostImage, AvatarImage } from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';
import { crossAlert, infoAlert } from '@/lib/crossAlert';
import { useToast } from '@/components/ui/Toast';
import { flashSalesApi } from '@/lib/api';



export default function OfferDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, shadows } = useTheme();
  const profile = useAuthStore((s) => s.profile);
  const { currentPost, fetchPostById, isLoading } = usePostsStore();
  const { addItem } = useCartStore();
  const { isSaved, toggleSave } = useSavedStore();
  const { showToast } = useToast();
  const [qty, setQty] = useState(1);
  const [flashSale, setFlashSale] = useState<any>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (id) {
      fetchPostById(id);
      // Check for active flash sale on this post
      flashSalesApi.getActive().then(({ data }) => {
        const sale = (data || []).find((s: any) => s.post_id === id);
        if (sale) setFlashSale(sale);
      }).catch(() => {});
    }
  }, [id]);

  // Must be called unconditionally (before any early return) to obey Rules of Hooks
  useEffect(() => {
    if (id) setSaved(isSaved(id));
  }, [id]);

  const handleSave = useCallback(async () => {
    if (profile?.id && id) {
      const result = await toggleSave(profile.id, 'dish', id);
      setSaved(result);
    }
  }, [profile?.id, id]);

  const post = currentPost;
  const chef = (post as any)?.chef || { id: '', full_name: 'Chef', profile_photo_url: null };
  const chefProfile = (post as any)?.chef_profile || { kitchen_name: 'Kitchen', rating_average: 0, total_reviews: 0 };
  const reviews = (post as any)?.reviews || [];
  const maxQty = post?.remaining_quantity || 1;

  // Flash sale pricing
  const discountedPrice = flashSale ? Math.round(post?.price * (1 - flashSale.discount_percentage / 100)) : null;
  const effectivePrice = discountedPrice || post?.price || 0;
  const saleEndsIn = flashSale ? Math.max(0, Math.floor((new Date(flashSale.ends_at).getTime() - Date.now()) / 3600000)) : 0;

  if (!post) {
    return (
      <ScreenWrapper>
        <View style={{ alignItems: 'center', paddingTop: 80 }}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>🔍</Text>
          <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 8 }}>Loading dish details...</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={{ color: '#8B6914', fontSize: 15, fontWeight: '600' }}>Go back</Text>
          </TouchableOpacity>
        </View>
      </ScreenWrapper>
    );
  }

  const handleAddToCart = () => {
    // Add the item with effective price (discounted if flash sale active)
    addItem({
      postId: id || post.id,
      chefId: chef.id,
      chefName: chef.full_name,
      title: post.title,
      photo: (post.photos && post.photos.length > 0) ? post.photos[0] : '',
      price: effectivePrice,
      maxQuantity: maxQty,
    });
    // If qty > 1, update to match selected quantity
    if (qty > 1) {
      const { updateQuantity } = useCartStore.getState();
      updateQuantity(id || post.id, qty);
    }
    showToast(`${qty}× ${post.title} added to cart 🛒`, 'success');
  };

  return (
    <ScreenWrapper padded={false}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.hero}>
          <PostImage photos={post.photos} height={260} fallbackSize={72} />
          <View style={[styles.remainingBadge, { backgroundColor: colors.tertiaryContainer }]}>
            <Text style={{ color: colors.onTertiaryContainer, fontWeight: '700', fontSize: 12 }}>{maxQty} left</Text>
          </View>
          <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: 'rgba(0,0,0,0.3)' }]}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSave} style={[styles.saveBtn, { backgroundColor: 'rgba(0,0,0,0.3)' }]}>
            <Ionicons name={saved ? 'heart' : 'heart-outline'} size={22} color={saved ? '#ef4444' : '#fff'} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => {
            const text = `🍽️ ${post.title} — ${post.price} DA\n${post.description || ''}\nOrder on HomeChef!`;
            if (typeof navigator !== 'undefined' && navigator.share) {
              navigator.share({ title: post.title, text }).catch(() => {});
            } else {
              infoAlert('Share', text);
            }
          }} style={[styles.shareBtn, { backgroundColor: 'rgba(0,0,0,0.3)' }]}>
            <Ionicons name="share-social-outline" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={{ padding: 20 }}>
          {/* Flash Sale Banner */}
          {flashSale && (
            <View style={styles.flashBanner}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="flash" size={18} color="#fff" />
                <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>FLASH SALE — {flashSale.discount_percentage}% OFF</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                <Ionicons name="time" size={13} color="#fef3c7" />
                <Text style={{ color: '#fef3c7', fontSize: 12, fontWeight: '600' }}>Ends in {saleEndsIn}h</Text>
              </View>
            </View>
          )}

          {/* Title & price */}
          <Text style={[styles.title, { color: colors.onBackground }]}>{post.title}</Text>
          {discountedPrice ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <Text style={[styles.price, { color: colors.primary }]}>{discountedPrice} <Text style={styles.currency}>DA</Text></Text>
              <Text style={{ fontSize: 18, color: '#9ca3af', textDecorationLine: 'line-through' }}>{post.price} DA</Text>
              <View style={{ backgroundColor: '#dc2626', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
                <Text style={{ color: '#fff', fontSize: 12, fontWeight: '800' }}>-{flashSale.discount_percentage}%</Text>
              </View>
            </View>
          ) : (
            <Text style={[styles.price, { color: colors.primary }]}>{post.price} <Text style={styles.currency}>DA</Text></Text>
          )}

          {/* Chef info */}
          <TouchableOpacity onPress={() => router.push(`/(customer)/chef/${chef.id}`)}
            style={[styles.chefCard, { backgroundColor: colors.surfaceContainerLowest, ...shadows.sm }]}>
            <AvatarImage uri={chef.profile_photo_url} size={48} emoji="👩‍🍳" />
            <View style={{ flex: 1 }}>
              <Text style={[styles.chefName, { color: colors.onSurface }]}>{chefProfile.kitchen_name}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="star" size={14} color="#f59e0b" />
                <Text style={{ color: colors.onSurfaceVariant, fontSize: 13 }}>{chefProfile.rating_average} ({chefProfile.total_reviews} reviews)</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.outline} />
          </TouchableOpacity>

          {/* Description */}
          <Text style={[styles.sectionTitle, { color: colors.onBackground }]}>About</Text>
          <Text style={[styles.desc, { color: colors.onSurfaceVariant }]}>
            {post.description || 'No description available.'}
          </Text>

          {/* Tags */}
          <View style={styles.tagsRow}>
            {post.delivery_available !== false && (
              <View style={[styles.tag, { backgroundColor: colors.surfaceContainerLow }]}>
                <Ionicons name="bicycle" size={14} color={colors.onSurfaceVariant} />
                <Text style={{ color: colors.onSurfaceVariant, fontSize: 12 }}>Delivery</Text>
              </View>
            )}
            {post.pickup_available !== false && (
              <View style={[styles.tag, { backgroundColor: colors.surfaceContainerLow }]}>
                <Ionicons name="storefront" size={14} color={colors.onSurfaceVariant} />
                <Text style={{ color: colors.onSurfaceVariant, fontSize: 12 }}>Pickup</Text>
              </View>
            )}
            <View style={[styles.tag, { backgroundColor: colors.surfaceContainerLow }]}>
              <Ionicons name="time" size={14} color={colors.onSurfaceVariant} />
              <Text style={{ color: colors.onSurfaceVariant, fontSize: 12 }}>Until {typeof post.order_deadline === 'string' && post.order_deadline.includes('T') ? new Date(post.order_deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : post.order_deadline || '14:00'}</Text>
            </View>
          </View>

          {/* Reviews */}
          {reviews.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.onBackground }]}>Reviews</Text>
              {reviews.slice(0, 3).map((r: any) => (
                <View key={r.id} style={[styles.reviewCard, { backgroundColor: colors.surfaceContainerLowest, ...shadows.sm }]}>
                  <View style={styles.reviewHeader}>
                    <View style={styles.reviewAvatar}>
                      <AvatarImage uri={r.customer?.profile_photo_url} size={32} emoji="👤" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: colors.onSurface, fontWeight: '600', fontSize: 13 }}>{r.customer?.full_name}</Text>
                      <View style={{ flexDirection: 'row', gap: 2 }}>
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Ionicons key={s} name="star" size={12} color={s <= r.overall_rating ? '#f59e0b' : colors.outlineVariant} />
                        ))}
                      </View>
                    </View>
                  </View>
                  {r.comment && <Text style={{ color: colors.onSurfaceVariant, fontSize: 13, marginTop: 6, lineHeight: 19 }}>{r.comment}</Text>}
                </View>
              ))}
            </>
          )}

          {/* Quantity + Add to cart */}
          <View style={[styles.bottomBar, { backgroundColor: colors.surfaceContainerLowest, ...shadows.lg }]}>
            <View style={styles.qtyRow}>
              <TouchableOpacity onPress={() => setQty(Math.max(1, qty - 1))} style={[styles.qtyBtn, { backgroundColor: colors.surfaceContainerLow }]}>
                <Ionicons name="remove" size={20} color={colors.onSurface} />
              </TouchableOpacity>
              <Text style={[styles.qtyText, { color: colors.onSurface }]}>{qty}</Text>
              <TouchableOpacity onPress={() => setQty(Math.min(maxQty, qty + 1))} style={[styles.qtyBtn, { backgroundColor: colors.surfaceContainerLow }]}>
                <Ionicons name="add" size={20} color={colors.onSurface} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={handleAddToCart} style={[styles.addBtn, { backgroundColor: colors.primary }]}>
              <Ionicons name="cart" size={20} color={colors.onPrimary} />
              <Text style={{ color: colors.onPrimary, fontWeight: '700', fontSize: 15, marginLeft: 8 }}>
                Add — {effectivePrice * qty} DA
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  hero: { height: 260, overflow: 'hidden', position: 'relative' },
  backBtn: { position: 'absolute', top: 16, left: 16, width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  saveBtn: { position: 'absolute', top: 12, right: 12, width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  shareBtn: { position: 'absolute', top: 12, right: 60, width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  remainingBadge: { position: 'absolute', top: 16, right: 110, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 10 },
  title: { fontFamily: 'NotoSerif-Bold', fontSize: 26, fontWeight: '700', marginBottom: 4 },
  price: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 24, fontWeight: '700', marginBottom: 16 },
  currency: { fontSize: 14, fontWeight: '400' },
  chefCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, gap: 12, marginBottom: 20 },
  chefAvatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  chefName: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 15, fontWeight: '600', marginBottom: 2 },
  sectionTitle: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 17, fontWeight: '600', marginBottom: 8 },
  desc: { fontFamily: 'PlusJakartaSans-Regular', fontSize: 14, lineHeight: 22, marginBottom: 16 },
  tagsRow: { flexDirection: 'row', gap: 8, marginBottom: 20, flexWrap: 'wrap' },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  reviewCard: { padding: 14, borderRadius: 12, marginBottom: 8 },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  reviewAvatar: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  bottomBar: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, marginTop: 16, gap: 12 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  qtyBtn: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  qtyText: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 18, fontWeight: '700', minWidth: 24, textAlign: 'center' },
  addBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 14 },
  flashBanner: { backgroundColor: '#dc2626', padding: 14, borderRadius: 14, marginBottom: 16 },
});

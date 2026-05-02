import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, TextInput } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useCartStore } from '@/stores/cartStore';
import { Button, ScreenWrapper } from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const MOCK_OFFER = {
  id: '1', title: 'Couscous Royal', chef: 'Sarah K.', chefId: 'c1', chefAvatar: '👩‍🍳',
  description: 'Traditional Algerian couscous with lamb, chickpeas, and seasonal vegetables. Slow-cooked to perfection with a blend of authentic spices.',
  photos: ['🍲', '🥘', '🍛'], price: 850, remaining: 5, total: 15,
  deadline: '14:00', delivery: true, pickup: true, preorder: true,
  rating: 4.9, reviews: 47,
};

const MOCK_COMMENTS = [
  { id: '1', user: 'Nadia R.', text: 'This couscous is amazing! 🤤', likes: 12, time: '2h ago' },
  { id: '2', user: 'Karim Z.', text: 'Best in the neighborhood', likes: 8, time: '3h ago' },
];

export default function OfferDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { colors, shadows } = useTheme();
  const { addItem } = useCartStore();
  const [qty, setQty] = useState(1);
  const [activePhoto, setActivePhoto] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const offer = MOCK_OFFER;

  const handleAddToCart = () => {
    addItem({ postId: offer.id, chefId: offer.chefId, chefName: offer.chef, title: offer.title, photo: '', price: offer.price, maxQuantity: offer.remaining });
    router.back();
  };

  return (
    <ScreenWrapper padded={false} safeArea={false}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Photo carousel */}
        <View style={[styles.photoCarousel, { backgroundColor: colors.surfaceContainerHigh }]}>
          <Text style={{ fontSize: 80 }}>{offer.photos[activePhoto]}</Text>
          {/* Back + Save buttons */}
          <TouchableOpacity style={[styles.backBtn, { backgroundColor: 'rgba(0,0,0,0.3)' }]} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.saveBtn, { backgroundColor: 'rgba(0,0,0,0.3)' }]} onPress={() => setIsSaved(!isSaved)}>
            <Ionicons name={isSaved ? 'heart' : 'heart-outline'} size={22} color={isSaved ? '#ef4444' : '#fff'} />
          </TouchableOpacity>
          {/* Dots */}
          <View style={styles.dots}>
            {offer.photos.map((_, i) => (
              <View key={i} style={[styles.dot, { backgroundColor: i === activePhoto ? colors.primary : 'rgba(255,255,255,0.5)' }]} />
            ))}
          </View>
        </View>

        <View style={{ padding: 24 }}>
          {/* Chef row */}
          <TouchableOpacity style={styles.chefRow} onPress={() => router.push(`/(customer)/chef/${offer.chefId}`)}>
            <View style={[styles.chefAvatar, { backgroundColor: colors.surfaceContainerHigh }]}>
              <Text style={{ fontSize: 22 }}>{offer.chefAvatar}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.chefName, { color: colors.onSurface }]}>{offer.chef}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="star" size={14} color="#F59E0B" />
                <Text style={[styles.ratingText, { color: colors.onSurfaceVariant }]}>{offer.rating} ({offer.reviews})</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.outline} />
          </TouchableOpacity>

          <Text style={[styles.offerTitle, { color: colors.onBackground }]}>{offer.title}</Text>
          <Text style={[styles.desc, { color: colors.onSurfaceVariant }]}>{offer.description}</Text>

          {/* Info chips */}
          <View style={styles.infoRow}>
            <View style={[styles.infoBadge, { backgroundColor: colors.primaryFixed }]}>
              <Ionicons name="time-outline" size={14} color={colors.primary} />
              <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '600' }}>Deadline {offer.deadline}</Text>
            </View>
            <View style={[styles.infoBadge, { backgroundColor: '#dcfce7' }]}>
              <Text style={{ fontSize: 12, fontWeight: '600', color: '#15803d' }}>{offer.remaining}/{offer.total} left</Text>
            </View>
          </View>

          {/* Quantity + Price */}
          <View style={[styles.qtySection, { borderColor: colors.outlineVariant }]}>
            <View style={styles.qtyControls}>
              <TouchableOpacity style={[styles.qtyBtn, { borderColor: colors.outlineVariant }]} onPress={() => qty > 1 && setQty(qty - 1)}>
                <Ionicons name="remove" size={18} color={colors.onSurface} />
              </TouchableOpacity>
              <Text style={[styles.qtyNum, { color: colors.onSurface }]}>{qty}</Text>
              <TouchableOpacity style={[styles.qtyBtn, { backgroundColor: colors.primary }]} onPress={() => qty < offer.remaining && setQty(qty + 1)}>
                <Ionicons name="add" size={18} color={colors.onPrimary} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.totalPrice, { color: colors.primary }]}>{offer.price * qty} DA</Text>
          </View>

          {/* Comments */}
          <Text style={[styles.sectionTitle, { color: colors.onBackground }]}>Comments ({MOCK_COMMENTS.length})</Text>
          {MOCK_COMMENTS.map((c) => (
            <View key={c.id} style={[styles.comment, { borderBottomColor: colors.outlineVariant }]}>
              <Text style={[styles.commentUser, { color: colors.onSurface }]}>{c.user}</Text>
              <Text style={[styles.commentText, { color: colors.onSurfaceVariant }]}>{c.text}</Text>
              <View style={styles.commentMeta}>
                <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons name="heart-outline" size={14} color={colors.outline} />
                  <Text style={{ color: colors.outline, fontSize: 12 }}>{c.likes}</Text>
                </TouchableOpacity>
                <Text style={{ color: colors.outline, fontSize: 12 }}>{c.time}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      <View style={[styles.bottomBar, { backgroundColor: colors.surfaceContainerLowest, borderTopColor: colors.outlineVariant, ...shadows.lg }]}>
        <Button title={`Add to Cart · ${offer.price * qty} DA`} onPress={handleAddToCart} size="lg" />
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  photoCarousel: { height: 280, alignItems: 'center', justifyContent: 'center' },
  backBtn: { position: 'absolute', top: 50, left: 20, width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  saveBtn: { position: 'absolute', top: 50, right: 20, width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  dots: { position: 'absolute', bottom: 16, flexDirection: 'row', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  chefRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  chefAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  chefName: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 15, fontWeight: '600' },
  ratingText: { fontSize: 13 },
  offerTitle: { fontFamily: 'NotoSerif-Bold', fontSize: 26, fontWeight: '700', marginBottom: 8 },
  desc: { fontFamily: 'PlusJakartaSans-Regular', fontSize: 15, lineHeight: 24, marginBottom: 16 },
  infoRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  infoBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  qtySection: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderTopWidth: 1, borderBottomWidth: 1, marginBottom: 24 },
  qtyControls: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  qtyBtn: { width: 36, height: 36, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  qtyNum: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 20, fontWeight: '700', width: 30, textAlign: 'center' },
  totalPrice: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 24, fontWeight: '700' },
  sectionTitle: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 17, fontWeight: '600', marginBottom: 12 },
  comment: { paddingVertical: 12, borderBottomWidth: 0.5 },
  commentUser: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 14, fontWeight: '600', marginBottom: 4 },
  commentText: { fontFamily: 'PlusJakartaSans-Regular', fontSize: 14, lineHeight: 20 },
  commentMeta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  bottomBar: { padding: 20, borderTopWidth: 0.5 },
});

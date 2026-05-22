import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/stores/authStore';
import { ScreenWrapper } from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/Toast';

export default function ReviewsReceivedScreen() {
  const router = useRouter();
  const { colors, shadows } = useTheme();
  const profile = useAuthStore((s) => s.profile);
  const { showToast } = useToast();

  const [reviews, setReviews] = useState<any[]>([]);
  const [filterStars, setFilterStars] = useState<number | null>(null);
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  useEffect(() => { fetchReviews(); }, []);

  const fetchReviews = async () => {
    if (!profile?.id) return;
    const { data } = await supabase.from('reviews').select(`*, customer:users!customer_id(full_name, profile_photo_url)`)
      .eq('chef_id', profile.id).order('created_at', { ascending: false });
    setReviews(data || []);
  };

  const filtered = filterStars ? reviews.filter(r => r.rating === filterStars) : reviews;
  const avgRating = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : '0.0';
  const starCounts = [5, 4, 3, 2, 1].map(s => ({ stars: s, count: reviews.filter(r => r.rating === s).length }));

  const handleReply = async (id: string) => {
    if (!replyText.trim()) return;
    await supabase.from('reviews').update({ chef_reply: replyText.trim() }).eq('id', id);
    showToast('Reply posted!', 'success');
    setReplyingId(null); setReplyText('');
    fetchReviews();
  };

  const Stars = ({ rating, size = 14 }: { rating: number; size?: number }) => (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(i => <Ionicons key={i} name={i <= rating ? 'star' : 'star-outline'} size={size} color="#f59e0b" />)}
    </View>
  );

  return (
    <ScreenWrapper>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color={colors.onSurface} /></TouchableOpacity>
          <Text style={[styles.title, { color: colors.onBackground }]}>Reviews</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Rating Overview */}
        <View style={[styles.overviewCard, { backgroundColor: colors.surfaceContainerLowest, ...shadows.sm }]}>
          <View style={{ alignItems: 'center', marginRight: 24 }}>
            <Text style={{ color: colors.onBackground, fontSize: 48, fontWeight: '800' }}>{avgRating}</Text>
            <Stars rating={Math.round(parseFloat(avgRating))} size={18} />
            <Text style={{ color: colors.outline, fontSize: 12, marginTop: 4 }}>{reviews.length} reviews</Text>
          </View>
          <View style={{ flex: 1 }}>
            {starCounts.map(({ stars, count }) => (
              <View key={stars} style={styles.barRow}>
                <Text style={{ color: colors.onSurfaceVariant, fontSize: 12, width: 14 }}>{stars}</Text>
                <Ionicons name="star" size={10} color="#f59e0b" />
                <View style={[styles.barBg, { backgroundColor: colors.surfaceContainerLow }]}>
                  <View style={[styles.barFill, { width: `${reviews.length ? (count / reviews.length) * 100 : 0}%`, backgroundColor: '#f59e0b' }]} />
                </View>
                <Text style={{ color: colors.outline, fontSize: 11, width: 22, textAlign: 'right' }}>{count}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
          <TouchableOpacity onPress={() => setFilterStars(null)} style={[styles.filterChip, { backgroundColor: !filterStars ? colors.primary : colors.surfaceContainerLow }]}>
            <Text style={{ color: !filterStars ? '#fff' : colors.onSurface, fontWeight: '600' }}>All</Text>
          </TouchableOpacity>
          {[5, 4, 3, 2, 1].map(s => (
            <TouchableOpacity key={s} onPress={() => setFilterStars(s)} style={[styles.filterChip, { backgroundColor: filterStars === s ? colors.primary : colors.surfaceContainerLow }]}>
              <Ionicons name="star" size={12} color={filterStars === s ? '#fff' : '#f59e0b'} />
              <Text style={{ color: filterStars === s ? '#fff' : colors.onSurface, fontWeight: '600', marginLeft: 4 }}>{s}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Reviews List */}
        {filtered.map((rev) => (
          <View key={rev.id} style={[styles.reviewCard, { backgroundColor: colors.surfaceContainerLowest, ...shadows.sm }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
              <Text style={{ color: colors.onSurface, fontWeight: '700' }}>{rev.customer?.full_name || 'Customer'}</Text>
              <Text style={{ color: colors.outline, fontSize: 11 }}>{new Date(rev.created_at).toLocaleDateString()}</Text>
            </View>
            <Stars rating={rev.rating} />
            {rev.comment && <Text style={{ color: colors.onSurfaceVariant, marginTop: 8, lineHeight: 20 }}>{rev.comment}</Text>}

            {/* Chef Reply */}
            {rev.chef_reply ? (
              <View style={[styles.replyBox, { backgroundColor: colors.surfaceContainerLow }]}>
                <Text style={{ color: colors.primary, fontWeight: '600', fontSize: 12, marginBottom: 4 }}>Your Reply</Text>
                <Text style={{ color: colors.onSurfaceVariant, fontSize: 13 }}>{rev.chef_reply}</Text>
              </View>
            ) : replyingId === rev.id ? (
              <View style={{ marginTop: 10 }}>
                <TextInput style={[styles.replyInput, { backgroundColor: colors.surfaceContainerLow, color: colors.onSurface }]}
                  placeholder="Write your reply..." placeholderTextColor={colors.outline}
                  value={replyText} onChangeText={setReplyText} multiline />
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                  <TouchableOpacity style={[styles.replyBtn, { backgroundColor: colors.primary }]} onPress={() => handleReply(rev.id)}>
                    <Text style={{ color: '#fff', fontWeight: '600' }}>Post Reply</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setReplyingId(null)}>
                    <Text style={{ color: colors.outline, fontWeight: '600', paddingVertical: 8 }}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity style={{ marginTop: 8 }} onPress={() => { setReplyingId(rev.id); setReplyText(''); }}>
                <Text style={{ color: colors.primary, fontWeight: '600', fontSize: 13 }}>Reply</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
        <View style={{ height: 30 }} />
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, marginTop: 8 },
  title: { fontFamily: 'NotoSerif-Bold', fontSize: 22, fontWeight: '700' },
  overviewCard: { flexDirection: 'row', padding: 20, borderRadius: 16, marginBottom: 20 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  barBg: { flex: 1, height: 6, borderRadius: 3 },
  barFill: { height: 6, borderRadius: 3 },
  filterChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, marginRight: 8 },
  reviewCard: { padding: 16, borderRadius: 16, marginBottom: 12 },
  replyBox: { padding: 12, borderRadius: 10, marginTop: 10 },
  replyInput: { padding: 10, borderRadius: 10, fontSize: 13, minHeight: 60, textAlignVertical: 'top' },
  replyBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
});

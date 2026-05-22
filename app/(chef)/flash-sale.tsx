import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/stores/authStore';
import { ScreenWrapper, Button, Input } from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';
import { flashSalesApi } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { infoAlert } from '@/lib/crossAlert';
import { useToast } from '@/components/ui/Toast';

export default function FlashSaleScreen() {
  const router = useRouter();
  const { colors, shadows } = useTheme();
  const profile = useAuthStore((s) => s.profile);
  const { showToast } = useToast();

  const [posts, setPosts] = useState<any[]>([]);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [discount, setDiscount] = useState('20');
  const [duration, setDuration] = useState('2'); // hours
  const [isLoading, setIsLoading] = useState(false);
  const [activeSales, setActiveSales] = useState<any[]>([]);

  useEffect(() => { fetchPosts(); fetchActiveSales(); }, []);

  const fetchPosts = async () => {
    if (!profile?.id) return;
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase.from('daily_posts').select('id, title, price, remaining_quantity')
      .eq('chef_id', profile.id).eq('is_active', true).eq('date', today);
    setPosts(data || []);
  };

  const fetchActiveSales = async () => {
    const { data } = await flashSalesApi.getActive();
    setActiveSales((data || []).filter((s: any) => s.post?.chef_id === profile?.id));
  };

  const handleCreate = async () => {
    if (!selectedPostId) { infoAlert('Error', 'Select a post'); return; }
    if (!discount || parseInt(discount) < 5 || parseInt(discount) > 80) { infoAlert('Error', 'Discount must be 5-80%'); return; }
    setIsLoading(true);
    const now = new Date();
    const ends = new Date(now.getTime() + parseInt(duration) * 60 * 60 * 1000);
    const { error } = await flashSalesApi.create({
      chef_id: profile?.id, post_id: selectedPostId,
      discount_percentage: parseInt(discount),
      starts_at: now.toISOString(), ends_at: ends.toISOString(),
    });
    setIsLoading(false);
    if (error) { infoAlert('Error', error); } else {
      showToast('Flash Sale is LIVE! 🔥', 'success');
      fetchActiveSales();
    }
  };

  const selectedPost = posts.find(p => p.id === selectedPostId);
  const discountedPrice = selectedPost ? Math.round(selectedPost.price * (1 - parseInt(discount || '0') / 100)) : 0;

  return (
    <ScreenWrapper>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color={colors.onSurface} /></TouchableOpacity>
          <Text style={[styles.title, { color: colors.onBackground }]}>⚡ Flash Sale</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Active Sales */}
        {activeSales.length > 0 && (
          <View style={[styles.activeCard, { ...shadows.sm }]}>
            <Text style={styles.activeTitle}>🔴 LIVE Flash Sales</Text>
            {activeSales.map((sale: any) => (
              <View key={sale.id} style={styles.activeSaleRow}>
                <Text style={{ color: '#fff', fontWeight: '600', flex: 1 }}>{sale.post?.title} — {sale.discount_percentage}% OFF</Text>
                <TouchableOpacity onPress={async () => { await flashSalesApi.end(sale.id); fetchActiveSales(); showToast('Sale ended', 'info'); }}>
                  <Text style={{ color: '#fca5a5', fontWeight: '700' }}>End</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Select Post */}
        <Text style={[styles.section, { color: colors.onBackground }]}>Select Today's Post</Text>
        {posts.length === 0 ? (
          <Text style={{ color: colors.outline, marginBottom: 20 }}>No active posts today. Create a daily post first.</Text>
        ) : (
          posts.map((post) => (
            <TouchableOpacity key={post.id} onPress={() => setSelectedPostId(post.id)}
              style={[styles.postOption, { backgroundColor: selectedPostId === post.id ? colors.primary : colors.surfaceContainerLowest, borderColor: selectedPostId === post.id ? colors.primary : colors.outlineVariant, ...shadows.sm }]}>
              <Text style={{ color: selectedPostId === post.id ? '#fff' : colors.onSurface, fontWeight: '700' }}>{post.title}</Text>
              <Text style={{ color: selectedPostId === post.id ? 'rgba(255,255,255,0.8)' : colors.outline, fontSize: 13 }}>{post.price} DA · {post.remaining_quantity} left</Text>
            </TouchableOpacity>
          ))
        )}

        {/* Discount */}
        <Text style={[styles.section, { color: colors.onBackground }]}>Discount Percentage</Text>
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
          {[10, 15, 20, 25, 30, 40, 50].map((d) => (
            <TouchableOpacity key={d} onPress={() => setDiscount(String(d))}
              style={[styles.discountChip, { backgroundColor: discount === String(d) ? colors.primary : colors.surfaceContainerLow }]}>
              <Text style={{ color: discount === String(d) ? '#fff' : colors.onSurface, fontWeight: '700' }}>{d}%</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Duration */}
        <Text style={[styles.section, { color: colors.onBackground }]}>Duration</Text>
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
          {['1', '2', '3', '4', '6'].map((h) => (
            <TouchableOpacity key={h} onPress={() => setDuration(h)}
              style={[styles.discountChip, { backgroundColor: duration === h ? colors.primary : colors.surfaceContainerLow }]}>
              <Text style={{ color: duration === h ? '#fff' : colors.onSurface, fontWeight: '600' }}>{h}h</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Preview */}
        {selectedPost && (
          <View style={[styles.previewCard, { backgroundColor: colors.surfaceContainerLowest, ...shadows.sm }]}>
            <View style={[styles.flashBadge]}>
              <Ionicons name="flash" size={14} color="#fff" />
              <Text style={{ color: '#fff', fontWeight: '800', fontSize: 13 }}>{discount}% OFF</Text>
            </View>
            <Text style={{ color: colors.onSurface, fontWeight: '700', fontSize: 17, marginTop: 8 }}>{selectedPost.title}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 }}>
              <Text style={{ color: colors.outline, textDecorationLine: 'line-through', fontSize: 16 }}>{selectedPost.price} DA</Text>
              <Text style={{ color: '#dc2626', fontWeight: '800', fontSize: 22 }}>{discountedPrice} DA</Text>
            </View>
            <Text style={{ color: colors.outline, fontSize: 12, marginTop: 6 }}>Sale runs for {duration} hours</Text>
          </View>
        )}

        <View style={{ marginTop: 20 }}>
          <Button title="🔥 Launch Flash Sale" onPress={handleCreate} loading={isLoading} size="lg" />
        </View>
        <View style={{ height: 30 }} />
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, marginTop: 8 },
  title: { fontFamily: 'NotoSerif-Bold', fontSize: 22, fontWeight: '700' },
  section: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 16, fontWeight: '600', marginBottom: 10 },
  activeCard: { backgroundColor: '#dc2626', padding: 16, borderRadius: 16, marginBottom: 20 },
  activeTitle: { color: '#fff', fontWeight: '800', fontSize: 15, marginBottom: 10 },
  activeSaleRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  postOption: { padding: 14, borderRadius: 14, marginBottom: 8, borderWidth: 1.5 },
  discountChip: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12 },
  previewCard: { padding: 20, borderRadius: 16, marginBottom: 8 },
  flashBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#dc2626', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 10 },
});

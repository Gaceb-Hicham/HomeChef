import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/stores/authStore';
import { ScreenWrapper, Button, Input } from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { crossAlert, infoAlert } from '@/lib/crossAlert';
import { useToast } from '@/components/ui/Toast';

export default function ManagePostScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, shadows } = useTheme();
  const profile = useAuthStore((s) => s.profile);
  const { showToast } = useToast();

  const [post, setPost] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editQty, setEditQty] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchPost();
    fetchOrders();
  }, [id]);

  const fetchPost = async () => {
    if (!id) {
      // No id, fetch today's active post
      if (!profile?.id) return;
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase.from('daily_posts').select('*')
        .eq('chef_id', profile.id).eq('date', today).eq('is_active', true).single();
      if (data) { setPost(data); setEditFields(data); }
    } else {
      const { data } = await supabase.from('daily_posts').select('*').eq('id', id).single();
      if (data) { setPost(data); setEditFields(data); }
    }
  };

  const setEditFields = (p: any) => {
    setEditTitle(p.title || ''); setEditDesc(p.description || '');
    setEditPrice(String(p.price || '')); setEditQty(String(p.remaining_quantity || ''));
  };

  const fetchOrders = async () => {
    const postId = id || post?.id;
    if (!postId) return;
    const { data } = await supabase.from('orders').select(`*, customer:users!customer_id(full_name, profile_photo_url, phone)`)
      .eq('post_id', postId).order('created_at', { ascending: false });
    setOrders(data || []);
  };

  const handleSave = async () => {
    if (!post?.id) return;
    setIsLoading(true);
    const { error } = await supabase.from('daily_posts').update({
      title: editTitle, description: editDesc,
      price: parseInt(editPrice) || post.price,
      remaining_quantity: parseInt(editQty) || post.remaining_quantity,
    }).eq('id', post.id);
    setIsLoading(false);
    if (error) { infoAlert('Error', error.message); } else {
      showToast('Post updated!', 'success');
      setIsEditing(false);
      fetchPost();
    }
  };

  const handleSoldOut = () => {
    crossAlert('Mark Sold Out', 'This will mark the post as sold out. Customers won\'t be able to order.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sold Out', style: 'destructive', onPress: async () => {
        await supabase.from('daily_posts').update({ is_sold_out: true, remaining_quantity: 0 }).eq('id', post.id);
        showToast('Marked as sold out', 'info');
        fetchPost();
      }},
    ]);
  };

  const handleDelete = () => {
    crossAlert('Delete Post', 'This will permanently delete this post and all its data.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await supabase.from('daily_posts').update({ is_active: false }).eq('id', post.id);
        showToast('Post deleted', 'success');
        router.back();
      }},
    ]);
  };

  const STATUS_MAP: Record<string, { color: string; bg: string }> = {
    received: { color: '#b45309', bg: '#fef3c7' },
    preparing: { color: '#4338ca', bg: '#e0e7ff' },
    ready: { color: '#16a34a', bg: '#dcfce7' },
    delivered: { color: '#059669', bg: '#d1fae5' },
    cancelled: { color: '#dc2626', bg: '#fce4ec' },
  };

  if (!post) {
    return (<ScreenWrapper><View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Ionicons name="restaurant-outline" size={48} color={colors.outline} />
      <Text style={{ color: colors.outline, marginTop: 12 }}>No active post today</Text>
      <Button title="Create Post" onPress={() => router.push('/(chef)/create-post')} variant="outline" style={{ marginTop: 16 }} />
    </View></ScreenWrapper>);
  }

  return (
    <ScreenWrapper>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color={colors.onSurface} /></TouchableOpacity>
          <Text style={[styles.title, { color: colors.onBackground }]}>Manage Post</Text>
          <TouchableOpacity onPress={() => setIsEditing(!isEditing)}>
            <Ionicons name={isEditing ? 'close' : 'create-outline'} size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Post Details / Edit */}
        <View style={[styles.card, { backgroundColor: colors.surfaceContainerLowest, ...shadows.sm }]}>
          {isEditing ? (
            <>
              <Input label="Title" value={editTitle} onChangeText={setEditTitle} />
              <View style={{ height: 12 }} />
              <Input label="Description" value={editDesc} onChangeText={setEditDesc} multiline />
              <View style={{ height: 12, flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}><Input label="Price (DA)" value={editPrice} onChangeText={setEditPrice} keyboardType="numeric" /></View>
                <View style={{ flex: 1 }}><Input label="Remaining Qty" value={editQty} onChangeText={setEditQty} keyboardType="numeric" /></View>
              </View>
              <Button title="Save Changes" onPress={handleSave} loading={isLoading} style={{ marginTop: 16 }} />
            </>
          ) : (
            <>
              <Text style={{ color: colors.onSurface, fontWeight: '800', fontSize: 20 }}>{post.title}</Text>
              {post.description && <Text style={{ color: colors.onSurfaceVariant, marginTop: 6 }}>{post.description}</Text>}
              <View style={{ flexDirection: 'row', gap: 16, marginTop: 12 }}>
                <View style={[styles.statBox, { backgroundColor: colors.surfaceContainerLow }]}>
                  <Ionicons name="cash" size={16} color={colors.primary} />
                  <Text style={{ color: colors.primary, fontWeight: '700' }}>{post.price} DA</Text>
                </View>
                <View style={[styles.statBox, { backgroundColor: post.remaining_quantity > 0 ? '#dcfce7' : '#fce4ec' }]}>
                  <Ionicons name="cube" size={16} color={post.remaining_quantity > 0 ? '#16a34a' : '#dc2626'} />
                  <Text style={{ color: post.remaining_quantity > 0 ? '#16a34a' : '#dc2626', fontWeight: '700' }}>{post.remaining_quantity} left</Text>
                </View>
              </View>
              {post.is_sold_out && (
                <View style={[styles.soldOutBanner]}>
                  <Text style={{ color: '#fff', fontWeight: '800' }}>SOLD OUT</Text>
                </View>
              )}
            </>
          )}
        </View>

        {/* Actions */}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#fef3c7' }]} onPress={handleSoldOut}>
            <Ionicons name="flag" size={16} color="#b45309" />
            <Text style={{ color: '#b45309', fontWeight: '600', marginLeft: 6 }}>Sold Out</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#fce4ec' }]} onPress={handleDelete}>
            <Ionicons name="trash" size={16} color="#dc2626" />
            <Text style={{ color: '#dc2626', fontWeight: '600', marginLeft: 6 }}>Delete</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#e0e7ff' }]} onPress={() => router.push('/(chef)/flash-sale')}>
            <Ionicons name="flash" size={16} color="#4338ca" />
            <Text style={{ color: '#4338ca', fontWeight: '600', marginLeft: 6 }}>Flash Sale</Text>
          </TouchableOpacity>
        </View>

        {/* Orders for this post */}
        <Text style={[styles.sectionTitle, { color: colors.onBackground }]}>📦 Orders ({orders.length})</Text>
        {orders.length === 0 ? (
          <Text style={{ color: colors.outline, textAlign: 'center', paddingVertical: 30 }}>No orders yet for this post</Text>
        ) : (
          orders.map((order) => {
            const st = STATUS_MAP[order.order_status] || STATUS_MAP.received;
            return (
              <View key={order.id} style={[styles.orderCard, { backgroundColor: colors.surfaceContainerLowest, ...shadows.sm }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                  <Text style={{ color: colors.onSurface, fontWeight: '700' }}>{order.customer?.full_name}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: st.bg }]}>
                    <Text style={{ color: st.color, fontSize: 11, fontWeight: '700' }}>{order.order_status}</Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', gap: 16 }}>
                  <Text style={{ color: colors.onSurfaceVariant, fontSize: 13 }}>x{order.quantity}</Text>
                  <Text style={{ color: colors.primary, fontWeight: '600', fontSize: 13 }}>{order.total_price} DA</Text>
                  {order.customer?.phone && <Text style={{ color: colors.outline, fontSize: 13 }}>📞 {order.customer.phone}</Text>}
                </View>
                {order.customer_note && <Text style={{ color: colors.outline, fontSize: 12, marginTop: 4, fontStyle: 'italic' }}>"{order.customer_note}"</Text>}
              </View>
            );
          })
        )}
        <View style={{ height: 30 }} />
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, marginTop: 8 },
  title: { fontFamily: 'NotoSerif-Bold', fontSize: 22, fontWeight: '700' },
  sectionTitle: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 17, fontWeight: '600', marginBottom: 12 },
  card: { padding: 18, borderRadius: 16, marginBottom: 16 },
  statBox: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  soldOutBanner: { backgroundColor: '#dc2626', alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 10, marginTop: 12 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12 },
  orderCard: { padding: 14, borderRadius: 14, marginBottom: 10 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
});

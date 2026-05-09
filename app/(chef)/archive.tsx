import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/stores/authStore';
import { usePostsStore } from '@/stores/postsStore';
import { postsApi } from '@/lib';
import { ScreenWrapper, PostImage, useToast } from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';
import { crossAlert } from '@/lib/crossAlert';
import { useLanguage } from '@/hooks/useLanguage';

export default function ArchiveScreen() {
  const router = useRouter();
  const { colors, shadows } = useTheme();
  const profile = useAuthStore((s) => s.profile);
  const { deletePost } = usePostsStore();
  const { showToast } = useToast();
  const { t } = useLanguage();
  const [archive, setArchive] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (profile?.id) {
      loadArchive();
    } else {
      setLoading(false);
    }
  }, [profile?.id]);

  const loadArchive = async () => {
    try {
      const { data } = await postsApi.getChefArchive(profile!.id, 50);
      if (data) setArchive(data);
    } catch (e) {
      // API error — show empty state
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadArchive();
  };

  const handleDelete = (postId: string, title: string) => {
    crossAlert(
      t('delete'),
      `Delete "${title}"? This cannot be undone.`,
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: async () => {
            const { error } = await deletePost(postId);
            if (error) {
              showToast(error, 'error');
            } else {
              setArchive((prev) => prev.filter((p) => p.id !== postId));
              showToast('Post deleted', 'success');
            }
          },
        },
      ]
    );
  };

  const handleEdit = (item: any) => {
    // Navigate to create-post with pre-filled data via query params
    router.push({
      pathname: '/(chef)/create-post',
      params: {
        editId: item.id,
        editTitle: item.title,
        editDescription: item.description || '',
        editPrice: item.price?.toString() || '',
        editQuantity: item.available_quantity?.toString() || '',
        editCategory: item.category || '',
        editDelivery: item.delivery_available ? '1' : '0',
        editPickup: item.pickup_available ? '1' : '0',
      },
    });
  };

  if (loading) {
    return (
      <ScreenWrapper>
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 60 }} />
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.onBackground }]}>Kitchen Archive</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList data={archive} keyExtractor={(i: any) => i.id} numColumns={2} columnWrapperStyle={{ gap: 12 }}
        contentContainerStyle={{ gap: 12 }} showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingTop: 40 }}>
            <Text style={{ fontSize: 40 }}>📋</Text>
            <Text style={{ color: colors.onSurfaceVariant, marginTop: 8, fontSize: 15 }}>No posts yet. Start by posting today's special!</Text>
          </View>
        }
        renderItem={({ item }: { item: any }) => (
          <View style={[styles.card, { backgroundColor: colors.surfaceContainerLowest, ...shadows.sm }]}>
            <PostImage photos={item.photos} height={100} borderRadius={12} fallbackSize={36} />
            <View style={{ padding: 10 }}>
              <Text style={[styles.cardTitle, { color: colors.onSurface }]} numberOfLines={1}>{item.title}</Text>
              <Text style={[styles.cardPrice, { color: colors.primary }]}>{item.price} DA</Text>
              <View style={styles.cardMeta}>
                <Text style={[styles.cardDate, { color: colors.outline }]}>{new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</Text>
                <Text style={[styles.cardOrders, { color: colors.onSurfaceVariant }]}>{item.available_quantity - item.remaining_quantity} sold</Text>
              </View>
              {/* Action buttons */}
              <View style={styles.actionRow}>
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.primaryFixed }]} onPress={() => handleEdit(item)}>
                  <Ionicons name="create-outline" size={14} color={colors.primary} />
                  <Text style={[styles.actionText, { color: colors.primary }]}>{t('edit')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#fee2e2' }]} onPress={() => handleDelete(item.id, item.title)}>
                  <Ionicons name="trash-outline" size={14} color="#dc2626" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, marginTop: 8 },
  title: { fontFamily: 'NotoSerif-Bold', fontSize: 22, fontWeight: '700' },
  card: { flex: 1, borderRadius: 14, overflow: 'hidden' },
  cardTitle: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 14, fontWeight: '600' },
  cardPrice: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 14, fontWeight: '700', marginTop: 2 },
  cardMeta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  cardDate: { fontFamily: 'PlusJakartaSans-Regular', fontSize: 11 },
  cardOrders: { fontFamily: 'PlusJakartaSans-Regular', fontSize: 11 },
  actionRow: { flexDirection: 'row', gap: 6, marginTop: 8 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  actionText: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 11, fontWeight: '600' },
});

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/stores/authStore';
import { reviewsApi, ordersApi } from '@/lib';
import { Button, ScreenWrapper } from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';
import { crossAlert, infoAlert } from '@/lib/crossAlert';
import { useLanguage } from '@/hooks/useLanguage';
import { useToast } from '@/components/ui/Toast';

export default function ReviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const profile = useAuthStore((s) => s.profile);
  const [overall, setOverall] = useState(0);
  const [taste, setTaste] = useState(0);
  const [packaging, setPackaging] = useState(0);
  const [accuracy, setAccuracy] = useState(0);
  const [comment, setComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [order, setOrder] = useState<any>(null);
  const { t } = useLanguage();
  const { showToast } = useToast();

  useEffect(() => {
    if (id) loadOrder();
  }, [id]);

  const loadOrder = async () => {
    const { data } = await ordersApi.getOrderById(id!);
    if (data) setOrder(data);
  };

  const StarRow = ({ label, value, onChange }: { label: string; value: number; onChange: (n: number) => void }) => (
    <View style={styles.starSection}>
      <Text style={[styles.starLabel, { color: colors.onSurfaceVariant }]}>{label}</Text>
      <View style={styles.stars}>
        {[1, 2, 3, 4, 5].map((n) => (
          <TouchableOpacity key={n} onPress={() => onChange(n)}>
            <Ionicons name={n <= value ? 'star' : 'star-outline'} size={32} color={n <= value ? '#F59E0B' : colors.outlineVariant} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const handleSubmit = async () => {
    if (overall === 0) { infoAlert('Rating Required', 'Please give an overall rating.'); return; }
    if (!profile?.id || !id) return;

    setIsLoading(true);
    const { data, error } = await reviewsApi.createReview({
      order_id: id,
      customer_id: profile.id,
      chef_id: order?.chef_id || order?.chef?.id || '',
      post_id: order?.post_id || '',
      overall_rating: overall,
      taste_rating: taste > 0 ? taste : null,
      packaging_rating: packaging > 0 ? packaging : null,
      accuracy_rating: accuracy > 0 ? accuracy : null,
      comment: comment.trim() || null,
    } as any);
    setIsLoading(false);

    if (error) {
      infoAlert('Error', error);
    } else {
      showToast(t('review.thanks'), 'success');
      router.back();
    }
  };

  return (
    <ScreenWrapper>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.onBackground }]}>{t('review.title')}</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.dishInfo}>
        <Text style={{ fontSize: 44 }}>🍲</Text>
        <Text style={[styles.dishName, { color: colors.onSurface }]}>{order?.post?.title || 'Your Order'}</Text>
        <Text style={[styles.chefName, { color: colors.onSurfaceVariant }]}>
          by {order?.chef?.full_name || 'Chef'}
        </Text>
      </View>

      <StarRow label={`${t('review.overall')} *`} value={overall} onChange={setOverall} />
      <StarRow label={t('review.taste')} value={taste} onChange={setTaste} />
      <StarRow label={t('review.packaging')} value={packaging} onChange={setPackaging} />
      <StarRow label={t('review.accuracy')} value={accuracy} onChange={setAccuracy} />

      <Text style={[styles.starLabel, { color: colors.onSurfaceVariant, marginTop: 4 }]}>{t('review.comment')}</Text>
      <TextInput
        value={comment}
        onChangeText={setComment}
        placeholder="Share your experience..."
        placeholderTextColor={colors.outline}
        multiline
        numberOfLines={3}
        style={[styles.commentInput, { color: colors.onSurface, backgroundColor: colors.surfaceContainerLow, borderColor: colors.outlineVariant }]}
      />

      <View style={{ flex: 1 }} />
      <Button title={t('review.submit')} onPress={handleSubmit} loading={isLoading} size="lg" disabled={overall === 0} />
      <View style={{ height: 16 }} />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, marginTop: 8 },
  title: { fontFamily: 'NotoSerif-Bold', fontSize: 22, fontWeight: '700' },
  dishInfo: { alignItems: 'center', marginBottom: 32 },
  dishName: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 20, fontWeight: '600', marginTop: 12 },
  chefName: { fontFamily: 'PlusJakartaSans-Regular', fontSize: 14, marginTop: 4 },
  starSection: { marginBottom: 20 },
  starLabel: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 14, fontWeight: '600', marginBottom: 8 },
  stars: { flexDirection: 'row', gap: 8 },
  commentInput: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 14, fontFamily: 'PlusJakartaSans-Regular', minHeight: 80, textAlignVertical: 'top', marginBottom: 16 },
});

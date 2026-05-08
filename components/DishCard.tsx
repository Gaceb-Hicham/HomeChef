import React, { memo, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_WIDTH = SCREEN_WIDTH - 32;

interface DishCardProps {
  id: string;
  title: string;
  chefName: string;
  price: number;
  imageUrl?: string;
  rating: number;
  quantityLeft: number;
  isSaved?: boolean;
  onSaveToggle?: () => void;
}

/**
 * Optimized dish card — memoized to prevent re-renders when
 * parent list scrolls or other cards update.
 */
function DishCardComponent({
  id,
  title,
  chefName,
  price,
  imageUrl,
  rating,
  quantityLeft,
  isSaved = false,
  onSaveToggle,
}: DishCardProps) {
  const { colors, shadows } = useTheme();
  const router = useRouter();

  const handlePress = useCallback(() => {
    router.push(`/(customer)/offer/${id}` as any);
  }, [id]);

  const priceText = useMemo(() => `${price.toLocaleString()} DA`, [price]);
  const ratingText = useMemo(() => `⭐ ${rating.toFixed(1)}`, [rating]);

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={handlePress}
      style={[styles.card, { backgroundColor: colors.surfaceContainerLowest, ...shadows.sm }]}
    >
      <View style={[styles.imageContainer, { backgroundColor: colors.surfaceContainerHigh }]}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
        ) : (
          <Text style={styles.placeholderEmoji}>🍲</Text>
        )}

        {/* Quantity badge */}
        {quantityLeft <= 5 && (
          <View style={[styles.badge, { backgroundColor: colors.error }]}>
            <Text style={styles.badgeText}>{quantityLeft} left</Text>
          </View>
        )}

        {/* Save button */}
        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: 'rgba(255,255,255,0.9)' }]}
          onPress={onSaveToggle}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={{ fontSize: 16 }}>{isSaved ? '❤️' : '🤍'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.info}>
        <Text style={[styles.title, { color: colors.onSurface }]} numberOfLines={1}>
          {title}
        </Text>
        <Text style={[styles.chef, { color: colors.onSurfaceVariant }]} numberOfLines={1}>
          by {chefName}
        </Text>
        <View style={styles.row}>
          <Text style={[styles.price, { color: colors.primary }]}>{priceText}</Text>
          <Text style={[styles.rating, { color: colors.onSurfaceVariant }]}>{ratingText}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export const DishCard = memo(DishCardComponent);

const styles = StyleSheet.create({
  card: { borderRadius: 16, overflow: 'hidden', marginBottom: 14 },
  imageContainer: { height: 160, position: 'relative', alignItems: 'center', justifyContent: 'center' },
  image: { width: '100%', height: '100%' },
  placeholderEmoji: { fontSize: 48 },
  badge: { position: 'absolute', top: 10, left: 10, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  saveBtn: { position: 'absolute', top: 10, right: 10, width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  info: { padding: 12 },
  title: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 16, fontWeight: '600', marginBottom: 2 },
  chef: { fontFamily: 'PlusJakartaSans-Regular', fontSize: 13, marginBottom: 6 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  price: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 15, fontWeight: '700' },
  rating: { fontFamily: 'PlusJakartaSans-Regular', fontSize: 13 },
});

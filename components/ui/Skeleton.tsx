import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

/**
 * Animated shimmer skeleton placeholder.
 * Use while content is loading to maintain layout and feel premium.
 */
export function Skeleton({ width = '100%', height = 16, borderRadius = 8, style }: SkeletonProps) {
  const { colors } = useTheme();
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 1000, useNativeDriver: false }),
        Animated.timing(shimmer, { toValue: 0, duration: 1000, useNativeDriver: false }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const backgroundColor = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.surfaceContainerLow, colors.surfaceContainerHigh],
  });

  return (
    <Animated.View
      style={[
        { width: width as any, height, borderRadius, backgroundColor },
        style,
      ]}
    />
  );
}

/**
 * Pre-built skeleton for a feed card (image + text rows).
 */
export function FeedCardSkeleton() {
  return (
    <View style={skeletonStyles.card}>
      <Skeleton height={180} borderRadius={16} />
      <View style={skeletonStyles.body}>
        <View style={skeletonStyles.chefRow}>
          <Skeleton width={28} height={28} borderRadius={14} />
          <Skeleton width={100} height={14} />
        </View>
        <Skeleton width="80%" height={18} style={{ marginTop: 8 }} />
        <View style={skeletonStyles.footer}>
          <Skeleton width={60} height={16} />
          <Skeleton width={36} height={36} borderRadius={18} />
        </View>
      </View>
    </View>
  );
}

/**
 * Pre-built skeleton for an order row.
 */
export function OrderRowSkeleton() {
  return (
    <View style={skeletonStyles.orderRow}>
      <Skeleton width={48} height={48} borderRadius={12} />
      <View style={{ flex: 1, gap: 6 }}>
        <Skeleton width="60%" height={14} />
        <Skeleton width="40%" height={12} />
      </View>
      <Skeleton width={60} height={24} borderRadius={12} />
    </View>
  );
}

/**
 * Multiple feed card skeletons for loading state.
 */
export function FeedSkeleton({ count = 3 }: { count?: number }) {
  return (
    <View style={{ gap: 16 }}>
      {Array.from({ length: count }).map((_, i) => (
        <FeedCardSkeleton key={i} />
      ))}
    </View>
  );
}

const skeletonStyles = StyleSheet.create({
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    gap: 0,
  },
  body: {
    padding: 14,
    gap: 4,
  },
  chefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  orderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
});

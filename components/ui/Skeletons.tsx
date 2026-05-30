import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

const SCREEN_W = Dimensions.get('window').width;

function ShimmerBlock({ width, height, borderRadius = 8, style }: {
  width: number | string; height: number; borderRadius?: number; style?: any;
}) {
  const { colors } = useTheme();
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 800, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.7] });

  return (
    <Animated.View
      style={[
        { width: width as any, height, borderRadius, backgroundColor: colors.surfaceContainerHigh, opacity },
        style,
      ]}
    />
  );
}

/** Skeleton for a single post card in the feed */
export function PostCardSkeleton() {
  return (
    <View style={styles.postCard}>
      <ShimmerBlock width="100%" height={180} borderRadius={0} />
      <View style={styles.postContent}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <ShimmerBlock width={24} height={24} borderRadius={12} />
          <ShimmerBlock width={100} height={12} />
        </View>
        <ShimmerBlock width="80%" height={16} style={{ marginTop: 10 }} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
          <ShimmerBlock width={80} height={20} />
          <ShimmerBlock width={36} height={36} borderRadius={12} />
        </View>
      </View>
    </View>
  );
}

/** Skeleton for order list items */
export function OrderCardSkeleton() {
  return (
    <View style={styles.orderCard}>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <ShimmerBlock width={52} height={52} borderRadius={14} />
        <View style={{ flex: 1 }}>
          <ShimmerBlock width="70%" height={14} />
          <ShimmerBlock width="40%" height={11} style={{ marginTop: 6 }} />
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <ShimmerBlock width={60} height={14} />
          <ShimmerBlock width={40} height={10} style={{ marginTop: 6 }} />
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
        <ShimmerBlock width={90} height={24} borderRadius={12} />
        <ShimmerBlock width={70} height={24} borderRadius={12} />
      </View>
    </View>
  );
}

/** Skeleton for chef card in search */
export function ChefCardSkeleton() {
  return (
    <View style={styles.chefCard}>
      <ShimmerBlock width={48} height={48} borderRadius={24} />
      <View style={{ flex: 1, marginLeft: 12 }}>
        <ShimmerBlock width="60%" height={14} />
        <ShimmerBlock width="40%" height={11} style={{ marginTop: 6 }} />
      </View>
      <ShimmerBlock width={40} height={14} />
    </View>
  );
}

/** Full feed skeleton (3 post cards) */
export function FeedSkeleton() {
  return (
    <View style={{ paddingHorizontal: 20, gap: 16 }}>
      <PostCardSkeleton />
      <PostCardSkeleton />
      <PostCardSkeleton />
    </View>
  );
}

/** Orders list skeleton */
export function OrdersSkeleton() {
  return (
    <View style={{ paddingHorizontal: 20, gap: 10 }}>
      <OrderCardSkeleton />
      <OrderCardSkeleton />
      <OrderCardSkeleton />
      <OrderCardSkeleton />
    </View>
  );
}

const styles = StyleSheet.create({
  postCard: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  postContent: {
    padding: 14,
  },
  orderCard: {
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#fff',
  },
  chefCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#fff',
  },
});

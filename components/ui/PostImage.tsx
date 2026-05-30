import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator,
  ScrollView, TouchableOpacity, LayoutChangeEvent,
} from 'react-native';
import { Image } from 'expo-image';
import { useTheme } from '@/hooks/useTheme';

interface PostImageProps {
  photos?: string[] | null;
  uri?: string | null;
  height?: number;
  borderRadius?: number;
  fallbackSize?: number;
  style?: any;
  /** Show all photos in a swipeable carousel (default: true when multiple photos) */
  showCarousel?: boolean;
  /** 'cover' crops to fill (default), 'contain' shows the full image */
  fit?: 'cover' | 'contain';
}

/**
 * Native (iOS/Android) implementation of PostImage.
 * Supports multi-image carousel with swipe and pagination dots.
 * Uses onLayout to determine actual container width for proper carousel sizing.
 */
export function PostImage({
  photos,
  uri,
  height = 180,
  borderRadius = 0,
  fallbackSize = 56,
  style,
  showCarousel = true,
  fit = 'cover',
}: PostImageProps) {
  const { colors } = useTheme();

  // Build list of valid image URLs
  const allPhotos: string[] = [];
  if (uri && uri.trim().length > 0) {
    allPhotos.push(uri.trim());
  } else if (photos && photos.length > 0) {
    photos.forEach(p => {
      if (p && p.trim().length > 0) allPhotos.push(p.trim());
    });
  }

  const hasMultiple = showCarousel && allPhotos.length > 1;
  const [activeIndex, setActiveIndex] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0) setContainerWidth(w);
  }, []);

  const onScroll = useCallback((e: any) => {
    if (!containerWidth) return;
    const x = e.nativeEvent.contentOffset.x;
    const idx = Math.round(x / containerWidth);
    setActiveIndex(idx);
  }, [containerWidth]);

  const containerStyle = [
    styles.container,
    { height, borderRadius, backgroundColor: colors.surfaceContainerHigh },
    style,
  ];

  if (allPhotos.length === 0) {
    return (
      <View style={containerStyle} onLayout={onLayout}>
        <Text style={{ fontSize: fallbackSize }}>🍽️</Text>
      </View>
    );
  }

  // Single image (no carousel)
  if (!hasMultiple) {
    return (
      <View style={containerStyle} onLayout={onLayout}>
        <SingleImage uri={allPhotos[0]} borderRadius={borderRadius} colors={colors} fit={fit} />
      </View>
    );
  }

  // Multi-image carousel
  return (
    <View style={containerStyle} onLayout={onLayout}>
      {containerWidth > 0 && (
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
          style={{ flex: 1 }}
        >
          {allPhotos.map((url, i) => (
            <View key={`${i}-${url}`} style={{ width: containerWidth, height }}>
              <SingleImage uri={url} borderRadius={0} colors={colors} fit={fit} />
            </View>
          ))}
        </ScrollView>
      )}
      {/* Pagination dots */}
      <View style={styles.dotsRow}>
        {allPhotos.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              {
                backgroundColor: i === activeIndex ? '#fff' : 'rgba(255,255,255,0.45)',
                width: i === activeIndex ? 18 : 7,
              },
            ]}
          />
        ))}
      </View>
      {/* Image counter */}
      <View style={styles.counterBadge}>
        <Text style={styles.counterText}>{activeIndex + 1}/{allPhotos.length}</Text>
      </View>
    </View>
  );
}

/** Single image with load/error handling */
function SingleImage({ uri, borderRadius, colors, fit = 'cover' }: { uri: string; borderRadius: number; colors: any; fit?: 'cover' | 'contain' }) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  if (errored) {
    return (
      <View style={[StyleSheet.absoluteFillObject, { alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ fontSize: 40 }}>🍽️</Text>
      </View>
    );
  }

  return (
    <>
      <Image
        source={{ uri }}
        style={[styles.image, { borderRadius }]}
        contentFit={fit}
        cachePolicy="memory-disk"
        transition={200}
        onLoad={() => setLoaded(true)}
        onError={() => setErrored(true)}
      />
      {!loaded && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      )}
    </>
  );
}

/**
 * Native avatar image component.
 */
export function AvatarImage({
  uri,
  size = 48,
  emoji = '👤',
  style,
}: {
  uri?: string | null;
  size?: number;
  emoji?: string;
  style?: any;
}) {
  const { colors } = useTheme();
  const [hasError, setHasError] = useState(false);

  const validUri = uri && uri.trim().length > 0 ? uri.trim() : null;

  if (!validUri || hasError) {
    return (
      <View
        style={[
          styles.avatar,
          { width: size, height: size, borderRadius: size / 2, backgroundColor: colors.surfaceContainerHigh },
          style,
        ]}
      >
        <Text style={{ fontSize: size * 0.5 }}>{emoji}</Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.avatar,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: colors.surfaceContainerHigh, overflow: 'hidden' },
        style,
      ]}
    >
      <Image
        source={{ uri: validUri }}
        style={{ width: size, height: size }}
        contentFit="cover"
        cachePolicy="memory-disk"
        transition={150}
        onError={() => setHasError(true)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
    ...StyleSheet.absoluteFillObject,
  } as any,
  loadingOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotsRow: {
    position: 'absolute',
    bottom: 10,
    left: 0, right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
  },
  dot: {
    height: 7,
    borderRadius: 4,
  },
  counterBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  counterText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
});

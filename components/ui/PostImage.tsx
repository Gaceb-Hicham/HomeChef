import React, { useState, useRef, useCallback } from 'react';
import {
  View, Image, Text, StyleSheet, ActivityIndicator,
  ScrollView, Dimensions, NativeSyntheticEvent, NativeScrollEvent, TouchableOpacity,
} from 'react-native';
import { useTheme } from '@/hooks/useTheme';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface PostImageProps {
  photos?: string[] | null;
  uri?: string | null;
  height?: number;
  borderRadius?: number;
  fallbackSize?: number;
  style?: any;
  /** Show all photos in a swipeable carousel (default: true when multiple photos) */
  showCarousel?: boolean;
}

/**
 * Native (iOS/Android) implementation of PostImage.
 * Supports multi-image carousel with swipe and pagination dots.
 *
 * The web counterpart lives in PostImage.web.tsx and uses HTML <img> tags
 * to avoid SSR/hydration mismatches with Expo Router.
 */
export function PostImage({
  photos,
  uri,
  height = 180,
  borderRadius = 0,
  fallbackSize = 56,
  style,
  showCarousel = true,
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

  const onScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const w = e.nativeEvent.layoutMeasurement.width;
    const idx = Math.round(x / w);
    setActiveIndex(idx);
  }, []);

  const containerStyle = [
    styles.container,
    { height, borderRadius, backgroundColor: colors.surfaceContainerHigh },
    style,
  ];

  if (allPhotos.length === 0) {
    return (
      <View style={containerStyle}>
        <Text style={{ fontSize: fallbackSize }}>🍽️</Text>
      </View>
    );
  }

  if (!hasMultiple) {
    return (
      <View style={containerStyle}>
        <SingleImage uri={allPhotos[0]} borderRadius={borderRadius} colors={colors} />
      </View>
    );
  }

  // Multi-image carousel
  return (
    <View style={containerStyle}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        style={{ flex: 1 }}
      >
        {allPhotos.map((url, i) => (
          <View key={`${url}-${i}`} style={{ width: SCREEN_WIDTH, height }}>
            <SingleImage uri={url} borderRadius={0} colors={colors} />
          </View>
        ))}
      </ScrollView>
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
function SingleImage({ uri, borderRadius, colors }: { uri: string; borderRadius: number; colors: any }) {
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
        resizeMode="cover"
        onLoadEnd={() => setLoaded(true)}
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
 * Web counterpart in PostImage.web.tsx.
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
        resizeMode="cover"
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
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
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
    left: 0,
    right: 0,
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

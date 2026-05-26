import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

interface PostImageProps {
  photos?: string[] | null;
  uri?: string | null;
  height?: number;
  borderRadius?: number;
  fallbackSize?: number;
  style?: any;
  showCarousel?: boolean;
  /** 'cover' crops to fill (default), 'contain' shows the full image */
  fit?: 'cover' | 'contain';
}

/**
 * Web-specific implementation of PostImage with multi-image carousel.
 * Uses native HTML <img> for SSR reliability.
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
  const [loadStates, setLoadStates] = useState<Record<number, boolean>>({});
  const [errorStates, setErrorStates] = useState<Record<number, boolean>>({});

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

  const currentUrl = allPhotos[activeIndex] || allPhotos[0];

  return (
    <View style={containerStyle}>
      {/* Current image */}
      {errorStates[activeIndex] ? (
        <Text style={{ fontSize: fallbackSize }}>🍽️</Text>
      ) : (
        <>
          <img
            key={activeIndex}
            src={currentUrl}
            alt=""
            onLoad={() => setLoadStates(s => ({ ...s, [activeIndex]: true }))}
            onError={() => setErrorStates(s => ({ ...s, [activeIndex]: true }))}
            style={{
              width: '100%',
              height: '100%',
              objectFit: fit,
              borderRadius,
              display: 'block',
            }}
          />
          {!loadStates[activeIndex] && !errorStates[activeIndex] && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          )}
        </>
      )}

      {/* Navigation arrows for multiple images */}
      {hasMultiple && (
        <>
          {activeIndex > 0 && (
            <TouchableOpacity
              onPress={() => setActiveIndex(i => Math.max(0, i - 1))}
              style={[styles.navBtn, { left: 8 }]}
            >
              <Text style={styles.navBtnText}>‹</Text>
            </TouchableOpacity>
          )}
          {activeIndex < allPhotos.length - 1 && (
            <TouchableOpacity
              onPress={() => setActiveIndex(i => Math.min(allPhotos.length - 1, i + 1))}
              style={[styles.navBtn, { right: 8 }]}
            >
              <Text style={styles.navBtnText}>›</Text>
            </TouchableOpacity>
          )}
          {/* Dots */}
          <View style={styles.dotsRow}>
            {allPhotos.map((_, i) => (
              <TouchableOpacity key={i} onPress={() => setActiveIndex(i)}>
                <View
                  style={[
                    styles.dot,
                    {
                      backgroundColor: i === activeIndex ? '#fff' : 'rgba(255,255,255,0.45)',
                      width: i === activeIndex ? 18 : 7,
                    },
                  ]}
                />
              </TouchableOpacity>
            ))}
          </View>
          {/* Counter */}
          <View style={styles.counterBadge}>
            <Text style={styles.counterText}>{activeIndex + 1}/{allPhotos.length}</Text>
          </View>
        </>
      )}
    </View>
  );
}

/**
 * Web-specific avatar image component.
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
      <img
        src={validUri}
        alt=""
        style={{ width: size, height: size, objectFit: 'cover' }}
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
  navBtn: {
    position: 'absolute',
    top: '50%',
    // @ts-ignore
    transform: [{ translateY: -16 }],
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBtnText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    marginTop: -2,
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

import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

interface PostImageProps {
  photos?: string[] | null;
  uri?: string | null;
  height?: number;
  borderRadius?: number;
  fallbackSize?: number;
  style?: any;
}

/**
 * Web-specific implementation of PostImage.
 *
 * Uses native HTML <img> instead of React Native's <Image> component because:
 * - Expo Router uses SSR where RN <Image> doesn't hydrate reliably
 * - HTML <img> fires load/error events consistently across all browsers
 * - objectFit: 'cover' gives reliable image scaling without RN style quirks
 *
 * Metro resolves this file for web builds via the .web.tsx extension.
 * The native counterpart (PostImage.tsx) uses React Native's <Image>.
 */
export function PostImage({
  photos,
  uri,
  height = 180,
  borderRadius = 0,
  fallbackSize = 56,
  style,
}: PostImageProps) {
  const { colors } = useTheme();

  // Filter out empty/whitespace-only URLs
  const rawUrl = uri || (photos && photos.length > 0 ? photos[0] : null);
  const imageUrl = rawUrl && rawUrl.trim().length > 0 ? rawUrl.trim() : null;

  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  // Reset state when URL changes (e.g. data arrives after mount)
  const prevUrl = useRef(imageUrl);
  if (imageUrl !== prevUrl.current) {
    prevUrl.current = imageUrl;
    setLoaded(false);
    setErrored(false);
  }

  const containerStyle = [
    styles.container,
    { height, borderRadius, backgroundColor: colors.surfaceContainerHigh },
    style,
  ];

  // No image or failed → emoji fallback
  if (!imageUrl || errored) {
    return (
      <View style={containerStyle}>
        <Text style={{ fontSize: fallbackSize }}>🍽️</Text>
      </View>
    );
  }

  return (
    <View style={containerStyle}>
      <img
        src={imageUrl}
        alt=""
        onLoad={() => setLoaded(true)}
        onError={() => setErrored(true)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          borderRadius,
          display: 'block',
        }}
      />
      {!loaded && !errored && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      )}
    </View>
  );
}

/**
 * Web-specific avatar image component.
 * Uses native HTML <img> for the same SSR reliability reasons as PostImage.
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
});

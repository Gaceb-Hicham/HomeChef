import React, { useState, useRef } from 'react';
import { View, Image, Text, StyleSheet, ActivityIndicator } from 'react-native';
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
 * Native (iOS/Android) implementation of PostImage.
 * Uses React Native's <Image> component with proper load/error handling.
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
}: PostImageProps) {
  const { colors } = useTheme();

  const rawUrl = uri || (photos && photos.length > 0 ? photos[0] : null);
  const imageUrl = rawUrl && rawUrl.trim().length > 0 ? rawUrl.trim() : null;

  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

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

  if (!imageUrl || errored) {
    return (
      <View style={containerStyle}>
        <Text style={{ fontSize: fallbackSize }}>🍽️</Text>
      </View>
    );
  }

  return (
    <View style={containerStyle}>
      <Image
        source={{ uri: imageUrl }}
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
    </View>
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
});

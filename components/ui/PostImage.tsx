import React, { useState } from 'react';
import { View, Image, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

interface PostImageProps {
  /** Array of photo URLs from Supabase Storage */
  photos?: string[] | null;
  /** Single photo URL override */
  uri?: string | null;
  /** Height of the image container */
  height?: number;
  /** Border radius */
  borderRadius?: number;
  /** Emoji fallback size */
  fallbackSize?: number;
  /** Style overrides */
  style?: any;
}

/**
 * Reusable image component for food posts.
 * - If `photos` array has items or `uri` is provided, renders an actual <Image>
 * - Otherwise renders an emoji placeholder with a themed background
 * - Shows a loading shimmer while the image loads
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
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Determine the image URL to use
  const imageUrl = uri || (photos && photos.length > 0 ? photos[0] : null);

  if (!imageUrl || hasError) {
    return (
      <View
        style={[
          styles.container,
          { height, borderRadius, backgroundColor: colors.surfaceContainerHigh },
          style,
        ]}
      >
        <Text style={{ fontSize: fallbackSize }}>🍽️</Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        { height, borderRadius, backgroundColor: colors.surfaceContainerHigh },
        style,
      ]}
    >
      <Image
        source={{ uri: imageUrl }}
        style={[styles.image, { borderRadius }]}
        resizeMode="cover"
        onLoadStart={() => setIsLoading(true)}
        onLoadEnd={() => setIsLoading(false)}
        onError={() => {
          setHasError(true);
          setIsLoading(false);
        }}
      />
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      )}
    </View>
  );
}

/**
 * Small avatar image for chefs/users.
 * Shows profile photo if available, emoji fallback otherwise.
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

  if (!uri || hasError) {
    return (
      <View
        style={[
          styles.avatar,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: colors.surfaceContainerHigh,
          },
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
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.surfaceContainerHigh,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Image
        source={{ uri }}
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
  },
  image: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

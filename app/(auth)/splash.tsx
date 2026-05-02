import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { useTheme } from '@/hooks/useTheme';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

export default function SplashScreen() {
  const router = useRouter();
  const { session, isLoading } = useAuthStore();
  const { colors } = useTheme();

  const logoScale = useRef(new Animated.Value(0.3)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const bgGlow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Logo animation sequence
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 6,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(taglineOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(bgGlow, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    // Navigate after 2.5 seconds
    const timer = setTimeout(async () => {
      if (isLoading) return; // Wait for auth to resolve

      const hasSeenOnboarding = await AsyncStorage.getItem('hasSeenOnboarding');

      if (session) {
        const profile = useAuthStore.getState().profile;
        if (profile?.role === 'chef') {
          router.replace('/(chef)/(tabs)/dashboard');
        } else {
          router.replace('/(customer)/(tabs)/home');
        }
      } else if (hasSeenOnboarding) {
        router.replace('/(auth)/login');
      } else {
        router.replace('/(auth)/onboarding');
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, [isLoading, session]);

  return (
    <View style={[styles.container, { backgroundColor: colors.primary }]}>
      {/* Background pattern */}
      <Animated.View
        style={[
          styles.glowCircle,
          {
            opacity: bgGlow.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.15],
            }),
            backgroundColor: colors.primaryFixedDim,
          },
        ]}
      />

      {/* Logo */}
      <Animated.View
        style={[
          styles.logoContainer,
          {
            transform: [{ scale: logoScale }],
            opacity: logoOpacity,
          },
        ]}
      >
        <View style={styles.logoIcon}>
          <Text style={styles.logoEmoji}>👨‍🍳</Text>
        </View>
        <Text style={[styles.logoText, { color: colors.onPrimary }]}>HomeChef</Text>
      </Animated.View>

      {/* Tagline */}
      <Animated.View style={{ opacity: taglineOpacity }}>
        <Text style={[styles.tagline, { color: colors.primaryFixedDim }]}>
          Homemade food, made with love
        </Text>
      </Animated.View>

      {/* Bottom decoration */}
      <Animated.View
        style={[
          styles.bottomDecoration,
          {
            opacity: taglineOpacity,
          },
        ]}
      >
        <View style={[styles.decorDot, { backgroundColor: colors.primaryFixedDim }]} />
        <View style={[styles.decorLine, { backgroundColor: colors.primaryFixedDim }]} />
        <View style={[styles.decorDot, { backgroundColor: colors.primaryFixedDim }]} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowCircle: {
    position: 'absolute',
    width: width * 1.5,
    height: width * 1.5,
    borderRadius: width * 0.75,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  logoIcon: {
    width: 100,
    height: 100,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  logoEmoji: {
    fontSize: 52,
  },
  logoText: {
    fontFamily: 'NotoSerif-Bold',
    fontSize: 42,
    fontWeight: '700',
    letterSpacing: -1,
  },
  tagline: {
    fontFamily: 'PlusJakartaSans-Regular',
    fontSize: 16,
    opacity: 0.85,
    marginTop: 4,
  },
  bottomDecoration: {
    position: 'absolute',
    bottom: 60,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  decorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    opacity: 0.4,
  },
  decorLine: {
    width: 32,
    height: 2,
    borderRadius: 1,
    opacity: 0.3,
  },
});

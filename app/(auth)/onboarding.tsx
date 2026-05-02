import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/components/ui';

const { width, height } = Dimensions.get('window');

const slides = [
  {
    id: '1',
    emoji: '🍽️',
    title: 'Discover Local\nHome Chefs',
    description:
      'Find talented home cooks in your neighborhood. Browse their daily specials, fresh dishes, and artisan desserts — all made with love.',
    accent: '#D97706',
  },
  {
    id: '2',
    emoji: '📦',
    title: 'Order Fresh,\nDelivered Fast',
    description:
      'Place your order before the deadline, choose delivery or pickup, and enjoy homemade food prepared just for you. It\'s that simple.',
    accent: '#9A3412',
  },
  {
    id: '3',
    emoji: '💰',
    title: 'Cook & Earn\nFrom Home',
    description:
      'Turn your kitchen into a business. Post your daily specials, build a following, and earn money doing what you love — cooking.',
    accent: '#78350F',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { colors, spacing, rounded } = useTheme();
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleSkip = async () => {
    await AsyncStorage.setItem('hasSeenOnboarding', 'true');
    router.replace('/(auth)/role-selection');
  };

  const handleNext = async () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      await AsyncStorage.setItem('hasSeenOnboarding', 'true');
      router.replace('/(auth)/role-selection');
    }
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index || 0);
    }
  }).current;

  const renderSlide = ({ item, index }: { item: typeof slides[0]; index: number }) => (
    <View style={[styles.slide, { width }]}>
      {/* Illustration area */}
      <View style={[styles.illustrationContainer, { backgroundColor: colors.surfaceContainerLow }]}>
        <View
          style={[
            styles.emojiCircle,
            { backgroundColor: `${item.accent}15`, borderColor: `${item.accent}30` },
          ]}
        >
          <Text style={styles.emoji}>{item.emoji}</Text>
        </View>

        {/* Decorative elements */}
        <View style={[styles.floatingDot, styles.dot1, { backgroundColor: item.accent, opacity: 0.2 }]} />
        <View style={[styles.floatingDot, styles.dot2, { backgroundColor: item.accent, opacity: 0.15 }]} />
        <View style={[styles.floatingDot, styles.dot3, { backgroundColor: item.accent, opacity: 0.1 }]} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.onBackground }]}>{item.title}</Text>
        <Text style={[styles.description, { color: colors.onSurfaceVariant }]}>
          {item.description}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Skip button */}
      <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
        <Text style={[styles.skipText, { color: colors.primary }]}>Skip</Text>
      </TouchableOpacity>

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
      />

      {/* Bottom section */}
      <View style={[styles.bottomSection, { paddingHorizontal: spacing.xl }]}>
        {/* Dots */}
        <View style={styles.dotsContainer}>
          {slides.map((_, index) => {
            const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
            const dotWidth = scrollX.interpolate({
              inputRange,
              outputRange: [8, 28, 8],
              extrapolate: 'clamp',
            });
            const dotOpacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.3, 1, 0.3],
              extrapolate: 'clamp',
            });
            return (
              <Animated.View
                key={index}
                style={[
                  styles.dot,
                  {
                    width: dotWidth,
                    opacity: dotOpacity,
                    backgroundColor: colors.primary,
                  },
                ]}
              />
            );
          })}
        </View>

        {/* CTA Button */}
        <Button
          title={currentIndex === slides.length - 1 ? 'Get Started' : 'Continue'}
          onPress={handleNext}
          size="lg"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  skipButton: {
    position: 'absolute',
    top: 60,
    right: 24,
    zIndex: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  skipText: {
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontSize: 15,
    fontWeight: '600',
  },
  slide: {
    flex: 1,
  },
  illustrationContainer: {
    flex: 0.55,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    overflow: 'hidden',
  },
  emojiCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 72,
  },
  floatingDot: {
    position: 'absolute',
    borderRadius: 50,
  },
  dot1: { width: 24, height: 24, top: '20%', left: '15%' },
  dot2: { width: 16, height: 16, top: '35%', right: '12%' },
  dot3: { width: 12, height: 12, bottom: '25%', left: '25%' },
  content: {
    flex: 0.45,
    paddingHorizontal: 32,
    paddingTop: 40,
  },
  title: {
    fontFamily: 'NotoSerif-Bold',
    fontSize: 34,
    fontWeight: '700',
    lineHeight: 42,
    letterSpacing: -0.5,
    marginBottom: 16,
  },
  description: {
    fontFamily: 'PlusJakartaSans-Regular',
    fontSize: 16,
    lineHeight: 26,
  },
  bottomSection: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 28,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
});

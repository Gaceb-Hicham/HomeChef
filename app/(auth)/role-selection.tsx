import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/stores/authStore';
import { Button, ScreenWrapper } from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

type Role = 'customer' | 'chef';

const roles = [
  {
    id: 'customer' as Role,
    emoji: '🛒',
    title: 'I want to eat',
    subtitle: 'Browse & order homemade food',
    features: [
      'Discover local home chefs',
      'Order fresh daily specials',
      'Track your delivery live',
      'Save your favorite dishes',
    ],
  },
  {
    id: 'chef' as Role,
    emoji: '👨‍🍳',
    title: 'I want to cook',
    subtitle: 'Sell your homemade creations',
    features: [
      'Post daily specials',
      'Manage orders easily',
      'Track your earnings',
      'Build your food brand',
    ],
  },
];

export default function RoleSelectionScreen() {
  const router = useRouter();
  const { colors, spacing, rounded, shadows } = useTheme();
  const { setSelectedRole } = useAuthStore();
  const [selected, setSelected] = useState<Role | null>(null);

  const handleContinue = () => {
    if (!selected) return;
    setSelectedRole(selected);
    router.push('/(auth)/signup');
  };

  return (
    <ScreenWrapper>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.onBackground }]}>Join HomeChef</Text>
        <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
          How would you like to use HomeChef?
        </Text>
      </View>

      <View style={styles.cardsContainer}>
        {roles.map((role) => {
          const isSelected = selected === role.id;
          return (
            <TouchableOpacity
              key={role.id}
              activeOpacity={0.8}
              onPress={() => setSelected(role.id)}
              style={[
                styles.roleCard,
                {
                  backgroundColor: isSelected ? colors.primaryFixed : colors.surfaceContainerLow,
                  borderColor: isSelected ? colors.primary : colors.outlineVariant,
                  borderWidth: isSelected ? 2 : 1,
                  ...shadows.md,
                },
              ]}
            >
              {/* Selection indicator */}
              <View
                style={[
                  styles.radioOuter,
                  {
                    borderColor: isSelected ? colors.primary : colors.outline,
                  },
                ]}
              >
                {isSelected && (
                  <View
                    style={[styles.radioInner, { backgroundColor: colors.primary }]}
                  />
                )}
              </View>

              <Text style={styles.roleEmoji}>{role.emoji}</Text>
              <Text style={[styles.roleTitle, { color: colors.onSurface }]}>{role.title}</Text>
              <Text style={[styles.roleSubtitle, { color: colors.onSurfaceVariant }]}>
                {role.subtitle}
              </Text>

              <View style={styles.featuresList}>
                {role.features.map((feature, idx) => (
                  <View key={idx} style={styles.featureRow}>
                    <Ionicons
                      name="checkmark-circle"
                      size={18}
                      color={isSelected ? colors.primary : colors.outline}
                    />
                    <Text style={[styles.featureText, { color: colors.onSurfaceVariant }]}>
                      {feature}
                    </Text>
                  </View>
                ))}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.bottomSection}>
        <Button
          title="Continue"
          onPress={handleContinue}
          disabled={!selected}
          size="lg"
        />

        <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
          <Text style={[styles.loginLink, { color: colors.onSurfaceVariant }]}>
            Already have an account?{' '}
            <Text style={{ color: colors.primary, fontWeight: '600' }}>Log in</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    marginTop: 20,
    marginBottom: 28,
  },
  title: {
    fontFamily: 'NotoSerif-Bold',
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'PlusJakartaSans-Regular',
    fontSize: 16,
    lineHeight: 24,
  },
  cardsContainer: {
    flex: 1,
    gap: 16,
  },
  roleCard: {
    borderRadius: 20,
    padding: 24,
    position: 'relative',
  },
  radioOuter: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  roleEmoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  roleTitle: {
    fontFamily: 'NotoSerif-Bold',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  roleSubtitle: {
    fontFamily: 'PlusJakartaSans-Regular',
    fontSize: 14,
    marginBottom: 16,
  },
  featuresList: {
    gap: 8,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureText: {
    fontFamily: 'PlusJakartaSans-Regular',
    fontSize: 13,
  },
  bottomSection: {
    paddingVertical: 24,
    gap: 16,
    alignItems: 'center',
  },
  loginLink: {
    fontFamily: 'PlusJakartaSans-Regular',
    fontSize: 14,
  },
});

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { ScreenWrapper } from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';

const FAQ = [
  { q: 'How do I place an order?', a: 'Browse today\'s specials on the home screen, tap a dish, select quantity, and add to cart. Then checkout with your preferred payment method.' },
  { q: 'Can I cancel an order?', a: 'You can cancel within 5 minutes of placing. After that, contact the chef directly via chat or phone.' },
  { q: 'How does delivery work?', a: 'Chefs handle their own delivery within their delivery radius. You can also choose pickup to collect from the chef\'s kitchen.' },
  { q: 'Is there a minimum order?', a: 'No minimum order required. Each dish has its own price set by the chef.' },
  { q: 'How do promo codes work?', a: 'Enter a promo code at checkout. Available codes: HOMECHEF10 (10% off), WELCOME50 (50 DA off), FREEDEL (free delivery).' },
  { q: 'How do I become a chef?', a: 'Register with a chef account, complete kitchen onboarding, and start posting your daily specials!' },
];

export default function AboutScreen() {
  const router = useRouter();
  const { colors, shadows } = useTheme();

  return (
    <ScreenWrapper>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.onSurface} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.onBackground }]}>Help & About</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* App Info */}
        <View style={[styles.card, { backgroundColor: colors.primaryFixed }]}>
          <Text style={{ fontSize: 48, marginBottom: 8 }}>👨‍🍳</Text>
          <Text style={{ fontFamily: 'NotoSerif-Bold', fontSize: 24, fontWeight: '700', color: colors.primary }}>HomeChef</Text>
          <Text style={{ color: colors.onSurfaceVariant, fontSize: 13, marginTop: 4 }}>Version 1.0.0</Text>
          <Text style={{ color: colors.onSurfaceVariant, fontSize: 14, marginTop: 12, textAlign: 'center', lineHeight: 22 }}>
            Connecting home chefs with food lovers in Algeria. Fresh, homemade meals delivered to your door.
          </Text>
        </View>

        {/* FAQ */}
        <Text style={[styles.sectionTitle, { color: colors.onBackground }]}>❓ Frequently Asked Questions</Text>
        {FAQ.map((item, i) => (
          <View key={i} style={[styles.faqCard, { backgroundColor: colors.surfaceContainerLowest, ...shadows.sm }]}>
            <Text style={{ color: colors.onSurface, fontWeight: '600', fontSize: 14, marginBottom: 6 }}>{item.q}</Text>
            <Text style={{ color: colors.onSurfaceVariant, fontSize: 13, lineHeight: 20 }}>{item.a}</Text>
          </View>
        ))}

        {/* Contact */}
        <Text style={[styles.sectionTitle, { color: colors.onBackground }]}>📞 Contact Us</Text>
        <View style={[styles.card, { backgroundColor: colors.surfaceContainerLowest, ...shadows.sm }]}>
          {[
            { icon: 'mail-outline', label: 'support@homechef.dz', action: () => Linking.openURL('mailto:support@homechef.dz') },
            { icon: 'call-outline', label: '+213 555 123 456', action: () => Linking.openURL('tel:+213555123456') },
            { icon: 'logo-instagram', label: '@homechef.dz', action: () => Linking.openURL('https://instagram.com/homechef.dz') },
          ].map((c) => (
            <TouchableOpacity key={c.label} onPress={c.action} style={styles.contactRow}>
              <Ionicons name={c.icon as any} size={20} color={colors.primary} />
              <Text style={{ color: colors.onSurface, fontSize: 14, marginLeft: 12 }}>{c.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Legal */}
        <Text style={[styles.sectionTitle, { color: colors.onBackground }]}>📜 Legal</Text>
        <View style={[styles.card, { backgroundColor: colors.surfaceContainerLowest, ...shadows.sm }]}>
          {[
            { label: 'Terms of Service', icon: 'document-text-outline' },
            { label: 'Privacy Policy', icon: 'shield-checkmark-outline' },
            { label: 'Cookie Policy', icon: 'information-circle-outline' },
          ].map((item) => (
            <TouchableOpacity key={item.label} style={styles.legalRow}>
              <Ionicons name={item.icon as any} size={20} color={colors.onSurfaceVariant} />
              <Text style={{ color: colors.onSurface, fontSize: 14, flex: 1, marginLeft: 12 }}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.outline} />
            </TouchableOpacity>
          ))}
        </View>

        <Text style={{ color: colors.outline, fontSize: 11, textAlign: 'center', marginTop: 20, marginBottom: 24 }}>
          © 2026 HomeChef. Made with ❤️ in Algeria.
        </Text>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, marginTop: 8 },
  title: { fontFamily: 'NotoSerif-Bold', fontSize: 22, fontWeight: '700' },
  card: { borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 20 },
  sectionTitle: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 17, fontWeight: '600', marginBottom: 12 },
  faqCard: { borderRadius: 14, padding: 16, marginBottom: 10 },
  contactRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, width: '100%' },
  legalRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, width: '100%' },
});

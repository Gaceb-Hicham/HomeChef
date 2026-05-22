import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { ScreenWrapper, Button, Input } from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';
import { useToast } from '@/components/ui/Toast';

const FAQ_ITEMS = [
  { q: 'How do I place an order?', a: 'Browse the home feed, tap on a dish you like, select quantity, and add it to your cart. Then proceed to checkout to complete your order.' },
  { q: 'How does delivery work?', a: 'Home chefs offer delivery within their specified radius. Delivery fees are calculated based on distance. You can also choose pickup at the chef\'s location.' },
  { q: 'Can I cancel an order?', a: 'You can cancel an order before the chef starts preparing it. Go to My Orders, tap on the order, and select Cancel. Refunds are processed within 3-5 business days.' },
  { q: 'What is a Prep Request?', a: 'A Prep Request lets you ask a chef to prepare a specific dish from their menu for a future date. The chef can accept, reject, or send a counter-offer.' },
  { q: 'How do Pre-Orders work?', a: 'Pre-orders let you order from a chef\'s specialty catalog for a future date. Perfect for events, birthdays, and gatherings.' },
  { q: 'How do I become a Home Chef?', a: 'Switch to Chef mode during registration or in your profile settings. Complete the onboarding steps: set up your kitchen name, upload photos, and start posting!' },
  { q: 'Is my payment secure?', a: 'Yes! We use Stripe for card payments, which is PCI-compliant. We never store your card details. You can also pay with cash on delivery.' },
  { q: 'How do I leave a review?', a: 'After your order is delivered, go to My Orders > Past, and tap "Leave Review" on the completed order.' },
];

export default function HelpScreen() {
  const router = useRouter();
  const { colors, shadows } = useTheme();
  const { showToast } = useToast();
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [reportText, setReportText] = useState('');
  const [showReport, setShowReport] = useState(false);

  return (
    <ScreenWrapper>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.onSurface} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.onBackground }]}>Help & Support</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Quick Actions */}
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
          <TouchableOpacity style={[styles.quickAction, { backgroundColor: '#dcfce7' }]} onPress={() => setShowReport(false)}>
            <Ionicons name="chatbubbles" size={24} color="#16a34a" />
            <Text style={{ color: '#16a34a', fontWeight: '600', marginTop: 6 }}>Contact Us</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.quickAction, { backgroundColor: '#fef3c7' }]} onPress={() => setShowReport(true)}>
            <Ionicons name="warning" size={24} color="#b45309" />
            <Text style={{ color: '#b45309', fontWeight: '600', marginTop: 6 }}>Report Issue</Text>
          </TouchableOpacity>
        </View>

        {/* Report Form */}
        {showReport && (
          <View style={[styles.reportCard, { backgroundColor: colors.surfaceContainerLowest, ...shadows.sm }]}>
            <Text style={[styles.sectionTitle, { color: colors.onBackground }]}>Report a Problem</Text>
            <Input
              label=""
              placeholder="Describe the issue in detail..."
              value={reportText}
              onChangeText={setReportText}
              multiline
              numberOfLines={4}
              style={{ minHeight: 100, textAlignVertical: 'top' }}
            />
            <Button title="Submit Report" onPress={() => {
              showToast('Report submitted! We\'ll get back to you soon.', 'success');
              setReportText('');
              setShowReport(false);
            }} style={{ marginTop: 14 }} />
          </View>
        )}

        {/* FAQ */}
        <Text style={[styles.sectionTitle, { color: colors.onBackground }]}>Frequently Asked Questions</Text>
        {FAQ_ITEMS.map((item, idx) => (
          <TouchableOpacity
            key={idx}
            style={[styles.faqItem, { backgroundColor: colors.surfaceContainerLowest, borderColor: expandedIdx === idx ? colors.primary : colors.outlineVariant, ...shadows.sm }]}
            onPress={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
            activeOpacity={0.8}
          >
            <View style={styles.faqHeader}>
              <Text style={{ flex: 1, color: colors.onSurface, fontWeight: '600', fontSize: 14 }}>{item.q}</Text>
              <Ionicons name={expandedIdx === idx ? 'chevron-up' : 'chevron-down'} size={18} color={colors.primary} />
            </View>
            {expandedIdx === idx && (
              <Text style={{ color: colors.onSurfaceVariant, fontSize: 13, marginTop: 10, lineHeight: 20 }}>{item.a}</Text>
            )}
          </TouchableOpacity>
        ))}

        <View style={{ height: 30 }} />
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, marginTop: 8 },
  title: { fontFamily: 'NotoSerif-Bold', fontSize: 22, fontWeight: '700' },
  sectionTitle: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 17, fontWeight: '600', marginBottom: 14 },
  quickAction: { flex: 1, padding: 18, borderRadius: 16, alignItems: 'center' },
  reportCard: { padding: 18, borderRadius: 16, marginBottom: 24 },
  faqItem: { padding: 16, borderRadius: 14, marginBottom: 10, borderWidth: 1 },
  faqHeader: { flexDirection: 'row', alignItems: 'center' },
});

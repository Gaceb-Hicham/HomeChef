import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { ScreenWrapper, Button } from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';

export default function OrderConfirmationScreen() {
  const router = useRouter();
  const { colors, shadows } = useTheme();
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const confettiAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 1, friction: 4, tension: 50, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(confettiAnim, { toValue: 1, duration: 800, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    ]).start();
  }, []);

  const orderId = `HC-${Date.now().toString(36).toUpperCase()}`;

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        {/* Animated Success Circle */}
        <Animated.View style={[styles.checkCircle, { transform: [{ scale: scaleAnim }], backgroundColor: '#16a34a', ...shadows.lg }]}>
          <Ionicons name="checkmark" size={56} color="#fff" />
        </Animated.View>

        {/* Confetti dots */}
        {[...Array(8)].map((_, i) => (
          <Animated.View key={i} style={[styles.confettiDot, {
            backgroundColor: ['#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#10b981', '#f97316', '#6366f1', '#14b8a6'][i],
            transform: [
              { translateX: confettiAnim.interpolate({ inputRange: [0, 1], outputRange: [0, Math.cos(i * 0.785) * 80] }) },
              { translateY: confettiAnim.interpolate({ inputRange: [0, 1], outputRange: [0, Math.sin(i * 0.785) * 80 - 40] }) },
              { scale: confettiAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 1.2, 0.8] }) },
            ],
            opacity: confettiAnim.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 1, 0.6] }),
          }]} />
        ))}

        <Animated.View style={{ opacity: fadeAnim, alignItems: 'center', width: '100%' }}>
          <Text style={[styles.title, { color: colors.onBackground }]}>Order Confirmed! 🎉</Text>
          <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
            Your order has been sent to the chef
          </Text>

          {/* Order Number Card */}
          <View style={[styles.orderCard, { backgroundColor: colors.surfaceContainerLowest, ...shadows.sm }]}>
            <Text style={{ color: colors.outline, fontSize: 13, letterSpacing: 1 }}>ORDER NUMBER</Text>
            <Text style={[styles.orderNumber, { color: colors.primary }]}>{orderId}</Text>
          </View>

          {/* Details */}
          <View style={[styles.detailsCard, { backgroundColor: colors.surfaceContainerLowest, ...shadows.sm }]}>
            <View style={styles.detailRow}>
              <View style={[styles.iconCircle, { backgroundColor: '#dcfce7' }]}>
                <Ionicons name="time" size={18} color="#16a34a" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ color: colors.outline, fontSize: 12 }}>Estimated Time</Text>
                <Text style={{ color: colors.onSurface, fontWeight: '700', fontSize: 16 }}>25-35 minutes</Text>
              </View>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.outlineVariant }]} />
            <View style={styles.detailRow}>
              <View style={[styles.iconCircle, { backgroundColor: '#fef3c7' }]}>
                <Ionicons name="receipt" size={18} color="#b45309" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ color: colors.outline, fontSize: 12 }}>Payment</Text>
                <Text style={{ color: colors.onSurface, fontWeight: '700', fontSize: 16 }}>Cash on Delivery</Text>
              </View>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.outlineVariant }]} />
            <View style={styles.detailRow}>
              <View style={[styles.iconCircle, { backgroundColor: '#e0e7ff' }]}>
                <Ionicons name="notifications" size={18} color="#4338ca" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ color: colors.outline, fontSize: 12 }}>Updates</Text>
                <Text style={{ color: colors.onSurface, fontWeight: '700', fontSize: 16 }}>We'll notify you on each step</Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={{ width: '100%', gap: 12, marginTop: 24 }}>
            <Button title="Track My Order" onPress={() => router.push('/(customer)/(tabs)/orders')} size="lg" />
            <Button
              title="Back to Home"
              onPress={() => router.replace('/(customer)/(tabs)/home')}
              variant="outline"
              size="lg"
            />
          </View>
        </Animated.View>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16 },
  checkCircle: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  confettiDot: { position: 'absolute', width: 10, height: 10, borderRadius: 5, top: '30%' },
  title: { fontFamily: 'NotoSerif-Bold', fontSize: 28, fontWeight: '800', marginBottom: 8 },
  subtitle: { fontSize: 16, textAlign: 'center', marginBottom: 28 },
  orderCard: { padding: 20, borderRadius: 16, alignItems: 'center', marginBottom: 20, width: '100%' },
  orderNumber: { fontSize: 28, fontWeight: '800', letterSpacing: 2, marginTop: 6 },
  detailsCard: { padding: 18, borderRadius: 16, width: '100%' },
  detailRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  iconCircle: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  divider: { height: 1, marginVertical: 4 },
});

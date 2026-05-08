import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/stores/authStore';
import { Button, Input, ScreenWrapper } from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';
import { crossAlert, infoAlert } from '@/lib/crossAlert';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { resetPassword } = useAuthStore();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState('');

  const handleSend = async () => {
    if (!email.trim()) { setError('Email is required'); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { setError('Enter a valid email'); return; }
    setError('');
    setIsLoading(true);
    const { error: e } = await resetPassword(email);
    setIsLoading(false);
    if (e) infoAlert('Error', e);
    else setIsSent(true);
  };

  return (
    <ScreenWrapper>
      <TouchableOpacity style={styles.back} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color={colors.onSurface} />
      </TouchableOpacity>
      <View style={styles.center}>
        <View style={[styles.icon, { backgroundColor: colors.primaryFixed }]}>
          <Text style={{ fontSize: 36 }}>{isSent ? '✉️' : '🔑'}</Text>
        </View>
        <Text style={[styles.title, { color: colors.onBackground }]}>
          {isSent ? 'Check your email' : 'Forgot password?'}
        </Text>
        <Text style={[styles.sub, { color: colors.onSurfaceVariant }]}>
          {isSent
            ? `We sent reset instructions to ${email}`
            : 'Enter your email for reset instructions.'}
        </Text>
        {!isSent && (
          <View style={{ width: '100%', marginTop: 24 }}>
            <Input label="Email" placeholder="you@example.com" icon="mail-outline"
              keyboardType="email-address" autoCapitalize="none" value={email}
              onChangeText={(t) => { setEmail(t); setError(''); }} error={error} />
            <Button title="Send Reset Link" onPress={handleSend} loading={isLoading} size="lg" />
          </View>
        )}
        {isSent && (
          <Button title="Back to Login" onPress={() => router.push('/(auth)/login')}
            size="lg" style={{ marginTop: 32 }} />
        )}
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  back: { marginTop: 8, width: 40, height: 40, justifyContent: 'center' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 60 },
  icon: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  title: { fontFamily: 'NotoSerif-Bold', fontSize: 28, fontWeight: '700', marginBottom: 8 },
  sub: { fontFamily: 'PlusJakartaSans-Regular', fontSize: 15, textAlign: 'center', lineHeight: 23 },
});

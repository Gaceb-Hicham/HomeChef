import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/stores/authStore';
import { Button, Input, ScreenWrapper } from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen() {
  const router = useRouter();
  const { colors, spacing, rounded } = useTheme();
  const { signIn, demoLogin } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Enter a valid email';
    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setIsLoading(true);
    const { error } = await signIn(email, password);
    setIsLoading(false);
    if (error) {
      Alert.alert('Login Failed', error);
    } else {
      const profile = useAuthStore.getState().profile;
      if (profile?.role === 'chef') {
        router.replace('/(chef)/(tabs)/dashboard');
      } else {
        router.replace('/(customer)/(tabs)/home');
      }
    }
  };

  return (
    <ScreenWrapper>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.emoji}>👋</Text>
            <Text style={[styles.title, { color: colors.onBackground }]}>Welcome back</Text>
            <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
              Sign in to continue to HomeChef
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Input
              label="Email"
              placeholder="you@example.com"
              icon="mail-outline"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              value={email}
              onChangeText={setEmail}
              error={errors.email}
            />

            <Input
              label="Password"
              placeholder="Enter your password"
              icon="lock-closed-outline"
              isPassword
              autoCapitalize="none"
              value={password}
              onChangeText={setPassword}
              error={errors.password}
            />

            {/* Remember me & Forgot password row */}
            <View style={styles.optionsRow}>
              <TouchableOpacity
                style={styles.rememberRow}
                onPress={() => setRememberMe(!rememberMe)}
              >
                <View
                  style={[
                    styles.checkbox,
                    {
                      backgroundColor: rememberMe ? colors.primary : 'transparent',
                      borderColor: rememberMe ? colors.primary : colors.outline,
                    },
                  ]}
                >
                  {rememberMe && <Ionicons name="checkmark" size={14} color={colors.onPrimary} />}
                </View>
                <Text style={[styles.rememberText, { color: colors.onSurfaceVariant }]}>
                  Remember me
                </Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')}>
                <Text style={[styles.forgotText, { color: colors.primary }]}>Forgot password?</Text>
              </TouchableOpacity>
            </View>

            <Button title="Sign In" onPress={handleLogin} loading={isLoading} size="lg" />
          </View>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={[styles.dividerLine, { backgroundColor: colors.outlineVariant }]} />
            <Text style={[styles.dividerText, { color: colors.outline }]}>or try demo mode</Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.outlineVariant }]} />
          </View>

          {/* Demo Mode Buttons */}
          <View style={styles.demoRow}>
            <TouchableOpacity
              style={[styles.demoButton, { backgroundColor: colors.primaryFixed, borderColor: colors.primary }]}
              onPress={() => {
                demoLogin('customer');
                router.replace('/(customer)/(tabs)/home');
              }}
            >
              <Text style={{ fontSize: 24 }}>🍽️</Text>
              <Text style={[styles.demoTitle, { color: colors.primary }]}>Customer Demo</Text>
              <Text style={[styles.demoSubtitle, { color: colors.onSurfaceVariant }]}>Browse & order food</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.demoButton, { backgroundColor: colors.primaryFixed, borderColor: colors.primary }]}
              onPress={() => {
                demoLogin('chef');
                router.replace('/(chef)/(tabs)/dashboard');
              }}
            >
              <Text style={{ fontSize: 24 }}>👨‍🍳</Text>
              <Text style={[styles.demoTitle, { color: colors.primary }]}>Chef Demo</Text>
              <Text style={[styles.demoSubtitle, { color: colors.onSurfaceVariant }]}>Manage your kitchen</Text>
            </TouchableOpacity>
          </View>

          {/* Sign up link */}
          <View style={styles.signupRow}>
            <Text style={[styles.signupText, { color: colors.onSurfaceVariant }]}>
              Don't have an account?{' '}
            </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/role-selection')}>
              <Text style={[styles.signupLink, { color: colors.primary }]}>Sign up</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 20,
  },
  header: {
    marginBottom: 36,
  },
  emoji: {
    fontSize: 44,
    marginBottom: 16,
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
  form: {
    marginBottom: 24,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: -4,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rememberText: {
    fontFamily: 'PlusJakartaSans-Regular',
    fontSize: 13,
  },
  forgotText: {
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontSize: 13,
    fontWeight: '600',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontFamily: 'PlusJakartaSans-Regular',
    fontSize: 13,
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 32,
  },
  socialButton: {
    width: 60,
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signupText: {
    fontFamily: 'PlusJakartaSans-Regular',
    fontSize: 14,
  },
  signupLink: {
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontSize: 14,
    fontWeight: '600',
  },
  demoRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  demoButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 16,
    borderWidth: 1.5,
    gap: 4,
  },
  demoTitle: {
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontSize: 14,
    fontWeight: '600',
  },
  demoSubtitle: {
    fontFamily: 'PlusJakartaSans-Regular',
    fontSize: 11,
  },
});

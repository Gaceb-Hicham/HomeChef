import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/stores/authStore';
import { Button, Input, ScreenWrapper } from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';
import { crossAlert, infoAlert } from '@/lib/crossAlert';

export default function SignUpScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { signUp, selectedRole } = useAuthStore();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!fullName.trim()) e.fullName = 'Full name is required';
    if (!email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Enter a valid email';
    if (!phone.trim()) e.phone = 'Phone number is required';
    else if (phone.length < 8) e.phone = 'Enter a valid phone number';
    if (!password) e.password = 'Password is required';
    else if (password.length < 8) e.password = 'Password must be at least 8 characters';
    else if (!/(?=.*[A-Z])(?=.*[0-9])/.test(password))
      e.password = 'Must include uppercase letter and number';
    if (password !== confirmPassword) e.confirmPassword = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSignUp = async () => {
    if (!validate()) return;
    setIsLoading(true);
    const { error } = await signUp(email, password, fullName, phone, selectedRole || 'customer');
    setIsLoading(false);
    if (error) {
      infoAlert('Sign Up Failed', error);
    } else {
      router.push({ pathname: '/(auth)/otp', params: { email, phone } });
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
          {/* Back button */}
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.onSurface} />
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.onBackground }]}>Create account</Text>
            <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
              {selectedRole === 'chef'
                ? 'Set up your chef account to start cooking'
                : 'Join HomeChef to discover amazing food'}
            </Text>
          </View>

          {/* Role badge */}
          <View style={[styles.roleBadge, { backgroundColor: colors.primaryFixed }]}>
            <Text style={styles.roleBadgeEmoji}>{selectedRole === 'chef' ? '👨‍🍳' : '🛒'}</Text>
            <Text style={[styles.roleBadgeText, { color: colors.primary }]}>
              Signing up as {selectedRole === 'chef' ? 'Home Chef' : 'Customer'}
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Input
              label="Full Name"
              placeholder="Enter your full name"
              icon="person-outline"
              autoCapitalize="words"
              autoComplete="name"
              value={fullName}
              onChangeText={setFullName}
              error={errors.fullName}
            />

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
              label="Phone Number"
              placeholder="+1 234 567 8900"
              icon="call-outline"
              keyboardType="phone-pad"
              autoComplete="tel"
              value={phone}
              onChangeText={setPhone}
              error={errors.phone}
            />

            <Input
              label="Password"
              placeholder="Create a strong password"
              icon="lock-closed-outline"
              isPassword
              autoCapitalize="none"
              value={password}
              onChangeText={setPassword}
              error={errors.password}
              hint="At least 8 characters, 1 uppercase, 1 number"
            />

            <Input
              label="Confirm Password"
              placeholder="Re-enter your password"
              icon="lock-closed-outline"
              isPassword
              autoCapitalize="none"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              error={errors.confirmPassword}
            />

            <Button title="Create Account" onPress={handleSignUp} loading={isLoading} size="lg" />
          </View>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={[styles.dividerLine, { backgroundColor: colors.outlineVariant }]} />
            <Text style={[styles.dividerText, { color: colors.outline }]}>or sign up with</Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.outlineVariant }]} />
          </View>

          {/* Social */}
          <View style={styles.socialRow}>
            <TouchableOpacity
              style={[styles.socialButton, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.outlineVariant }]}
              onPress={() => infoAlert('Google Sign Up', 'Google authentication will be available soon. Please use email sign up for now.')}
            >
              <Ionicons name="logo-google" size={22} color={colors.onSurface} />
              <Text style={[styles.socialText, { color: colors.onSurface }]}>Google</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.socialButton, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.outlineVariant }]}
              onPress={() => infoAlert('Apple Sign Up', 'Apple authentication will be available soon. Please use email sign up for now.')}
            >
              <Ionicons name="logo-apple" size={22} color={colors.onSurface} />
              <Text style={[styles.socialText, { color: colors.onSurface }]}>Apple</Text>
            </TouchableOpacity>
          </View>

          {/* Login link */}
          <View style={styles.loginRow}>
            <Text style={[styles.loginText, { color: colors.onSurfaceVariant }]}>
              Already have an account?{' '}
            </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
              <Text style={[styles.loginLink, { color: colors.primary }]}>Log in</Text>
            </TouchableOpacity>
          </View>

          {/* Terms */}
          <Text style={[styles.terms, { color: colors.outline }]}>
            By creating an account, you agree to our{' '}
            <Text style={{ color: colors.primary }}>Terms of Service</Text> and{' '}
            <Text style={{ color: colors.primary }}>Privacy Policy</Text>.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 32,
  },
  backButton: {
    marginTop: 8,
    marginBottom: 16,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontFamily: 'NotoSerif-Bold',
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'PlusJakartaSans-Regular',
    fontSize: 15,
    lineHeight: 23,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
    marginBottom: 24,
  },
  roleBadgeEmoji: {
    fontSize: 18,
  },
  roleBadgeText: {
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontSize: 13,
    fontWeight: '600',
  },
  form: {
    marginBottom: 20,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
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
    gap: 12,
    marginBottom: 24,
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  socialText: {
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontSize: 14,
    fontWeight: '600',
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  loginText: {
    fontFamily: 'PlusJakartaSans-Regular',
    fontSize: 14,
  },
  loginLink: {
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontSize: 14,
    fontWeight: '600',
  },
  terms: {
    fontFamily: 'PlusJakartaSans-Regular',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});

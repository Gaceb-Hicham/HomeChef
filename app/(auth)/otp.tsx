import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Keyboard,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/stores/authStore';
import { Button, ScreenWrapper } from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';
import { crossAlert, infoAlert } from '@/lib/crossAlert';

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60;
const MAX_RESEND = 3;

export default function OTPScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string; phone?: string }>();
  const { colors, rounded } = useTheme();

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [isLoading, setIsLoading] = useState(false);
  const [timer, setTimer] = useState(RESEND_COOLDOWN);
  const [resendCount, setResendCount] = useState(0);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  // Countdown timer
  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const handleChange = (text: string, index: number) => {
    if (text.length > 1) {
      // Handle paste
      const chars = text.slice(0, OTP_LENGTH).split('');
      const newOtp = [...otp];
      chars.forEach((char, i) => {
        if (index + i < OTP_LENGTH) newOtp[index + i] = char;
      });
      setOtp(newOtp);
      const nextIndex = Math.min(index + chars.length, OTP_LENGTH - 1);
      inputRefs.current[nextIndex]?.focus();

      if (newOtp.every((d) => d !== '')) {
        handleVerify(newOtp.join(''));
      }
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    // Auto-advance
    if (text && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all filled
    if (text && index === OTP_LENGTH - 1 && newOtp.every((d) => d !== '')) {
      handleVerify(newOtp.join(''));
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
      const newOtp = [...otp];
      newOtp[index - 1] = '';
      setOtp(newOtp);
    }
  };

  const handleVerify = async (code: string) => {
    Keyboard.dismiss();
    setIsLoading(true);
    const email = params.email;
    if (!email) {
      // If no email provided, just navigate (demo flow)
      setIsLoading(false);
      router.replace('/(auth)/location');
      return;
    }
    const { error } = await useAuthStore.getState().verifyOtp(email, code);
    setIsLoading(false);
    if (error) {
      infoAlert('Verification Failed', error);
      setOtp(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } else {
      router.replace('/(auth)/location');
    }
  };

  const handleResend = () => {
    if (resendCount >= MAX_RESEND) {
      infoAlert('Limit Reached', 'You have exceeded the maximum resend attempts. Please try again later.');
      return;
    }
    setTimer(RESEND_COOLDOWN);
    setResendCount((c) => c + 1);
    setOtp(Array(OTP_LENGTH).fill(''));
    inputRefs.current[0]?.focus();
  };

  const maskedContact = params.phone
    ? `****${params.phone.slice(-4)}`
    : params.email
    ? `${params.email.slice(0, 3)}***@${params.email.split('@')[1]}`
    : '';

  return (
    <ScreenWrapper>
      {/* Back */}
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color={colors.onSurface} />
      </TouchableOpacity>

      <View style={styles.content}>
        {/* Icon */}
        <View style={[styles.iconCircle, { backgroundColor: colors.primaryFixed }]}>
          <Text style={styles.iconEmoji}>🔐</Text>
        </View>

        <Text style={[styles.title, { color: colors.onBackground }]}>Verification Code</Text>
        <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
          We sent a 6-digit code to{'\n'}
          <Text style={{ fontWeight: '600', color: colors.onSurface }}>{maskedContact}</Text>
        </Text>

        {/* OTP Boxes */}
        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => (inputRefs.current[index] = ref)}
              style={[
                styles.otpBox,
                {
                  backgroundColor: digit
                    ? colors.primaryFixed
                    : colors.surfaceContainerLow,
                  borderColor: digit ? colors.primary : colors.outlineVariant,
                  color: colors.onSurface,
                },
              ]}
              value={digit}
              onChangeText={(text) => handleChange(text, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              keyboardType="number-pad"
              maxLength={index === 0 ? OTP_LENGTH : 1}
              selectTextOnFocus
              autoFocus={index === 0}
            />
          ))}
        </View>

        {/* Verify button */}
        <Button
          title="Verify"
          onPress={() => handleVerify(otp.join(''))}
          loading={isLoading}
          disabled={otp.some((d) => !d)}
          size="lg"
        />

        {/* Resend */}
        <View style={styles.resendRow}>
          {timer > 0 ? (
            <Text style={[styles.resendText, { color: colors.onSurfaceVariant }]}>
              Resend code in{' '}
              <Text style={{ color: colors.primary, fontWeight: '600' }}>
                {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
              </Text>
            </Text>
          ) : (
            <TouchableOpacity onPress={handleResend}>
              <Text style={[styles.resendLink, { color: colors.primary }]}>
                Resend Code{' '}
                <Text style={{ color: colors.outline, fontSize: 12 }}>
                  ({MAX_RESEND - resendCount} left)
                </Text>
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  backButton: {
    marginTop: 8,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 60,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  iconEmoji: {
    fontSize: 36,
  },
  title: {
    fontFamily: 'NotoSerif-Bold',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'PlusJakartaSans-Regular',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 23,
    marginBottom: 32,
  },
  otpContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 32,
  },
  otpBox: {
    width: 48,
    height: 56,
    borderRadius: 12,
    borderWidth: 1.5,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
    fontFamily: 'PlusJakartaSans-Bold',
  },
  resendRow: {
    marginTop: 24,
    alignItems: 'center',
  },
  resendText: {
    fontFamily: 'PlusJakartaSans-Regular',
    fontSize: 14,
  },
  resendLink: {
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontSize: 14,
    fontWeight: '600',
  },
});

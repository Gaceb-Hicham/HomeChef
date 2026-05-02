import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { Button, Input, ScreenWrapper } from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';

export default function ChefOnboardingScreen() {
  const router = useRouter();
  const { colors, shadows } = useTheme();
  const [kitchenName, setKitchenName] = useState('');
  const [bio, setBio] = useState('');
  const [specialties, setSpecialties] = useState('');
  const [radius, setRadius] = useState('5');
  const [isLoading, setIsLoading] = useState(false);

  const handleSetup = () => {
    if (!kitchenName.trim()) return;
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      router.replace('/(chef)/(tabs)/dashboard');
    }, 1500);
  };

  return (
    <ScreenWrapper>
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={{ fontSize: 48 }}>👨‍🍳</Text>
          <Text style={[styles.title, { color: colors.onBackground }]}>Setup Your Kitchen</Text>
          <Text style={[styles.sub, { color: colors.onSurfaceVariant }]}>
            Tell us about your kitchen so customers can find you
          </Text>
        </View>

        {/* Cover photo */}
        <TouchableOpacity style={[styles.coverArea, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.outlineVariant }]}>
          <Ionicons name="image-outline" size={28} color={colors.outline} />
          <Text style={{ color: colors.outline, marginTop: 6, fontSize: 13 }}>Add Cover Photo</Text>
        </TouchableOpacity>

        <Input label="Kitchen Name *" placeholder="e.g. Mama's Kitchen" value={kitchenName}
          onChangeText={setKitchenName} icon="storefront-outline" />
        <Input label="Bio" placeholder="Tell customers about yourself..."
          value={bio} onChangeText={setBio} multiline numberOfLines={3}
          style={{ minHeight: 70, textAlignVertical: 'top' }} />
        <Input label="Specialties" placeholder="e.g. Couscous, Baklava, Tajine"
          value={specialties} onChangeText={setSpecialties} icon="restaurant-outline"
          hint="Comma-separated list" />
        <Input label="Delivery Radius (km)" placeholder="5" value={radius}
          onChangeText={setRadius} keyboardType="numeric" icon="navigate-outline" />

        <Button title="Launch My Kitchen 🚀" onPress={handleSetup} loading={isLoading} size="lg" />
        <View style={{ height: 32 }} />
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', paddingVertical: 24 },
  title: { fontFamily: 'NotoSerif-Bold', fontSize: 28, fontWeight: '700', marginTop: 12, marginBottom: 8 },
  sub: { fontFamily: 'PlusJakartaSans-Regular', fontSize: 15, textAlign: 'center', lineHeight: 23 },
  coverArea: { height: 120, borderRadius: 16, borderWidth: 2, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
});

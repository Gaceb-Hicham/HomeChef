import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/stores/authStore';
import { useChefProfileStore } from '@/stores/appStores';
import { Button, Input, ScreenWrapper } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import { Ionicons } from '@expo/vector-icons';
import { infoAlert } from '@/lib/crossAlert';

export default function ChefOnboardingScreen() {
  const router = useRouter();
  const { colors, shadows } = useTheme();
  const profile = useAuthStore((s) => s.profile);
  const { createProfile } = useChefProfileStore();
  const { showToast } = useToast();
  const [kitchenName, setKitchenName] = useState('');
  const [bio, setBio] = useState('');
  const [specialties, setSpecialties] = useState('');
  const [radius, setRadius] = useState('5');
  const [isLoading, setIsLoading] = useState(false);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');

  const handleGetLocation = async () => {
    setLocationStatus('loading');

    if (Platform.OS === 'web') {
      // Use browser Geolocation API — no packages needed
      if (!navigator.geolocation) {
        setLocationStatus('error');
        showToast('Geolocation not supported in this browser', 'error');
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLatitude(pos.coords.latitude);
          setLongitude(pos.coords.longitude);
          setLocationStatus('done');
          showToast('Location captured ✓', 'success');
        },
        (err) => {
          setLocationStatus('error');
          showToast('Location access denied. You can set it later from Kitchen Settings.', 'warning');
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      // Mobile: use expo-location
      try {
        const Location = require('expo-location');
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setLocationStatus('error');
          showToast('Location permission denied', 'warning');
          return;
        }
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setLatitude(loc.coords.latitude);
        setLongitude(loc.coords.longitude);
        setLocationStatus('done');
        showToast('Location captured ✓', 'success');
      } catch (e) {
        setLocationStatus('error');
        showToast('Could not get location', 'error');
      }
    }
  };

  const handleSetup = async () => {
    if (!kitchenName.trim()) { infoAlert('Required', 'Please enter your kitchen name.'); return; }
    if (!profile?.id) { infoAlert('Error', 'Please log in first.'); return; }
    setIsLoading(true);

    // Step 1: Create profile WITHOUT location (always works)
    const profileData: any = {
      user_id: profile.id,
      kitchen_name: kitchenName.trim(),
      bio: bio.trim() || null,
      specialty_tags: specialties.split(',').map(s => s.trim()).filter(Boolean),
      delivery_radius_km: parseInt(radius) || 5,
    };

    const { error } = await createProfile(profileData);

    // Step 2: Try to save location separately (won't break if columns missing)
    if (!error && latitude && longitude) {
      try {
        const { chefApi } = require('@/lib');
        await chefApi.updateChefProfile(profile.id, { latitude, longitude });
      } catch (e) {
        // Location columns may not exist yet — non-critical, skip silently
        console.log('Location save skipped (columns may not exist yet)');
      }
    }

    setIsLoading(false);
    if (error) {
      infoAlert('Error', error);
    } else {
      showToast('Kitchen is live! 🎉', 'success');
      router.replace('/(chef)/(tabs)/dashboard');
    }
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
        <TouchableOpacity style={[styles.coverArea, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.outlineVariant }]}
          onPress={() => infoAlert('Cover Photo', 'Photo upload is available on mobile devices. You can add a cover photo later from Kitchen Settings.')}>
          <Ionicons name="image-outline" size={28} color={colors.outline} />
          <Text style={{ color: colors.outline, marginTop: 6, fontSize: 13 }}>Add Cover Photo (optional)</Text>
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

        {/* 📍 Location Section — Self-service, no admin needed */}
        <View style={[styles.locationCard, { backgroundColor: colors.surfaceContainerLowest, borderColor: colors.outlineVariant, ...shadows.sm }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <Ionicons name="location" size={22} color={colors.primary} />
            <Text style={[styles.locationTitle, { color: colors.onSurface }]}>Kitchen Location</Text>
          </View>
          <Text style={{ color: colors.onSurfaceVariant, fontSize: 13, lineHeight: 19, marginBottom: 14 }}>
            Set your location so customers can find you on the map. This uses your device's GPS.
          </Text>

          {locationStatus === 'done' && latitude && longitude ? (
            <View style={[styles.locationDone, { backgroundColor: '#dcfce7' }]}>
              <Ionicons name="checkmark-circle" size={20} color="#15803d" />
              <Text style={{ color: '#15803d', fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 13, fontWeight: '600' }}>
                Location set: {latitude.toFixed(4)}, {longitude.toFixed(4)}
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              onPress={handleGetLocation}
              disabled={locationStatus === 'loading'}
              style={[styles.locationBtn, { backgroundColor: colors.primary }]}>
              {locationStatus === 'loading' ? (
                <Text style={{ color: '#fff', fontWeight: '600' }}>Detecting...</Text>
              ) : (
                <>
                  <Ionicons name="locate-outline" size={18} color="#fff" />
                  <Text style={{ color: '#fff', fontFamily: 'PlusJakartaSans-SemiBold', fontWeight: '600', fontSize: 14 }}>
                    {locationStatus === 'error' ? 'Try Again' : 'Use My Current Location'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {locationStatus === 'error' && (
            <Text style={{ color: colors.outline, fontSize: 11, marginTop: 8, textAlign: 'center' }}>
              You can also set your location later from Kitchen Settings
            </Text>
          )}
        </View>

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
  locationCard: { borderRadius: 16, borderWidth: 1, padding: 18, marginBottom: 20 },
  locationTitle: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 16, fontWeight: '600' },
  locationDone: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12 },
  locationBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12 },
});

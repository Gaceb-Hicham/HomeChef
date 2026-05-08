import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/stores/authStore';
import { Button, Input, ScreenWrapper } from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';
import { crossAlert, infoAlert } from '@/lib/crossAlert';

export default function LocationScreen() {
  const router = useRouter();
  const { colors, shadows } = useTheme();
  const { updateProfile, profile } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [city, setCity] = useState('');
  const [area, setArea] = useState('');

  const handleAllow = async () => {
    setIsLoading(true);
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setIsLoading(false);
      setManualMode(true);
      return;
    }
    try {
      const loc = await Location.getCurrentPositionAsync({});
      const [geo] = await Location.reverseGeocodeAsync(loc.coords);
      const detectedCity = geo?.city || 'Unknown';
      const detectedArea = geo?.district || geo?.subregion || '';
      await updateProfile({ city: detectedCity, area: detectedArea });
      navigateHome();
    } catch {
      setManualMode(true);
    }
    setIsLoading(false);
  };

  const handleManualSave = async () => {
    if (!city.trim()) { infoAlert('Error', 'Please enter your city'); return; }
    setIsLoading(true);
    await updateProfile({ city, area });
    setIsLoading(false);
    navigateHome();
  };

  const navigateHome = () => {
    const role = profile?.role || useAuthStore.getState().selectedRole;
    if (role === 'chef') router.replace('/(chef)/(tabs)/dashboard');
    else router.replace('/(customer)/(tabs)/home');
  };

  return (
    <ScreenWrapper>
      <View style={styles.center}>
        <View style={[styles.iconWrap, { backgroundColor: colors.primaryFixed }]}>
          <Ionicons name="location" size={40} color={colors.primary} />
        </View>

        <Text style={[styles.title, { color: colors.onBackground }]}>
          {manualMode ? 'Enter your location' : 'Enable Location'}
        </Text>
        <Text style={[styles.sub, { color: colors.onSurfaceVariant }]}>
          {manualMode
            ? 'Tell us where you are so we can find nearby chefs'
            : 'We need your location to show you nearby home chefs and delivery options.'}
        </Text>

        {manualMode ? (
          <View style={{ width: '100%', marginTop: 24 }}>
            <Input label="City" placeholder="e.g. Algiers" icon="business-outline"
              value={city} onChangeText={setCity} />
            <Input label="Area / Neighborhood" placeholder="e.g. Bab El Oued"
              icon="map-outline" value={area} onChangeText={setArea} />
            <Button title="Save Location" onPress={handleManualSave} loading={isLoading} size="lg" />
          </View>
        ) : (
          <View style={{ width: '100%', marginTop: 32, gap: 12 }}>
            <Button title="Allow Location Access" onPress={handleAllow} loading={isLoading} size="lg"
              icon={<Ionicons name="navigate" size={18} color={colors.onPrimary} />} />
            <Button title="Enter Manually" onPress={() => setManualMode(true)} variant="outline" size="lg" />
          </View>
        )}

        {!manualMode && (
          <TouchableOpacity onPress={navigateHome} style={{ marginTop: 20 }}>
            <Text style={{ color: colors.outline, fontSize: 14, fontFamily: 'PlusJakartaSans-Regular' }}>
              Skip for now
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 40 },
  iconWrap: { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  title: { fontFamily: 'NotoSerif-Bold', fontSize: 28, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  sub: { fontFamily: 'PlusJakartaSans-Regular', fontSize: 15, textAlign: 'center', lineHeight: 23, paddingHorizontal: 16 },
});

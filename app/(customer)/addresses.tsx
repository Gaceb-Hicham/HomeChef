import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/stores/authStore';
import { ScreenWrapper, Button, Input } from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';
import { addressesApi } from '@/lib/api';
import { crossAlert, infoAlert } from '@/lib/crossAlert';
import { useToast } from '@/components/ui/Toast';

export default function AddressesScreen() {
  const router = useRouter();
  const { colors, shadows } = useTheme();
  const profile = useAuthStore((s) => s.profile);
  const { showToast } = useToast();

  const [addresses, setAddresses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [label, setLabel] = useState('');
  const [fullAddress, setFullAddress] = useState('');
  const [isDetecting, setIsDetecting] = useState(false);

  useEffect(() => { fetchAddresses(); }, []);

  const fetchAddresses = async () => {
    if (!profile?.id) return;
    setIsLoading(true);
    const { data } = await addressesApi.getByUser(profile.id);
    setAddresses(data || []);
    setIsLoading(false);
  };

  const handleDetectLocation = async () => {
    setIsDetecting(true);
    try {
      // Try expo-location first (native)
      const Location = require('expo-location');
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        infoAlert('Error', 'Location permission denied');
        setIsDetecting(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      setFullAddress(`${loc.coords.latitude.toFixed(6)}, ${loc.coords.longitude.toFixed(6)}`);
    } catch {
      // Fallback for web
      if (typeof navigator !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => setFullAddress(`${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`),
          () => infoAlert('Error', 'Could not get location')
        );
      } else {
        infoAlert('Error', 'Location not available on this device');
      }
    }
    setIsDetecting(false);
  };

  const handleSave = async () => {
    if (!profile?.id || !label || !fullAddress) { infoAlert('Error', 'Fill all fields'); return; }
    const { error } = await addressesApi.create({
      user_id: profile.id,
      label,
      full_address: fullAddress,
      is_default: addresses.length === 0,
    });
    if (error) { infoAlert('Error', error); } else {
      showToast('Address added!', 'success');
      setShowForm(false); setLabel(''); setFullAddress('');
      fetchAddresses();
    }
  };

  const handleSetDefault = async (id: string) => {
    if (!profile?.id) return;
    await addressesApi.setDefault(profile.id, id);
    showToast('Default address updated', 'success');
    fetchAddresses();
  };

  const handleDelete = (id: string) => {
    crossAlert('Delete Address', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await addressesApi.remove(id);
        showToast('Address removed', 'success');
        fetchAddresses();
      }},
    ]);
  };

  return (
    <ScreenWrapper>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.onSurface} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.onBackground }]}>My Addresses</Text>
          <TouchableOpacity onPress={() => setShowForm(!showForm)}>
            <Ionicons name={showForm ? 'close' : 'add-circle'} size={28} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Add Form */}
        {showForm && (
          <View style={[styles.formCard, { backgroundColor: colors.surfaceContainerLowest, ...shadows.sm }]}>
            <Input label="Label" placeholder="e.g. Home, Work, Mom's house" value={label} onChangeText={setLabel} icon="bookmark-outline" />
            <View style={{ marginTop: 12 }}>
              <Input label="Full Address" placeholder="Enter address or detect" value={fullAddress} onChangeText={setFullAddress} icon="location-outline" multiline />
            </View>
            <TouchableOpacity style={[styles.detectBtn, { borderColor: colors.primary }]} onPress={handleDetectLocation}>
              <Ionicons name="locate" size={18} color={colors.primary} />
              <Text style={{ color: colors.primary, fontWeight: '600', marginLeft: 8 }}>
                {isDetecting ? 'Detecting...' : 'Auto-detect Location'}
              </Text>
            </TouchableOpacity>
            <Button title="Save Address" onPress={handleSave} style={{ marginTop: 16 }} />
          </View>
        )}

        {/* Address List */}
        {addresses.length === 0 && !showForm ? (
          <View style={styles.empty}>
            <Ionicons name="location-outline" size={48} color={colors.outline} />
            <Text style={{ color: colors.outline, fontSize: 16, marginTop: 12 }}>No addresses saved</Text>
            <Button title="Add Address" onPress={() => setShowForm(true)} variant="outline" style={{ marginTop: 16 }} />
          </View>
        ) : (
          addresses.map((addr) => (
            <View key={addr.id} style={[styles.addressCard, { backgroundColor: colors.surfaceContainerLowest, ...shadows.sm, borderColor: addr.is_default ? colors.primary : 'transparent', borderWidth: addr.is_default ? 2 : 0 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', flex: 1 }}>
                <View style={[styles.addrIcon, { backgroundColor: addr.is_default ? colors.primary : colors.surfaceContainerLow }]}>
                  <Ionicons name={addr.label?.toLowerCase() === 'home' ? 'home' : addr.label?.toLowerCase() === 'work' ? 'briefcase' : 'location'} size={18} color={addr.is_default ? '#fff' : colors.primary} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={{ color: colors.onSurface, fontWeight: '700', fontSize: 15 }}>{addr.label}</Text>
                    {addr.is_default && (
                      <View style={[styles.defaultBadge, { backgroundColor: '#dcfce7' }]}>
                        <Text style={{ color: '#16a34a', fontSize: 10, fontWeight: '700' }}>DEFAULT</Text>
                      </View>
                    )}
                  </View>
                  <Text style={{ color: colors.onSurfaceVariant, fontSize: 13, marginTop: 4 }} numberOfLines={2}>{addr.full_address}</Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 12, justifyContent: 'flex-end' }}>
                {!addr.is_default && (
                  <TouchableOpacity style={[styles.actionChip, { backgroundColor: colors.surfaceContainerLow }]} onPress={() => handleSetDefault(addr.id)}>
                    <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '600' }}>Set Default</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={[styles.actionChip, { backgroundColor: '#fce4ec' }]} onPress={() => handleDelete(addr.id)}>
                  <Ionicons name="trash-outline" size={14} color="#dc2626" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
        <View style={{ height: 30 }} />
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, marginTop: 8 },
  title: { fontFamily: 'NotoSerif-Bold', fontSize: 22, fontWeight: '700' },
  formCard: { padding: 18, borderRadius: 16, marginBottom: 20 },
  detectBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderRadius: 12, paddingVertical: 12, marginTop: 12, borderStyle: 'dashed' },
  addressCard: { padding: 16, borderRadius: 16, marginBottom: 12 },
  addrIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  defaultBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  actionChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10 },
  empty: { alignItems: 'center', paddingVertical: 60 },
});

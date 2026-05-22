import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/stores/authStore';
import { ScreenWrapper, Button, Input } from '@/components/ui';
import { ProfilePhotoUpload } from '@/components/ui/ProfilePhotoUpload';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { infoAlert } from '@/lib/crossAlert';
import { useToast } from '@/components/ui/Toast';

export default function EditProfileScreen() {
  const router = useRouter();
  const { colors, shadows } = useTheme();
  const profile = useAuthStore((s) => s.profile);
  const setProfile = useAuthStore((s) => s.setProfile);
  const { showToast } = useToast();

  const [name, setName] = useState(profile?.full_name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [city, setCity] = useState(profile?.city || '');
  const [area, setArea] = useState(profile?.area || '');
  const [photoUrl, setPhotoUrl] = useState(profile?.profile_photo_url || '');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswordSection, setShowPasswordSection] = useState(false);

  const handleSave = async () => {
    if (!profile?.id) return;
    setIsLoading(true);
    const { error } = await supabase.from('users').update({
      full_name: name, phone, city, area,
      profile_photo_url: photoUrl || null,
    }).eq('id', profile.id);

    if (error) { infoAlert('Error', error.message); }
    else {
      setProfile({ ...profile, full_name: name, phone, city, area, profile_photo_url: photoUrl });
      showToast('Profile updated!', 'success');
    }
    setIsLoading(false);
  };

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 6) { infoAlert('Error', 'Password must be at least 6 characters'); return; }
    setIsLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) { infoAlert('Error', error.message); }
    else { showToast('Password changed!', 'success'); setOldPassword(''); setNewPassword(''); setShowPasswordSection(false); }
    setIsLoading(false);
  };

  return (
    <ScreenWrapper>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.onSurface} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.onBackground }]}>Edit Profile</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Photo */}
        <View style={{ alignItems: 'center', marginBottom: 24 }}>
          <ProfilePhotoUpload currentUrl={photoUrl} onUpload={(url) => setPhotoUrl(url)} size={100} />
          <Text style={{ color: colors.outline, fontSize: 12, marginTop: 8 }}>Tap to change photo</Text>
        </View>

        {/* Fields */}
        <Input label="Full Name" value={name} onChangeText={setName} icon="person-outline" />
        <View style={{ height: 14 }} />
        <Input label="Phone" value={phone} onChangeText={setPhone} icon="call-outline" keyboardType="phone-pad" />
        <View style={{ height: 14 }} />
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}><Input label="City" value={city} onChangeText={setCity} icon="business-outline" /></View>
          <View style={{ flex: 1 }}><Input label="Area" value={area} onChangeText={setArea} icon="map-outline" /></View>
        </View>

        <View style={{ height: 14 }} />
        <Input label="Email" value={profile?.email || ''} editable={false} icon="mail-outline" />

        <View style={{ marginTop: 24 }}>
          <Button title="Save Changes" onPress={handleSave} loading={isLoading} />
        </View>

        {/* Password Section */}
        <TouchableOpacity style={[styles.passwordToggle, { borderColor: colors.outlineVariant }]} onPress={() => setShowPasswordSection(!showPasswordSection)}>
          <Ionicons name="lock-closed-outline" size={18} color={colors.primary} />
          <Text style={{ color: colors.primary, fontWeight: '600', marginLeft: 8 }}>Change Password</Text>
          <Ionicons name={showPasswordSection ? 'chevron-up' : 'chevron-down'} size={18} color={colors.primary} style={{ marginLeft: 'auto' }} />
        </TouchableOpacity>

        {showPasswordSection && (
          <View style={[styles.passwordCard, { backgroundColor: colors.surfaceContainerLowest, ...shadows.sm }]}>
            <Input label="New Password" value={newPassword} onChangeText={setNewPassword} secureTextEntry icon="key-outline" />
            <View style={{ marginTop: 14 }}>
              <Button title="Update Password" onPress={handleChangePassword} loading={isLoading} variant="outline" />
            </View>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, marginTop: 8 },
  title: { fontFamily: 'NotoSerif-Bold', fontSize: 22, fontWeight: '700' },
  passwordToggle: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, marginTop: 24, borderTopWidth: 1 },
  passwordCard: { padding: 18, borderRadius: 16, marginTop: 12 },
});

import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/stores/authStore';
import { pickImage, uploadAvatar } from '@/lib/storage';
import { AvatarImage } from './PostImage';
import { Ionicons } from '@expo/vector-icons';
import { infoAlert } from '@/lib/crossAlert';

interface ProfilePhotoUploadProps {
  size?: number;
  showLabel?: boolean;
}

/**
 * Self-contained profile photo upload widget.
 * Displays the current avatar + camera overlay, handles pick/upload/update.
 */
export function ProfilePhotoUpload({ size = 96, showLabel = true }: ProfilePhotoUploadProps) {
  const { colors, shadows } = useTheme();
  const profile = useAuthStore((s) => s.profile);
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const [isUploading, setIsUploading] = useState(false);

  const handlePick = async () => {
    if (!profile?.id) return;

    const { assets, canceled } = await pickImage({ aspect: [1, 1], quality: 0.7 });
    if (canceled || !assets?.[0]?.base64) return;

    setIsUploading(true);
    const { url, error } = await uploadAvatar(profile.id, assets[0].base64);
    if (error) {
      infoAlert('Upload Failed', error);
    } else if (url) {
      // Update local state immediately
      await updateProfile({ profile_photo_url: url });
    }
    setIsUploading(false);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={handlePick}
        activeOpacity={0.8}
        disabled={isUploading}
        style={styles.avatarWrap}
      >
        <AvatarImage
          uri={profile?.profile_photo_url}
          size={size}
          emoji="👤"
        />

        {/* Camera badge */}
        <View style={[styles.cameraBadge, { backgroundColor: colors.primary, ...shadows.sm }]}>
          {isUploading ? (
            <ActivityIndicator size={14} color={colors.onPrimary} />
          ) : (
            <Ionicons name="camera" size={14} color={colors.onPrimary} />
          )}
        </View>

        {/* Upload overlay */}
        {isUploading && (
          <View style={[styles.overlay, { borderRadius: size / 2 }]}>
            <ActivityIndicator size="small" color="#fff" />
          </View>
        )}
      </TouchableOpacity>

      {showLabel && (
        <TouchableOpacity onPress={handlePick} disabled={isUploading}>
          <Text style={[styles.label, { color: colors.primary }]}>
            {isUploading ? 'Uploading...' : 'Change Photo'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 8,
  },
  avatarWrap: {
    position: 'relative',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
  },
});

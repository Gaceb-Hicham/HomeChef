import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Image, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/stores/authStore';
import { usePostsStore } from '@/stores/postsStore';
import { pickImage, uploadPostPhotos } from '@/lib/storage';
import { Button, Input, ScreenWrapper } from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';
import { crossAlert, infoAlert } from '@/lib/crossAlert';
import { useLanguage } from '@/hooks/useLanguage';
import { useToast } from '@/components/ui/Toast';
import { compressImage } from '@/lib/imageCompressor';

export default function CreatePostScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    editId?: string; editTitle?: string; editDescription?: string;
    editPrice?: string; editQuantity?: string; editCategory?: string;
    editDelivery?: string; editPickup?: string;
  }>();
  const isEditMode = !!params.editId;
  const { colors, shadows } = useTheme();
  const profile = useAuthStore((s) => s.profile);
  const { createPost, updatePost, isLoading: storeLoading } = usePostsStore();
  const { t } = useLanguage();
  const { showToast } = useToast();

  const [title, setTitle] = useState(params.editTitle || '');
  const [description, setDescription] = useState(params.editDescription || '');
  const [price, setPrice] = useState(params.editPrice || '');
  const [quantity, setQuantity] = useState(params.editQuantity || '');
  const [deadline, setDeadline] = useState('14:00');
  const [delivery, setDelivery] = useState(params.editDelivery !== '0');
  const [pickup, setPickup] = useState(params.editPickup !== '0');
  const [preorder, setPreorder] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<{ uri: string; base64: string }[]>([]);

  const handlePickPhotos = async () => {
    if (Platform.OS === 'web') {
      // Web: use native HTML file input for image upload
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.multiple = true;
      input.onchange = async (e: any) => {
        const files = Array.from(e.target.files || []) as File[];
        const maxNew = 5 - selectedPhotos.length;
        const newPhotos: { uri: string; base64: string }[] = [];
        for (const file of files.slice(0, maxNew)) {
          const reader = new FileReader();
          const result = await new Promise<string>((resolve) => {
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          });
          const base64 = result.split(',')[1] || '';
          const uri = result; 
          newPhotos.push({ uri, base64 });
        }
        setSelectedPhotos((prev) => [...prev, ...newPhotos]);
      };
      input.click();
    } else {
      try {
        const { assets, canceled } = await pickImage({ allowsMultipleSelection: true, aspect: [4, 3], quality: 0.8 });
        if (!canceled && assets) {
          const newPhotos: { uri: string; base64: string }[] = [];
          for (const a of assets.slice(0, 5 - selectedPhotos.length)) {
            const compressed = await compressImage(a.uri, 1200, 0.7);
            newPhotos.push({ uri: compressed, base64: a.base64 || '' });
          }
          setSelectedPhotos([...selectedPhotos, ...newPhotos]);
        }
      } catch (e) {
        infoAlert('Info', 'Photo upload failed. Please try again.');
      }
    }
  };

  const removePhoto = (idx: number) => {
    setSelectedPhotos(selectedPhotos.filter((_, i) => i !== idx));
  };

  const handlePublish = async () => {
    // ── Validation ──────────────────────────────────────────
    if (!title.trim()) {
      infoAlert('Missing Title', 'Please enter a dish name.');
      return;
    }

    const parsedPrice = parseInt(price);
    if (!price || isNaN(parsedPrice) || parsedPrice <= 0) {
      infoAlert('Invalid Price', 'Price must be a positive number (in DA).');
      return;
    }

    const parsedQty = parseInt(quantity);
    if (!quantity || isNaN(parsedQty) || parsedQty <= 0) {
      infoAlert('Invalid Quantity', 'Quantity must be at least 1.');
      return;
    }

    // Validate deadline format (HH:MM)
    const timeRegex = /^([01]?\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(deadline.trim())) {
      infoAlert('Invalid Deadline', 'Please enter a valid time in HH:MM format (e.g. 14:00).');
      return;
    }

    // Check deadline is in the future
    const now = new Date();
    const [hours, minutes] = deadline.trim().split(':').map(Number);
    const deadlineDate = new Date();
    deadlineDate.setHours(hours, minutes, 0, 0);
    if (deadlineDate <= now) {
      infoAlert('Deadline Passed', 'The order deadline must be in the future.');
      return;
    }

    if (!delivery && !pickup) {
      infoAlert('No Delivery Method', 'Please enable at least one delivery method (Delivery or Pickup).');
      return;
    }

    if (!profile?.id) {
      infoAlert('Error', 'Please log in first');
      return;
    }

    setIsLoading(true);

    // Safety timeout — never stay loading for more than 15s
    const timeout = setTimeout(() => {
      setIsLoading(false);
      infoAlert('Timeout', 'The operation took too long. Please try again.');
    }, 15000);

    try {
      // Upload photos if any
      let photoUrls: string[] = [];
      if (selectedPhotos.length > 0) {
        const { urls } = await uploadPostPhotos(
          profile.id,
          selectedPhotos.map((p) => ({ base64: p.base64 }))
        );
        photoUrls = urls;
      }

      if (isEditMode) {
        // ── Edit mode: update existing post ──
        const { error } = await updatePost(params.editId!, {
          title: title.trim(),
          description: description.trim() || null,
          photos: photoUrls.length > 0 ? photoUrls : undefined,
          price: parseInt(price),
          available_quantity: parseInt(quantity),
          delivery_available: delivery,
          pickup_available: pickup,
          preorder_allowed: preorder,
        });

        clearTimeout(timeout);
        setIsLoading(false);

        if (error) {
          infoAlert('Error', error);
        } else {
          showToast('Post updated successfully', 'success');
          router.back();
        }
      } else {
        // ── Create mode: new post ──
        const today = new Date().toISOString().split('T')[0];
        const deadlineTime = `${today}T${deadline}:00.000Z`;

        const { error } = await createPost({
          chef_id: profile.id,
          title: title.trim(),
          description: description.trim() || null,
          photos: photoUrls,
          price: parseInt(price),
          available_quantity: parseInt(quantity),
          remaining_quantity: parseInt(quantity),
          order_deadline: deadlineTime,
          delivery_available: delivery,
          pickup_available: pickup,
          preorder_allowed: preorder,
          is_active: true,
          date: today,
        });

        clearTimeout(timeout);
        setIsLoading(false);

        if (error) {
          infoAlert('Error', error);
        } else {
          showToast(t('create_post.published'), 'success');
          router.back();
        }
      }
    } catch (e: any) {
      clearTimeout(timeout);
      setIsLoading(false);
      infoAlert('Error', e.message || 'Failed to publish');
    }
  };

  return (
    <ScreenWrapper>
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="close" size={24} color={colors.onSurface} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.onBackground }]}>{isEditMode ? t('edit') + ' ' + t('create_post.dish_name') : t('create_post.title')}</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Photo upload area */}
        {selectedPhotos.length === 0 ? (
          <TouchableOpacity onPress={handlePickPhotos}
            style={[styles.photoArea, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.outlineVariant }]}>
            <Ionicons name="camera-outline" size={32} color={colors.outline} />
            <Text style={{ color: colors.outline, marginTop: 8, fontSize: 14 }}>{t('create_post.add_photos')}</Text>
            <Text style={{ color: colors.outline, fontSize: 12 }}>Tap to upload from gallery</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.photosRow}>
            {selectedPhotos.map((photo, idx) => (
              <View key={idx} style={styles.photoThumb}>
                <Image source={{ uri: photo.uri }} style={styles.photoImg} />
                <TouchableOpacity onPress={() => removePhoto(idx)} style={styles.removePhoto}>
                  <Ionicons name="close-circle" size={20} color="#ef4444" />
                </TouchableOpacity>
              </View>
            ))}
            {selectedPhotos.length < 5 && (
              <TouchableOpacity onPress={handlePickPhotos}
                style={[styles.addPhotoBtn, { borderColor: colors.outlineVariant }]}>
                <Ionicons name="add" size={24} color={colors.outline} />
              </TouchableOpacity>
            )}
          </View>
        )}

        <Input label={`${t('create_post.dish_name')} *`} placeholder="e.g. Couscous Royal" value={title} onChangeText={setTitle} icon="restaurant-outline" />
        <Input label={t('create_post.description')} placeholder="Describe your dish..." value={description} onChangeText={setDescription}
          multiline numberOfLines={3} style={{ minHeight: 70, textAlignVertical: 'top' }} />

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Input label={`${t('create_post.price')} *`} placeholder="850" value={price} onChangeText={setPrice} keyboardType="numeric" icon="pricetag-outline" />
          </View>
          <View style={{ flex: 1 }}>
            <Input label={`${t('create_post.quantity')} *`} placeholder="15" value={quantity} onChangeText={setQuantity} keyboardType="numeric" icon="layers-outline" />
          </View>
        </View>

        <Text style={{ color: colors.onSurfaceVariant, fontWeight: '600', fontSize: 14, marginBottom: 8 }}>{t('create_post.deadline')} *</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
          {['12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'].map(time => (
            <TouchableOpacity key={time} onPress={() => setDeadline(time)}
              style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, marginRight: 8,
                backgroundColor: deadline === time ? colors.primary : colors.surfaceContainerLow }}>
              <Ionicons name="time-outline" size={14} color={deadline === time ? '#fff' : colors.onSurface} />
              <Text style={{ color: deadline === time ? '#fff' : colors.onSurface, fontWeight: '600', fontSize: 13, marginLeft: 4 }}>{time}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Toggles */}
        <View style={[styles.toggleCard, { backgroundColor: colors.surfaceContainerLowest, ...shadows.sm }]}>
          {[
            { label: t('create_post.delivery_available'), value: delivery, onChange: setDelivery, icon: 'bicycle-outline' },
            { label: t('create_post.pickup_available'), value: pickup, onChange: setPickup, icon: 'storefront-outline' },
            { label: t('create_post.allow_preorder'), value: preorder, onChange: setPreorder, icon: 'calendar-outline' },
          ].map((toggle, idx) => (
            <View key={toggle.label} style={[styles.toggleRow, idx < 2 && { borderBottomColor: colors.outlineVariant, borderBottomWidth: 0.5 }]}>
              <Ionicons name={toggle.icon as any} size={20} color={colors.onSurfaceVariant} />
              <Text style={[styles.toggleLabel, { color: colors.onSurface }]}>{toggle.label}</Text>
              <Switch value={toggle.value} onValueChange={toggle.onChange} trackColor={{ true: colors.primary, false: colors.outlineVariant }}
                thumbColor="#fff" />
            </View>
          ))}
        </View>

        <Button title={isEditMode ? t('save') : t('create_post.publish')} onPress={handlePublish} loading={isLoading || storeLoading} size="lg" />
        <View style={{ height: 32 }} />
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, marginTop: 8 },
  title: { fontFamily: 'NotoSerif-Bold', fontSize: 22, fontWeight: '700' },
  photoArea: { height: 140, borderRadius: 16, borderWidth: 2, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  photosRow: { flexDirection: 'row', gap: 8, marginBottom: 20, flexWrap: 'wrap' },
  photoThumb: { width: 80, height: 80, borderRadius: 12, overflow: 'hidden' },
  photoImg: { width: '100%', height: '100%' },
  removePhoto: { position: 'absolute', top: 2, right: 2 },
  addPhotoBtn: { width: 80, height: 80, borderRadius: 12, borderWidth: 2, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  toggleCard: { borderRadius: 16, marginBottom: 24, overflow: 'hidden' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, gap: 12 },
  toggleLabel: { flex: 1, fontFamily: 'PlusJakartaSans-Regular', fontSize: 15 },
});

import { supabase } from './supabase';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';

type Bucket = 'avatars' | 'posts' | 'reviews' | 'kitchens';

/**
 * Pick an image from the device gallery
 */
export async function pickImage(options?: {
  allowsMultipleSelection?: boolean;
  aspect?: [number, number];
  quality?: number;
}) {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: !options?.allowsMultipleSelection,
    allowsMultipleSelection: options?.allowsMultipleSelection || false,
    aspect: options?.aspect || [1, 1],
    quality: options?.quality || 0.8,
    base64: true,
  });

  if (result.canceled) return { assets: null, canceled: true };
  return { assets: result.assets, canceled: false };
}

/**
 * Take a photo with the camera
 */
export async function takePhoto() {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) return { asset: null, error: 'Camera permission denied' };

  const result = await ImagePicker.launchCameraAsync({
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
    base64: true,
  });

  if (result.canceled) return { asset: null, error: null };
  return { asset: result.assets[0], error: null };
}

/**
 * Upload an image to Supabase Storage
 */
export async function uploadImage(
  bucket: Bucket,
  userId: string,
  base64Data: string,
  fileName?: string,
  contentType = 'image/jpeg',
): Promise<{ url: string | null; error: string | null }> {
  try {
    const ext = contentType === 'image/png' ? 'png' : 'jpg';
    const name = fileName || `${Date.now()}.${ext}`;
    const path = `${userId}/${name}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(path, decode(base64Data), {
        contentType,
        upsert: true,
      });

    if (uploadError) return { url: null, error: uploadError.message };

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    return { url: publicUrl, error: null };
  } catch (e: any) {
    return { url: null, error: e.message || 'Upload failed' };
  }
}

/**
 * Upload profile avatar
 */
export async function uploadAvatar(userId: string, base64Data: string) {
  const result = await uploadImage('avatars', userId, base64Data, 'avatar.jpg');

  if (result.url) {
    // Also update the user profile
    await supabase
      .from('users')
      .update({ profile_photo_url: result.url })
      .eq('id', userId);
  }

  return result;
}

/**
 * Upload post photos (multiple)
 */
export async function uploadPostPhotos(userId: string, photos: { base64: string; fileName?: string }[]) {
  const urls: string[] = [];

  for (const photo of photos) {
    const result = await uploadImage('posts', userId, photo.base64, photo.fileName);
    if (result.url) urls.push(result.url);
  }

  return { urls, error: urls.length === 0 ? 'No photos uploaded' : null };
}

/**
 * Upload kitchen cover photo
 */
export async function uploadKitchenCover(userId: string, base64Data: string) {
  return uploadImage('kitchens', userId, base64Data, 'cover.jpg');
}

/**
 * Delete a file from storage
 */
export async function deleteFile(bucket: Bucket, path: string) {
  const { error } = await supabase.storage.from(bucket).remove([path]);
  return { error: error?.message || null };
}

/**
 * Get signed URL for a private file
 */
export async function getSignedUrl(bucket: Bucket, path: string, expiresIn = 3600) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);

  return { url: data?.signedUrl || null, error: error?.message || null };
}

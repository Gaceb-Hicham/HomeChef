/**
 * Image compression utility.
 * Tries to use expo-image-manipulator if available, otherwise returns original.
 */

let ImageManipulator: any = null;
try {
  ImageManipulator = require('expo-image-manipulator');
} catch (_) {
  // expo-image-manipulator not installed — compression will be skipped
}

/**
 * Compresses and resizes an image before uploading.
 * Falls back to original URI if expo-image-manipulator is not installed.
 */
export async function compressImage(
  uri: string,
  maxWidth: number = 1200,
  quality: number = 0.7
): Promise<string> {
  if (!ImageManipulator) return uri;
  try {
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: maxWidth } }],
      { compress: quality, format: ImageManipulator.SaveFormat.JPEG }
    );
    return result.uri;
  } catch (error) {
    console.warn('Image compression failed, using original:', error);
    return uri;
  }
}

/**
 * Compresses multiple images in parallel.
 */
export async function compressImages(
  uris: string[],
  maxWidth: number = 1200,
  quality: number = 0.7
): Promise<string[]> {
  return Promise.all(uris.map(uri => compressImage(uri, maxWidth, quality)));
}

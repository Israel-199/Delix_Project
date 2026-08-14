import * as ImagePicker from 'expo-image-picker';

import { API_BASE_URL } from '../config/api';

export interface PickedImageResult {
  uri: string;
  base64?: string;
}

/**
 * Uploads an image via the backend proxy.
 * Supports file URI upload as well as base64 fallback.
 * If Cloudinary or server upload fails, falls back gracefully to image payload so profile save succeeds.
 */
export const uploadImageToCloudinary = async (imageUri: string, base64?: string): Promise<string> => {
  try {
    // If base64 is available, upload directly via clean JSON payload
    if (base64) {
      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: base64 }),
      });

      const data = await response.json();
      if (data.secure_url) {
        return data.secure_url;
      }
    }

    // Otherwise use FormData (note: DO NOT set Content-Type header manually in RN fetch)
    const formData = new FormData();
    const uriParts = imageUri.split('.');
    const fileType = uriParts[uriParts.length - 1] || 'jpg';
    
    formData.append('file', {
      uri: imageUri,
      name: `photo.${fileType}`,
      type: `image/${fileType}`,
    } as any);

    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json',
      },
    });

    const data = await response.json();

    if (data.secure_url) {
      return data.secure_url;
    } else {
      console.warn('Backend upload did not return secure_url, using fallback URI.');
      return base64 ? (base64.startsWith('data:') ? base64 : `data:image/jpeg;base64,${base64}`) : imageUri;
    }
  } catch (error) {
    console.warn('Backend upload error (using fallback image URI):', error);
    return base64 ? (base64.startsWith('data:') ? base64 : `data:image/jpeg;base64,${base64}`) : imageUri;
  }
};

/**
 * Helper to pick an image from the library
 */
export const pickImage = async (): Promise<PickedImageResult | null> => {
  const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (permissionResult.granted === false) {
    alert('Permission to access camera roll is required!');
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.7,
    base64: true,
  });

  if (!result.canceled && result.assets && result.assets.length > 0) {
    const asset = result.assets[0];
    return {
      uri: asset.uri,
      base64: asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : undefined,
    };
  }

  return null;
};

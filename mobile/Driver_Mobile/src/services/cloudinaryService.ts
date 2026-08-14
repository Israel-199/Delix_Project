import * as ImagePicker from 'expo-image-picker';
import { API_BASE_URL } from '../config/api';

export interface PickedImageResult {
  uri: string;
  base64?: string;
}

export const uploadDriverDocument = async (
  imageUri: string,
  driverId: string,
  base64?: string
): Promise<{ url: string; publicId?: string }> => {
  const folder = `drivers/${driverId}`;

  if (base64) {
    const response = await fetch(`${API_BASE_URL}/api/upload`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ image: base64, folder }),
    });

    const data = await response.json();
    if (!response.ok || !data.secure_url) {
      throw new Error(data.error || 'Upload failed');
    }
    return { url: data.secure_url, publicId: data.public_id };
  }

  const formData = new FormData();
  const uriParts = imageUri.split('.');
  const fileType = uriParts[uriParts.length - 1] || 'jpg';

  formData.append('file', {
    uri: imageUri,
    name: `document.${fileType}`,
    type: `image/${fileType}`,
  } as unknown as Blob);
  formData.append('folder', folder);

  const response = await fetch(`${API_BASE_URL}/api/upload`, {
    method: 'POST',
    body: formData,
    headers: { Accept: 'application/json' },
  });

  const data = await response.json();
  if (!response.ok || !data.secure_url) {
    throw new Error(data.error || 'Upload failed');
  }
  return { url: data.secure_url, publicId: data.public_id };
};

export const pickDocumentImage = async (): Promise<PickedImageResult | null> => {
  const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permissionResult.granted) {
    throw new Error('Photo library permission is required to upload documents.');
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    quality: 0.8,
    base64: true,
  });

  if (result.canceled || !result.assets?.length) {
    return null;
  }

  const asset = result.assets[0];
  return {
    uri: asset.uri,
    base64: asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : undefined,
  };
};

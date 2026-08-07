import * as ImagePicker from 'expo-image-picker';

const CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME || '';
const API_KEY = process.env.EXPO_PUBLIC_CLOUDINARY_API_KEY || '';
// In a true production app, use signed uploads via a backend.
// For this frontend implementation with the API secret, we would theoretically sign it.
// However, the best approach on frontend is using an 'upload_preset'.
const UPLOAD_PRESET = 'delix_preset'; // Replace with a Cloudinary unsigned upload preset if available

/**
 * Uploads an image to Cloudinary using unsigned upload.
 */
export const uploadImageToCloudinary = async (imageUri: string): Promise<string> => {
  if (!CLOUD_NAME) {
    throw new Error('Cloudinary cloud name is not configured in .env');
  }

  const formData = new FormData();
  
  // Extract file extension and type
  const uriParts = imageUri.split('.');
  const fileType = uriParts[uriParts.length - 1];
  
  formData.append('file', {
    uri: imageUri,
    name: `photo.${fileType}`,
    type: `image/${fileType}`,
  } as any);

  // You can also use an unsigned upload preset here
  formData.append('upload_preset', UPLOAD_PRESET);
  // formData.append('api_key', API_KEY); // Re-enable if using signed uploads

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    const data = await response.json();

    if (data.secure_url) {
      return data.secure_url;
    } else {
      throw new Error(data.error?.message || 'Upload failed');
    }
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
};

/**
 * Helper to pick an image from the library
 */
export const pickImage = async (): Promise<string | null> => {
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
  });

  if (!result.canceled && result.assets && result.assets.length > 0) {
    return result.assets[0].uri;
  }

  return null;
};

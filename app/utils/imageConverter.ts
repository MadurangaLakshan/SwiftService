// utils/imageConverter.ts
// Used for converting multiple images to base64 (e.g., booking attachments)

import { readAsStringAsync } from "expo-file-system/legacy";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { Alert } from "react-native";

/**
 * Request media library permissions
 */
export const requestMediaLibraryPermissions = async (): Promise<boolean> => {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== "granted") {
    Alert.alert(
      "Permission Required",
      "Please grant camera roll permissions to upload images."
    );
    return false;
  }
  return true;
};

/**
 * Request camera permissions
 */
export const requestCameraPermissions = async (): Promise<boolean> => {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== "granted") {
    Alert.alert(
      "Permission Required",
      "Please grant camera permissions to take photos."
    );
    return false;
  }
  return true;
};

/**
 * Compress and convert image to Base64
 * @param uri - Image URI from ImagePicker
 * @param maxWidth - Maximum width for compression (default: 800px)
 * @param quality - Image quality 0-1 (default: 0.6)
 * @returns Base64 string with data URI prefix
 */
export const convertImageToBase64 = async (
  uri: string,
  maxWidth: number = 800,
  quality: number = 0.6
): Promise<string> => {
  try {
    // Compress image
    const manipulatedImage = await manipulateAsync(
      uri,
      [{ resize: { width: maxWidth } }],
      {
        compress: quality,
        format: SaveFormat.JPEG,
      }
    );

    // Convert to base64
    const base64 = await readAsStringAsync(manipulatedImage.uri, {
      encoding: "base64",
    });

    return `data:image/jpeg;base64,${base64}`;
  } catch (error) {
    console.error("Error converting image:", error);
    throw error;
  }
};

/**
 * Pick multiple images from library
 * @param maxImages - Maximum number of images to select
 * @returns Array of image URIs
 */
export const pickMultipleImages = async (
  maxImages: number = 5
): Promise<string[]> => {
  const hasPermission = await requestMediaLibraryPermissions();
  if (!hasPermission) return [];

  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.6,
      selectionLimit: maxImages,
    });

    if (!result.canceled && result.assets) {
      return result.assets.map((asset) => asset.uri);
    }

    return [];
  } catch (error) {
    console.error("Error picking images:", error);
    return [];
  }
};

/**
 * Take a photo using camera
 * @param allowEditing - Allow image editing (default: false)
 * @returns Image URI or null if cancelled
 */
export const takePhoto = async (
  allowEditing: boolean = false
): Promise<string | null> => {
  const hasPermission = await requestCameraPermissions();
  if (!hasPermission) return null;

  try {
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: allowEditing,
      quality: 0.6,
    });

    if (!result.canceled && result.assets[0]) {
      return result.assets[0].uri;
    }

    return null;
  } catch (error) {
    console.error("Error taking photo:", error);
    return null;
  }
};

/**
 * Pick multiple images and convert all to Base64
 * @param maxImages - Maximum number of images
 * @param maxWidth - Maximum width for compression
 * @param quality - Image quality 0-1
 * @returns Array of Base64 strings
 */
export const pickAndConvertMultipleImages = async (
  maxImages: number = 5,
  maxWidth: number = 800,
  quality: number = 0.6
): Promise<string[]> => {
  try {
    const imageUris = await pickMultipleImages(maxImages);

    if (imageUris.length === 0) {
      return [];
    }

    // Convert all images to base64
    const base64Promises = imageUris.map((uri) =>
      convertImageToBase64(uri, maxWidth, quality)
    );

    const base64Images = await Promise.all(base64Promises);

    return base64Images;
  } catch (error) {
    console.error("Error in pickAndConvertMultipleImages:", error);
    throw error;
  }
};

/**
 * Take photo and convert to Base64 in one step
 * @param allowEditing - Allow image editing
 * @param maxWidth - Maximum width for compression
 * @param quality - Image quality 0-1
 * @returns Base64 string or null if cancelled
 */
export const takeAndConvertPhoto = async (
  allowEditing: boolean = false,
  maxWidth: number = 800,
  quality: number = 0.6
): Promise<string | null> => {
  try {
    const photoUri = await takePhoto(allowEditing);

    if (!photoUri) {
      return null;
    }

    const base64Photo = await convertImageToBase64(photoUri, maxWidth, quality);

    return base64Photo;
  } catch (error) {
    console.error("Error in takeAndConvertPhoto:", error);
    throw error;
  }
};

/**
 * Show image picker options (Gallery or Camera)
 * @param onGalleryPress - Callback for gallery selection
 * @param onCameraPress - Callback for camera capture
 * @param title - Alert title
 * @param message - Alert message
 */
export const showImagePickerOptions = (
  onGalleryPress: () => void,
  onCameraPress: () => void,
  title: string = "Add Photo",
  message: string = "Choose an option"
) => {
  Alert.alert(
    title,
    message,
    [
      {
        text: "Take Photo",
        onPress: onCameraPress,
      },
      {
        text: "Choose from Library",
        onPress: onGalleryPress,
      },
      {
        text: "Cancel",
        style: "cancel",
      },
    ],
    { cancelable: true }
  );
};

/**
 * Calculate the approximate size of a base64 image in MB
 * @param base64String - Base64 encoded image string
 * @returns Size in megabytes
 */
export const getBase64ImageSize = (base64String: string): number => {
  // Remove data URI prefix if present
  const base64Data = base64String.split(",")[1] || base64String;

  // Calculate size: (base64 length * 3) / 4 bytes, then convert to MB
  const sizeInBytes = (base64Data.length * 3) / 4;
  const sizeInMB = sizeInBytes / (1024 * 1024);

  return parseFloat(sizeInMB.toFixed(2));
};

/**
 * Validate if base64 images are within size limits
 * @param base64Images - Array of base64 image strings
 * @param maxSizePerImageMB - Maximum size per image in MB (default: 2MB)
 * @param maxTotalSizeMB - Maximum total size in MB (default: 10MB)
 * @returns Object with validation result and message
 */
export const validateImageSizes = (
  base64Images: string[],
  maxSizePerImageMB: number = 2,
  maxTotalSizeMB: number = 10
): { valid: boolean; message?: string } => {
  let totalSize = 0;

  for (let i = 0; i < base64Images.length; i++) {
    const size = getBase64ImageSize(base64Images[i]);
    totalSize += size;

    if (size > maxSizePerImageMB) {
      return {
        valid: false,
        message: `Image ${
          i + 1
        } is too large (${size}MB). Maximum size per image is ${maxSizePerImageMB}MB.`,
      };
    }
  }

  if (totalSize > maxTotalSizeMB) {
    return {
      valid: false,
      message: `Total image size (${totalSize.toFixed(
        2
      )}MB) exceeds maximum (${maxTotalSizeMB}MB).`,
    };
  }

  return { valid: true };
};

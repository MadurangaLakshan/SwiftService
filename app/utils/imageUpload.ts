import { readAsStringAsync } from "expo-file-system/legacy";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { Alert } from "react-native";

export const pickImage = async () => {
  // Request permissions
  const permissionResult =
    await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permissionResult.granted) {
    Alert.alert(
      "Permission Required",
      "Please grant camera roll permissions to upload images."
    );
    return null;
  }

  // Launch image picker
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.7,
  });

  if (!result.canceled && result.assets[0]) {
    return result.assets[0].uri;
  }

  return null;
};

/**
 * Compress and convert image to Base64
 * @param uri - Image URI from ImagePicker
 * @param maxWidth - Maximum width for compression (default: 800px)
 * @param quality - Image quality 0-1 (default: 0.7)
 * @returns Base64 string with data URI prefix
 */

export const convertImageToBase64 = async (
  uri: string,
  maxWidth: number = 800,
  quality: number = 0.7
): Promise<string> => {
  try {
    // Compress image
    const manipulatedImage = await manipulateAsync(
      // Declared inside try scope
      uri,
      [{ resize: { width: maxWidth } }],
      {
        compress: quality,
        format: SaveFormat.JPEG,
      }
    );

    // Convert to base64 using LEGACY API
    const base64 = await readAsStringAsync(manipulatedImage.uri, {
      // Used inside try scope
      encoding: "base64",
    });

    return `data:image/jpeg;base64,${base64}`;
  } catch (error) {
    console.error("Error converting image:", error);
    throw error;
  }
};

/**
 * Pick image and convert to Base64 in one step
 * @returns Base64 string or null if cancelled
 */
export const pickAndConvertImage = async (): Promise<string | null> => {
  try {
    const imageUri = await pickImage();

    if (!imageUri) {
      return null;
    }

    const base64Image = await convertImageToBase64(imageUri);

    return base64Image;
  } catch (error) {
    console.error("Error in pickAndConvertImage:", error);
    throw error;
  }
};

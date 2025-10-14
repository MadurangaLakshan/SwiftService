import * as ImagePicker from "expo-image-picker";
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
} from "firebase/storage";
import { Alert } from "react-native";
import { storage } from "../config/firebase";

export interface ImagePickerResult {
  success: boolean;
  uri?: string;
  error?: string;
}

export const requestCameraPermissions = async () => {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== "granted") {
    Alert.alert(
      "Permission Denied",
      "Camera permission is required to take photos"
    );
    return false;
  }
  return true;
};

export const requestMediaLibraryPermissions = async () => {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== "granted") {
    Alert.alert(
      "Permission Denied",
      "Media library permission is required to select photos"
    );
    return false;
  }
  return true;
};

export const pickImageFromGallery = async (): Promise<ImagePickerResult> => {
  try {
    const hasPermission = await requestMediaLibraryPermissions();
    if (!hasPermission) {
      return { success: false, error: "Permission denied" };
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (result.canceled) {
      return { success: false, error: "Image selection cancelled" };
    }

    return { success: true, uri: result.assets[0].uri };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const takePhoto = async (): Promise<ImagePickerResult> => {
  try {
    const hasPermission = await requestCameraPermissions();
    if (!hasPermission) {
      return { success: false, error: "Permission denied" };
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (result.canceled) {
      return { success: false, error: "Photo capture cancelled" };
    }

    return { success: true, uri: result.assets[0].uri };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const uploadProfilePicture = async (
  imageUri: string,
  userId: string,
  userType: "provider" | "customer"
): Promise<{ success: boolean; url?: string; error?: string }> => {
  try {
    const response = await fetch(imageUri);
    const blob = await response.blob();

    const filename = `${userType}s/${userId}/profile-${Date.now()}.jpg`;
    const storageRef = ref(storage, filename);

    await uploadBytes(storageRef, blob);

    const downloadURL = await getDownloadURL(storageRef);

    return { success: true, url: downloadURL };
  } catch (error: any) {
    console.error("Upload error:", error);
    return { success: false, error: error.message };
  }
};

export const deleteProfilePicture = async (
  imageUrl: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    if (!imageUrl) {
      return { success: true };
    }

    const url = new URL(imageUrl);
    const path = decodeURIComponent(url.pathname.split("/o/")[1].split("?")[0]);

    const storageRef = ref(storage, path);
    await deleteObject(storageRef);

    return { success: true };
  } catch (error: any) {
    console.error("Delete error:", error);
    return { success: false, error: error.message };
  }
};

export const showImagePickerOptions = (
  onGalleryPress: () => void,
  onCameraPress: () => void
) => {
  Alert.alert(
    "Select Profile Picture",
    "Choose an option",
    [
      {
        text: "Take Photo",
        onPress: onCameraPress,
      },
      {
        text: "Choose from Gallery",
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

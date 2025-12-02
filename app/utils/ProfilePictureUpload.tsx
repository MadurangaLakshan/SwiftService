import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import {
  updateCustomerProfilePicture,
  updateProviderProfilePicture,
} from "../services/apiService";
import { pickAndConvertImage } from "../utils/imageUpload";

interface ProfilePictureUploadProps {
  currentImageUrl: string;
  userId: string;
  userType: "customer" | "provider";
  onUploadComplete: (url: string) => void;
  isRegistration?: boolean;
}

const ProfilePictureUpload: React.FC<ProfilePictureUploadProps> = ({
  currentImageUrl,
  userId,
  userType,
  onUploadComplete,
  isRegistration = false,
}) => {
  const [uploading, setUploading] = useState(false);
  const [localImageUri, setLocalImageUri] = useState<string>("");

  const handlePickImage = async () => {
    if (uploading) return;

    try {
      setUploading(true);

      const base64Image = await pickAndConvertImage();

      if (!base64Image) {
        setUploading(false);
        return;
      }

      // Show preview immediately
      setLocalImageUri(base64Image);

      // During registration: just preview, don't upload yet
      if (isRegistration) {
        onUploadComplete(base64Image);
        Alert.alert(
          "Photo Selected",
          "Your photo will be uploaded when you complete registration."
        );
        setUploading(false);
        return;
      }

      // Profile editing: upload immediately
      const updateFunction =
        userType === "customer"
          ? updateCustomerProfilePicture
          : updateProviderProfilePicture;

      const result = await updateFunction(userId, base64Image);

      if (result.success) {
        const newUrl = result.data?.profilePhoto || base64Image;
        onUploadComplete(newUrl);
        Alert.alert("Success", "Profile picture updated successfully!");
      } else {
        throw new Error(
          result.error || "Failed to update profile picture on server."
        );
      }
    } catch (error: any) {
      console.error("Error uploading profile picture:", error);
      Alert.alert("Error", error.message || "Failed to upload image.");
      setLocalImageUri("");
    } finally {
      setUploading(false);
    }
  };

  const displayImage = localImageUri || currentImageUrl;

  return (
    <View className="items-center mb-6">
      <View className="relative">
        {displayImage ? (
          <Image
            source={{ uri: displayImage }}
            className="w-32 h-32 rounded-full border-4 border-gray-200"
          />
        ) : (
          <View className="w-32 h-32 rounded-full bg-gray-200 items-center justify-center border-4 border-gray-300">
            <Ionicons name="person" size={48} color="#9ca3af" />
          </View>
        )}

        <TouchableOpacity
          onPress={handlePickImage}
          disabled={uploading}
          className="absolute bottom-0 right-0 bg-blue-500 rounded-full p-3 border-4 border-white"
        >
          {uploading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Ionicons name="camera" size={20} color="white" />
          )}
        </TouchableOpacity>

        {isRegistration && displayImage && (
          <View className="absolute -top-2 -right-2 bg-green-500 rounded-full px-2 py-1">
            <Text className="text-white text-xs font-bold">Preview</Text>
          </View>
        )}
      </View>

      <Text className="text-gray-600 text-sm mt-3 text-center">
        {isRegistration && displayImage
          ? "Photo ready! Will upload on registration"
          : displayImage
          ? "Tap camera to change"
          : "Tap camera to add photo"}
      </Text>
    </View>
  );
};

export default ProfilePictureUpload;

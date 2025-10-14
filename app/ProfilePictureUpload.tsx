import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import colors from "tailwindcss/colors";
import {
  pickImageFromGallery,
  showImagePickerOptions,
  takePhoto,
  uploadProfilePicture,
} from "./services/imageService";

interface ProfilePictureUploadProps {
  currentImageUrl?: string;
  userId: string;
  userType: "provider" | "customer";
  onUploadComplete: (imageUrl: string) => void;
}

export default function ProfilePictureUpload({
  currentImageUrl,
  userId,
  userType,
  onUploadComplete,
}: ProfilePictureUploadProps) {
  const [imageUri, setImageUri] = useState<string | undefined>(currentImageUrl);
  const [uploading, setUploading] = useState(false);

  const handleImagePick = async (type: "gallery" | "camera") => {
    setUploading(true);

    try {
      const result =
        type === "gallery" ? await pickImageFromGallery() : await takePhoto();

      if (!result.success || !result.uri) {
        setUploading(false);
        return;
      }

      const uploadResult = await uploadProfilePicture(
        result.uri,
        userId,
        userType
      );

      if (uploadResult.success && uploadResult.url) {
        setImageUri(uploadResult.url);
        onUploadComplete(uploadResult.url);
      }
    } catch (error) {
      console.error("Image handling error:", error);
    } finally {
      setUploading(false);
    }
  };

  const handlePress = () => {
    showImagePickerOptions(
      () => handleImagePick("gallery"),
      () => handleImagePick("camera")
    );
  };

  return (
    <View className="items-center mb-6">
      <TouchableOpacity
        onPress={handlePress}
        disabled={uploading}
        className="relative"
      >
        <View className="w-32 h-32 rounded-full bg-gray-200 items-center justify-center overflow-hidden border-4 border-gray-300">
          {imageUri ? (
            <Image
              source={{ uri: imageUri }}
              className="w-full h-full"
              resizeMode="cover"
            />
          ) : (
            <Ionicons name="person" size={60} color={colors.gray[400]} />
          )}

          {uploading && (
            <View className="absolute inset-0 bg-black/50 items-center justify-center">
              <ActivityIndicator color="white" />
            </View>
          )}
        </View>

        <View className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-blue-500 items-center justify-center border-2 border-white">
          <Ionicons name="camera" size={20} color="white" />
        </View>
      </TouchableOpacity>

      <Text className="text-gray-600 text-sm mt-2">
        Tap to {imageUri ? "change" : "upload"} photo
      </Text>
    </View>
  );
}

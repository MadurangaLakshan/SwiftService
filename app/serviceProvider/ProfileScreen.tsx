import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { signOut } from "firebase/auth";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { auth } from "../config/firebase";
import { useProvider } from "../context/ProviderContext";
import { updateProviderProfilePicture } from "../services/apiService";
import { pickAndConvertImage } from "../utils/imageUpload";

interface MenuItem {
  id: number;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  route: string;
}

interface Stat {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const ProfileScreen: React.FC = () => {
  const { providerData, loading, refreshProviderData } = useProvider();
  const [uploadingImage, setUploadingImage] = useState(false);

  const menuItems: MenuItem[] = [
    {
      id: 1,
      title: "Edit Profile",
      icon: "person-outline",
      color: "#3b82f6",
      route: "/customer/EditProfileScreen",
    },
    {
      id: 2,
      title: "Payment Methods",
      icon: "card-outline",
      color: "#10b981",
      route: "/customer/PaymentMethodsScreen",
    },
    {
      id: 3,
      title: "Booking History",
      icon: "time-outline",
      color: "#f59e0b",
      route: "/customer/BookingHistoryScreen",
    },
    {
      id: 4,
      title: "My Reviews",
      icon: "star-outline",
      color: "#fbbf24",
      route: "/serviceProvider/ReviewScreen",
    },
    {
      id: 5,
      title: "Notifications Settings",
      icon: "notifications-outline",
      color: "#8b5cf6",
      route: "/customer/NotificationSettingsScreen",
    },
    {
      id: 6,
      title: "Help & Support",
      icon: "help-circle-outline",
      color: "#06b6d4",
      route: "/customer/HelpSupportScreen",
    },
    {
      id: 7,
      title: "Terms & Conditions",
      icon: "document-text-outline",
      color: "#6b7280",
      route: "/customer/TermsScreen",
    },
    {
      id: 8,
      title: "Privacy Policy",
      icon: "shield-checkmark-outline",
      color: "#6b7280",
      route: "/customer/PrivacyScreen",
    },
  ];

  const stats: Stat[] = [
    {
      label: "Jobs",
      value: providerData?.totalJobs?.toString() || "0",
      icon: "briefcase",
    },
    {
      label: "Rating",
      value: providerData?.rating?.toFixed(1) || "N/A",
      icon: "star",
    },
    {
      label: "Reviews",
      value: providerData?.totalReviews?.toString() || "0",
      icon: "document-text",
    },
  ];

  const handleChangeProfilePicture = async () => {
    if (!auth.currentUser) {
      Alert.alert("Error", "You must be logged in to change profile picture");
      return;
    }

    try {
      setUploadingImage(true);

      const base64Image = await pickAndConvertImage();

      if (!base64Image) {
        setUploadingImage(false);
        return;
      }

      const result = await updateProviderProfilePicture(
        auth.currentUser.uid,
        base64Image
      );

      if (result.success) {
        Alert.alert("Success", "Profile picture updated successfully!");
        if (refreshProviderData) await refreshProviderData();
      } else {
        throw new Error(result.error || "Failed to update profile picture");
      }
    } catch (error: any) {
      let errorMessage = "Failed to upload image. Please try again.";
      if (error.message.includes("too large")) {
        errorMessage = "Image is too large. Please select a smaller image.";
      } else if (error.message.includes("Invalid image")) {
        errorMessage = "Invalid image format. Please select a valid image.";
      }
      Alert.alert("Error", errorMessage);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            try {
              await signOut(auth);
              router.replace("/");
            } catch (error: any) {
              Alert.alert("Error", "Failed to logout. Please try again.");
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const profileImageSource = providerData?.profilePhoto
    ? { uri: providerData.profilePhoto }
    : { uri: "https://i.pravatar.cc/150?img=68" };

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="bg-blue-600 pt-12 pb-8 px-6">
          <View className="items-center">
            <View className="relative">
              <Image
                source={profileImageSource}
                className="w-28 h-28 rounded-full border-4 border-white"
              />
              <TouchableOpacity
                className="absolute bottom-0 right-0 bg-white rounded-full p-2"
                onPress={handleChangeProfilePicture}
                disabled={uploadingImage}
              >
                {uploadingImage ? (
                  <ActivityIndicator size="small" />
                ) : (
                  <Ionicons name="camera" size={20} color="#3b82f6" />
                )}
              </TouchableOpacity>
            </View>

            <Text className="text-white text-2xl font-bold mt-4">
              {providerData?.name}
            </Text>

            <Text className="text-blue-100 text-base mt-1">
              {providerData?.email}
            </Text>

            <Text className="text-blue-100 text-sm mt-1">
              {providerData?.phone}
            </Text>
          </View>
        </View>

        <View className="flex-row mx-6 -mt-6 bg-white rounded-2xl shadow-sm border border-gray-200">
          {stats.map((stat, index) => (
            <View
              key={index}
              className={`flex-1 py-4 items-center ${
                index !== stats.length - 1 ? "border-r border-gray-200" : ""
              }`}
            >
              <View className="flex-row items-center mb-1">
                <Ionicons name={stat.icon} size={16} color="#3b82f6" />
                <Text className="text-2xl font-bold text-gray-800 ml-1">
                  {stat.value}
                </Text>
              </View>
              <Text className="text-sm text-gray-500">{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Other sections remain same */}
        <View className="mt-6 px-6">
          <Text className="text-lg font-semibold text-gray-800 mb-3">
            Account Settings
          </Text>
          <View className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            {menuItems.slice(0, 2).map((item, index) => (
              <TouchableOpacity
                key={item.id}
                onPress={() => router.push(item.route as any)}
                className={`flex-row items-center px-4 py-4 ${
                  index !== 0 ? "border-t border-gray-100" : ""
                }`}
              >
                <View
                  className="w-10 h-10 rounded-full items-center justify-center"
                  style={{ backgroundColor: `${item.color}15` }}
                >
                  <Ionicons name={item.icon} size={22} color={item.color} />
                </View>
                <Text className="flex-1 ml-4 text-base text-gray-800">
                  {item.title}
                </Text>
                <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Activity Section */}
        <View className="mt-6 px-6">
          <Text className="text-lg font-semibold text-gray-800 mb-3">
            Activity
          </Text>
          <View className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            {menuItems.slice(2, 4).map((item, index) => (
              <TouchableOpacity
                key={item.id}
                onPress={() => router.push(item.route as any)}
                className={`flex-row items-center px-4 py-4 ${
                  index !== 0 ? "border-t border-gray-100" : ""
                }`}
              >
                <View
                  className="w-10 h-10 rounded-full items-center justify-center"
                  style={{ backgroundColor: `${item.color}15` }}
                >
                  <Ionicons name={item.icon} size={22} color={item.color} />
                </View>
                <Text className="flex-1 ml-4 text-base text-gray-800">
                  {item.title}
                </Text>
                <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Preferences Section */}
        <View className="mt-6 px-6">
          <Text className="text-lg font-semibold text-gray-800 mb-3">
            Preferences
          </Text>
          <View className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            {menuItems.slice(4, 5).map((item) => (
              <TouchableOpacity
                key={item.id}
                onPress={() => router.push(item.route as any)}
                className="flex-row items-center px-4 py-4"
              >
                <View
                  className="w-10 h-10 rounded-full items-center justify-center"
                  style={{ backgroundColor: `${item.color}15` }}
                >
                  <Ionicons name={item.icon} size={22} color={item.color} />
                </View>
                <Text className="flex-1 ml-4 text-base text-gray-800">
                  {item.title}
                </Text>
                <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Support & Legal Section */}
        <View className="mt-6 px-6">
          <Text className="text-lg font-semibold text-gray-800 mb-3">
            Support & Legal
          </Text>
          <View className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            {menuItems.slice(5).map((item, index) => (
              <TouchableOpacity
                key={item.id}
                onPress={() => router.push(item.route as any)}
                className={`flex-row items-center px-4 py-4 ${
                  index !== 0 ? "border-t border-gray-100" : ""
                }`}
              >
                <View
                  className="w-10 h-10 rounded-full items-center justify-center"
                  style={{ backgroundColor: `${item.color}15` }}
                >
                  <Ionicons name={item.icon} size={22} color={item.color} />
                </View>
                <Text className="flex-1 ml-4 text-base text-gray-800">
                  {item.title}
                </Text>
                <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Logout Button */}
        <View className="px-6 mt-6 mb-8">
          <TouchableOpacity
            onPress={handleLogout}
            className="bg-red-50 border border-red-200 rounded-2xl py-4 flex-row items-center justify-center"
          >
            <Ionicons name="log-out-outline" size={24} color="#ef4444" />
            <Text className="text-red-600 text-base font-semibold ml-2">
              Logout
            </Text>
          </TouchableOpacity>
        </View>

        {/* Version Info */}
        <View className="items-center pb-8">
          <Text className="text-gray-400 text-sm">Version 1.0.0</Text>
        </View>
      </ScrollView>
    </View>
  );
};

export default ProfileScreen;

import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { signOut } from "firebase/auth";
import React from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { auth } from "../config/firebase";

interface MenuItem {
  id: number;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  onPress: () => void;
}

const AdminProfileScreen: React.FC = () => {
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
      { cancelable: true },
    );
  };

  const menuItems: MenuItem[] = [
    {
      id: 1,
      title: "Pending Approvals",
      icon: "shield-checkmark-outline",
      color: "#10b981",
      onPress: () => router.push("/admin/ApprovalsScreen"),
    },
    {
      id: 2,
      title: "User Management",
      icon: "people-outline",
      color: "#3b82f6",
      onPress: () => router.push("/admin/ApprovalsScreen"),
    },
    {
      id: 3,
      title: "System Settings",
      icon: "settings-outline",
      color: "#8b5cf6",
      onPress: () => router.push("/admin/ApprovalsScreen"),
    },
    {
      id: 4,
      title: "Help & Support",
      icon: "help-circle-outline",
      color: "#06b6d4",
      onPress: () => {},
    },
  ];

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="bg-emerald-600 pt-12 pb-8 px-6">
          <View className="items-center">
            <View className="w-28 h-28 rounded-full border-4 border-white bg-emerald-400 items-center justify-center">
              <Ionicons name="shield-checkmark" size={56} color="white" />
            </View>
            <Text className="text-white text-2xl font-bold mt-4">Admin</Text>
            <Text className="text-emerald-100 text-base mt-1">
              {auth.currentUser?.email}
            </Text>
            <View className="mt-3 bg-emerald-500 px-4 py-1 rounded-full">
              <Text className="text-white text-sm font-semibold">
                Administrator
              </Text>
            </View>
          </View>
        </View>

        {/* Admin Actions */}
        <View className="mt-6 px-6">
          <Text className="text-lg font-semibold text-gray-800 mb-3">
            Admin Panel
          </Text>
          <View className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={item.id}
                onPress={item.onPress}
                className={`flex-row items-center px-4 py-4 ${
                  index !== 0 ? "border-t border-gray-100" : ""
                }`}
              >
                <View
                  className="w-10 h-10 rounded-full items-center justify-center"
                  style={{ backgroundColor: `${item.color}20` }}
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

        {/* Logout */}
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

        <View className="items-center pb-8">
          <Text className="text-gray-400 text-sm">Version 1.0.0</Text>
        </View>
      </ScrollView>
    </View>
  );
};

export default AdminProfileScreen;

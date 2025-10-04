import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

const CustomerHomeScreen = () => {
  return (
    <View className="flex-1 bg-white">
      {/* This handles keyboard for the main content only */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View className="flex-1 justify-between p-6">
            {/* --- Main Content --- */}
            <View>
              {/* Logo and App Name */}
              <View className="flex-row items-center gap-2 mt-12 mb-6 justify-center">
                <Image
                  source={require("../assets/images/SwiftService.png")}
                  className="w-16 h-16"
                />
                <Text className="text-2xl font-bold">
                  <Text className="text-blue-700">Swift</Text>
                  <Text className="text-gray-700">Service</Text>
                </Text>
              </View>

              {/* Greeting + Notification */}
              <View className="flex-row items-center justify-between w-full mb-4">
                <View>
                  <Text className="text-2xl font-semibold text-gray-800">
                    <Text>Hey </Text>
                    <Text className="text-blue-700">Maduranga!</Text>
                  </Text>
                  <Text className="text-lg text-gray-500">
                    How’s your day going?
                  </Text>
                </View>
                <Ionicons
                  name="notifications-outline"
                  size={28}
                  color="black"
                />
              </View>

              {/* Search Bar */}
              <View className="flex-row items-center bg-gray-100 rounded-2xl px-4 py-3 mb-6 shadow-sm">
                <Ionicons name="search-outline" size={22} color="gray" />
                <TextInput
                  placeholder="Search for a service..."
                  placeholderTextColor="#9ca3af"
                  className="ml-3 flex-1 text-gray-700 text-base"
                  returnKeyType="search"
                />
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      {/* --- Fixed Bottom Navigation --- */}
      <View className="flex-row justify-around items-center bg-blue-600 py-3 rounded-t-3xl pb-6">
        <TouchableOpacity className="items-center">
          <Ionicons name="home" size={26} color="white" />
          <Text className="text-white text-xs mt-1">Home</Text>
        </TouchableOpacity>

        <TouchableOpacity className="items-center">
          <Ionicons name="clipboard" size={26} color="white" />
          <Text className="text-white text-xs mt-1">Bookings</Text>
        </TouchableOpacity>

        <TouchableOpacity className="items-center">
          <Ionicons name="chatbubbles" size={26} color="white" />
          <Text className="text-white text-xs mt-1">Messages</Text>
        </TouchableOpacity>

        <TouchableOpacity className="items-center">
          <Ionicons name="person" size={26} color="white" />
          <Text className="text-white text-xs mt-1">Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default CustomerHomeScreen;

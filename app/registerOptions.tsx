import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";
import colors from "tailwindcss/colors";

const RegisterOptions = () => {
  const router = useRouter();

  return (
    <View className="flex-1 justify-center items-center bg-white p-6">
      <View className="flex-row items-center gap-2 mb-12">
        <Image
          source={require("../assets/images/SwiftService.png")}
          className="w-32 h-32"
        />
        <Text className="text-4xl font-bold">
          <Text className="text-blue-700">Swift</Text>
          <Text className="text-gray-700">Service</Text>
        </Text>
      </View>

      <Image
        source={require("../assets/images/Register.png")}
        className="w-64 h-64 mb-12"
      />

      {/* Register as Customer Option */}
      <TouchableOpacity
        className="w-full bg-white border border-gray-200 rounded-lg p-4 mb-4 flex-row items-center"
        onPress={() => router.push("/(auth)/registerCustomer")}
        activeOpacity={0.7}
      >
        <View className="w-12 h-12 bg-blue-100 rounded-full items-center justify-center mr-4">
          <Ionicons name="person" size={24} color={colors.blue[600]} />
        </View>
        <View className="flex-1">
          <Text className="text-lg font-bold text-gray-800 mb-1">
            Register as a Customer
          </Text>
          <Text className="text-sm text-gray-500">
            Find and hire trusted tradespeople for your projects.
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={24} color={colors.gray[400]} />
      </TouchableOpacity>

      <TouchableOpacity
        className="w-full bg-white border border-gray-200 rounded-lg p-4 mb-6 flex-row items-center"
        onPress={() => router.push("/serviceProvider/registerProvider")}
        activeOpacity={0.7}
      >
        <View className="w-12 h-12 bg-blue-100 rounded-full items-center justify-center mr-4">
          <Ionicons name="construct" size={24} color={colors.blue[600]} />
        </View>
        <View className="flex-1">
          <Text className="text-lg font-bold text-gray-800 mb-1">
            Register as a Service Provider
          </Text>
          <Text className="text-sm text-gray-500">
            Offer your services and find your next job.
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={24} color={colors.gray[400]} />
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push("/login")}>
        <Text className="text-gray-600">
          Already have an account?{" "}
          <Text className="text-blue-500 font-semibold">Log In</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default RegisterOptions;

import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import {
  Alert,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { updateProviderStatus } from "../services/adminService";

const ProviderDetailScreen = () => {
  const params = useLocalSearchParams();

  // Parse provider passed as JSON string
  const provider = params.provider
    ? JSON.parse(params.provider as string)
    : null;

  if (!provider) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <Text className="text-gray-500">Provider not found</Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-4">
          <Text className="text-emerald-600 font-semibold">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleApprove = () => {
    Alert.alert("Approve Provider", `Approve ${provider.name}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Approve",
        onPress: async () => {
          const response = await updateProviderStatus(provider._id, true);
          if (response.success) {
            Alert.alert("Success", "Provider approved!", [
              { text: "OK", onPress: () => router.back() },
            ]);
          } else {
            Alert.alert("Error", "Failed to approve provider");
          }
        },
      },
    ]);
  };

  const handleReject = () => {
    Alert.alert(
      "Reject Provider",
      `Reject ${provider.name}? They will be marked as rejected.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reject",
          style: "destructive",
          onPress: async () => {
            const response = await updateProviderStatus(
              provider._id,
              false,
              "rejected",
            );
            if (response.success) {
              Alert.alert("Done", "Provider rejected.", [
                { text: "OK", onPress: () => router.back() },
              ]);
            } else {
              Alert.alert("Error", "Failed to reject provider");
            }
          },
        },
      ],
    );
  };

  const InfoRow = ({
    icon,
    label,
    value,
    color = "#3b82f6",
  }: {
    icon: any;
    label: string;
    value: string;
    color?: string;
  }) => (
    <View className="flex-row items-start py-3 border-b border-gray-100">
      <View
        className="w-10 h-10 rounded-full items-center justify-center"
        style={{ backgroundColor: `${color}15` }}
      >
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <View className="flex-1 ml-4">
        <Text className="text-xs text-gray-500 mb-0.5">{label}</Text>
        <Text className="text-sm font-semibold text-gray-800">
          {value || "N/A"}
        </Text>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-6 pt-12 pb-4 border-b border-gray-200">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-800">
            Provider Details
          </Text>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View className="bg-white mx-6 mt-6 rounded-2xl p-5 border border-gray-200 items-center">
          <Image
            source={{
              uri:
                provider.profilePhoto ||
                `https://i.pravatar.cc/150?u=${provider._id}`,
            }}
            className="w-24 h-24 rounded-full mb-3"
          />
          <Text className="text-xl font-bold text-gray-800">
            {provider.name}
          </Text>
          {provider.businessName && (
            <Text className="text-sm text-gray-500 mt-1">
              {provider.businessName}
            </Text>
          )}
          <View
            className={`mt-2 px-3 py-1 rounded-full ${
              provider.verified
                ? "bg-emerald-100"
                : provider.status === "rejected"
                  ? "bg-red-100"
                  : "bg-yellow-100"
            }`}
          >
            <Text
              className={`text-xs font-semibold ${
                provider.verified
                  ? "text-emerald-700"
                  : provider.status === "rejected"
                    ? "text-red-700"
                    : "text-yellow-700"
              }`}
            >
              {provider.verified
                ? "Verified"
                : provider.status === "rejected"
                  ? "Rejected"
                  : "Pending"}
            </Text>
          </View>
        </View>

        {/* Personal Info */}
        <View className="mx-6 mt-4 bg-white rounded-2xl p-4 border border-gray-200">
          <Text className="text-xs font-bold text-gray-500 mb-2">
            PERSONAL INFO
          </Text>
          <InfoRow
            icon="mail-outline"
            label="Email"
            value={provider.email}
            color="#3b82f6"
          />
          <InfoRow
            icon="call-outline"
            label="Phone"
            value={provider.phone}
            color="#10b981"
          />
        </View>

        {/* Business Info */}
        <View className="mx-6 mt-4 bg-white rounded-2xl p-4 border border-gray-200">
          <Text className="text-xs font-bold text-gray-500 mb-2">
            BUSINESS INFO
          </Text>
          {provider.businessName && (
            <InfoRow
              icon="business-outline"
              label="Business Name"
              value={provider.businessName}
              color="#8b5cf6"
            />
          )}
          {provider.licenseNumber && (
            <InfoRow
              icon="document-text-outline"
              label="License Number"
              value={provider.licenseNumber}
              color="#f59e0b"
            />
          )}
          <InfoRow
            icon="time-outline"
            label="Years of Experience"
            value={`${provider.yearsExperience} years`}
            color="#06b6d4"
          />
          <InfoRow
            icon="cash-outline"
            label="Hourly Rate"
            value={`$${provider.hourlyRate}/hr`}
            color="#10b981"
          />
          {provider.bio && (
            <View className="pt-3">
              <Text className="text-xs text-gray-500 mb-1">Bio</Text>
              <Text className="text-sm text-gray-700">{provider.bio}</Text>
            </View>
          )}
        </View>

        {/* Services */}
        <View className="mx-6 mt-4 bg-white rounded-2xl p-4 border border-gray-200">
          <Text className="text-xs font-bold text-gray-500 mb-3">
            SERVICES OFFERED
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {[
              ...(provider.services || []),
              ...(provider.customServices || []),
            ].map((service: string, index: number) => (
              <View
                key={index}
                className="bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full"
              >
                <Text className="text-xs font-semibold text-emerald-700">
                  {service}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Location */}
        <View className="mx-6 mt-4 bg-white rounded-2xl p-4 border border-gray-200">
          <Text className="text-xs font-bold text-gray-500 mb-2">LOCATION</Text>
          <InfoRow
            icon="location-outline"
            label="Address"
            value={provider.location?.address}
            color="#ef4444"
          />
          <InfoRow
            icon="map-outline"
            label="City"
            value={provider.location?.city}
            color="#ef4444"
          />
          <InfoRow
            icon="mail-outline"
            label="Postal Code"
            value={provider.location?.postalCode}
            color="#6b7280"
          />
          <InfoRow
            icon="radio-outline"
            label="Service Radius"
            value={`${provider.location?.serviceRadius} km`}
            color="#8b5cf6"
          />
        </View>

        {/* Stats */}
        <View className="mx-6 mt-4 bg-white rounded-2xl p-4 border border-gray-200">
          <Text className="text-xs font-bold text-gray-500 mb-3">STATS</Text>
          <View className="flex-row justify-around">
            <View className="items-center">
              <Text className="text-2xl font-bold text-gray-800">
                {provider.rating?.toFixed(1) || "0.0"}
              </Text>
              <Text className="text-xs text-gray-500 mt-1">Rating</Text>
            </View>
            <View className="w-px bg-gray-100" />
            <View className="items-center">
              <Text className="text-2xl font-bold text-gray-800">
                {provider.totalJobs || 0}
              </Text>
              <Text className="text-xs text-gray-500 mt-1">Jobs</Text>
            </View>
            <View className="w-px bg-gray-100" />
            <View className="items-center">
              <Text className="text-2xl font-bold text-gray-800">
                {provider.totalReviews || 0}
              </Text>
              <Text className="text-xs text-gray-500 mt-1">Reviews</Text>
            </View>
          </View>
        </View>

        <View className="h-36" />
      </ScrollView>

      {/* Action Buttons - only show if pending */}
      {!provider.verified && provider.status !== "rejected" && (
        <View className="bg-white px-6 py-4 border-t border-gray-200 flex-row gap-3">
          <TouchableOpacity
            onPress={handleReject}
            className="flex-1 bg-red-50 border border-red-200 py-4 rounded-xl flex-row items-center justify-center"
          >
            <Ionicons name="close-circle-outline" size={20} color="#ef4444" />
            <Text className="text-red-600 font-bold ml-2">Reject</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleApprove}
            className="flex-1 bg-emerald-500 py-4 rounded-xl flex-row items-center justify-center"
          >
            <Ionicons name="checkmark-circle-outline" size={20} color="white" />
            <Text className="text-white font-bold ml-2">Approve</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default ProviderDetailScreen;

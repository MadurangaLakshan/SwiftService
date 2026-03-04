import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAdmin } from "../context/AdminContext";

const ApprovalsScreen = () => {
  const {
    pendingProviders,
    loading,
    refreshList,
    approveProvider,
    rejectProvider,
  } = useAdmin();

  const handleReject = (id: string, name: string) => {
    Alert.alert(
      "Reject Provider",
      `Reject ${name}? They will be marked as rejected.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reject",
          style: "destructive",
          onPress: () => rejectProvider(id),
        },
      ],
    );
  };

  return (
    <View className="flex-1 bg-gray-50">
      <View className="px-6 pt-12 pb-6 bg-white border-b border-gray-100">
        <Text className="text-2xl font-bold text-gray-800">
          Pending Approvals
        </Text>
        <Text className="text-gray-500">
          {pendingProviders.length} application
          {pendingProviders.length !== 1 ? "s" : ""} to review
        </Text>
      </View>

      <ScrollView
        className="flex-1 px-6 pt-4"
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refreshList} />
        }
      >
        {loading ? (
          <ActivityIndicator size="large" color="#10b981" className="mt-10" />
        ) : pendingProviders.length > 0 ? (
          pendingProviders.map((provider) => (
            <View
              key={provider._id}
              className="bg-white rounded-2xl p-4 mb-4 border border-gray-200 shadow-sm"
            >
              <View className="flex-row items-center">
                <Image
                  source={{
                    uri:
                      provider.profilePhoto ||
                      `https://i.pravatar.cc/150?u=${provider._id}`,
                  }}
                  className="w-14 h-14 rounded-full"
                />
                <View className="ml-4 flex-1">
                  <Text className="text-lg font-bold text-gray-800">
                    {provider.name}
                  </Text>
                  <Text className="text-sm text-blue-600 font-medium">
                    {provider.services?.[0]}
                  </Text>
                  {provider.businessName && (
                    <Text className="text-xs text-gray-400">
                      {provider.businessName}
                    </Text>
                  )}
                </View>
                <View className="bg-yellow-100 border border-yellow-200 px-2 py-1 rounded-full">
                  <Text className="text-xs text-yellow-700 font-semibold">
                    Pending
                  </Text>
                </View>
              </View>

              {/* Quick info row */}
              <View className="flex-row mt-3 gap-2">
                <View className="flex-1 bg-gray-50 rounded-xl px-3 py-2 flex-row items-center">
                  <Ionicons name="time-outline" size={14} color="#6b7280" />
                  <Text className="text-xs text-gray-600 ml-1">
                    {provider.yearsExperience} yrs exp
                  </Text>
                </View>
                <View className="flex-1 bg-gray-50 rounded-xl px-3 py-2 flex-row items-center">
                  <Ionicons name="cash-outline" size={14} color="#6b7280" />
                  <Text className="text-xs text-gray-600 ml-1">
                    ${provider.hourlyRate}/hr
                  </Text>
                </View>
                <View className="flex-1 bg-gray-50 rounded-xl px-3 py-2 flex-row items-center">
                  <Ionicons name="location-outline" size={14} color="#6b7280" />
                  <Text
                    className="text-xs text-gray-600 ml-1"
                    numberOfLines={1}
                  >
                    {provider.location?.city}
                  </Text>
                </View>
              </View>

              <View className="mt-4 flex-row gap-2">
                {/* View Details */}
                <TouchableOpacity
                  onPress={() =>
                    router.push({
                      pathname: "/admin/ProviderDetailsScreen",
                      params: { provider: JSON.stringify(provider) },
                    })
                  }
                  className="flex-1 bg-gray-100 py-2.5 rounded-xl flex-row items-center justify-center"
                >
                  <Ionicons name="eye-outline" size={16} color="#374151" />
                  <Text className="text-gray-700 font-semibold ml-1.5">
                    View Details
                  </Text>
                </TouchableOpacity>

                {/* Reject */}
                <TouchableOpacity
                  onPress={() => handleReject(provider._id, provider.name)}
                  className="flex-1 bg-red-50 border border-red-200 py-2.5 rounded-xl flex-row items-center justify-center"
                >
                  <Ionicons
                    name="close-circle-outline"
                    size={16}
                    color="#ef4444"
                  />
                  <Text className="text-red-600 font-semibold ml-1.5">
                    Reject
                  </Text>
                </TouchableOpacity>

                {/* Approve */}
                <TouchableOpacity
                  onPress={() => approveProvider(provider._id)}
                  className="flex-1 bg-emerald-500 py-2.5 rounded-xl flex-row items-center justify-center"
                >
                  <Ionicons name="checkmark-circle" size={16} color="white" />
                  <Text className="text-white font-bold ml-1.5">Approve</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        ) : (
          <View className="items-center justify-center py-20">
            <Ionicons
              name="checkmark-done-circle-outline"
              size={80}
              color="#d1d5db"
            />
            <Text className="text-gray-400 mt-4 text-lg font-medium">
              No pending applications
            </Text>
            <Text className="text-gray-400 text-sm mt-1">
              All providers have been reviewed
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default ApprovalsScreen;

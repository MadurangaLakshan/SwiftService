import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAdmin } from "../context/AdminContext";

const ApprovalsScreen = () => {
  const { pendingProviders, loading, refreshList, approveProvider } =
    useAdmin();

  return (
    <View className="flex-1 bg-gray-50">
      <View className="px-6 pt-12 pb-6 bg-white border-b border-gray-100">
        <Text className="text-2xl font-bold text-gray-800">
          Pending Approvals
        </Text>
        <Text className="text-gray-500">
          Review new service provider applications
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
                    {provider.services[0]}
                  </Text>
                </View>
              </View>

              <View className="mt-4 flex-row justify-between items-center">
                <TouchableOpacity className="bg-gray-100 px-4 py-2 rounded-xl">
                  <Text className="text-gray-600 font-semibold">
                    View Documents
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => approveProvider(provider._id)}
                  className="bg-emerald-500 px-6 py-2 rounded-xl flex-row items-center"
                >
                  <Ionicons name="checkmark-circle" size={18} color="white" />
                  <Text className="text-white font-bold ml-2">Approve</Text>
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
            <Text className="text-gray-400 mt-4 text-lg">
              No pending applications
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default ApprovalsScreen;

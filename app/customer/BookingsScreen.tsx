import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { auth } from "../config/firebase";
import { getCustomerBookings } from "../services/apiService";

interface Booking {
  _id: string;
  customerId: string;
  providerId: string;
  serviceType: string;
  category: string;
  scheduledDate: string;
  timeSlot: string;
  serviceAddress: string;
  additionalNotes?: string;
  status: "pending" | "confirmed" | "in-progress" | "completed" | "cancelled";
  pricing: {
    hourlyRate: number;
    estimatedHours: number;
    platformFee: number;
    totalAmount: number;
  };
  customerDetails: {
    name: string;
    phone: string;
    email: string;
  };
  providerDetails: {
    name: string;
    phone: string;
    email: string;
    profilePhoto?: string;
  };
  createdAt: string;
  updatedAt: string;
}

const BookingsScreen = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "all" | "pending" | "confirmed" | "completed"
  >("all");

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      if (!refreshing) {
        setLoading(true);
      }
      const currentUser = auth.currentUser;

      if (!currentUser) {
        console.error("No authenticated user");
        return;
      }

      const response = await getCustomerBookings(currentUser.uid);

      if (response.success && response.data) {
        setBookings(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchBookings();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-700 border-green-200";
      case "pending":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "in-progress":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "completed":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "cancelled":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "confirmed":
        return "checkmark-circle";
      case "pending":
        return "time";
      case "in-progress":
        return "hourglass";
      case "completed":
        return "checkmark-done-circle";
      case "cancelled":
        return "close-circle";
      default:
        return "help-circle";
    }
  };

  const filteredBookings = bookings.filter((booking) => {
    if (activeTab === "all") return true;
    return booking.status === activeTab;
  });

  const renderBookingCard = ({ item }: { item: Booking }) => (
    <TouchableOpacity
      onPress={() =>
        router.push({
          pathname: "/customer/BookingDetailsScreen",
          params: { bookingId: item._id },
        })
      }
      className="bg-white mx-6 mb-4 rounded-2xl border border-gray-200 overflow-hidden"
    >
      {/* Status Badge */}
      <View className="px-4 pt-4 pb-3 border-b border-gray-100">
        <View className="flex-row items-center justify-between">
          <View
            className={`flex-row items-center px-3 py-1.5 rounded-full border ${getStatusColor(
              item.status
            )}`}
          >
            <Ionicons
              name={getStatusIcon(item.status)}
              size={16}
              color={
                item.status === "confirmed"
                  ? "#15803d"
                  : item.status === "pending"
                  ? "#a16207"
                  : item.status === "in-progress"
                  ? "#7c3aed"
                  : item.status === "completed"
                  ? "#1e40af"
                  : "#b91c1c"
              }
            />
            <Text
              className={`ml-1.5 text-sm font-semibold capitalize ${
                item.status === "confirmed"
                  ? "text-green-700"
                  : item.status === "pending"
                  ? "text-yellow-700"
                  : item.status === "in-progress"
                  ? "text-purple-700"
                  : item.status === "completed"
                  ? "text-blue-700"
                  : "text-red-700"
              }`}
            >
              {item.status}
            </Text>
          </View>
          <Text className="text-xs text-gray-500">
            {formatDate(item.createdAt)}
          </Text>
        </View>
      </View>

      {/* Provider Info */}
      <View className="p-4">
        <View className="flex-row items-center mb-3">
          <Image
            source={{
              uri:
                item.providerDetails.profilePhoto ||
                `https://i.pravatar.cc/150?u=${item.providerId}`,
            }}
            className="w-12 h-12 rounded-xl"
          />
          <View className="flex-1 ml-3">
            <Text className="text-base font-bold text-gray-800">
              {item.providerDetails.name}
            </Text>
            <Text className="text-sm text-gray-600">{item.serviceType}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
        </View>

        {/* Booking Details */}
        <View className="space-y-2">
          <View className="flex-row items-center">
            <Ionicons name="calendar-outline" size={16} color="#6b7280" />
            <Text className="text-sm text-gray-700 ml-2">
              {formatDate(item.scheduledDate)} • {item.timeSlot}
            </Text>
          </View>
          <View className="flex-row items-center">
            <Ionicons name="location-outline" size={16} color="#6b7280" />
            <Text
              className="text-sm text-gray-700 ml-2 flex-1"
              numberOfLines={1}
            >
              {item.serviceAddress}
            </Text>
          </View>
          <View className="flex-row items-center justify-between pt-2 border-t border-gray-100">
            <Text className="text-sm text-gray-600">Total Amount</Text>
            <Text className="text-lg font-bold text-blue-600">
              ${item.pricing.totalAmount}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View className="flex-1 items-center justify-center px-6 py-12">
      <View className="w-24 h-24 bg-gray-100 rounded-full items-center justify-center mb-4">
        <Ionicons name="calendar-outline" size={48} color="#9ca3af" />
      </View>
      <Text className="text-xl font-bold text-gray-800 mb-2">
        No Bookings Yet
      </Text>
      <Text className="text-center text-gray-600 mb-6">
        {activeTab === "all"
          ? "You haven't made any bookings yet. Start exploring services!"
          : `You don't have any ${activeTab} bookings.`}
      </Text>
      <TouchableOpacity
        onPress={() => router.push("/customer/HomeScreen")}
        className="bg-blue-600 px-6 py-3 rounded-xl"
      >
        <Text className="text-white font-semibold">Browse Services</Text>
      </TouchableOpacity>
    </View>
  );

  const ListHeaderComponent = () => (
    <>
      {/* Filter Tabs */}
      <View className="bg-white px-6 pb-4 border-b border-gray-200">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="flex-row"
        >
          {[
            { key: "all", label: "All" },
            { key: "pending", label: "Pending" },
            { key: "confirmed", label: "Confirmed" },
            { key: "completed", label: "Completed" },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveTab(tab.key as any)}
              className={`mr-3 px-4 py-2 rounded-xl ${
                activeTab === tab.key ? "bg-blue-600" : "bg-gray-100"
              }`}
            >
              <Text
                className={`font-semibold ${
                  activeTab === tab.key ? "text-white" : "text-gray-700"
                }`}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Section Title */}
      <View className="px-6 pt-4 pb-2">
        <Text className="text-lg font-semibold text-gray-800">
          {activeTab === "all"
            ? "All Bookings"
            : `${
                activeTab.charAt(0).toUpperCase() + activeTab.slice(1)
              } Bookings`}{" "}
          ({filteredBookings.length})
        </Text>
      </View>
    </>
  );

  if (loading) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="text-gray-500 mt-4">Loading bookings...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header - Fixed at top, doesn't scroll */}
      <View className="bg-white px-6 pt-12 pb-4">
        <View className="flex-row items-center justify-between">
          <Text className="text-2xl font-bold text-gray-800">My Bookings</Text>
          <TouchableOpacity>
            <Ionicons name="search-outline" size={24} color="#6b7280" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Bookings List with tabs in header - this scrolls */}
      <FlatList
        data={filteredBookings}
        renderItem={renderBookingCard}
        keyExtractor={(item) => item._id}
        ListHeaderComponent={ListHeaderComponent}
        stickyHeaderIndices={[0]}
        contentContainerStyle={
          filteredBookings.length === 0 ? { flex: 1 } : { paddingBottom: 16 }
        }
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#3b82f6"
            colors={["#3b82f6"]}
            progressViewOffset={0}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

export default BookingsScreen;

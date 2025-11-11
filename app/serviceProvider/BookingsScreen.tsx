import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useProvider } from "../context/ProviderContext";
import { getProviderBookings } from "../services/apiService";

interface Booking {
  _id: string;
  customerDetails: {
    name: string;
    phone: string;
    email: string;
    image?: string;
  };
  category: string;
  status: string;
  scheduledDate: string;
  timeSlot: string;
  pricing: {
    totalAmount: number;
  };
  serviceAddress: string;
}

const BookingsScreen = () => {
  const { providerData, loading: providerLoading } = useProvider();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = React.useState("all");

  const statusFilters = [
    "all",
    "pending",
    "confirmed",
    "in-progress",
    "completed",
    "cancelled",
  ];

  useEffect(() => {
    if (providerData?.userId) {
      fetchBookings();
    }
  }, [providerData]);

  const fetchBookings = async () => {
    try {
      if (!refreshing) {
        setLoading(true);
      }
      setError(null);
      const response = await getProviderBookings(providerData!.userId);

      if (response.data.success) {
        setBookings(response.data.data);
      } else {
        setError(response.data.error || "Failed to fetch bookings");
      }
    } catch (err: any) {
      console.error("Error fetching bookings:", err);
      setError(err.message || "An error occurred");
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
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return "Tomorrow";
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }
  };

  const filteredBookings =
    selectedStatus === "all"
      ? bookings
      : bookings.filter((booking) => booking.status === selectedStatus);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "confirmed":
        return "bg-blue-100 text-blue-700";
      case "in-progress":
        return "bg-purple-100 text-purple-700";
      case "completed":
        return "bg-green-100 text-green-700";
      case "cancelled":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const formatStatusLabel = (status: string) => {
    if (status === "in-progress") return "In Progress";
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  if (providerLoading || loading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="text-gray-600 mt-4">Loading Bookings...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-white px-6 pt-12 pb-4 border-b border-gray-200">
        <Text className="text-2xl font-bold text-gray-800 mb-4">
          My Bookings
        </Text>

        <View className="mb-4">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="flex-row"
          >
            {statusFilters.map((status, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => setSelectedStatus(status)}
                className={`mr-3 px-5 py-2.5 rounded-full ${
                  selectedStatus === status ? "bg-blue-600" : "bg-gray-200"
                }`}
              >
                <Text
                  className={`font-medium capitalize ${
                    selectedStatus === status ? "text-white" : "text-gray-700"
                  }`}
                >
                  {formatStatusLabel(status)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      <ScrollView
        className="flex-1 px-6 py-4"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#3b82f6"
            colors={["#3b82f6"]}
          />
        }
      >
        <Text className="text-lg font-semibold text-gray-800 mb-4 capitalize">
          {formatStatusLabel(selectedStatus)} ({filteredBookings.length})
        </Text>

        {error && (
          <View className="bg-red-50 rounded-2xl p-4 mb-4 border border-red-200">
            <Text className="text-red-600 text-sm">{error}</Text>
            <TouchableOpacity
              onPress={fetchBookings}
              className="bg-red-600 rounded-xl px-4 py-2 mt-2 self-start"
            >
              <Text className="text-white font-semibold">Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {filteredBookings.length > 0 ? (
          filteredBookings.map((booking) => (
            <TouchableOpacity
              key={booking._id}
              className="bg-white rounded-2xl p-4 mb-4 border border-gray-200 shadow-sm"
              onPress={() =>
                router.push({
                  pathname: "/serviceProvider/BookingDetailsScreen",
                  params: { bookingId: booking._id },
                })
              }
            >
              <View className="flex-row">
                <Image
                  source={{
                    uri:
                      booking.customerDetails.image ||
                      `https://i.pravatar.cc/150?u=${booking.customerDetails.email}`,
                  }}
                  className="w-16 h-16 rounded-xl"
                />

                <View className="flex-1 ml-4">
                  <View className="flex-row items-center justify-between mb-1">
                    <View className="flex-row items-center">
                      <Text className="text-lg font-semibold text-gray-800">
                        {booking.customerDetails.name}
                      </Text>
                    </View>
                  </View>

                  <Text className="text-sm text-gray-600 mb-2">
                    {booking.category}
                  </Text>

                  <View className="flex-row items-center mb-2">
                    <Ionicons
                      name="location-outline"
                      size={14}
                      color="#6b7280"
                    />
                    <Text className="text-xs text-gray-500 ml-1">
                      {booking.serviceAddress}
                    </Text>
                  </View>

                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center">
                      <Ionicons
                        name="calendar-outline"
                        size={14}
                        color="#6b7280"
                      />
                      <Text className="text-xs text-gray-500 ml-1">
                        {formatDate(booking.scheduledDate)} • {booking.timeSlot}
                      </Text>
                    </View>
                    <View
                      className={`rounded-full px-3 py-1 ${getStatusColor(
                        booking.status
                      )}`}
                    >
                      <Text className="text-xs font-semibold capitalize">
                        {formatStatusLabel(booking.status)}
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row items-center justify-between mt-2 pt-2 border-t border-gray-100">
                    <Text className="text-sm font-semibold text-green-600">
                      ${booking.pricing.totalAmount}
                    </Text>
                    {booking.status === "pending" && (
                      <View className="flex-row gap-2">
                        <TouchableOpacity className="bg-green-600 rounded-lg px-3 py-1.5">
                          <Text className="text-white text-xs font-semibold">
                            Accept
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity className="bg-red-100 rounded-lg px-3 py-1.5">
                          <Text className="text-red-600 text-xs font-semibold">
                            Decline
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}
                    {booking.status === "confirmed" && (
                      <TouchableOpacity className="bg-purple-600 rounded-lg px-3 py-1.5">
                        <Text className="text-white text-xs font-semibold">
                          Start Job
                        </Text>
                      </TouchableOpacity>
                    )}
                    {booking.status === "in-progress" && (
                      <TouchableOpacity className="bg-green-600 rounded-lg px-3 py-1.5">
                        <Text className="text-white text-xs font-semibold">
                          Complete
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View className="items-center justify-center py-20">
            <Ionicons name="calendar-outline" size={64} color="#d1d5db" />
            <Text className="text-gray-500 text-base mt-4">
              No {selectedStatus.toLowerCase()} bookings
            </Text>
          </View>
        )}

        <View className="h-4" />
      </ScrollView>
    </View>
  );
};

export default BookingsScreen;

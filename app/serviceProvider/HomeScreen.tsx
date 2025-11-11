import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
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

const HomeScreen = () => {
  const { providerData, loading: providerLoading } = useProvider();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (providerData?.userId) {
      fetchBookings();
    }
  }, [providerData]);

  const fetchBookings = async () => {
    try {
      if (!refreshing) setLoading(true);
      setError(null);
      const response = await getProviderBookings(providerData!.userId);

      if (response.success) {
        const recentBookings = response.data.data.slice(0, 3);
        setBookings(recentBookings);
      } else {
        setError(response.error || "Failed to fetch bookings");
      }
    } catch (err: any) {
      console.error("Error fetching bookings:", err);
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchBookings();
  };

  const pendingRequests = bookings.filter((b) => b.status === "pending");
  const pendingCount = pendingRequests.length;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === tomorrow.toDateString()) return "Tomorrow";
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

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
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusLabel = (status: string) => {
    return status === "in-progress"
      ? "In Progress"
      : status.charAt(0).toUpperCase() + status.slice(1);
  };

  const performanceData = {
    jobs: bookings.filter((b) => b.status === "completed").length,
    earned: bookings
      .filter((b) => b.status === "completed")
      .reduce((sum, b) => sum + b.pricing.totalAmount, 0),
    rating: 4.8,
  };

  if (providerLoading || loading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="text-gray-600 mt-4">Loading...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View className="flex-1">
            {/* HEADER */}
            <View className="px-6 pt-16">
              <View className="flex-row items-center justify-between w-full mb-6">
                <View>
                  <Text className="text-2xl font-semibold text-gray-800">
                    Welcome back,
                  </Text>
                  <Text className="text-2xl font-bold text-blue-700">
                    {providerData?.name ?? "Provider"}
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() =>
                    router.push("../serviceProvider/NotificationScreen")
                  }
                >
                  <View>
                    <Ionicons
                      name="notifications-outline"
                      size={28}
                      color="black"
                    />
                    {pendingCount > 0 && (
                      <View className="absolute -top-1 -right-1 bg-red-500 rounded-full w-5 h-5 items-center justify-center">
                        <Text className="text-white text-xs font-bold">
                          {pendingCount}
                        </Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              </View>

              {/* WELCOME CARD */}
              <View className="bg-blue-600 rounded-2xl p-6 mb-6">
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text className="text-white text-lg font-bold mb-2">
                      Ready to work today?
                    </Text>
                    <Text className="text-blue-100 text-sm mb-4">
                      You have {pendingCount} pending booking request
                      {pendingCount !== 1 ? "s" : ""}.
                    </Text>
                    <TouchableOpacity
                      onPress={() =>
                        router.push("../serviceProvider/BookingsScreen")
                      }
                      className="bg-white rounded-xl px-4 py-2 self-start"
                    >
                      <Text className="text-blue-600 font-semibold">
                        View Requests
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <View className="w-20 h-20 bg-blue-500 rounded-full items-center justify-center">
                    <Ionicons name="briefcase" size={40} color="white" />
                  </View>
                </View>
              </View>
            </View>

            {/* MAIN SCROLL */}
            <ScrollView
              className="flex-1"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 24 }}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor="#3b82f6"
                  colors={["#3b82f6"]}
                />
              }
            >
              {/* Performance Summary */}
              <View className="bg-gray-50 rounded-2xl p-4 my-4 border border-gray-200">
                <Text className="text-sm font-semibold text-gray-500 uppercase mb-3">
                  Overall Performance
                </Text>
                <View className="flex-row justify-between">
                  <View className="items-center">
                    <Text className="text-2xl font-bold text-gray-800">
                      {performanceData.jobs}
                    </Text>
                    <Text className="text-xs text-gray-600">Jobs</Text>
                  </View>
                  <View className="items-center">
                    <Text className="text-2xl font-bold text-green-600">
                      ${performanceData.earned}
                    </Text>
                    <Text className="text-xs text-gray-600">Earned</Text>
                  </View>
                  <View className="items-center">
                    <Text className="text-2xl font-bold text-blue-600">
                      {performanceData.rating}
                    </Text>
                    <Text className="text-xs text-gray-600">Rating</Text>
                  </View>
                </View>
              </View>

              {/* Recent Bookings */}
              <View className="flex-row items-center justify-between mb-3 mt-4">
                <Text className="text-lg font-semibold text-gray-800">
                  Recent Bookings
                </Text>
                <TouchableOpacity
                  onPress={() =>
                    router.push("../serviceProvider/BookingsScreen")
                  }
                >
                  <Text className="text-blue-600 font-medium">See All</Text>
                </TouchableOpacity>
              </View>

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

              {bookings.length === 0 && !error ? (
                <View className="items-center justify-center py-12 bg-gray-50 rounded-2xl">
                  <Ionicons name="calendar-outline" size={48} color="#d1d5db" />
                  <Text className="text-gray-500 text-base mt-4">
                    No bookings yet
                  </Text>
                </View>
              ) : (
                bookings.map((booking) => (
                  <TouchableOpacity
                    key={booking._id}
                    className="bg-white rounded-2xl p-4 mb-3 border border-gray-100 shadow-sm"
                    onPress={() =>
                      router.push({
                        pathname: "/serviceProvider/BookingDetailsScreen",
                        params: { bookingId: booking._id },
                      })
                    }
                  >
                    <View className="flex-row">
                      <View className="w-14 h-14 rounded-xl bg-blue-100 items-center justify-center">
                        <Text className="text-2xl">👤</Text>
                      </View>

                      <View className="flex-1 ml-4">
                        <View className="flex-row items-center justify-between mb-1">
                          <View className="flex-row items-center">
                            <Text className="text-base font-semibold text-gray-800">
                              {booking.customerDetails.name}
                            </Text>
                            {booking.status === "pending" && (
                              <View className="ml-2 bg-red-100 rounded-full px-2 py-0.5">
                                <Text className="text-xs text-red-600 font-semibold">
                                  NEW
                                </Text>
                              </View>
                            )}
                          </View>
                        </View>

                        <Text className="text-sm text-gray-600 mb-2">
                          {booking.category}
                        </Text>

                        <View className="flex-row items-center justify-between">
                          <View className="flex-row items-center">
                            <Ionicons
                              name="time-outline"
                              size={14}
                              color="#6b7280"
                            />
                            <Text className="text-xs text-gray-500 ml-1">
                              {formatDate(booking.scheduledDate)} •{" "}
                              {booking.timeSlot}
                            </Text>
                          </View>
                          <View
                            className={`rounded-full px-3 py-1 ${getStatusColor(
                              booking.status
                            )}`}
                          >
                            <Text className="text-xs font-semibold">
                              {getStatusLabel(booking.status)}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))
              )}

              {/* Tips */}
              <View className="bg-yellow-50 rounded-2xl p-4 mb-6 border border-yellow-200">
                <View className="flex-row items-start">
                  <View className="w-10 h-10 bg-yellow-100 rounded-full items-center justify-center mr-3">
                    <Ionicons name="bulb" size={24} color="#f59e0b" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-gray-800 mb-1">
                      Pro Tip
                    </Text>
                    <Text className="text-sm text-gray-600">
                      Respond to booking requests within 1 hour to increase your
                      acceptance rate and visibility!
                    </Text>
                  </View>
                </View>
              </View>

              <View className="h-4" />
            </ScrollView>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </View>
  );
};

export default HomeScreen;

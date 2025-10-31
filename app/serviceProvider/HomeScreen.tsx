import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useProvider } from "../context/ProviderContext";

const HomeScreen = () => {
  const [selectedStatus, setSelectedStatus] = React.useState("All");
  const { providerData, loading } = useProvider();

  const statusFilters = [
    "All",
    "Pending",
    "Confirmed",
    "In Progress",
    "Completed",
  ];

  // Mock bookings data - replace with actual API call
  const bookings = [
    {
      id: 1,
      customerName: "Kamal Perera",
      service: "Electrical Wiring",
      status: "Pending",
      date: "2025-11-01",
      time: "10:00 AM",
      location: "Colombo 03",
      price: "$150",
      customerImage: "https://i.pravatar.cc/150?img=8",
      urgent: true,
    },
    {
      id: 2,
      customerName: "Nimal Silva",
      service: "Smart Home Installation",
      status: "Confirmed",
      date: "2025-11-02",
      time: "2:00 PM",
      location: "Nugegoda",
      price: "$200",
      customerImage: "https://i.pravatar.cc/150?img=15",
      urgent: false,
    },
    {
      id: 3,
      customerName: "Anura Fernando",
      service: "Electrical Repair",
      status: "In Progress",
      date: "2025-10-31",
      time: "9:00 AM",
      location: "Dehiwala",
      price: "$80",
      customerImage: "https://i.pravatar.cc/150?img=33",
      urgent: false,
    },
    {
      id: 4,
      customerName: "Saman Jayawardena",
      service: "Solar Panel Installation",
      status: "Pending",
      date: "2025-11-03",
      time: "11:00 AM",
      location: "Maharagama",
      price: "$500",
      customerImage: "https://i.pravatar.cc/150?img=60",
      urgent: false,
    },
    {
      id: 5,
      customerName: "Ruwan Wickramasinghe",
      service: "Electrical Maintenance",
      status: "Completed",
      date: "2025-10-28",
      time: "3:00 PM",
      location: "Mount Lavinia",
      price: "$120",
      customerImage: "https://i.pravatar.cc/150?img=25",
      urgent: false,
    },
  ];

  const stats = {
    todayBookings: bookings.filter((b) => b.date === "2025-10-31").length,
    pendingBookings: bookings.filter((b) => b.status === "Pending").length,
    monthlyEarnings: "$2,450",
    rating: providerData?.rating || 4.8,
  };

  const filteredBookings =
    selectedStatus === "All"
      ? bookings
      : bookings.filter((booking) => booking.status === selectedStatus);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending":
        return "bg-yellow-100 text-yellow-700";
      case "Confirmed":
        return "bg-blue-100 text-blue-700";
      case "In Progress":
        return "bg-purple-100 text-purple-700";
      case "Completed":
        return "bg-green-100 text-green-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <View className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View className="flex-1">
            <View className="px-6">
              <View className="flex-row items-center gap-2 mt-12 mb-6 justify-center">
                <Image
                  source={require("../../assets/images/SwiftService.png")}
                  className="w-16 h-16"
                />
                <Text className="text-2xl font-bold">
                  <Text className="text-blue-700">Swift</Text>
                  <Text className="text-gray-700">Service</Text>
                  <Text className="text-xs text-gray-500"> Pro</Text>
                </Text>
              </View>

              <View className="flex-row items-center justify-between w-full mb-4">
                <View>
                  <Text className="text-2xl font-semibold text-gray-800">
                    <Text>Welcome back, </Text>
                    <Text className="text-blue-700">
                      {providerData?.name ?? "Provider"}
                    </Text>
                  </Text>
                  <Text className="text-lg text-gray-500">
                    Ready to work today?
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
                    {stats.pendingBookings > 0 && (
                      <View className="absolute -top-1 -right-1 bg-red-500 rounded-full w-5 h-5 items-center justify-center">
                        <Text className="text-white text-xs font-bold">
                          {stats.pendingBookings}
                        </Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              </View>

              {/* Stats Cards */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="mb-6"
              >
                <View className="bg-blue-50 rounded-2xl p-4 mr-3 w-36">
                  <Ionicons name="calendar-outline" size={24} color="#3b82f6" />
                  <Text className="text-2xl font-bold text-gray-800 mt-2">
                    {stats.todayBookings}
                  </Text>
                  <Text className="text-sm text-gray-600">Today</Text>
                </View>

                <View className="bg-yellow-50 rounded-2xl p-4 mr-3 w-36">
                  <Ionicons name="time-outline" size={24} color="#f59e0b" />
                  <Text className="text-2xl font-bold text-gray-800 mt-2">
                    {stats.pendingBookings}
                  </Text>
                  <Text className="text-sm text-gray-600">Pending</Text>
                </View>

                <View className="bg-green-50 rounded-2xl p-4 mr-3 w-36">
                  <Ionicons name="cash-outline" size={24} color="#10b981" />
                  <Text className="text-2xl font-bold text-gray-800 mt-2">
                    {stats.monthlyEarnings}
                  </Text>
                  <Text className="text-sm text-gray-600">This Month</Text>
                </View>

                <View className="bg-purple-50 rounded-2xl p-4 w-36">
                  <Ionicons name="star-outline" size={24} color="#8b5cf6" />
                  <Text className="text-2xl font-bold text-gray-800 mt-2">
                    {stats.rating}
                  </Text>
                  <Text className="text-sm text-gray-600">Rating</Text>
                </View>
              </ScrollView>

              <View className="mb-4">
                <Text className="text-lg font-semibold text-gray-800 mb-3">
                  Filter Bookings 📋
                </Text>
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
                        selectedStatus === status
                          ? "bg-blue-600"
                          : "bg-gray-200"
                      }`}
                    >
                      <Text
                        className={`font-medium ${
                          selectedStatus === status
                            ? "text-white"
                            : "text-gray-700"
                        }`}
                      >
                        {status}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            <ScrollView
              className="flex-1 px-6"
              showsVerticalScrollIndicator={false}
            >
              <Text className="text-lg font-semibold text-gray-800 mb-4">
                {selectedStatus === "All"
                  ? "All Bookings"
                  : `${selectedStatus} Bookings`}
              </Text>

              {filteredBookings.length > 0 ? (
                filteredBookings.map((booking) => (
                  <TouchableOpacity
                    key={booking.id}
                    className="bg-white rounded-2xl p-4 mb-4 border border-gray-200 shadow-sm"
                    onPress={() =>
                      router.push(`../provider/BookingDetail/${booking.id}`)
                    }
                  >
                    <View className="flex-row">
                      <Image
                        source={{ uri: booking.customerImage }}
                        className="w-16 h-16 rounded-xl"
                      />

                      <View className="flex-1 ml-4">
                        <View className="flex-row items-center justify-between mb-1">
                          <View className="flex-row items-center">
                            <Text className="text-lg font-semibold text-gray-800">
                              {booking.customerName}
                            </Text>
                            {booking.urgent && (
                              <View className="ml-2 bg-red-100 rounded-full px-2 py-0.5">
                                <Text className="text-xs text-red-600 font-semibold">
                                  URGENT
                                </Text>
                              </View>
                            )}
                          </View>
                        </View>

                        <Text className="text-sm text-gray-600 mb-2">
                          {booking.service}
                        </Text>

                        <View className="flex-row items-center mb-2">
                          <Ionicons
                            name="location-outline"
                            size={14}
                            color="#6b7280"
                          />
                          <Text className="text-xs text-gray-500 ml-1">
                            {booking.location}
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
                              {booking.date} • {booking.time}
                            </Text>
                          </View>
                          <View
                            className={`rounded-full px-3 py-1 ${getStatusColor(
                              booking.status
                            )}`}
                          >
                            <Text className="text-xs font-semibold">
                              {booking.status}
                            </Text>
                          </View>
                        </View>

                        <View className="flex-row items-center justify-between mt-2 pt-2 border-t border-gray-100">
                          <Text className="text-sm font-semibold text-green-600">
                            {booking.price}
                          </Text>
                          {booking.status === "Pending" && (
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
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))
              ) : (
                <View className="items-center justify-center py-12">
                  <Ionicons name="calendar-outline" size={64} color="#d1d5db" />
                  <Text className="text-gray-500 text-base mt-4">
                    No {selectedStatus.toLowerCase()} bookings
                  </Text>
                </View>
              )}

              <View className="h-4" />
            </ScrollView>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </View>
  );
};

export default HomeScreen;

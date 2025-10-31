import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";

type Booking = {
  id: number;
  provider: string;
  service: string;
  category: string;
  date: string;
  time: string;
  price: string;
  status: string;
  image: string;
  address: string;
  rated?: boolean;
  reason?: string;
};

const BookingsScreen = () => {
  const [activeTab, setActiveTab] = React.useState<
    "upcoming" | "completed" | "cancelled"
  >("upcoming");

  const bookings: {
    [key in "upcoming" | "completed" | "cancelled"]: Booking[];
  } = {
    upcoming: [
      {
        id: 1,
        provider: "John Silva",
        service: "Electrical Services",
        category: "Wiring Installation",
        date: "Oct 10, 2025",
        time: "2:00 PM - 4:00 PM",
        price: "$100",
        status: "confirmed",
        image: "https://i.pravatar.cc/150?img=12",
        address: "123 Main Street, Colombo",
      },
      {
        id: 2,
        provider: "Sarah Perera",
        service: "Plumbing Services",
        category: "Pipe Repair",
        date: "Oct 12, 2025",
        time: "10:00 AM - 12:00 PM",
        price: "$90",
        status: "pending",
        image: "https://i.pravatar.cc/150?img=45",
        address: "456 Lake Road, Kandy",
      },
      {
        id: 3,
        provider: "Ahmed Hassan",
        service: "HVAC Services",
        category: "AC Installation",
        date: "Oct 15, 2025",
        time: "9:00 AM - 1:00 PM",
        price: "$260",
        status: "confirmed",
        image: "https://i.pravatar.cc/150?img=52",
        address: "789 Beach Avenue, Galle",
      },
    ],
    completed: [
      {
        id: 4,
        provider: "Mike Fernando",
        service: "Construction Work",
        category: "Wall Renovation",
        date: "Oct 05, 2025",
        time: "8:00 AM - 5:00 PM",
        price: "$480",
        status: "completed",
        image: "https://i.pravatar.cc/150?img=33",
        address: "321 Hill Street, Nuwara Eliya",
        rated: true,
      },
      {
        id: 5,
        provider: "Lisa Jayawardena",
        service: "Painting Services",
        category: "Interior Painting",
        date: "Sep 28, 2025",
        time: "9:00 AM - 4:00 PM",
        price: "$280",
        status: "completed",
        image: "https://i.pravatar.cc/150?img=47",
        address: "654 Garden Lane, Colombo",
        rated: false,
      },
    ],
    cancelled: [
      {
        id: 6,
        provider: "David Kumar",
        service: "Carpentry Services",
        category: "Furniture Assembly",
        date: "Oct 01, 2025",
        time: "3:00 PM - 5:00 PM",
        price: "$80",
        status: "cancelled",
        image: "https://i.pravatar.cc/150?img=51",
        address: "987 Park Road, Jaffna",
        reason: "Provider unavailable",
      },
    ],
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-700";
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "completed":
        return "bg-blue-100 text-blue-700";
      case "cancelled":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "confirmed":
        return "checkmark-circle";
      case "pending":
        return "time";
      case "completed":
        return "checkmark-done-circle";
      case "cancelled":
        return "close-circle";
      default:
        return "help-circle";
    }
  };

  const currentBookings = bookings[activeTab];

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-white px-6 pt-12 pb-4 border-b border-gray-200">
        <Text className="text-2xl font-bold text-gray-800 mb-4">
          My Bookings
        </Text>

        <View className="flex-row bg-gray-100 rounded-full p-1">
          <TouchableOpacity
            onPress={() => setActiveTab("upcoming")}
            className={`flex-1 py-2 rounded-full ${
              activeTab === "upcoming" ? "bg-white" : ""
            }`}
          >
            <Text
              className={`text-center text-sm font-medium ${
                activeTab === "upcoming" ? "text-blue-600" : "text-gray-600"
              }`}
            >
              Upcoming
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab("completed")}
            className={`flex-1 py-2 rounded-full ${
              activeTab === "completed" ? "bg-white" : ""
            }`}
          >
            <Text
              className={`text-center text-sm font-medium ${
                activeTab === "completed" ? "text-blue-600" : "text-gray-600"
              }`}
            >
              Completed
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab("cancelled")}
            className={`flex-1 py-2 rounded-full ${
              activeTab === "cancelled" ? "bg-white" : ""
            }`}
          >
            <Text
              className={`text-center text-sm font-medium ${
                activeTab === "cancelled" ? "text-blue-600" : "text-gray-600"
              }`}
            >
              Cancelled
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        className="flex-1 px-4 py-4"
        showsVerticalScrollIndicator={false}
      >
        {currentBookings.length > 0 ? (
          currentBookings.map((booking) => (
            <TouchableOpacity
              key={booking.id}
              onPress={() =>
                router.push({
                  pathname: "/customer/BookingDetailsScreen",
                  params: {
                    id: booking.id,
                    provider: booking.provider,
                    service: booking.service,
                    category: booking.category,
                    date: booking.date,
                    time: booking.time,
                    price: booking.price,
                    status: booking.status,
                    image: booking.image,
                    address: booking.address,
                  },
                })
              }
              className="bg-white rounded-2xl p-4 mb-4 border border-gray-200 shadow-sm"
            >
              <View className="flex-row items-center justify-between mb-3">
                <View
                  className={`flex-row items-center px-3 py-1 rounded-full ${getStatusColor(
                    booking.status
                  )}`}
                >
                  <Ionicons
                    name={getStatusIcon(booking.status)}
                    size={14}
                    color={
                      booking.status === "confirmed"
                        ? "#15803d"
                        : booking.status === "pending"
                        ? "#a16207"
                        : booking.status === "completed"
                        ? "#1e40af"
                        : "#b91c1c"
                    }
                  />
                  <Text
                    className={`ml-1 text-xs font-semibold capitalize ${
                      booking.status === "confirmed"
                        ? "text-green-700"
                        : booking.status === "pending"
                        ? "text-yellow-700"
                        : booking.status === "completed"
                        ? "text-blue-700"
                        : "text-red-700"
                    }`}
                  >
                    {booking.status}
                  </Text>
                </View>
                <Text className="text-lg font-bold text-blue-600">
                  {booking.price}
                </Text>
              </View>

              <View className="flex-row mb-3">
                <Image
                  source={{ uri: booking.image }}
                  className="w-16 h-16 rounded-xl"
                />
                <View className="flex-1 ml-3">
                  <Text className="text-lg font-semibold text-gray-800 mb-1">
                    {booking.provider}
                  </Text>
                  <Text className="text-sm text-gray-600 mb-1">
                    {booking.service}
                  </Text>
                  <View className="bg-blue-50 px-2 py-1 rounded-full self-start">
                    <Text className="text-xs text-blue-700">
                      {booking.category}
                    </Text>
                  </View>
                </View>
              </View>

              <View className="bg-gray-50 rounded-xl p-3 mb-3">
                <View className="flex-row items-center mb-2">
                  <Ionicons name="calendar-outline" size={16} color="#6b7280" />
                  <Text className="text-sm text-gray-700 ml-2">
                    {booking.date}
                  </Text>
                </View>
                <View className="flex-row items-center mb-2">
                  <Ionicons name="time-outline" size={16} color="#6b7280" />
                  <Text className="text-sm text-gray-700 ml-2">
                    {booking.time}
                  </Text>
                </View>
                <View className="flex-row items-start">
                  <Ionicons name="location-outline" size={16} color="#6b7280" />
                  <Text className="text-sm text-gray-700 ml-2 flex-1">
                    {booking.address}
                  </Text>
                </View>
              </View>

              {activeTab === "upcoming" && (
                <View className="flex-row gap-2">
                  <TouchableOpacity className="flex-1 bg-blue-600 py-3 rounded-xl flex-row items-center justify-center">
                    <Ionicons name="chatbox-outline" size={18} color="white" />
                    <Text className="text-white font-semibold ml-2">
                      Message
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity className="flex-1 bg-gray-200 py-3 rounded-xl flex-row items-center justify-center">
                    <Ionicons name="close" size={18} color="#4b5563" />
                    <Text className="text-gray-700 font-semibold ml-2">
                      Cancel
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {activeTab === "completed" && !booking.rated && (
                <TouchableOpacity className="bg-yellow-400 py-3 rounded-xl flex-row items-center justify-center">
                  <Ionicons name="star-outline" size={18} color="#1f2937" />
                  <Text className="text-gray-900 font-semibold ml-2">
                    Rate Service
                  </Text>
                </TouchableOpacity>
              )}

              {activeTab === "completed" && booking.rated && (
                <View className="bg-green-50 py-3 rounded-xl flex-row items-center justify-center">
                  <Ionicons name="checkmark-circle" size={18} color="#15803d" />
                  <Text className="text-green-700 font-semibold ml-2">
                    Reviewed
                  </Text>
                </View>
              )}

              {activeTab === "cancelled" && booking.reason && (
                <View className="bg-red-50 py-2 px-3 rounded-xl">
                  <Text className="text-xs text-red-700">
                    Reason: {booking.reason}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))
        ) : (
          <View className="items-center justify-center py-20">
            <Ionicons name="calendar-outline" size={64} color="#d1d5db" />
            <Text className="text-gray-500 text-base mt-4">
              No {activeTab} bookings
            </Text>
          </View>
        )}

        <View className="h-4" />
      </ScrollView>
    </View>
  );
};

export default BookingsScreen;

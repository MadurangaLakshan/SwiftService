import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import {
  Image,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const BookingDetailsScreen = () => {
  const params = useLocalSearchParams();
  const {
    provider,
    service,
    category,
    date,
    time,
    price,
    status,
    image,
    address,
  } = params;

  const [showCancelModal, setShowCancelModal] = React.useState(false);
  const [showRatingModal, setShowRatingModal] = React.useState(false);
  const [rating, setRating] = React.useState(0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-700 border-green-200";
      case "pending":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
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
      case "completed":
        return "checkmark-done-circle";
      case "cancelled":
        return "close-circle";
      default:
        return "help-circle";
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-white px-6 pt-12 pb-4 border-b border-gray-200">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity
            onPress={() => router.push("/customer/BookingsScreen")}
            className="mr-4"
          >
            <Ionicons name="arrow-back" size={24} color="black" />
          </TouchableOpacity>
          <Text className="flex-1 text-xl font-bold text-gray-800">
            Booking Details
          </Text>
          <TouchableOpacity>
            <Ionicons name="ellipsis-vertical" size={24} color="#6b7280" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View
          className={`mx-6 mt-6 p-4 rounded-2xl border ${getStatusColor(
            status as string
          )}`}
        >
          <View className="flex-row items-center">
            <Ionicons
              name={getStatusIcon(status as string)}
              size={24}
              color={
                status === "confirmed"
                  ? "#15803d"
                  : status === "pending"
                  ? "#a16207"
                  : status === "completed"
                  ? "#1e40af"
                  : "#b91c1c"
              }
            />
            <View className="ml-3 flex-1">
              <Text
                className={`text-lg font-bold capitalize ${
                  status === "confirmed"
                    ? "text-green-700"
                    : status === "pending"
                    ? "text-yellow-700"
                    : status === "completed"
                    ? "text-blue-700"
                    : "text-red-700"
                }`}
              >
                {status}
              </Text>
              <Text
                className={`text-sm ${
                  status === "confirmed"
                    ? "text-green-600"
                    : status === "pending"
                    ? "text-yellow-600"
                    : status === "completed"
                    ? "text-blue-600"
                    : "text-red-600"
                }`}
              >
                {status === "confirmed"
                  ? "Your booking is confirmed"
                  : status === "pending"
                  ? "Waiting for provider confirmation"
                  : status === "completed"
                  ? "Service completed successfully"
                  : "This booking was cancelled"}
              </Text>
            </View>
          </View>
        </View>

        <View className="mx-6 mt-4 bg-white rounded-2xl p-4 border border-gray-200">
          <Text className="text-sm font-semibold text-gray-500 mb-3">
            SERVICE PROVIDER
          </Text>
          <View className="flex-row items-center mb-4">
            <Image
              source={{ uri: image as string }}
              className="w-16 h-16 rounded-xl"
            />
            <View className="flex-1 ml-4">
              <Text className="text-lg font-bold text-gray-800">
                {provider}
              </Text>
              <Text className="text-sm text-gray-600">{service}</Text>
              <View className="flex-row items-center mt-1">
                <Ionicons name="star" size={14} color="#fbbf24" />
                <Text className="text-sm text-gray-600 ml-1">4.8 (124)</Text>
              </View>
            </View>
          </View>

          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: "/customer/ChatScreen",
                  params: {
                    id: 1,
                    name: provider,
                    service: service,
                    image: image,
                  },
                })
              }
              className="flex-1 bg-blue-600 py-3 rounded-xl flex-row items-center justify-center"
            >
              <Ionicons name="chatbox-outline" size={18} color="white" />
              <Text className="text-white font-semibold ml-2">Message</Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex-1 bg-gray-100 py-3 rounded-xl flex-row items-center justify-center">
              <Ionicons name="call-outline" size={18} color="#3b82f6" />
              <Text className="text-blue-600 font-semibold ml-2">Call</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View className="mx-6 mt-4 bg-white rounded-2xl p-4 border border-gray-200">
          <Text className="text-sm font-semibold text-gray-500 mb-3">
            BOOKING INFORMATION
          </Text>

          <View className="space-y-3">
            <View className="flex-row items-start py-3 border-b border-gray-100">
              <View className="w-10 h-10 bg-blue-50 rounded-full items-center justify-center">
                <Ionicons name="construct-outline" size={20} color="#3b82f6" />
              </View>
              <View className="flex-1 ml-4">
                <Text className="text-xs text-gray-500 mb-1">Service</Text>
                <Text className="text-base font-semibold text-gray-800">
                  {category}
                </Text>
              </View>
            </View>

            <View className="flex-row items-start py-3 border-b border-gray-100">
              <View className="w-10 h-10 bg-green-50 rounded-full items-center justify-center">
                <Ionicons name="calendar-outline" size={20} color="#10b981" />
              </View>
              <View className="flex-1 ml-4">
                <Text className="text-xs text-gray-500 mb-1">Date</Text>
                <Text className="text-base font-semibold text-gray-800">
                  {date}
                </Text>
              </View>
            </View>

            <View className="flex-row items-start py-3 border-b border-gray-100">
              <View className="w-10 h-10 bg-yellow-50 rounded-full items-center justify-center">
                <Ionicons name="time-outline" size={20} color="#f59e0b" />
              </View>
              <View className="flex-1 ml-4">
                <Text className="text-xs text-gray-500 mb-1">Time</Text>
                <Text className="text-base font-semibold text-gray-800">
                  {time}
                </Text>
              </View>
            </View>

            <View className="flex-row items-start py-3">
              <View className="w-10 h-10 bg-purple-50 rounded-full items-center justify-center">
                <Ionicons name="location-outline" size={20} color="#8b5cf6" />
              </View>
              <View className="flex-1 ml-4">
                <Text className="text-xs text-gray-500 mb-1">Location</Text>
                <Text className="text-base font-semibold text-gray-800">
                  {address}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View className="mx-6 mt-4 bg-white rounded-2xl p-4 border border-gray-200">
          <Text className="text-sm font-semibold text-gray-500 mb-3">
            PAYMENT SUMMARY
          </Text>

          <View className="space-y-2">
            <View className="flex-row justify-between py-2">
              <Text className="text-gray-600">Service Fee</Text>
              <Text className="text-gray-800 font-medium">{price}</Text>
            </View>
            <View className="flex-row justify-between py-2">
              <Text className="text-gray-600">Platform Fee</Text>
              <Text className="text-gray-800 font-medium">$5</Text>
            </View>
            <View className="flex-row justify-between py-2 border-t border-gray-200 pt-3">
              <Text className="text-lg font-bold text-gray-800">Total</Text>
              <Text className="text-lg font-bold text-blue-600">
                ${parseInt((price as string).replace("$", "")) + 5}
              </Text>
            </View>
          </View>
        </View>

        <View className="mx-6 mt-4 mb-6 bg-gray-100 rounded-2xl p-4">
          <Text className="text-xs text-gray-500 mb-1">Booking ID</Text>
          <Text className="text-sm font-mono font-semibold text-gray-800">
            #BK{Math.floor(Math.random() * 1000000)}
          </Text>
        </View>
      </ScrollView>

      {status === "upcoming" ||
      status === "pending" ||
      status === "confirmed" ? (
        <View className="bg-white px-6 py-4 border-t border-gray-200">
          <TouchableOpacity
            onPress={() => setShowCancelModal(true)}
            className="bg-red-50 border border-red-200 py-4 rounded-xl flex-row items-center justify-center"
          >
            <Ionicons name="close-circle-outline" size={24} color="#ef4444" />
            <Text className="text-red-600 font-bold text-base ml-2">
              Cancel Booking
            </Text>
          </TouchableOpacity>
        </View>
      ) : status === "completed" ? (
        <View className="bg-white px-6 py-4 border-t border-gray-200">
          <TouchableOpacity
            onPress={() => setShowRatingModal(true)}
            className="bg-yellow-400 py-4 rounded-xl flex-row items-center justify-center"
          >
            <Ionicons name="star-outline" size={24} color="#1f2937" />
            <Text className="text-gray-900 font-bold text-base ml-2">
              Rate Service
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <Modal
        visible={showCancelModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCancelModal(false)}
      >
        <View className="flex-1 bg-black/50 items-center justify-center px-6">
          <View className="bg-white rounded-2xl p-6 w-full">
            <View className="items-center mb-4">
              <View className="w-16 h-16 bg-red-100 rounded-full items-center justify-center mb-3">
                <Ionicons name="warning-outline" size={32} color="#ef4444" />
              </View>
              <Text className="text-xl font-bold text-gray-800 mb-2">
                Cancel Booking?
              </Text>
              <Text className="text-center text-gray-600">
                Are you sure you want to cancel this booking? This action cannot
                be undone.
              </Text>
            </View>
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setShowCancelModal(false)}
                className="flex-1 bg-gray-100 py-3 rounded-xl"
              >
                <Text className="text-center text-gray-700 font-semibold">
                  No, Keep It
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setShowCancelModal(false);
                  router.push("/customer/BookingsScreen");
                }}
                className="flex-1 bg-red-600 py-3 rounded-xl"
              >
                <Text className="text-center text-white font-semibold">
                  Yes, Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showRatingModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowRatingModal(false)}
      >
        <View className="flex-1 bg-black/50 items-center justify-end">
          <View className="bg-white rounded-t-3xl p-6 w-full">
            <View className="items-center mb-6">
              <Text className="text-xl font-bold text-gray-800 mb-2">
                Rate Your Experience
              </Text>
              <Text className="text-center text-gray-600">
                How was your experience with {provider}?
              </Text>
            </View>

            <View className="flex-row justify-center mb-6">
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setRating(star)}
                  className="mx-2"
                >
                  <Ionicons
                    name={star <= rating ? "star" : "star-outline"}
                    size={40}
                    color={star <= rating ? "#fbbf24" : "#d1d5db"}
                  />
                </TouchableOpacity>
              ))}
            </View>

            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setShowRatingModal(false)}
                className="flex-1 bg-gray-100 py-4 rounded-xl"
              >
                <Text className="text-center text-gray-700 font-semibold">
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setShowRatingModal(false);
                  // Add rating logic here
                }}
                className="flex-1 bg-blue-600 py-4 rounded-xl"
                disabled={rating === 0}
              >
                <Text className="text-center text-white font-semibold">
                  Submit Rating
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default BookingDetailsScreen;

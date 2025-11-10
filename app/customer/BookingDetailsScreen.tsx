import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { cancelBooking, getBookingById } from "../services/apiService";

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
  cancellationReason?: string;
  cancelledBy?: "customer" | "provider";
  rating?: number;
  review?: string;
  createdAt: string;
  updatedAt: string;
}

const BookingDetailsScreen = () => {
  const params = useLocalSearchParams();
  const { bookingId } = params;

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [cancelReason, setCancelReason] = useState("");
  const [reviewText, setReviewText] = useState("");

  useEffect(() => {
    if (bookingId) {
      fetchBookingDetails();
    }
  }, [bookingId]);

  const fetchBookingDetails = async () => {
    try {
      setLoading(true);
      const response = await getBookingById(bookingId as string);

      if (response.success && response.data) {
        setBooking(response.data.data);
      } else {
        Alert.alert("Error", "Failed to load booking details");
        router.back();
      }
    } catch (error) {
      console.error("Error fetching booking:", error);
      Alert.alert("Error", "Failed to load booking details");
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!cancelReason.trim()) {
      Alert.alert("Error", "Please provide a reason for cancellation");
      return;
    }

    try {
      const response = await cancelBooking(bookingId as string, cancelReason);

      if (response.success) {
        Alert.alert("Success", "Booking cancelled successfully");
        setShowCancelModal(false);
        fetchBookingDetails();
      } else {
        Alert.alert("Error", response.error || "Failed to cancel booking");
      }
    } catch (error) {
      console.error("Error cancelling booking:", error);
      Alert.alert("Error", "Failed to cancel booking");
    }
  };

  const handleCall = () => {
    if (booking?.providerDetails.phone) {
      Linking.openURL(`tel:${booking.providerDetails.phone}`);
    } else {
      Alert.alert("Error", "Phone number not available");
    }
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

  const getStatusIconColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "#15803d";
      case "pending":
        return "#a16207";
      case "in-progress":
        return "#7c3aed";
      case "completed":
        return "#1e40af";
      case "cancelled":
        return "#b91c1c";
      default:
        return "#6b7280";
    }
  };

  const getStatusMessage = (status: string) => {
    switch (status) {
      case "confirmed":
        return "Your booking is confirmed";
      case "pending":
        return "Waiting for provider confirmation";
      case "in-progress":
        return "Service is currently in progress";
      case "completed":
        return "Service completed successfully";
      case "cancelled":
        return "This booking was cancelled";
      default:
        return "";
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="text-gray-500 mt-4">Loading booking details...</Text>
      </View>
    );
  }

  if (!booking) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
        <Text className="text-gray-500 mt-4">Booking not found</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="mt-4 bg-blue-600 px-6 py-3 rounded-xl"
        >
          <Text className="text-white font-semibold">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-white px-6 pt-12 pb-4 border-b border-gray-200">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
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
            booking.status
          )}`}
        >
          <View className="flex-row items-center">
            <Ionicons
              name={getStatusIcon(booking.status)}
              size={24}
              color={getStatusIconColor(booking.status)}
            />
            <View className="ml-3 flex-1">
              <Text
                className={`text-lg font-bold capitalize ${
                  booking.status === "confirmed"
                    ? "text-green-700"
                    : booking.status === "pending"
                    ? "text-yellow-700"
                    : booking.status === "in-progress"
                    ? "text-purple-700"
                    : booking.status === "completed"
                    ? "text-blue-700"
                    : "text-red-700"
                }`}
              >
                {booking.status}
              </Text>
              <Text
                className={`text-sm ${
                  booking.status === "confirmed"
                    ? "text-green-600"
                    : booking.status === "pending"
                    ? "text-yellow-600"
                    : booking.status === "in-progress"
                    ? "text-purple-600"
                    : booking.status === "completed"
                    ? "text-blue-600"
                    : "text-red-600"
                }`}
              >
                {getStatusMessage(booking.status)}
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
              source={{
                uri:
                  booking.providerDetails.profilePhoto ||
                  `https://i.pravatar.cc/150?u=${booking.providerId}`,
              }}
              className="w-16 h-16 rounded-xl"
            />
            <View className="flex-1 ml-4">
              <Text className="text-lg font-bold text-gray-800">
                {booking.providerDetails.name}
              </Text>
              <Text className="text-sm text-gray-600">
                {booking.serviceType}
              </Text>
              <Text className="text-xs text-gray-500 mt-1">
                {booking.providerDetails.email}
              </Text>
            </View>
          </View>

          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: "/customer/ChatScreen",
                  params: {
                    id: booking.providerId,
                    name: booking.providerDetails.name,
                    service: booking.serviceType,
                    image:
                      booking.providerDetails.profilePhoto ||
                      `https://i.pravatar.cc/150?u=${booking.providerId}`,
                  },
                })
              }
              className="flex-1 bg-blue-600 py-3 rounded-xl flex-row items-center justify-center"
            >
              <Ionicons name="chatbox-outline" size={18} color="white" />
              <Text className="text-white font-semibold ml-2">Message</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleCall}
              className="flex-1 bg-gray-100 py-3 rounded-xl flex-row items-center justify-center"
            >
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
                  {booking.category}
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
                  {formatDate(booking.scheduledDate)}
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
                  {booking.timeSlot}
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
                  {booking.serviceAddress}
                </Text>
              </View>
            </View>

            {booking.additionalNotes && (
              <View className="flex-row items-start py-3 border-t border-gray-100">
                <View className="w-10 h-10 bg-gray-50 rounded-full items-center justify-center">
                  <Ionicons
                    name="document-text-outline"
                    size={20}
                    color="#6b7280"
                  />
                </View>
                <View className="flex-1 ml-4">
                  <Text className="text-xs text-gray-500 mb-1">Notes</Text>
                  <Text className="text-base text-gray-700">
                    {booking.additionalNotes}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>

        <View className="mx-6 mt-4 bg-white rounded-2xl p-4 border border-gray-200">
          <Text className="text-sm font-semibold text-gray-500 mb-3">
            PAYMENT SUMMARY
          </Text>

          <View className="space-y-2">
            <View className="flex-row justify-between py-2">
              <Text className="text-gray-600">Hourly Rate</Text>
              <Text className="text-gray-800 font-medium">
                ${booking.pricing.hourlyRate}/hr
              </Text>
            </View>
            <View className="flex-row justify-between py-2">
              <Text className="text-gray-600">Estimated Hours</Text>
              <Text className="text-gray-800 font-medium">
                {booking.pricing.estimatedHours}
              </Text>
            </View>
            <View className="flex-row justify-between py-2">
              <Text className="text-gray-600">Service Fee</Text>
              <Text className="text-gray-800 font-medium">
                ${booking.pricing.hourlyRate * booking.pricing.estimatedHours}
              </Text>
            </View>
            <View className="flex-row justify-between py-2">
              <Text className="text-gray-600">Platform Fee</Text>
              <Text className="text-gray-800 font-medium">
                ${booking.pricing.platformFee}
              </Text>
            </View>
            <View className="flex-row justify-between py-2 border-t border-gray-200 pt-3">
              <Text className="text-lg font-bold text-gray-800">Total</Text>
              <Text className="text-lg font-bold text-blue-600">
                ${booking.pricing.totalAmount}
              </Text>
            </View>
          </View>
        </View>

        {booking.status === "cancelled" && booking.cancellationReason && (
          <View className="mx-6 mt-4 bg-red-50 rounded-2xl p-4 border border-red-200">
            <Text className="text-sm font-semibold text-red-700 mb-2">
              CANCELLATION DETAILS
            </Text>
            <Text className="text-sm text-red-600">
              Reason: {booking.cancellationReason}
            </Text>
            {booking.cancelledBy && (
              <Text className="text-xs text-red-500 mt-1">
                Cancelled by: {booking.cancelledBy}
              </Text>
            )}
          </View>
        )}

        <View className="mx-6 mt-4 mb-6 bg-gray-100 rounded-2xl p-4">
          <Text className="text-xs text-gray-500 mb-1">Booking ID</Text>
          <Text className="text-sm font-mono font-semibold text-gray-800">
            #{booking._id}
          </Text>
          <Text className="text-xs text-gray-500 mt-2">
            Created: {formatDate(booking.createdAt)}
          </Text>
        </View>
      </ScrollView>

      {(booking.status === "pending" || booking.status === "confirmed") && (
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
      )}

      {booking.status === "completed" && !booking.rating && (
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
      )}

      {/* Cancel Modal */}
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
              <Text className="text-center text-gray-600 mb-4">
                Please provide a reason for cancellation
              </Text>
              <TextInput
                value={cancelReason}
                onChangeText={setCancelReason}
                placeholder="Enter cancellation reason..."
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-700"
                multiline
                numberOfLines={3}
              />
            </View>
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => {
                  setShowCancelModal(false);
                  setCancelReason("");
                }}
                className="flex-1 bg-gray-100 py-3 rounded-xl"
              >
                <Text className="text-center text-gray-700 font-semibold">
                  No, Keep It
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCancelBooking}
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

      {/* Rating Modal */}
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
                How was your experience with {booking.providerDetails.name}?
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

            <TextInput
              value={reviewText}
              onChangeText={setReviewText}
              placeholder="Write your review (optional)..."
              className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-6 text-gray-700 h-24"
              multiline
              textAlignVertical="top"
            />

            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => {
                  setShowRatingModal(false);
                  setRating(0);
                  setReviewText("");
                }}
                className="flex-1 bg-gray-100 py-4 rounded-xl"
              >
                <Text className="text-center text-gray-700 font-semibold">
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  // TODO: Implement rating submission
                  Alert.alert("Success", "Thank you for your review!");
                  setShowRatingModal(false);
                  setRating(0);
                  setReviewText("");
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

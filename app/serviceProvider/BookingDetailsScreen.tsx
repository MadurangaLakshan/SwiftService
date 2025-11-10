import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  cancelBooking,
  getBookingById,
  updateBookingStatus,
} from "../services/apiService";

interface Booking {
  _id: string;
  customerDetails: {
    name: string;
    phone: string;
    email: string;
    image?: string;
  };
  providerDetails: {
    name: string;
    phone: string;
    email: string;
    profilePhoto?: string;
  };
  category: string;
  serviceType: string;
  status: string;
  scheduledDate: string;
  timeSlot: string;
  pricing: {
    hourlyRate: number;
    estimatedHours: number;
    platformFee: number;
    totalAmount: number;
  };
  serviceAddress: string;
  additionalNotes?: string;
}

const BookingDetailsScreen = () => {
  const params = useLocalSearchParams();
  const { bookingId } = params;

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (bookingId) {
      fetchBookingDetails();
    }
  }, [bookingId]);

  const fetchBookingDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getBookingById(bookingId as string);

      if (response.success) {
        setBooking(response.data.data);
      } else {
        setError(response.error || "Failed to fetch booking details");
      }
    } catch (err: any) {
      console.error("Error fetching booking:", err);
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    try {
      setActionLoading(true);
      const response = await updateBookingStatus(
        bookingId as string,
        newStatus
      );

      if (response.success) {
        setBooking(response.data);
      } else {
        alert("Failed to update booking status");
      }
    } catch (err) {
      console.error("Error updating status:", err);
      alert("An error occurred");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    try {
      setActionLoading(true);
      const response = await cancelBooking(
        bookingId as string,
        "Cancelled by provider"
      );

      if (response.success) {
        setShowCancelModal(false);
        setBooking(response.data);
      } else {
        alert("Failed to cancel booking");
      }
    } catch (err) {
      console.error("Error cancelling booking:", err);
      alert("An error occurred");
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

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
      case "in-progress":
        return "bg-purple-100 text-purple-700 border-purple-200";
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
      case "in-progress":
        return "play-circle";
      default:
        return "help-circle";
    }
  };

  const formatStatusLabel = (status: string) => {
    if (!status) return "Unknown";
    if (status === "in-progress") return "In Progress";
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  if (loading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="text-gray-600 mt-4">Loading booking details...</Text>
      </View>
    );
  }

  if (error || !booking) {
    return (
      <View className="flex-1 bg-white items-center justify-center px-6">
        <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
        <Text className="text-gray-800 text-lg font-semibold mt-4">
          {error || "Booking not found"}
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="bg-blue-600 rounded-xl px-6 py-3 mt-4"
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
              color={
                booking.status === "confirmed"
                  ? "#15803d"
                  : booking.status === "pending"
                  ? "#a16207"
                  : booking.status === "completed"
                  ? "#1e40af"
                  : booking.status === "in-progress"
                  ? "#7c3aed"
                  : "#b91c1c"
              }
            />
            <View className="ml-3 flex-1">
              <Text
                className={`text-lg font-bold capitalize ${
                  booking.status === "confirmed"
                    ? "text-green-700"
                    : booking.status === "pending"
                    ? "text-yellow-700"
                    : booking.status === "completed"
                    ? "text-blue-700"
                    : booking.status === "in-progress"
                    ? "text-purple-700"
                    : "text-red-700"
                }`}
              >
                {formatStatusLabel(booking.status)}
              </Text>
              <Text
                className={`text-sm ${
                  booking.status === "confirmed"
                    ? "text-green-600"
                    : booking.status === "pending"
                    ? "text-yellow-600"
                    : booking.status === "completed"
                    ? "text-blue-600"
                    : booking.status === "in-progress"
                    ? "text-purple-600"
                    : "text-red-600"
                }`}
              >
                {booking.status === "confirmed"
                  ? "Booking is confirmed"
                  : booking.status === "pending"
                  ? "Awaiting confirmation"
                  : booking.status === "completed"
                  ? "Service completed successfully"
                  : booking.status === "in-progress"
                  ? "Service is in progress"
                  : "This booking was cancelled"}
              </Text>
            </View>
          </View>
        </View>

        <View className="mx-6 mt-4 bg-white rounded-2xl p-4 border border-gray-200">
          <Text className="text-sm font-semibold text-gray-500 mb-3">
            CUSTOMER DETAILS
          </Text>
          <View className="flex-row items-center mb-4">
            <Image
              source={{
                uri:
                  booking.customerDetails.image ||
                  `https://i.pravatar.cc/150?u=${booking.customerDetails.email}`,
              }}
              className="w-16 h-16 rounded-xl"
            />
            <View className="flex-1 ml-4">
              <Text className="text-lg font-bold text-gray-800">
                {booking.customerDetails.name}
              </Text>
              <Text className="text-sm text-gray-600">
                {booking.customerDetails.phone}
              </Text>
              <Text className="text-sm text-gray-600">
                {booking.customerDetails.email}
              </Text>
            </View>
          </View>

          <View className="flex-row gap-2">
            <TouchableOpacity className="flex-1 bg-blue-600 py-3 rounded-xl flex-row items-center justify-center">
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
                  {booking.category}
                </Text>
                <Text className="text-sm text-gray-600">
                  {booking.serviceType}
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
                  <Text className="text-base text-gray-800">
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
              <Text className="text-gray-600">
                Service Fee ({booking.pricing.estimatedHours}h × $
                {booking.pricing.hourlyRate}/h)
              </Text>
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

        <View className="mx-6 mt-4 mb-6 bg-gray-100 rounded-2xl p-4">
          <Text className="text-xs text-gray-500 mb-1">Booking ID</Text>
          <Text className="text-sm font-mono font-semibold text-gray-800">
            #{booking._id.slice(-8).toUpperCase()}
          </Text>
        </View>
      </ScrollView>

      {booking.status === "pending" && (
        <View className="bg-white px-6 py-4 border-t border-gray-200">
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={() => handleStatusUpdate("confirmed")}
              disabled={actionLoading}
              className="flex-1 bg-green-600 py-4 rounded-xl flex-row items-center justify-center"
            >
              {actionLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={24} color="white" />
                  <Text className="text-white font-bold text-base ml-2">
                    Accept
                  </Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowCancelModal(true)}
              disabled={actionLoading}
              className="flex-1 bg-red-50 border border-red-200 py-4 rounded-xl flex-row items-center justify-center"
            >
              <Ionicons name="close-circle-outline" size={24} color="#ef4444" />
              <Text className="text-red-600 font-bold text-base ml-2">
                Decline
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {booking.status === "confirmed" && (
        <View className="bg-white px-6 py-4 border-t border-gray-200">
          <TouchableOpacity
            onPress={() => handleStatusUpdate("in-progress")}
            disabled={actionLoading}
            className="bg-purple-600 py-4 rounded-xl flex-row items-center justify-center"
          >
            {actionLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Ionicons name="play-circle" size={24} color="white" />
                <Text className="text-white font-bold text-base ml-2">
                  Start Job
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {booking.status === "in-progress" && (
        <View className="bg-white px-6 py-4 border-t border-gray-200">
          <TouchableOpacity
            onPress={() => handleStatusUpdate("completed")}
            disabled={actionLoading}
            className="bg-green-600 py-4 rounded-xl flex-row items-center justify-center"
          >
            {actionLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Ionicons name="checkmark-done" size={24} color="white" />
                <Text className="text-white font-bold text-base ml-2">
                  Complete Job
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

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
                Decline Booking?
              </Text>
              <Text className="text-center text-gray-600">
                Are you sure you want to decline this booking? This action
                cannot be undone.
              </Text>
            </View>
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setShowCancelModal(false)}
                disabled={actionLoading}
                className="flex-1 bg-gray-100 py-3 rounded-xl"
              >
                <Text className="text-center text-gray-700 font-semibold">
                  No, Keep It
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCancelBooking}
                disabled={actionLoading}
                className="flex-1 bg-red-600 py-3 rounded-xl"
              >
                {actionLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-center text-white font-semibold">
                    Yes, Decline
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default BookingDetailsScreen;

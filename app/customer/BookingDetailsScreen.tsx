import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Keyboard,
  Linking,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import {
  approveBookingCompletion,
  cancelBooking,
  disputeBooking,
  getBookingById,
  submitBookingReview,
} from "../services/apiService";
import TrackingScreen from "./TrackingScreen";

type BookingStatus =
  | "pending"
  | "confirmed"
  | "on-the-way"
  | "arrived"
  | "in-progress"
  | "awaiting-customer-approval"
  | "completed"
  | "disputed"
  | "cancelled";

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
  status: BookingStatus;
  pricing: {
    hourlyRate: number;
    estimatedHours: number;
    actualHours?: number;
    platformFee: number;
    totalAmount: number;
    finalAmount?: number;
  };
  customerDetails: {
    name: string;
    phone: string;
    email: string;
    image: string;
  };
  providerDetails: {
    name: string;
    phone: string;
    email: string;
    profilePhoto?: string;
  };
  timeline?: {
    bookedAt: string;
    confirmedAt?: string;
    startedTravelAt?: string;
    arrivedAt?: string;
    workStartedAt?: string;
    workCompletedAt?: string;
    customerApprovedAt?: string;
  };
  workDocumentation?: {
    beforePhotos: string[];
    afterPhotos: string[];
    workNotes?: string;
  };
  cancellationReason?: string;
  cancelledBy?: "customer" | "provider";
  rating?: number;
  review?: string;
  dispute?: {
    reason: string;
    description: string;
    status: "open" | "resolved" | "escalated";
  };
  createdAt: string;
  updatedAt: string;
}

const BookingDetailsScreen = () => {
  const params = useLocalSearchParams();
  const { bookingId } = params;

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [showTrackingModal, setShowTrackingModal] = useState(false); // NEW
  const [rating, setRating] = useState(0);
  const [cancelReason, setCancelReason] = useState("");
  const [reviewText, setReviewText] = useState("");
  const [disputeReason, setDisputeReason] = useState("");
  const [disputeDescription, setDisputeDescription] = useState("");

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
      setActionLoading(true);
      const response = await cancelBooking(bookingId as string, cancelReason);

      if (response.success) {
        Alert.alert("Success", "Booking cancelled successfully");
        setShowCancelModal(false);
        setCancelReason("");
        fetchBookingDetails();
      } else {
        Alert.alert("Error", response.error || "Failed to cancel booking");
      }
    } catch (error) {
      console.error("Error cancelling booking:", error);
      Alert.alert("Error", "Failed to cancel booking");
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveCompletion = async () => {
    try {
      setActionLoading(true);
      const response = await approveBookingCompletion(bookingId as string);

      if (response.success) {
        Alert.alert("Success", "Service completion approved!");
        setShowApprovalModal(false);
        fetchBookingDetails();
      } else {
        Alert.alert("Error", response.error || "Failed to approve completion");
      }
    } catch (error) {
      console.error("Error approving completion:", error);
      Alert.alert("Error", "Failed to approve completion");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRaiseDispute = async () => {
    if (!disputeReason.trim() || !disputeDescription.trim()) {
      Alert.alert("Error", "Please provide dispute reason and description");
      return;
    }

    try {
      setActionLoading(true);
      const response = await disputeBooking(bookingId as string, {
        reason: disputeReason,
        description: disputeDescription,
      });

      if (response.success) {
        Alert.alert(
          "Success",
          "Dispute raised successfully. Our team will review it."
        );
        setShowDisputeModal(false);
        setDisputeReason("");
        setDisputeDescription("");
        fetchBookingDetails();
      } else {
        Alert.alert("Error", response.error || "Failed to raise dispute");
      }
    } catch (error) {
      console.error("Error raising dispute:", error);
      Alert.alert("Error", "Failed to raise dispute");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    if (rating === 0) {
      Alert.alert("Error", "Please select a rating");
      return;
    }

    const customerPhoto = booking?.customerDetails.image || undefined;

    try {
      setActionLoading(true);
      const response = await submitBookingReview(bookingId as string, {
        rating,
        review: reviewText,
        customerPhoto,
      });

      if (response.success) {
        Alert.alert("Success", "Thank you for your review!");
        setShowRatingModal(false);
        setRating(0);
        setReviewText("");
        fetchBookingDetails();
      } else {
        Alert.alert("Error", response.error || "Failed to submit review");
      }
    } catch (error) {
      console.error("Error submitting review:", error);
      Alert.alert("Error", "Failed to submit review");
    } finally {
      setActionLoading(false);
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

  const getStatusColor = (status: BookingStatus) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-700 border-green-200";
      case "pending":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "on-the-way":
      case "arrived":
        return "bg-indigo-100 text-indigo-700 border-indigo-200";
      case "in-progress":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "awaiting-customer-approval":
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "completed":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "disputed":
        return "bg-pink-100 text-pink-700 border-pink-200";
      case "cancelled":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getStatusIcon = (status: BookingStatus) => {
    switch (status) {
      case "confirmed":
        return "checkmark-circle";
      case "pending":
        return "time";
      case "on-the-way":
        return "car";
      case "arrived":
        return "location";
      case "in-progress":
        return "hourglass";
      case "awaiting-customer-approval":
        return "alert-circle";
      case "completed":
        return "checkmark-done-circle";
      case "disputed":
        return "warning";
      case "cancelled":
        return "close-circle";
      default:
        return "help-circle";
    }
  };

  const getStatusMessage = (status: BookingStatus) => {
    switch (status) {
      case "pending":
        return "Waiting for provider to accept your booking";
      case "confirmed":
        return "Provider confirmed - They will arrive soon";
      case "on-the-way":
        return "Provider is on the way to your location";
      case "arrived":
        return "Provider has arrived at your location";
      case "in-progress":
        return "Service is currently in progress";
      case "awaiting-customer-approval":
        return "Provider finished - Please review and approve";
      case "completed":
        return "Service completed successfully";
      case "disputed":
        return "Your dispute is being reviewed";
      case "cancelled":
        return "This booking was cancelled";
      default:
        return "";
    }
  };

  const formatStatusLabel = (status: BookingStatus) => {
    switch (status) {
      case "on-the-way":
        return "On The Way";
      case "awaiting-customer-approval":
        return "Awaiting Approval";
      case "in-progress":
        return "In Progress";
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  // NEW: Check if tracking is available
  const canTrack =
    booking?.status === "on-the-way" ||
    booking?.status === "arrived" ||
    booking?.status === "in-progress";

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
              color={
                booking.status === "confirmed" || booking.status === "completed"
                  ? "#15803d"
                  : booking.status === "pending"
                  ? "#a16207"
                  : booking.status === "in-progress"
                  ? "#7c3aed"
                  : booking.status === "awaiting-customer-approval"
                  ? "#ea580c"
                  : booking.status === "on-the-way" ||
                    booking.status === "arrived"
                  ? "#4f46e5"
                  : booking.status === "disputed"
                  ? "#ec4899"
                  : "#b91c1c"
              }
            />
            <View className="ml-3 flex-1">
              <Text className="text-lg font-bold capitalize">
                {formatStatusLabel(booking.status)}
              </Text>
              <Text className="text-sm">
                {getStatusMessage(booking.status)}
              </Text>
            </View>
          </View>
        </View>

        {/* NEW: Track Provider Button */}
        {canTrack && (
          <TouchableOpacity
            onPress={() => setShowTrackingModal(true)}
            className="mx-6 mt-4 bg-blue-600 p-4 rounded-2xl flex-row items-center justify-center shadow-lg"
          >
            <Ionicons name="navigate" size={24} color="white" />
            <Text className="text-white font-bold text-base ml-2">
              Track Provider Live
            </Text>
          </TouchableOpacity>
        )}

        {/* Timeline Progress */}
        {booking.timeline && (
          <View className="mx-6 mt-4 bg-white rounded-2xl p-4 border border-gray-200">
            <Text className="text-sm font-semibold text-gray-500 mb-3">
              BOOKING TIMELINE
            </Text>
            <View className="space-y-2">
              {booking.timeline.bookedAt && (
                <View className="flex-row items-center py-2">
                  <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                  <View className="ml-3 flex-1">
                    <Text className="text-sm font-medium text-gray-800">
                      Booking Created
                    </Text>
                    <Text className="text-xs text-gray-500">
                      {formatDate(booking.timeline.bookedAt)}
                    </Text>
                  </View>
                </View>
              )}
              {booking.timeline.confirmedAt && (
                <View className="flex-row items-center py-2">
                  <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                  <View className="ml-3 flex-1">
                    <Text className="text-sm font-medium text-gray-800">
                      Confirmed by Provider
                    </Text>
                    <Text className="text-xs text-gray-500">
                      {formatDate(booking.timeline.confirmedAt)}
                    </Text>
                  </View>
                </View>
              )}
              {booking.timeline.startedTravelAt && (
                <View className="flex-row items-center py-2">
                  <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                  <View className="ml-3 flex-1">
                    <Text className="text-sm font-medium text-gray-800">
                      Provider Started Travel
                    </Text>
                    <Text className="text-xs text-gray-500">
                      {formatDate(booking.timeline.startedTravelAt)}
                    </Text>
                  </View>
                </View>
              )}
              {booking.timeline.arrivedAt && (
                <View className="flex-row items-center py-2">
                  <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                  <View className="ml-3 flex-1">
                    <Text className="text-sm font-medium text-gray-800">
                      Provider Arrived
                    </Text>
                    <Text className="text-xs text-gray-500">
                      {formatDate(booking.timeline.arrivedAt)}
                    </Text>
                  </View>
                </View>
              )}
              {booking.timeline.workStartedAt && (
                <View className="flex-row items-center py-2">
                  <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                  <View className="ml-3 flex-1">
                    <Text className="text-sm font-medium text-gray-800">
                      Work Started
                    </Text>
                    <Text className="text-xs text-gray-500">
                      {formatDate(booking.timeline.workStartedAt)}
                    </Text>
                  </View>
                </View>
              )}
              {booking.timeline.workCompletedAt && (
                <View className="flex-row items-center py-2">
                  <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                  <View className="ml-3 flex-1">
                    <Text className="text-sm font-medium text-gray-800">
                      Work Completed
                    </Text>
                    <Text className="text-xs text-gray-500">
                      {formatDate(booking.timeline.workCompletedAt)}
                    </Text>
                  </View>
                </View>
              )}
              {booking.timeline.customerApprovedAt && (
                <View className="flex-row items-center py-2">
                  <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                  <View className="ml-3 flex-1">
                    <Text className="text-sm font-medium text-gray-800">
                      Approved by You
                    </Text>
                    <Text className="text-xs text-gray-500">
                      {formatDate(booking.timeline.customerApprovedAt)}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Work Documentation */}
        {booking.workDocumentation &&
          (booking.workDocumentation.beforePhotos.length > 0 ||
            booking.workDocumentation.afterPhotos.length > 0 ||
            booking.workDocumentation.workNotes) && (
            <View className="mx-6 mt-4 bg-white rounded-2xl p-4 border border-gray-200">
              <Text className="text-sm font-semibold text-gray-500 mb-3">
                WORK DOCUMENTATION
              </Text>

              {booking.workDocumentation.beforePhotos.length > 0 && (
                <View className="mb-4">
                  <Text className="text-sm font-medium text-gray-700 mb-2">
                    Before Photos
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {booking.workDocumentation.beforePhotos.map(
                      (photo, index) => (
                        <Image
                          key={index}
                          source={{ uri: photo }}
                          className="w-24 h-24 rounded-lg mr-2"
                        />
                      )
                    )}
                  </ScrollView>
                </View>
              )}

              {booking.workDocumentation.afterPhotos.length > 0 && (
                <View className="mb-4">
                  <Text className="text-sm font-medium text-gray-700 mb-2">
                    After Photos
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {booking.workDocumentation.afterPhotos.map(
                      (photo, index) => (
                        <Image
                          key={index}
                          source={{ uri: photo }}
                          className="w-24 h-24 rounded-lg mr-2"
                        />
                      )
                    )}
                  </ScrollView>
                </View>
              )}

              {booking.workDocumentation.workNotes && (
                <View>
                  <Text className="text-sm font-medium text-gray-700 mb-1">
                    Provider Notes
                  </Text>
                  <Text className="text-sm text-gray-600">
                    {booking.workDocumentation.workNotes}
                  </Text>
                </View>
              )}
            </View>
          )}

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
              <Text className="text-gray-600">
                {booking.pricing.actualHours
                  ? "Actual Hours"
                  : "Estimated Hours"}
              </Text>
              <Text className="text-gray-800 font-medium">
                {booking.pricing.actualHours || booking.pricing.estimatedHours}h
              </Text>
            </View>
            <View className="flex-row justify-between py-2">
              <Text className="text-gray-600">Service Fee</Text>
              <Text className="text-gray-800 font-medium">
                $
                {booking.pricing.hourlyRate *
                  (booking.pricing.actualHours ||
                    booking.pricing.estimatedHours)}
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
                ${booking.pricing.finalAmount || booking.pricing.totalAmount}
              </Text>
            </View>
            {booking.pricing.actualHours &&
              booking.pricing.actualHours !==
                booking.pricing.estimatedHours && (
                <View className="bg-yellow-50 rounded-lg p-3 mt-2">
                  <Text className="text-xs text-yellow-700">
                    * Final amount based on actual hours worked
                  </Text>
                </View>
              )}
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

        {booking.dispute && (
          <View className="mx-6 mt-4 bg-pink-50 rounded-2xl p-4 border border-pink-200">
            <Text className="text-sm font-semibold text-pink-700 mb-2">
              DISPUTE DETAILS
            </Text>
            <Text className="text-sm text-pink-600 mb-1">
              Reason: {booking.dispute.reason}
            </Text>
            <Text className="text-sm text-pink-600 mb-1">
              Description: {booking.dispute.description}
            </Text>
            <Text className="text-xs text-pink-500">
              Status: {booking.dispute.status.toUpperCase()}
            </Text>
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

      {/* Action Buttons */}
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

      {booking.status === "awaiting-customer-approval" && (
        <View className="bg-white px-6 py-4 border-t border-gray-200">
          <Text className="text-center text-gray-600 text-sm mb-3">
            Please review the completed work
          </Text>
          <View className="flex-row gap-3 mb-3">
            <TouchableOpacity
              onPress={() => setShowApprovalModal(true)}
              className="flex-1 bg-green-600 py-4 rounded-xl flex-row items-center justify-center"
            >
              <Ionicons
                name="checkmark-circle-outline"
                size={24}
                color="white"
              />
              <Text className="text-white font-bold text-base ml-2">
                Approve
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowDisputeModal(true)}
              className="flex-1 bg-orange-50 border border-orange-200 py-4 rounded-xl flex-row items-center justify-center"
            >
              <Ionicons name="alert-circle-outline" size={24} color="#ea580c" />
              <Text className="text-orange-600 font-bold text-base ml-2">
                Raise Issue
              </Text>
            </TouchableOpacity>
          </View>
          <Text className="text-center text-xs text-gray-500">
            Once approved, payment will be released to the provider
          </Text>
        </View>
      )}

      {booking.status === "completed" && !booking.rating && (
        <View className="bg-white px-6 py-4 border-t border-gray-200">
          <View className="bg-green-50 border border-green-200 p-4 rounded-xl mb-3">
            <View className="flex-row items-center mb-2">
              <Ionicons name="checkmark-circle" size={24} color="#10b981" />
              <Text className="flex-1 ml-3 text-green-700 font-medium">
                Service completed successfully!
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => setShowRatingModal(true)}
            className="bg-blue-600 py-4 rounded-xl flex-row items-center justify-center"
          >
            <Ionicons name="star-outline" size={24} color="white" />
            <Text className="text-white font-bold text-base ml-2">
              Rate Your Experience
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {booking.status === "completed" && booking.rating && (
        <View className="bg-white px-6 py-4 border-t border-gray-200">
          <View className="bg-green-50 border border-green-200 p-4 rounded-xl">
            <View className="flex-row items-center">
              <Ionicons name="checkmark-circle" size={24} color="#10b981" />
              <View className="flex-1 ml-3">
                <Text className="text-green-700 font-bold mb-1">
                  Service Completed
                </Text>
                <View className="flex-row items-center">
                  <Text className="text-green-600 text-sm mr-2">
                    Your rating:
                  </Text>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Ionicons
                      key={star}
                      name="star"
                      size={16}
                      color={star <= booking.rating! ? "#fbbf24" : "#d1d5db"}
                    />
                  ))}
                </View>
              </View>
            </View>
          </View>
        </View>
      )}

      {booking.status === "disputed" && (
        <View className="bg-white px-6 py-4 border-t border-gray-200">
          <View className="bg-pink-50 border border-pink-200 p-4 rounded-xl">
            <View className="flex-row items-start">
              <Ionicons name="warning-outline" size={24} color="#ec4899" />
              <View className="flex-1 ml-3">
                <Text className="text-pink-700 font-bold mb-1">
                  Dispute Under Review
                </Text>
                <Text className="text-pink-600 text-sm">
                  Our support team is reviewing your dispute. We'll contact you
                  within 24-48 hours.
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {booking.status === "cancelled" && (
        <View className="bg-white px-6 py-4 border-t border-gray-200">
          <View className="bg-red-50 border border-red-200 p-4 rounded-xl">
            <View className="flex-row items-center">
              <Ionicons name="close-circle" size={24} color="#ef4444" />
              <Text className="flex-1 ml-3 text-red-700 font-medium">
                This booking was cancelled
              </Text>
            </View>
          </View>
        </View>
      )}

      {(booking.status === "on-the-way" ||
        booking.status === "arrived" ||
        booking.status === "in-progress") && (
        <View className="bg-white px-6 py-4 border-t border-gray-200">
          <View
            className={`border p-4 rounded-xl ${
              booking.status === "on-the-way"
                ? "bg-indigo-50 border-indigo-200"
                : booking.status === "arrived"
                ? "bg-purple-50 border-purple-200"
                : "bg-blue-50 border-blue-200"
            }`}
          >
            <View className="flex-row items-center">
              <Ionicons
                name={
                  booking.status === "on-the-way"
                    ? "car"
                    : booking.status === "arrived"
                    ? "location"
                    : "construct"
                }
                size={24}
                color={
                  booking.status === "on-the-way"
                    ? "#4f46e5"
                    : booking.status === "arrived"
                    ? "#7c3aed"
                    : "#3b82f6"
                }
              />
              <Text
                className={`flex-1 ml-3 font-medium ${
                  booking.status === "on-the-way"
                    ? "text-indigo-700"
                    : booking.status === "arrived"
                    ? "text-purple-700"
                    : "text-blue-700"
                }`}
              >
                {getStatusMessage(booking.status)}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Modals */}
      <Modal
        visible={showCancelModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCancelModal(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View className="flex-1 bg-black/50 items-center justify-center px-6">
            <TouchableWithoutFeedback onPress={() => {}}>
              <View className="bg-white rounded-2xl p-6 w-full">
                <View className="items-center mb-4">
                  <View className="w-16 h-16 bg-red-100 rounded-full items-center justify-center mb-3">
                    <Ionicons
                      name="warning-outline"
                      size={32}
                      color="#ef4444"
                    />
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
                    disabled={actionLoading}
                  >
                    <Text className="text-center text-gray-700 font-semibold">
                      No, Keep It
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleCancelBooking}
                    className="flex-1 bg-red-600 py-3 rounded-xl"
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <ActivityIndicator color="white" size="small" />
                    ) : (
                      <Text className="text-center text-white font-semibold">
                        Yes, Cancel
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <Modal
        visible={showApprovalModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowApprovalModal(false)}
      >
        <View className="flex-1 bg-black/50 items-center justify-center px-6">
          <View className="bg-white rounded-2xl p-6 w-full">
            <View className="items-center mb-4">
              <View className="w-16 h-16 bg-green-100 rounded-full items-center justify-center mb-3">
                <Ionicons name="checkmark-circle" size={32} color="#10b981" />
              </View>
              <Text className="text-xl font-bold text-gray-800 mb-2">
                Approve Service Completion?
              </Text>
              <Text className="text-center text-gray-600">
                Please confirm that the service has been completed to your
                satisfaction. Once approved, payment will be released to the
                provider.
              </Text>
            </View>
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setShowApprovalModal(false)}
                className="flex-1 bg-gray-100 py-3 rounded-xl"
                disabled={actionLoading}
              >
                <Text className="text-center text-gray-700 font-semibold">
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleApproveCompletion}
                className="flex-1 bg-green-600 py-3 rounded-xl"
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text className="text-center text-white font-semibold">
                    Approve
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showDisputeModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDisputeModal(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View className="flex-1 bg-black/50 items-center justify-end">
            <TouchableWithoutFeedback onPress={() => {}}>
              <View className="bg-white rounded-t-3xl p-6 w-full">
                <View className="items-center mb-6">
                  <View className="w-16 h-16 bg-orange-100 rounded-full items-center justify-center mb-3">
                    <Ionicons
                      name="warning-outline"
                      size={32}
                      color="#ea580c"
                    />
                  </View>
                  <Text className="text-xl font-bold text-gray-800 mb-2">
                    Raise an Issue
                  </Text>
                  <Text className="text-center text-gray-600">
                    Describe the issue with the service completion
                  </Text>
                </View>

                <TextInput
                  value={disputeReason}
                  onChangeText={setDisputeReason}
                  placeholder="Issue title (e.g., Incomplete work)"
                  className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-4 text-gray-700"
                />

                <TextInput
                  value={disputeDescription}
                  onChangeText={setDisputeDescription}
                  placeholder="Describe the issue in detail..."
                  className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-6 text-gray-700 h-24"
                  multiline
                  textAlignVertical="top"
                />

                <View className="flex-row gap-3">
                  <TouchableOpacity
                    onPress={() => {
                      setShowDisputeModal(false);
                      setDisputeReason("");
                      setDisputeDescription("");
                    }}
                    className="flex-1 bg-gray-100 py-4 rounded-xl"
                    disabled={actionLoading}
                  >
                    <Text className="text-center text-gray-700 font-semibold">
                      Cancel
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleRaiseDispute}
                    className="flex-1 bg-orange-600 py-4 rounded-xl"
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <ActivityIndicator color="white" size="small" />
                    ) : (
                      <Text className="text-center text-white font-semibold">
                        Submit Issue
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <Modal
        visible={showRatingModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowRatingModal(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View className="flex-1 bg-black/50 items-center justify-end">
            <TouchableWithoutFeedback onPress={() => {}}>
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
                    disabled={actionLoading}
                  >
                    <Text className="text-center text-gray-700 font-semibold">
                      Cancel
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleSubmitReview}
                    className="flex-1 bg-blue-600 py-4 rounded-xl"
                    disabled={rating === 0 || actionLoading}
                  >
                    {actionLoading ? (
                      <ActivityIndicator color="white" size="small" />
                    ) : (
                      <Text className="text-center text-white font-semibold">
                        Submit Rating
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* NEW: Tracking Modal */}
      <Modal
        visible={showTrackingModal}
        animationType="slide"
        onRequestClose={() => setShowTrackingModal(false)}
      >
        <TrackingScreen
          bookingId={booking._id}
          onClose={() => setShowTrackingModal(false)}
        />
      </Modal>
    </View>
  );
};

export default BookingDetailsScreen;

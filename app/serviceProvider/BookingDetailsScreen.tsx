import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Keyboard,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import {
  cancelBooking,
  getBookingById,
  updateBookingStatus,
  uploadWorkPhotos,
} from "../services/apiService";

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
  status: BookingStatus;
  scheduledDate: string;
  timeSlot: string;
  pricing: {
    hourlyRate: number;
    estimatedHours: number;
    actualHours?: number;
    platformFee: number;
    totalAmount: number;
    finalAmount?: number;
  };
  serviceAddress: string;
  additionalNotes?: string;
  timeline?: {
    bookedAt: string;
    confirmedAt?: string;
    startedTravelAt?: string;
    arrivedAt?: string;
    workStartedAt?: string;
    workCompletedAt?: string;
  };
  workDocumentation?: {
    beforePhotos: string[];
    afterPhotos: string[];
    workNotes?: string;
  };
}

const BookingDetailsScreen = () => {
  const params = useLocalSearchParams();
  const { bookingId } = params;

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showWorkCompletionModal, setShowWorkCompletionModal] = useState(false);
  const [showActualHoursModal, setShowActualHoursModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actualHours, setActualHours] = useState("");
  const [workNotes, setWorkNotes] = useState("");
  const [beforePhotos, setBeforePhotos] = useState<string[]>([]);
  const [afterPhotos, setAfterPhotos] = useState<string[]>([]);

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

  const handleStatusUpdate = async (newStatus: BookingStatus) => {
    try {
      setActionLoading(true);
      const response = await updateBookingStatus(
        bookingId as string,
        newStatus
      );

      if (response.success) {
        setBooking(response.data.data);
        Alert.alert("Success", "Booking status updated successfully");
      } else {
        Alert.alert("Error", "Failed to update booking status");
      }
    } catch (err) {
      console.error("Error updating status:", err);
      Alert.alert("Error", "An error occurred");
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
        Alert.alert("Success", "Booking cancelled successfully");
      } else {
        Alert.alert("Error", "Failed to cancel booking");
      }
    } catch (err) {
      console.error("Error cancelling booking:", err);
      Alert.alert("Error", "An error occurred");
    } finally {
      setActionLoading(false);
    }
  };

  const pickImage = async (type: "before" | "after") => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets) {
      const newPhotos = result.assets.map((asset) => asset.uri);
      if (type === "before") {
        setBeforePhotos([...beforePhotos, ...newPhotos]);
      } else {
        setAfterPhotos([...afterPhotos, ...newPhotos]);
      }
    }
  };

  const handleCompleteWork = async () => {
    if (!actualHours || parseFloat(actualHours) <= 0) {
      Alert.alert("Error", "Please enter valid actual hours worked");
      return;
    }

    try {
      setActionLoading(true);

      // Upload photos if any
      if (beforePhotos.length > 0 || afterPhotos.length > 0) {
        await uploadWorkPhotos(bookingId as string, {
          beforePhotos,
          afterPhotos,
          workNotes,
        });
      }

      // Update status to awaiting customer approval
      await updateBookingStatus(
        bookingId as string,
        "awaiting-customer-approval",
        {
          actualHours: parseFloat(actualHours),
        }
      );

      Alert.alert(
        "Success",
        "Work marked as complete. Waiting for customer approval."
      );
      setShowWorkCompletionModal(false);
      setShowActualHoursModal(false);
      fetchBookingDetails();
    } catch (err) {
      console.error("Error completing work:", err);
      Alert.alert("Error", "Failed to complete work");
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
      case "cancelled":
        return "bg-red-100 text-red-700 border-red-200";
      case "disputed":
        return "bg-pink-100 text-pink-700 border-pink-200";
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
      case "cancelled":
        return "close-circle";
      case "disputed":
        return "warning";
      default:
        return "help-circle";
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

  const getStatusMessage = (status: BookingStatus) => {
    switch (status) {
      case "pending":
        return "New booking request - Review and accept";
      case "confirmed":
        return "Booking confirmed - Start travel when ready";
      case "on-the-way":
        return "En route to customer location";
      case "arrived":
        return "At customer location - Ready to begin work";
      case "in-progress":
        return "Work in progress";
      case "awaiting-customer-approval":
        return "Waiting for customer to approve completion";
      case "completed":
        return "Job completed successfully";
      case "cancelled":
        return "This booking was cancelled";
      case "disputed":
        return "Customer has raised a dispute";
      default:
        return "";
    }
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

        {/* Timeline Progress */}
        {booking.timeline && (
          <View className="mx-6 mt-4 bg-white rounded-2xl p-4 border border-gray-200">
            <Text className="text-sm font-semibold text-gray-500 mb-3">
              JOB TIMELINE
            </Text>
            <View className="space-y-2">
              {booking.timeline.confirmedAt && (
                <View className="flex-row items-center py-2">
                  <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                  <View className="ml-3 flex-1">
                    <Text className="text-sm font-medium text-gray-800">
                      Booking Accepted
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
                      Started Travel
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
                      Arrived at Location
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
            </View>
          </View>
        )}

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
                  <Text className="text-xs text-gray-500 mb-1">
                    Customer Notes
                  </Text>
                  <Text className="text-base text-gray-800">
                    {booking.additionalNotes}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Work Documentation */}
        {booking.workDocumentation && (
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
                  {booking.workDocumentation.afterPhotos.map((photo, index) => (
                    <Image
                      key={index}
                      source={{ uri: photo }}
                      className="w-24 h-24 rounded-lg mr-2"
                    />
                  ))}
                </ScrollView>
              </View>
            )}

            {booking.workDocumentation.workNotes && (
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-1">
                  Work Notes
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
              <Text className="text-lg font-bold text-gray-800">
                {booking.pricing.actualHours
                  ? "Final Total"
                  : "Estimated Total"}
              </Text>
              <Text className="text-lg font-bold text-green-600">
                ${booking.pricing.finalAmount || booking.pricing.totalAmount}
              </Text>
            </View>
            {!booking.pricing.actualHours && (
              <View className="bg-blue-50 rounded-lg p-3 mt-2">
                <Text className="text-xs text-blue-700">
                  * Final amount will be calculated based on actual hours worked
                </Text>
              </View>
            )}
          </View>
        </View>

        <View className="mx-6 mt-4 mb-6 bg-gray-100 rounded-2xl p-4">
          <Text className="text-xs text-gray-500 mb-1">Booking ID</Text>
          <Text className="text-sm font-mono font-semibold text-gray-800">
            #{booking._id.slice(-8).toUpperCase()}
          </Text>
        </View>
      </ScrollView>
      {/* Action Buttons */}
      {booking.status === "pending" && (
        <View className="bg-white px-6 py-4 border-t border-gray-200">
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={() => setShowCancelModal(true)}
              className="flex-1 bg-red-50 border border-red-200 py-4 rounded-xl"
              disabled={actionLoading}
            >
              <Text className="text-center text-red-600 font-bold">
                Decline
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleStatusUpdate("confirmed")}
              className="flex-1 bg-green-600 py-4 rounded-xl"
              disabled={actionLoading}
            >
              {actionLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-center text-white font-bold">
                  Accept Booking
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {booking.status === "confirmed" && (
        <View className="bg-white px-6 py-4 border-t border-gray-200">
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={() => setShowCancelModal(true)}
              className="flex-1 bg-red-50 border border-red-200 py-4 rounded-xl"
              disabled={actionLoading}
            >
              <Text className="text-center text-red-600 font-bold">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleStatusUpdate("on-the-way")}
              className="flex-1 bg-blue-600 py-4 rounded-xl"
              disabled={actionLoading}
            >
              {actionLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <View className="flex-row items-center justify-center">
                  <Ionicons name="car-outline" size={20} color="white" />
                  <Text className="text-center text-white font-bold ml-2">
                    Start Travel
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {booking.status === "on-the-way" && (
        <View className="bg-white px-6 py-4 border-t border-gray-200">
          <TouchableOpacity
            onPress={() => handleStatusUpdate("arrived")}
            className="bg-indigo-600 py-4 rounded-xl"
            disabled={actionLoading}
          >
            {actionLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <View className="flex-row items-center justify-center">
                <Ionicons name="location-outline" size={20} color="white" />
                <Text className="text-center text-white font-bold ml-2">
                  I've Arrived
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      )}

      {booking.status === "arrived" && (
        <View className="bg-white px-6 py-4 border-t border-gray-200">
          <TouchableOpacity
            onPress={() => handleStatusUpdate("in-progress")}
            className="bg-purple-600 py-4 rounded-xl"
            disabled={actionLoading}
          >
            {actionLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <View className="flex-row items-center justify-center">
                <Ionicons name="construct-outline" size={20} color="white" />
                <Text className="text-center text-white font-bold ml-2">
                  Start Work
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      )}

      {booking.status === "in-progress" && (
        <View className="bg-white px-6 py-4 border-t border-gray-200">
          <TouchableOpacity
            onPress={() => setShowActualHoursModal(true)}
            className="bg-orange-600 py-4 rounded-xl"
            disabled={actionLoading}
          >
            <View className="flex-row items-center justify-center">
              <Ionicons name="checkmark-done-outline" size={20} color="white" />
              <Text className="text-center text-white font-bold ml-2">
                Complete Work
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      )}

      {booking.status === "awaiting-customer-approval" && (
        <View className="bg-white px-6 py-4 border-t border-gray-200">
          <View className="bg-orange-50 border border-orange-200 p-4 rounded-xl">
            <View className="flex-row items-center">
              <Ionicons name="time-outline" size={24} color="#ea580c" />
              <Text className="flex-1 ml-3 text-orange-700 font-medium">
                Waiting for customer to approve the completed work
              </Text>
            </View>
          </View>
        </View>
      )}

      {booking.status === "completed" && (
        <View className="bg-white px-6 py-4 border-t border-gray-200">
          <View className="bg-green-50 border border-green-200 p-4 rounded-xl">
            <View className="flex-row items-center">
              <Ionicons name="checkmark-circle" size={24} color="#10b981" />
              <Text className="flex-1 ml-3 text-green-700 font-medium">
                Job completed successfully!
              </Text>
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
                  Customer Raised a Dispute
                </Text>
                <Text className="text-pink-600 text-sm">
                  Our support team is reviewing this case. You will be contacted
                  soon.
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
                {booking.status === "pending"
                  ? "Decline Booking?"
                  : "Cancel Booking?"}
              </Text>
              <Text className="text-center text-gray-600">
                {booking.status === "pending"
                  ? "Are you sure you want to decline this booking request?"
                  : "Are you sure you want to cancel this booking?"}
              </Text>
            </View>
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setShowCancelModal(false)}
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
                    Yes, {booking.status === "pending" ? "Decline" : "Cancel"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showActualHoursModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowActualHoursModal(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View className="flex-1 bg-black/50 items-center justify-end">
            <TouchableWithoutFeedback onPress={() => {}}>
              <View className="bg-white rounded-t-3xl p-6 w-full">
                <View className="items-center mb-6">
                  <View className="w-16 h-16 bg-orange-100 rounded-full items-center justify-center mb-3">
                    <Ionicons name="time-outline" size={32} color="#ea580c" />
                  </View>
                  <Text className="text-xl font-bold text-gray-800 mb-2">
                    Complete Work
                  </Text>
                  <Text className="text-center text-gray-600">
                    Enter the actual hours worked to complete this job
                  </Text>
                </View>

                <View className="mb-4">
                  <Text className="text-sm font-medium text-gray-700 mb-2">
                    Actual Hours Worked *
                  </Text>
                  <TextInput
                    value={actualHours}
                    onChangeText={setActualHours}
                    placeholder="e.g., 2.5"
                    keyboardType="decimal-pad"
                    className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-700 text-base"
                  />
                  <Text className="text-xs text-gray-500 mt-1">
                    Estimated: {booking.pricing.estimatedHours} hours
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() => setShowWorkCompletionModal(true)}
                  className="bg-blue-50 border border-blue-200 py-3 rounded-xl mb-4"
                >
                  <View className="flex-row items-center justify-center">
                    <Ionicons name="camera-outline" size={20} color="#3b82f6" />
                    <Text className="text-blue-600 font-semibold ml-2">
                      Add Work Photos (Optional)
                    </Text>
                  </View>
                </TouchableOpacity>

                {(beforePhotos.length > 0 || afterPhotos.length > 0) && (
                  <View className="bg-gray-50 rounded-xl p-3 mb-4">
                    <Text className="text-xs text-gray-600">
                      📸 {beforePhotos.length} before photos,{" "}
                      {afterPhotos.length} after photos added
                    </Text>
                  </View>
                )}

                <View className="flex-row gap-3">
                  <TouchableOpacity
                    onPress={() => {
                      setShowActualHoursModal(false);
                      setActualHours("");
                    }}
                    className="flex-1 bg-gray-100 py-4 rounded-xl"
                    disabled={actionLoading}
                  >
                    <Text className="text-center text-gray-700 font-semibold">
                      Cancel
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleCompleteWork}
                    className="flex-1 bg-orange-600 py-4 rounded-xl"
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <ActivityIndicator color="white" size="small" />
                    ) : (
                      <Text className="text-center text-white font-semibold">
                        Submit
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Work Completion Photos Modal */}
      <Modal
        visible={showWorkCompletionModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowWorkCompletionModal(false)}
      >
        <View className="flex-1 bg-black/50 items-center justify-end">
          <View className="bg-white rounded-t-3xl p-6 w-full max-h-[80%]">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-xl font-bold text-gray-800">
                Work Documentation
              </Text>
              <TouchableOpacity
                onPress={() => setShowWorkCompletionModal(false)}
              >
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View className="mb-6">
                <Text className="text-sm font-semibold text-gray-700 mb-2">
                  Before Photos
                </Text>
                <TouchableOpacity
                  onPress={() => pickImage("before")}
                  className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-4 mb-2"
                >
                  <View className="items-center">
                    <Ionicons name="camera-outline" size={32} color="#9ca3af" />
                    <Text className="text-gray-600 text-sm mt-2">
                      Add Before Photos
                    </Text>
                  </View>
                </TouchableOpacity>
                {beforePhotos.length > 0 && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {beforePhotos.map((photo, index) => (
                      <View key={index} className="mr-2 relative">
                        <Image
                          source={{ uri: photo }}
                          className="w-20 h-20 rounded-lg"
                        />
                        <TouchableOpacity
                          onPress={() =>
                            setBeforePhotos(
                              beforePhotos.filter((_, i) => i !== index)
                            )
                          }
                          className="absolute -top-2 -right-2 bg-red-500 rounded-full w-6 h-6 items-center justify-center"
                        >
                          <Ionicons name="close" size={16} color="white" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </ScrollView>
                )}
              </View>

              <View className="mb-6">
                <Text className="text-sm font-semibold text-gray-700 mb-2">
                  After Photos
                </Text>
                <TouchableOpacity
                  onPress={() => pickImage("after")}
                  className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-4 mb-2"
                >
                  <View className="items-center">
                    <Ionicons name="camera-outline" size={32} color="#9ca3af" />
                    <Text className="text-gray-600 text-sm mt-2">
                      Add After Photos
                    </Text>
                  </View>
                </TouchableOpacity>
                {afterPhotos.length > 0 && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {afterPhotos.map((photo, index) => (
                      <View key={index} className="mr-2 relative">
                        <Image
                          source={{ uri: photo }}
                          className="w-20 h-20 rounded-lg"
                        />
                        <TouchableOpacity
                          onPress={() =>
                            setAfterPhotos(
                              afterPhotos.filter((_, i) => i !== index)
                            )
                          }
                          className="absolute -top-2 -right-2 bg-red-500 rounded-full w-6 h-6 items-center justify-center"
                        >
                          <Ionicons name="close" size={16} color="white" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </ScrollView>
                )}
              </View>

              <View className="mb-4">
                <Text className="text-sm font-semibold text-gray-700 mb-2">
                  Work Notes (Optional)
                </Text>
                <TextInput
                  value={workNotes}
                  onChangeText={setWorkNotes}
                  placeholder="Describe the work completed..."
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-700"
                />
              </View>
            </ScrollView>

            <TouchableOpacity
              onPress={() => setShowWorkCompletionModal(false)}
              className="bg-blue-600 py-4 rounded-xl mt-2"
            >
              <Text className="text-center text-white font-bold">Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default BookingDetailsScreen;

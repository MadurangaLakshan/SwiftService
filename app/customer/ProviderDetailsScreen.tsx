import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo, useState } from "react";
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
import { createBooking, getProviderReviews } from "../services/apiService";
import { createConversation } from "../services/messageService";
import {
  convertImageToBase64,
  pickMultipleImages,
  showImagePickerOptions,
  takePhoto,
} from "../utils/imageConverter";

const ProviderDetailsScreen = () => {
  const params = useLocalSearchParams();
  const {
    id,
    userId,
    name,
    service,
    category,
    rating,
    reviews,
    price,
    image,
    verified,
    specialties,
    bio,
    phone,
    email,
    location,
    yearsExperience,
    businessName,
    totalJobs,
  } = params;

  const specialtiesArray = specialties ? JSON.parse(specialties as string) : [];
  const locationData = location ? JSON.parse(location as string) : null;

  const serviceText =
    typeof service === "string"
      ? service
      : Array.isArray(service)
      ? service.join(", ")
      : "";

  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [attachedPhotos, setAttachedPhotos] = useState<string[]>([]);
  const [reviewsData, setReviewsData] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  const availableDates = useMemo(() => {
    const dates = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 10; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);

      const dayOfWeek = date.toLocaleDateString("en-US", { weekday: "short" });

      const monthDay = date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });

      let displayLabel;
      if (i === 0) {
        displayLabel = `Today, ${monthDay}`;
      } else if (i === 1) {
        displayLabel = `Tomorrow, ${monthDay}`;
      } else {
        displayLabel = `${dayOfWeek}, ${monthDay}`;
      }

      const fullDate = date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });

      dates.push({
        display: displayLabel,
        value: fullDate,
        date: date,
      });
    }

    return dates;
  }, []);

  const availableTimes = [
    "9:00 AM - 11:00 AM",
    "11:00 AM - 1:00 PM",
    "2:00 PM - 4:00 PM",
    "4:00 PM - 6:00 PM",
  ];

  React.useEffect(() => {
    const fetchReviews = async () => {
      if (!userId) return;

      try {
        setLoadingReviews(true);
        const response = await getProviderReviews(userId as string);

        const reviewsArray = Array.isArray(response?.data?.data?.reviews)
          ? response.data.data.reviews
          : [];

        setReviewsData(reviewsArray.slice(0, 3));
      } catch (error) {
        console.error("Error fetching reviews:", error);
        setReviewsData([]);
      } finally {
        setLoadingReviews(false);
      }
    };

    fetchReviews();
  }, [userId]);

  const pickImages = async () => {
    if (attachedPhotos.length >= 5) {
      Alert.alert("Limit Reached", "You can only attach up to 5 photos.");
      return;
    }

    try {
      setUploadingPhotos(true);

      const maxToSelect = 5 - attachedPhotos.length;
      const imageUris = await pickMultipleImages(maxToSelect);

      if (imageUris.length > 0) {
        // Convert all selected images to base64
        const base64Promises = imageUris.map((uri) =>
          convertImageToBase64(uri)
        );

        const base64Images = await Promise.all(base64Promises);
        setAttachedPhotos([...attachedPhotos, ...base64Images]);
      }
    } catch (error) {
      console.error("Error picking images:", error);
      Alert.alert("Error", "Failed to process images. Please try again.");
    } finally {
      setUploadingPhotos(false);
    }
  };

  const handleTakePhoto = async () => {
    if (attachedPhotos.length >= 5) {
      Alert.alert("Limit Reached", "You can only attach up to 5 photos.");
      return;
    }

    try {
      setUploadingPhotos(true);

      const photoUri = await takePhoto();

      if (photoUri) {
        const base64Image = await convertImageToBase64(photoUri);
        setAttachedPhotos([...attachedPhotos, base64Image]);
      }
    } catch (error) {
      console.error("Error taking photo:", error);
      Alert.alert("Error", "Failed to process photo. Please try again.");
    } finally {
      setUploadingPhotos(false);
    }
  };

  const removePhoto = (index: number) => {
    setAttachedPhotos(attachedPhotos.filter((_, i) => i !== index));
  };

  const handleShowPhotoOptions = () => {
    showImagePickerOptions(
      pickImages,
      handleTakePhoto,
      "Add Photo",
      "Choose an option"
    );
  };

  const handleBookNow = async () => {
    if (!selectedDate || !selectedTime || !address) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      const priceStr = typeof price === "string" ? price : String(price);
      const hourlyRate = parseFloat(priceStr.split("/")[0]) || 0;

      const bookingPayload = {
        providerId: userId as string,
        serviceType: serviceText,
        category: category as string,
        scheduledDate: selectedDate,
        timeSlot: selectedTime,
        serviceAddress: address,
        additionalNotes: notes,
        hourlyRate: hourlyRate,
        estimatedHours: 1,
        customerAttachedPhotos: attachedPhotos, // Base64 images
      };

      const bookingResult = await createBooking(bookingPayload);

      if (!bookingResult.success) {
        alert(`Booking failed: ${bookingResult.error}`);
        return;
      }

      const bookingData = bookingResult.data.data;

      router.push({
        pathname: "/customer/BookingDetailsScreen",
        params: {
          bookingId: bookingData._id,
        },
      });

      setShowBookingModal(false);
      // Reset form
      setSelectedDate("");
      setSelectedTime("");
      setAddress("");
      setNotes("");
      setAttachedPhotos([]);
    } catch (error: any) {
      console.error("Booking error:", error);
      alert("An unexpected error occurred while creating your booking.");
    }
  };

  const handleCall = () => {
    if (phone) {
      Linking.openURL(`tel:${phone}`);
    } else {
      alert("Phone number not available");
    }
  };

  const handleMessage = async () => {
    try {
      const response = await createConversation(userId as string);

      if (response.success && response.data) {
        const conversationId =
          response.data.conversationId || response.data._id;

        if (!conversationId) {
          alert("Failed to get conversation ID");
          return;
        }

        router.push({
          pathname: "/customer/ChatScreen",
          params: {
            conversationId: conversationId.toString(),
            otherUserId: userId as string,
            otherUserName: name as string,
            otherUserPhoto: image as string,
          },
        });
      } else {
        alert(
          `Failed to create conversation: ${response.error || "Unknown error"}`
        );
      }
    } catch (error: any) {
      console.error("Error creating conversation:", error);
      alert("Failed to start conversation. Please try again.");
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-6 pt-12 pb-4 border-b border-gray-200">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <Ionicons name="arrow-back" size={24} color="black" />
          </TouchableOpacity>
          <Text className="flex-1 text-xl font-bold text-gray-800">
            Provider Details
          </Text>
          <TouchableOpacity>
            <Ionicons name="heart-outline" size={24} color="#6b7280" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Provider Card */}
        <View className="mx-6 mt-6 bg-white rounded-2xl p-6 border border-gray-200">
          <View className="items-center mb-4">
            <Image
              source={{ uri: image as string }}
              className="w-24 h-24 rounded-full mb-3"
            />
            <View className="flex-row items-center mb-1">
              <Text className="text-2xl font-bold text-gray-800">{name}</Text>
              {verified && (
                <Ionicons
                  name="checkmark-circle"
                  size={24}
                  color="#3b82f6"
                  style={{ marginLeft: 6 }}
                />
              )}
            </View>
            {businessName && (
              <Text className="text-sm text-gray-500 mb-1">{businessName}</Text>
            )}
            <Text className="text-base text-gray-600 mb-2">{service}</Text>
            <View className="flex-row items-center">
              <Ionicons name="star" size={18} color="#fbbf24" />
              <Text className="text-base font-semibold text-gray-700 ml-1">
                {rating}
              </Text>
              <Text className="text-sm text-gray-500 ml-1">
                ({reviews} reviews)
              </Text>
            </View>
            <View className="flex-row items-center mt-2">
              <Ionicons name="briefcase-outline" size={16} color="#6b7280" />
              <Text className="text-sm text-gray-600 ml-1">
                {yearsExperience || 0} years experience
              </Text>
            </View>
          </View>

          <View className="flex-row mb-4 justify-center">
            {specialtiesArray.map((specialty: string, index: number) => (
              <View
                key={index}
                className="bg-blue-50 rounded-full px-3 py-1.5 mr-2"
              >
                <Text className="text-sm text-blue-700">{specialty}</Text>
              </View>
            ))}
          </View>

          {/* Message and Call Buttons */}
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={handleMessage}
              className="flex-1 bg-gray-100 py-3 rounded-xl flex-row items-center justify-center"
            >
              <Ionicons name="chatbox-outline" size={20} color="#3b82f6" />
              <Text className="text-blue-600 font-semibold ml-2">Message</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleCall}
              className="flex-1 bg-gray-100 py-3 rounded-xl flex-row items-center justify-center"
            >
              <Ionicons name="call-outline" size={20} color="#3b82f6" />
              <Text className="text-blue-600 font-semibold ml-2">Call</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Pricing & Stats */}
        <View className="mx-6 mt-4 bg-white rounded-2xl p-4 border border-gray-200">
          <Text className="text-sm font-semibold text-gray-500 mb-3">
            PRICING
          </Text>
          <View className="flex-row items-center justify-between">
            <Text className="text-gray-600">Hourly Rate</Text>
            <Text className="text-2xl font-bold text-blue-600">{price}</Text>
          </View>

          {totalJobs !== undefined && (
            <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-gray-100">
              <Text className="text-gray-600">Jobs Completed</Text>
              <Text className="text-lg font-bold text-gray-800">
                {totalJobs || 0}
              </Text>
            </View>
          )}

          {locationData && (
            <View className="mt-3 pt-3 border-t border-gray-100">
              <View className="flex-row items-center">
                <Ionicons name="location-outline" size={16} color="#6b7280" />
                <Text className="text-gray-600 ml-1">
                  {locationData.city}, {locationData.postalCode}
                </Text>
              </View>
              <Text className="text-xs text-gray-500 mt-1">
                Service radius: {locationData.serviceRadius || 10} km
              </Text>
            </View>
          )}

          <Text className="text-sm font-semibold text-gray-500 mt-4 mb-2">
            ABOUT
          </Text>
          <Text className="text-gray-700 leading-6">
            {bio ||
              `Professional ${serviceText.toLowerCase()} with over ${
                yearsExperience || 10
              } years of experience. Specializing in ${specialtiesArray
                .join(", ")
                .toLowerCase()}. Committed to delivering high-quality service with attention to detail and customer satisfaction.`}
          </Text>
        </View>

        {/* Reviews */}
        <View className="mx-6 mt-4 bg-white rounded-2xl p-4 border border-gray-200 mb-6">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-sm font-semibold text-gray-500">REVIEWS</Text>
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: "/customer/ProviderReviewsScreen",
                  params: {
                    providerId: userId as string,
                    providerName: name as string,
                    averageRating: rating as string,
                  },
                })
              }
            >
              <Text className="text-sm text-blue-600 font-medium">See All</Text>
            </TouchableOpacity>
          </View>

          {loadingReviews ? (
            <Text className="text-gray-500 text-center py-4">
              Loading reviews...
            </Text>
          ) : reviewsData.length === 0 ? (
            <Text className="text-gray-500 text-center py-4">
              No reviews available
            </Text>
          ) : (
            reviewsData.map((review, index) => (
              <View key={index} className="mb-4 pb-4 border-b border-gray-100">
                <View className="flex-row items-center mb-2">
                  <Image
                    source={{
                      uri:
                        review.customerPhoto ||
                        `https://i.pravatar.cc/150?img=${index + 20}`,
                    }}
                    className="w-10 h-10 rounded-full"
                  />
                  <View className="flex-1 ml-3">
                    <Text className="font-semibold text-gray-800">
                      {review.customerName || `Customer ${index + 1}`}
                    </Text>
                    <Text>{review.review}</Text>

                    <View className="flex-row items-center">
                      {[...Array(5)].map((_, starIndex) => (
                        <Ionicons
                          key={starIndex}
                          name="star"
                          size={12}
                          color={
                            starIndex < review.rating ? "#fbbf24" : "#d1d5db"
                          }
                        />
                      ))}
                    </View>
                  </View>
                  <Text className="text-xs text-gray-500">
                    {review.timeAgo || "2 days ago"}
                  </Text>
                </View>
                <Text className="text-sm text-gray-600">{review.comment}</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Book Now Button */}
      <View className="bg-white px-6 py-4 border-t border-gray-200">
        <TouchableOpacity
          onPress={() => setShowBookingModal(true)}
          className="bg-blue-600 py-4 rounded-xl flex-row items-center justify-center"
        >
          <Ionicons name="calendar-outline" size={24} color="white" />
          <Text className="text-white font-bold text-base ml-2">Book Now</Text>
        </TouchableOpacity>
      </View>

      {/* Booking Modal */}
      <Modal
        visible={showBookingModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowBookingModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6 max-h-[90%]">
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-xl font-bold text-gray-800">
                Book Service
              </Text>
              <TouchableOpacity onPress={() => setShowBookingModal(false)}>
                <Ionicons name="close" size={28} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Select Date */}
              <Text className="text-sm font-semibold text-gray-700 mb-3">
                Select Date *
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="mb-6"
              >
                {availableDates.map((dateObj) => (
                  <TouchableOpacity
                    key={dateObj.value}
                    onPress={() => setSelectedDate(dateObj.value)}
                    className={`mr-3 px-4 py-3 rounded-xl border ${
                      selectedDate === dateObj.value
                        ? "bg-blue-600 border-blue-600"
                        : "bg-white border-gray-200"
                    }`}
                  >
                    <Text
                      className={`font-medium ${
                        selectedDate === dateObj.value
                          ? "text-white"
                          : "text-gray-700"
                      }`}
                    >
                      {dateObj.display}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Select Time */}
              <Text className="text-sm font-semibold text-gray-700 mb-3">
                Select Time Slot *
              </Text>
              <View className="flex-row flex-wrap mb-6">
                {availableTimes.map((time) => (
                  <TouchableOpacity
                    key={time}
                    onPress={() => setSelectedTime(time)}
                    className={`mr-2 mb-2 px-4 py-3 rounded-xl border ${
                      selectedTime === time
                        ? "bg-blue-600 border-blue-600"
                        : "bg-white border-gray-200"
                    }`}
                  >
                    <Text
                      className={`font-medium ${
                        selectedTime === time ? "text-white" : "text-gray-700"
                      }`}
                    >
                      {time}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Address */}
              <Text className="text-sm font-semibold text-gray-700 mb-3">
                Service Address *
              </Text>
              <TextInput
                value={address}
                onChangeText={setAddress}
                placeholder="Enter your address"
                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-6 text-gray-700"
                multiline
              />

              {/* Photo Attachments */}
              <Text className="text-sm font-semibold text-gray-700 mb-3">
                Attach Photos (Optional)
              </Text>
              <Text className="text-xs text-gray-500 mb-3">
                Share photos of the area or issue to help the provider prepare
                better (max 5 photos)
              </Text>

              {attachedPhotos.length > 0 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  className="mb-3"
                >
                  {attachedPhotos.map((photo, index) => (
                    <View key={index} className="mr-3 relative">
                      <Image
                        source={{ uri: photo }}
                        className="w-24 h-24 rounded-xl"
                      />
                      <TouchableOpacity
                        onPress={() => removePhoto(index)}
                        className="absolute -top-2 -right-2 bg-red-500 rounded-full w-6 h-6 items-center justify-center"
                      >
                        <Ionicons name="close" size={16} color="white" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              )}

              {attachedPhotos.length < 5 && (
                <TouchableOpacity
                  onPress={handleShowPhotoOptions}
                  disabled={uploadingPhotos}
                  className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl py-6 items-center justify-center mb-6"
                >
                  {uploadingPhotos ? (
                    <>
                      <ActivityIndicator size="large" color="#3b82f6" />
                      <Text className="text-gray-600 font-medium mt-2">
                        Processing photos...
                      </Text>
                    </>
                  ) : (
                    <>
                      <Ionicons
                        name="images-outline"
                        size={32}
                        color="#6b7280"
                      />
                      <Text className="text-gray-600 font-medium mt-2">
                        Add Photos
                      </Text>
                      <Text className="text-xs text-gray-500 mt-1">
                        {attachedPhotos.length}/5 photos added
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              )}

              {/* Additional Notes */}
              <Text className="text-sm font-semibold text-gray-700 mb-3">
                Additional Notes (Optional)
              </Text>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="Any specific requirements or instructions..."
                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-6 text-gray-700 h-24"
                multiline
                textAlignVertical="top"
              />

              {/* Summary */}
              <View className="bg-blue-50 rounded-xl p-4 mb-6">
                <Text className="text-sm font-semibold text-gray-700 mb-2">
                  Booking Summary
                </Text>
                <View className="flex-row justify-between mb-1">
                  <Text className="text-sm text-gray-600">Service</Text>
                  <Text className="text-sm font-medium text-gray-800">
                    {service}
                  </Text>
                </View>
                <View className="flex-row justify-between mb-1">
                  <Text className="text-sm text-gray-600">Provider</Text>
                  <Text className="text-sm font-medium text-gray-800">
                    {name}
                  </Text>
                </View>
                <View className="flex-row justify-between mb-1">
                  <Text className="text-sm text-gray-600">Rate</Text>
                  <Text className="text-sm font-medium text-gray-800">
                    {price}
                  </Text>
                </View>
                {selectedDate && (
                  <View className="flex-row justify-between mb-1">
                    <Text className="text-sm text-gray-600">Date</Text>
                    <Text className="text-sm font-medium text-gray-800">
                      {selectedDate}
                    </Text>
                  </View>
                )}
                {selectedTime && (
                  <View className="flex-row justify-between mb-1">
                    <Text className="text-sm text-gray-600">Time</Text>
                    <Text className="text-sm font-medium text-gray-800">
                      {selectedTime}
                    </Text>
                  </View>
                )}
                {attachedPhotos.length > 0 && (
                  <View className="flex-row justify-between">
                    <Text className="text-sm text-gray-600">
                      Photos Attached
                    </Text>
                    <Text className="text-sm font-medium text-gray-800">
                      {attachedPhotos.length} photo
                      {attachedPhotos.length > 1 ? "s" : ""}
                    </Text>
                  </View>
                )}
              </View>

              {/* Confirm Button */}
              <TouchableOpacity
                onPress={handleBookNow}
                className="bg-blue-600 py-4 rounded-xl flex-row items-center justify-center mb-4"
              >
                <Ionicons name="checkmark-circle" size={24} color="white" />
                <Text className="text-white font-bold text-base ml-2">
                  Confirm Booking
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default ProviderDetailsScreen;

import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { auth } from "../config/firebase";
import { getProviderReviews } from "../services/apiService";

interface Review {
  _id: string;
  bookingId: string;
  rating: number;
  review?: string;
  serviceType: string;
  customerName: string;
  customerPhoto?: string;
  providerResponse?: {
    message: string;
    respondedAt: string;
  };
  helpful: number;
  createdAt: string;
  updatedAt: string;
}

interface ReviewData {
  reviews: Review[];
  total: number;
  breakdown: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

const ReviewScreen = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reviewData, setReviewData] = useState<ReviewData | null>(null);
  const [filter, setFilter] = useState<"all" | 1 | 2 | 3 | 4 | 5>("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        Alert.alert("Error", "You must be logged in");
        return;
      }

      const response = await getProviderReviews(userId);

      if (response.success && response.data) {
        setReviewData(response.data.data);
      } else {
        Alert.alert("Error", "Failed to load reviews");
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
      Alert.alert("Error", "Failed to load reviews");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchReviews();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const renderStars = (rating: number) => {
    return (
      <View className="flex-row">
        {[1, 2, 3, 4, 5].map((star) => (
          <Ionicons
            key={star}
            name="star"
            size={16}
            color={star <= rating ? "#fbbf24" : "#e5e7eb"}
          />
        ))}
      </View>
    );
  };

  const renderRatingBar = (
    stars: 1 | 2 | 3 | 4 | 5,
    count: number,
    total: number
  ) => {
    const percentage = total > 0 ? (count / total) * 100 : 0;

    return (
      <TouchableOpacity
        key={stars}
        onPress={() => setFilter(filter === stars ? "all" : stars)}
        className={`flex-row items-center mb-2 p-2 rounded-lg ${
          filter === stars ? "bg-yellow-50" : ""
        }`}
      >
        <Text
          className={`text-sm w-8 ${
            filter === stars ? "font-bold text-yellow-700" : "text-gray-600"
          }`}
        >
          {stars}★
        </Text>
        <View className="flex-1 h-2 bg-gray-200 rounded-full mx-3">
          <View
            className="h-2 bg-yellow-400 rounded-full"
            style={{ width: `${percentage}%` }}
          />
        </View>
        <Text
          className={`text-sm w-10 text-right ${
            filter === stars ? "font-bold text-yellow-700" : "text-gray-600"
          }`}
        >
          {count}
        </Text>
      </TouchableOpacity>
    );
  };

  const getFilteredReviews = () => {
    if (!reviewData?.reviews) return [];

    let filtered = reviewData.reviews;

    // Filter by rating
    if (filter !== "all") {
      filtered = filtered.filter((review) => review.rating === filter);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (review) =>
          review.customerName.toLowerCase().includes(query) ||
          review.review?.toLowerCase().includes(query) ||
          review.serviceType.toLowerCase().includes(query)
      );
    }

    return filtered;
  };

  const calculateAverageRating = () => {
    if (!reviewData?.reviews || reviewData.reviews.length === 0) return "0.0";
    const total = reviewData.reviews.reduce(
      (sum, review) => sum + review.rating,
      0
    );
    return (total / reviewData.reviews.length).toFixed(1);
  };

  const handleViewBooking = (bookingId: string) => {
    router.push({
      pathname: "/serviceProvider/BookingDetailsScreen",
      params: { bookingId },
    });
  };

  const filteredReviews = getFilteredReviews();

  if (loading) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="text-gray-500 mt-4">Loading reviews...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-6 pt-12 pb-4 border-b border-gray-200">
        <View className="flex-row items-center mb-4">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <Ionicons name="arrow-back" size={24} color="black" />
          </TouchableOpacity>
          <Text className="flex-1 text-xl font-bold text-gray-800">
            My Reviews
          </Text>
        </View>

        {/* Search Bar */}
        <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-3">
          <Ionicons name="search" size={20} color="#9ca3af" />
          <TextInput
            placeholder="Search reviews..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            className="flex-1 ml-3 text-gray-800"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={20} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Rating Summary */}
        <View className="mx-6 mt-6 bg-white rounded-2xl p-6 border border-gray-200">
          <View className="items-center mb-6">
            <Text className="text-5xl font-bold text-gray-800 mb-2">
              {calculateAverageRating()}
            </Text>
            <View className="flex-row mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Ionicons
                  key={star}
                  name="star"
                  size={24}
                  color={
                    star <= Math.round(parseFloat(calculateAverageRating()))
                      ? "#fbbf24"
                      : "#e5e7eb"
                  }
                />
              ))}
            </View>
            <Text className="text-gray-600">
              Based on {reviewData?.total || 0} reviews
            </Text>
          </View>

          {/* Rating Breakdown */}
          {reviewData?.breakdown && (
            <View>
              <Text className="text-sm font-semibold text-gray-500 mb-3">
                RATING BREAKDOWN
              </Text>
              {([5, 4, 3, 2, 1] as const).map((stars) =>
                renderRatingBar(
                  stars,
                  reviewData.breakdown[
                    stars as keyof typeof reviewData.breakdown
                  ],
                  reviewData.total
                )
              )}
            </View>
          )}

          {/* Filter Indicator */}
          {filter !== "all" && (
            <View className="mt-4 pt-4 border-t border-gray-200">
              <View className="flex-row items-center justify-between">
                <Text className="text-sm text-gray-600">
                  Showing {filter}-star reviews
                </Text>
                <TouchableOpacity
                  onPress={() => setFilter("all")}
                  className="bg-gray-100 px-3 py-1 rounded-full"
                >
                  <Text className="text-xs text-gray-700 font-medium">
                    Clear Filter
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Reviews List */}
        <View className="mx-6 mt-4 mb-6">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-bold text-gray-800">
              {filteredReviews.length}{" "}
              {filteredReviews.length === 1 ? "Review" : "Reviews"}
            </Text>
            {searchQuery && (
              <Text className="text-sm text-gray-500">for "{searchQuery}"</Text>
            )}
          </View>

          {filteredReviews.length > 0 ? (
            filteredReviews.map((review) => (
              <View
                key={review._id}
                className="bg-white rounded-2xl p-4 mb-3 border border-gray-200"
              >
                {/* Customer Info */}
                <View className="flex-row items-start mb-3">
                  <Image
                    source={{
                      uri:
                        review.customerPhoto ||
                        `https://i.pravatar.cc/150?u=${review.customerName}`,
                    }}
                    className="w-12 h-12 rounded-full"
                  />
                  <View className="flex-1 ml-3">
                    <View className="flex-row items-center justify-between mb-1">
                      <Text className="font-semibold text-gray-800">
                        {review.customerName}
                      </Text>
                      <Text className="text-xs text-gray-500">
                        {formatDate(review.createdAt)}
                      </Text>
                    </View>
                    {renderStars(review.rating)}
                    <View className="flex-row items-center mt-1">
                      <Ionicons
                        name="construct-outline"
                        size={12}
                        color="#6b7280"
                      />
                      <Text className="text-xs text-gray-500 ml-1">
                        {review.serviceType}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Review Text */}
                {review.review && (
                  <Text className="text-gray-700 mb-3 leading-5">
                    {review.review}
                  </Text>
                )}

                {/* Provider Response */}
                {review.providerResponse && (
                  <View className="bg-blue-50 rounded-xl p-3 mt-2 border-l-4 border-blue-600">
                    <Text className="text-xs font-semibold text-blue-800 mb-1">
                      Your Response
                    </Text>
                    <Text className="text-sm text-gray-700">
                      {review.providerResponse.message}
                    </Text>
                    <Text className="text-xs text-gray-500 mt-1">
                      {formatDate(review.providerResponse.respondedAt)}
                    </Text>
                  </View>
                )}

                {/* Action Buttons */}
                <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-gray-100">
                  <View className="flex-row items-center">
                    <Ionicons
                      name="thumbs-up-outline"
                      size={16}
                      color="#6b7280"
                    />
                    <Text className="text-xs text-gray-600 ml-1">
                      {review.helpful} helpful
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => handleViewBooking(review.bookingId)}
                    className="flex-row items-center"
                  >
                    <Text className="text-xs text-blue-600 font-medium mr-1">
                      View Booking
                    </Text>
                    <Ionicons name="arrow-forward" size={14} color="#3b82f6" />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          ) : (
            <View className="bg-white rounded-2xl p-8 items-center border border-gray-200">
              <View className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-4">
                <Ionicons name="star-outline" size={40} color="#d1d5db" />
              </View>
              <Text className="text-gray-800 font-semibold text-lg mb-2">
                No Reviews Found
              </Text>
              <Text className="text-gray-500 text-center">
                {filter !== "all"
                  ? `You don't have any ${filter}-star reviews yet`
                  : searchQuery
                  ? `No reviews match "${searchQuery}"`
                  : "You haven't received any reviews yet"}
              </Text>
              {(filter !== "all" || searchQuery) && (
                <TouchableOpacity
                  onPress={() => {
                    setFilter("all");
                    setSearchQuery("");
                  }}
                  className="mt-4 bg-blue-600 px-6 py-3 rounded-xl"
                >
                  <Text className="text-white font-semibold">
                    Clear Filters
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Tips Section */}
        {reviewData && reviewData.total > 0 && (
          <View className="mx-6 mb-6 bg-blue-50 rounded-2xl p-4 border border-blue-200">
            <View className="flex-row items-start">
              <View className="w-10 h-10 bg-blue-100 rounded-full items-center justify-center mr-3">
                <Ionicons name="bulb" size={20} color="#3b82f6" />
              </View>
              <View className="flex-1">
                <Text className="text-blue-900 font-semibold mb-1">
                  Pro Tip
                </Text>
                <Text className="text-blue-700 text-sm">
                  Respond to reviews to show customers you value their feedback
                  and build trust with potential clients!
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default ReviewScreen;

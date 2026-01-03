import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { getProviderReviews } from "../services/apiService";

interface Review {
  _id: string;
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

const ProviderReviewsScreen = () => {
  const params = useLocalSearchParams();
  const { providerId, providerName, averageRating } = params;

  const [loading, setLoading] = useState(true);
  const [reviewData, setReviewData] = useState<ReviewData | null>(null);

  useEffect(() => {
    fetchReviews();
  }, [providerId]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await getProviderReviews(providerId as string);

      if (response.success && response.data) {
        setReviewData(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setLoading(false);
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

  const renderRatingBar = (stars: number, count: number, total: number) => {
    const percentage = total > 0 ? (count / total) * 100 : 0;

    return (
      <View className="flex-row items-center mb-2">
        <Text className="text-sm text-gray-600 w-8">{stars}★</Text>
        <View className="flex-1 h-2 bg-gray-200 rounded-full mx-3">
          <View
            className="h-2 bg-yellow-400 rounded-full"
            style={{ width: `${percentage}%` }}
          />
        </View>
        <Text className="text-sm text-gray-600 w-10 text-right">{count}</Text>
      </View>
    );
  };

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
      <View className="bg-white px-6 pt-12 pb-4 border-b border-gray-200">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <Ionicons name="arrow-back" size={24} color="black" />
          </TouchableOpacity>
          <Text className="flex-1 text-xl font-bold text-gray-800">
            Reviews
          </Text>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Rating Summary */}
        <View className="mx-6 mt-6 bg-white rounded-2xl p-6 border border-gray-200">
          <View className="items-center mb-6">
            <Text className="text-5xl font-bold text-gray-800 mb-2">
              {parseFloat(averageRating as string).toFixed(1)}
            </Text>
            <View className="flex-row mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Ionicons
                  key={star}
                  name="star"
                  size={24}
                  color={
                    star <= Math.round(parseFloat(averageRating as string))
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

          {reviewData?.breakdown && (
            <View>
              {[5, 4, 3, 2, 1].map((stars) => (
                <View key={stars}>
                  {renderRatingBar(
                    stars,
                    reviewData.breakdown[
                      stars as keyof typeof reviewData.breakdown
                    ],
                    reviewData.total
                  )}
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Reviews List */}
        <View className="mx-6 mt-4 mb-6">
          <Text className="text-lg font-bold text-gray-800 mb-4">
            Customer Reviews
          </Text>

          {reviewData?.reviews && reviewData.reviews.length > 0 ? (
            reviewData.reviews.map((review) => (
              <View
                key={review._id}
                className="bg-white rounded-2xl p-4 mb-3 border border-gray-200"
              >
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
                    <Text className="text-xs text-gray-500 mt-1">
                      {review.serviceType}
                    </Text>
                  </View>
                </View>

                {review.review && (
                  <Text className="text-gray-700 mb-3">{review.review}</Text>
                )}

                {review.providerResponse && (
                  <View className="bg-blue-50 rounded-xl p-3 mt-2 border-l-4 border-blue-600">
                    <Text className="text-xs font-semibold text-blue-800 mb-1">
                      Response from {providerName}
                    </Text>
                    <Text className="text-sm text-gray-700">
                      {review.providerResponse.message}
                    </Text>
                    <Text className="text-xs text-gray-500 mt-1">
                      {formatDate(review.providerResponse.respondedAt)}
                    </Text>
                  </View>
                )}

                <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-gray-100">
                  <View className="flex-row items-center">
                    <Ionicons
                      name="thumbs-up-outline"
                      size={16}
                      color="#6b7280"
                    />
                    <Text className="text-xs text-gray-600 ml-1">
                      Helpful ({review.helpful})
                    </Text>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <View className="bg-white rounded-2xl p-8 items-center border border-gray-200">
              <Ionicons name="star-outline" size={48} color="#d1d5db" />
              <Text className="text-gray-500 mt-4 text-center">
                No reviews yet
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default ProviderReviewsScreen;

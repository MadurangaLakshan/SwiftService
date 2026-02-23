import { authenticatedRequest } from "./apiService";

export const createReview = async (reviewData: any) => {
  return authenticatedRequest("/reviews", {
    method: "POST",
    body: JSON.stringify(reviewData),
  });
};

export const getProviderReviews = async (providerId: string) => {
  return authenticatedRequest(`/reviews/providers/${providerId}/reviews`, {
    method: "GET",
  });
};

export const submitBookingReview = async (
  bookingId: string,
  reviewData: {
    rating: number;
    review?: string;
  },
) => {
  return authenticatedRequest(`/reviews/bookings/${bookingId}/review`, {
    method: "POST",
    body: JSON.stringify(reviewData),
  });
};

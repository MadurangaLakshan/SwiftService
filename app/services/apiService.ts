import * as Location from "expo-location";
import { auth } from "../config/firebase";

const API_URL = __DEV__
  ? process.env.EXPO_PUBLIC_API_URL || "http://192.168.1.XXX:3000/api"
  : "https://production-domain.com/api";

const authenticatedRequest = async (
  endpoint: string,
  options: RequestInit = {}
) => {
  try {
    const token = await auth.currentUser?.getIdToken();

    if (!token) {
      throw new Error("No authentication token available");
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Request failed");
    }

    return { success: true, data };
  } catch (error: any) {
    console.error("API Request Error:", error);
    return { success: false, error: error.message };
  }
};

export const getUserType = async (userId: string) => {
  try {
    const response = await fetch(`${API_URL}/users/type/${userId}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching user type:", error);
    return { success: false, error: "Failed to fetch user type" };
  }
};

export const registerProviderProfile = async (providerData: any) => {
  return authenticatedRequest("/providers/register", {
    method: "POST",
    body: JSON.stringify(providerData),
  });
};

export const getProviderProfile = async (userId: string) => {
  try {
    const result = authenticatedRequest(`/providers/${userId}`, {
      method: "GET",
    });

    return result;
  } catch (error: any) {
    console.error("Error fetching provider profile:", error);
    return { success: false, error: error.message };
  }
};

export const updateProviderProfile = async (userId: string, updates: any) => {
  return authenticatedRequest(`/providers/${userId}`, {
    method: "PUT",
    body: JSON.stringify(updates),
  });
};

export const updateProviderProfilePicture = async (
  userId: string,
  imageUrl: string
) => {
  try {
    const result = await authenticatedRequest(`/providers/${userId}`, {
      method: "PUT",
      body: JSON.stringify({ profilePhoto: imageUrl }),
    });

    // Handle both response formats from your backend
    if (result.success || result.data) {
      return {
        success: true,
        data: result.data || result,
      };
    }

    return result;
  } catch (error: any) {
    console.error("Error updating provider profile picture:", error);
    return { success: false, error: error.message };
  }
};

export const updateCustomerProfilePicture = async (
  userId: string,
  imageUrl: string
) => {
  try {
    const result = await authenticatedRequest(`/customers/${userId}`, {
      method: "PUT",
      body: JSON.stringify({ profilePhoto: imageUrl }),
    });

    // Handle both response formats from your backend
    if (result.success || result.data) {
      return {
        success: true,
        data: result.data || result,
      };
    }

    return result;
  } catch (error: any) {
    console.error("Error updating customer profile picture:", error);
    return { success: false, error: error.message };
  }
};

export const deleteProviderProfile = async (userId: string) => {
  return authenticatedRequest(`/providers/${userId}`, {
    method: "DELETE",
  });
};

export const searchProviders = async (filters: {
  service?: string;
  city?: string;
  minRating?: number;
}) => {
  const params = new URLSearchParams();
  if (filters.service) params.append("service", filters.service);
  if (filters.city) params.append("city", filters.city);
  if (filters.minRating)
    params.append("minRating", filters.minRating.toString());

  const queryString = params.toString();
  const endpoint = queryString ? `/providers?${queryString}` : "/providers";

  return authenticatedRequest(endpoint, {
    method: "GET",
  });
};

export const getAllProviders = async (filters?: {
  service?: string;
  city?: string;
}) => {
  let endpoint = "/providers";

  if (filters) {
    const params = new URLSearchParams();
    if (filters.service) params.append("service", filters.service);
    if (filters.city) params.append("city", filters.city);

    const queryString = params.toString();
    if (queryString) {
      endpoint = `/providers?${queryString}`;
    }
  }

  return authenticatedRequest(endpoint, {
    method: "GET",
  });
};

export const registerCustomerProfile = async (customerData: any) => {
  return authenticatedRequest("/customers/register", {
    method: "POST",
    body: JSON.stringify(customerData),
  });
};

export const getCustomerProfile = async (userId: string) => {
  try {
    const result = await authenticatedRequest(`/customers/${userId}`, {
      method: "GET",
    });

    return result;
  } catch (error: any) {
    console.error("Error fetching customer profile:", error);
    return { success: false, error: error.message };
  }
};

export const updateCustomerProfile = async (userId: string, updates: any) => {
  return authenticatedRequest(`/customers/${userId}`, {
    method: "PUT",
    body: JSON.stringify(updates),
  });
};

export const deleteCustomerProfile = async (userId: string) => {
  return authenticatedRequest(`/customers/${userId}`, {
    method: "DELETE",
  });
};

export const getBooking = async (bookingId: string) => {
  return authenticatedRequest(`/bookings/${bookingId}`, {
    method: "GET",
  });
};

export const getProviderBookings = async (providerId: string) => {
  return authenticatedRequest(`/bookings/provider/${providerId}`, {
    method: "GET",
  });
};

export const updateBookingStatus = async (
  bookingId: string,
  status: string,
  additionalData?: any
) => {
  return authenticatedRequest(`/bookings/${bookingId}/status`, {
    method: "PUT",
    body: JSON.stringify({ status, ...additionalData }),
  });
};

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

// UPDATED: Now accepts serviceLocation with coordinates
export const createBooking = async (bookingData: {
  providerId: string;
  serviceType: string;
  category: string;
  scheduledDate: string;
  timeSlot: string;
  serviceAddress: string;
  serviceLocation?: {
    latitude: number;
    longitude: number;
    formattedAddress: string;
    isCustomAddress: boolean;
  };
  additionalNotes?: string;
  hourlyRate: number;
  estimatedHours?: number;
  customerAttachedPhotos?: string[];
}) => {
  return authenticatedRequest("/bookings", {
    method: "POST",
    body: JSON.stringify(bookingData),
  });
};

export const getCustomerBookings = async (customerId: string) => {
  return authenticatedRequest(`/bookings/customer/${customerId}`, {
    method: "GET",
  });
};

export const getBookingById = async (bookingId: string) => {
  return authenticatedRequest(`/bookings/${bookingId}`, {
    method: "GET",
  });
};

export const cancelBooking = async (bookingId: string, reason: string) => {
  return authenticatedRequest(`/bookings/${bookingId}/cancel`, {
    method: "PUT",
    body: JSON.stringify({ reason }),
  });
};

export const uploadWorkPhotos = async (
  bookingId: string,
  documentation: {
    beforePhotos: string[];
    afterPhotos: string[];
    workNotes?: string;
  }
) => {
  return authenticatedRequest(`/bookings/${bookingId}/work-documentation`, {
    method: "POST",
    body: JSON.stringify(documentation),
  });
};

export const approveBookingCompletion = async (bookingId: string) => {
  return authenticatedRequest(`/bookings/${bookingId}/approve`, {
    method: "PUT",
  });
};

export const disputeBooking = async (
  bookingId: string,
  disputeData: {
    reason: string;
    description: string;
  }
) => {
  return authenticatedRequest(`/bookings/${bookingId}/dispute`, {
    method: "PUT",
    body: JSON.stringify(disputeData),
  });
};

export const submitBookingReview = async (
  bookingId: string,
  reviewData: {
    rating: number;
    review?: string;
  }
) => {
  return authenticatedRequest(`/reviews/bookings/${bookingId}/review`, {
    method: "POST",
    body: JSON.stringify(reviewData),
  });
};

export const getApiUrl = () => API_URL;

export const isApiAvailable = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_URL.replace("/api", "")}/health`);
    return response.ok;
  } catch (error) {
    console.error("API not available:", error);
    return false;
  }
};

// ============================================================================
// NEW: LOCATION TRACKING API FUNCTIONS
// ============================================================================

/**
 * Geocode an address to get coordinates
 * Uses Google Geocoding API
 */
export const geocodeAddress = async (address: string) => {
  try {
    const response = await authenticatedRequest("/location/geocode", {
      method: "POST",
      body: JSON.stringify({ address }),
    });

    return response;
  } catch (error) {
    console.error("Error geocoding address:", error);
    throw error;
  }
};

/**
 * Reverse geocode coordinates to get address
 * Converts latitude/longitude to formatted address
 */
export const reverseGeocode = async (latitude: number, longitude: number) => {
  try {
    const response = await authenticatedRequest("/location/reverse-geocode", {
      method: "POST",
      body: JSON.stringify({ latitude, longitude }),
    });

    return response;
  } catch (error) {
    console.error("Error reverse geocoding:", error);
    throw error;
  }
};

/**
 * Update provider's real-time location during service
 * Call this every 10-15 seconds when provider status is "on-the-way"
 */
export const updateProviderLocation = async (
  bookingId: string,
  locationData: {
    latitude: number;
    longitude: number;
    heading?: number;
    speed?: number;
  }
) => {
  try {
    const response = await authenticatedRequest(
      `/location/${bookingId}/provider-location`,
      {
        method: "PUT",
        body: JSON.stringify(locationData),
      }
    );

    return response;
  } catch (error) {
    console.error("Error updating provider location:", error);
    throw error;
  }
};

/**
 * Get real-time tracking information for a booking
 * Returns provider location, service location, ETA, and distance
 */
export const getBookingTracking = async (bookingId: string) => {
  try {
    const response = await authenticatedRequest(
      `/location/${bookingId}/tracking`,
      {
        method: "GET",
      }
    );

    return response;
  } catch (error) {
    console.error("Error fetching tracking data:", error);
    throw error;
  }
};

/**
 * Start location tracking for provider
 * Returns a subscription that can be cleaned up later
 * Call this when booking status changes to "on-the-way"
 */
export const startLocationTracking = async (
  bookingId: string
): Promise<Location.LocationSubscription | null> => {
  try {
    // Request permissions
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      console.error("Location permission not granted");
      throw new Error("Location permission not granted");
    }

    // Start watching position
    const subscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 10000, // Update every 10 seconds
        distanceInterval: 10, // Or when moved 10 meters
      },
      async (location) => {
        try {
          await updateProviderLocation(bookingId, {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            heading: location.coords.heading || undefined,
            speed: location.coords.speed || undefined,
          });
          console.log("Location updated successfully");
        } catch (error) {
          console.error("Error updating location:", error);
        }
      }
    );

    return subscription;
  } catch (error) {
    console.error("Error starting location tracking:", error);
    return null;
  }
};

/**
 * Stop location tracking for provider
 * Call this when booking is completed/cancelled or when provider stops moving
 */
export const stopLocationTracking = (
  locationSubscription: Location.LocationSubscription | null
) => {
  if (locationSubscription) {
    locationSubscription.remove();
    console.log("Location tracking stopped");
  }
};

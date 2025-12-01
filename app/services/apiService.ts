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
  return authenticatedRequest(`/reviews/provider/${providerId}`, {
    method: "GET",
  });
};

export const createBooking = async (bookingData: {
  providerId: string;
  serviceType: string;
  category: string;
  scheduledDate: string;
  timeSlot: string;
  serviceAddress: string;
  additionalNotes?: string;
  hourlyRate: number;
  estimatedHours?: number;
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
    method: "POST",
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
  return authenticatedRequest(`/bookings/${bookingId}/review`, {
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

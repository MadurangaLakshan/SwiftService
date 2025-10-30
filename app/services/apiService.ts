import { auth } from "../config/firebase";

const API_URL = __DEV__
  ? process.env.EXPO_PUBLIC_API_URL || "http://192.168.1.XXX:3000/api"
  : "https://your-production-domain.com/api";

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
  return authenticatedRequest(`/providers/${userId}`, {
    method: "GET",
  });
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
  return authenticatedRequest(`/providers/${userId}`, {
    method: "PUT",
    body: JSON.stringify({ profilePhoto: imageUrl }),
  });
};

export const updateCustomerProfilePicture = async (
  userId: string,
  imageUrl: string
) => {
  return authenticatedRequest(`/customers/${userId}`, {
    method: "PUT",
    body: JSON.stringify({ profilePhoto: imageUrl }),
  });
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

export const getAllProviders = async () => {
  return authenticatedRequest("/providers", {
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
  return authenticatedRequest(`/customers/${userId}`, {
    method: "GET",
  });
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

export const createBooking = async (bookingData: any) => {
  return authenticatedRequest("/bookings", {
    method: "POST",
    body: JSON.stringify(bookingData),
  });
};

export const getBooking = async (bookingId: string) => {
  return authenticatedRequest(`/bookings/${bookingId}`, {
    method: "GET",
  });
};

export const getCustomerBookings = async (customerId: string) => {
  return authenticatedRequest(`/bookings/customer/${customerId}`, {
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
  status: string
) => {
  return authenticatedRequest(`/bookings/${bookingId}/status`, {
    method: "PUT",
    body: JSON.stringify({ status }),
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

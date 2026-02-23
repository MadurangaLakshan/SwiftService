import { authenticatedRequest } from "./apiService";

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

export const getProviderBookings = async (providerId: string) => {
  return authenticatedRequest(`/bookings/provider/${providerId}`, {
    method: "GET",
  });
};

export const getBookingById = async (bookingId: string) => {
  return authenticatedRequest(`/bookings/${bookingId}`, {
    method: "GET",
  });
};

export const updateBookingStatus = async (
  bookingId: string,
  status: string,
  additionalData?: any,
) => {
  return authenticatedRequest(`/bookings/${bookingId}/status`, {
    method: "PUT",
    body: JSON.stringify({ status, ...additionalData }),
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
  },
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
  },
) => {
  return authenticatedRequest(`/bookings/${bookingId}/dispute`, {
    method: "PUT",
    body: JSON.stringify(disputeData),
  });
};

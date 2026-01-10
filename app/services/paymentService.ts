import { auth } from "../config/firebase";

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000/api";

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface PaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
  amount: number;
}

interface PaymentStatusResponse {
  paymentCompleted: boolean;
  payment: {
    orderId?: string;
    paymentIntentId?: string;
    clientSecret?: string;
    status: "pending" | "completed" | "failed";
    amount?: number;
    currency?: string;
    createdAt?: string;
    completedAt?: string;
  } | null;
}

/**
 * Helper function to get Firebase auth token
 */
const getFirebaseToken = async (): Promise<string | null> => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.error("No user logged in");
      return null;
    }

    const token = await currentUser.getIdToken();
    return token;
  } catch (error) {
    console.error("Error getting Firebase token:", error);
    return null;
  }
};

/**
 * Create a payment intent for a booking
 */
export const createPaymentIntent = async (
  bookingId: string,
  amount: number
): Promise<ApiResponse<PaymentIntentResponse>> => {
  try {
    const token = await getFirebaseToken();

    if (!token) {
      return {
        success: false,
        error: "Authentication required. Please login again.",
      };
    }

    console.log("Creating payment intent for booking:", bookingId);

    const response = await fetch(
      `${API_BASE_URL}/payment/create-payment-intent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ bookingId, amount }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Payment intent creation failed:", data);
    }

    return data;
  } catch (error: any) {
    console.error("Create payment intent error:", error);
    return {
      success: false,
      error: error.message || "Failed to create payment intent",
    };
  }
};

/**
 * Confirm payment after successful Stripe payment
 */
export const confirmPayment = async (
  paymentIntentId: string,
  bookingId: string
): Promise<ApiResponse> => {
  try {
    const token = await getFirebaseToken();

    if (!token) {
      return {
        success: false,
        error: "Authentication required. Please login again.",
      };
    }

    console.log("Confirming payment:", paymentIntentId);

    const response = await fetch(`${API_BASE_URL}/payment/confirm-payment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ paymentIntentId, bookingId }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Payment confirmation failed:", data);
    }

    return data;
  } catch (error: any) {
    console.error("Confirm payment error:", error);
    return {
      success: false,
      error: error.message || "Failed to confirm payment",
    };
  }
};

/**
 * Get payment status for a booking
 */
export const getPaymentStatus = async (
  bookingId: string
): Promise<ApiResponse<PaymentStatusResponse>> => {
  try {
    const token = await getFirebaseToken();

    if (!token) {
      return {
        success: false,
        error: "Authentication required. Please login again.",
      };
    }

    const response = await fetch(
      `${API_BASE_URL}/payment/status/${bookingId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error("Get payment status error:", error);
    return {
      success: false,
      error: error.message || "Failed to get payment status",
    };
  }
};

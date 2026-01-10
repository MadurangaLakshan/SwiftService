import { Ionicons } from "@expo/vector-icons";
import {
  AddressCollectionMode,
  CollectionMode,
  useStripe,
} from "@stripe/stripe-react-native";

import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  confirmPayment,
  createPaymentIntent,
} from "../services/paymentService";

interface PaymentSectionProps {
  booking: {
    _id: string;
    status: string;
    paymentCompleted?: boolean;
    pricing: {
      hourlyRate: number;
      estimatedHours: number;
      actualHours?: number;
      platformFee: number;
      totalAmount: number;
      finalAmount?: number;
    };
    customerDetails: {
      name: string;
      phone: string;
      email: string;
    };
    payment?: {
      orderId?: string;
      paymentIntentId?: string;
      clientSecret?: string;
      status: "pending" | "completed" | "failed";
      amount?: number;
      currency?: string;
      createdAt?: string;
      completedAt?: string;
    };
  };
  onPaymentSuccess: () => void;
}

const PaymentSection: React.FC<PaymentSectionProps> = ({
  booking,
  onPaymentSuccess,
}) => {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [paymentLoading, setPaymentLoading] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handlePayNow = async () => {
    try {
      setPaymentLoading(true);

      // Calculate amount
      const amount = booking.pricing.finalAmount || booking.pricing.totalAmount;

      console.log("💳 Creating payment intent...");
      console.log("📊 Amount:", amount);
      console.log("📝 Booking ID:", booking._id);

      // Create payment intent on backend
      const response = await createPaymentIntent(booking._id, amount);

      console.log("📥 Backend response:", response);

      if (!response.success || !response.data) {
        Alert.alert("Error", response.error || "Failed to initialize payment");
        return;
      }

      const { clientSecret, paymentIntentId } = response.data;

      console.log(
        "🔑 Client Secret received:",
        clientSecret ? "Yes ✅" : "No ❌"
      );
      console.log("🆔 Payment Intent ID:", paymentIntentId);

      // Initialize Stripe Payment Sheet
      console.log("🎨 Initializing payment sheet...");

      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: "HandyHub Services",
        paymentIntentClientSecret: clientSecret,
        defaultBillingDetails: {
          name: booking.customerDetails.name,
          email: booking.customerDetails.email,
          phone: booking.customerDetails.phone,
          address: {
            country: "LK",
          },
        },

        billingDetailsCollectionConfiguration: {
          name: CollectionMode.ALWAYS,
          email: CollectionMode.AUTOMATIC,
          phone: CollectionMode.AUTOMATIC,
          address: AddressCollectionMode.AUTOMATIC,
        },

        returnURL: "handyhub://payment-complete",
        allowsDelayedPaymentMethods: false,
      });

      if (initError) {
        console.error("❌ Init error:", initError);
        console.error("Error code:", initError.code);
        console.error("Error message:", initError.message);

        Alert.alert(
          "Initialization Failed",
          `${initError.message}\n\nCode: ${initError.code}`
        );
        return;
      }

      console.log("✅ Payment sheet initialized");

      // Present Payment Sheet
      console.log("📱 Presenting payment sheet...");

      const { error: presentError } = await presentPaymentSheet();

      if (presentError) {
        console.error("❌ Present error:", presentError);
        console.error("Error code:", presentError.code);
        console.error("Error message:", presentError.message);

        if (presentError.code === "Canceled") {
          Alert.alert("Payment Cancelled", "You cancelled the payment process");
        } else {
          Alert.alert(
            "Payment Failed",
            `${presentError.message}\n\nCode: ${presentError.code}`
          );
        }
        return;
      }

      console.log("✅ Payment sheet completed successfully");

      // Payment successful - confirm on backend
      console.log("🔄 Confirming payment on backend...");

      const confirmResponse = await confirmPayment(
        paymentIntentId,
        booking._id
      );

      console.log("📥 Confirmation response:", confirmResponse);

      if (confirmResponse.success) {
        console.log("🎉 Payment confirmed!");
        Alert.alert(
          "Payment Successful! 🎉",
          `Your payment of LKR ${amount.toFixed(
            2
          )} has been processed successfully.`,
          [
            {
              text: "OK",
              onPress: () => {
                onPaymentSuccess();
              },
            },
          ]
        );
      } else {
        Alert.alert(
          "Verification Failed",
          "Payment was processed but verification failed. Please contact support.",
          [
            {
              text: "OK",
              onPress: () => onPaymentSuccess(),
            },
          ]
        );
      }
    } catch (error: any) {
      console.error("💥 Payment error:", error);
      Alert.alert(
        "Error",
        error.message || "An unexpected error occurred during payment"
      );
    } finally {
      setPaymentLoading(false);
    }
  };

  // Don't show anything if booking is not completed
  if (booking.status !== "completed") {
    return null;
  }

  // Show "Pay Now" section if payment not completed
  if (!booking.paymentCompleted) {
    return (
      <View className="bg-white px-6 py-4 border-t border-gray-200">
        {/* Payment Info Card */}
        <View className="bg-blue-50 border border-blue-200 p-4 rounded-xl mb-4">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-blue-700 font-semibold">Payment Due</Text>
            <Text className="text-2xl font-bold text-blue-600">
              LKR{" "}
              {(
                booking.pricing.finalAmount || booking.pricing.totalAmount
              ).toFixed(2)}
            </Text>
          </View>
          <Text className="text-xs text-blue-600">
            Service completed • Payment required to close booking
          </Text>
        </View>

        {/* Pay Now Button */}
        <TouchableOpacity
          onPress={handlePayNow}
          className="bg-blue-600 py-4 rounded-xl flex-row items-center justify-center shadow-lg"
          disabled={paymentLoading}
          style={{
            opacity: paymentLoading ? 0.6 : 1,
          }}
        >
          {paymentLoading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <>
              <Ionicons name="card-outline" size={24} color="white" />
              <Text className="text-white font-bold text-base ml-2">
                Pay Now
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Security Badge */}
        <View className="flex-row items-center justify-center mt-3">
          <Ionicons name="shield-checkmark" size={16} color="#10b981" />
          <Text className="text-xs text-gray-500 ml-1">
            Secure payment powered by Stripe
          </Text>
        </View>

        {/* Payment Methods */}
        <View className="flex-row items-center justify-center mt-2">
          <Text className="text-xs text-gray-400 mr-1">Accepted:</Text>
          <Text className="text-xs text-gray-500">
            Visa • Mastercard • Amex
          </Text>
        </View>
      </View>
    );
  }

  // Show "Payment Completed" section
  return (
    <View className="bg-white px-6 py-4 border-t border-gray-200">
      <View className="bg-green-50 border border-green-200 p-4 rounded-xl">
        <View className="flex-row items-start">
          <View className="w-12 h-12 bg-green-100 rounded-full items-center justify-center">
            <Ionicons name="checkmark-circle" size={28} color="#10b981" />
          </View>
          <View className="flex-1 ml-4">
            <Text className="text-green-700 font-bold text-lg mb-1">
              Payment Completed
            </Text>
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-green-600 text-sm">Amount Paid:</Text>
              <Text className="text-green-700 font-bold text-lg">
                LKR{" "}
                {(
                  booking.pricing.finalAmount || booking.pricing.totalAmount
                ).toFixed(2)}
              </Text>
            </View>
            {booking.payment?.completedAt && (
              <Text className="text-green-600 text-xs">
                Completed on {formatDate(booking.payment.completedAt)}
              </Text>
            )}
            {booking.payment?.paymentIntentId && (
              <Text className="text-green-500 text-xs mt-1 font-mono">
                ID: {booking.payment.paymentIntentId.substring(0, 20)}...
              </Text>
            )}
          </View>
        </View>
      </View>
    </View>
  );
};

export default PaymentSection;

import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { getAllDisputes, resolveDispute } from "../services/adminService";

interface Dispute {
  _id: string;
  customerId: string;
  providerId: string;
  serviceType: string;
  category: string;
  scheduledDate: string;
  serviceAddress: string;
  status: string;
  pricing: {
    finalAmount?: number;
    totalAmount: number;
  };
  customerDetails: {
    name: string;
    phone: string;
    email: string;
  };
  providerDetails: {
    name: string;
    phone: string;
    email: string;
  };
  dispute: {
    reason: string;
    description: string;
    status: "open" | "resolved" | "escalated";
    adminNote?: string;
  };
  createdAt: string;
  updatedAt: string;
}

const DisputesScreen = () => {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [adminNote, setAdminNote] = useState("");
  const [refundCustomer, setRefundCustomer] = useState(false);
  const [suspendProvider, setSuspendProvider] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchDisputes = async () => {
    try {
      const response = await getAllDisputes();

      const data = response?.data?.data || response?.data || [];

      setDisputes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching disputes:", error);
      setDisputes([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDisputes();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDisputes();
  };

  const openModal = (dispute: Dispute) => {
    setSelectedDispute(dispute);
    setAdminNote("");
    setRefundCustomer(false);
    setSuspendProvider(false);
    setShowModal(true);
  };

  const handleAction = async (action: "resolve" | "reject" | "escalate") => {
    if (!selectedDispute) return;

    const labels = {
      resolve: "resolve this dispute in favour of the customer",
      reject: "reject this dispute",
      escalate: "escalate this dispute",
    };

    Alert.alert(
      "Confirm Action",
      `Are you sure you want to ${labels[action]}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          style: action === "reject" ? "destructive" : "default",
          onPress: async () => {
            try {
              setActionLoading(true);
              const response = await resolveDispute(selectedDispute._id, {
                action,
                adminNote,
                refundCustomer,
                suspendProvider,
              });

              if (response.success) {
                Alert.alert(
                  "Success",
                  `Dispute ${action === "resolve" ? "resolved" : action === "reject" ? "rejected" : "escalated"} successfully`,
                );
                setShowModal(false);
                fetchDisputes();
              } else {
                Alert.alert("Error", response.error || "Action failed");
              }
            } catch (error) {
              Alert.alert("Error", "Failed to process action");
            } finally {
              setActionLoading(false);
            }
          },
        },
      ],
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getDisputeStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return {
          bg: "bg-orange-100",
          text: "text-orange-700",
          border: "border-orange-200",
        };
      case "resolved":
        return {
          bg: "bg-green-100",
          text: "text-green-700",
          border: "border-green-200",
        };
      case "escalated":
        return {
          bg: "bg-red-100",
          text: "text-red-700",
          border: "border-red-200",
        };
      default:
        return {
          bg: "bg-gray-100",
          text: "text-gray-700",
          border: "border-gray-200",
        };
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="px-6 pt-12 pb-6 bg-white border-b border-gray-100">
        <Text className="text-2xl font-bold text-gray-800">Disputes</Text>
        <Text className="text-gray-500 mt-1">
          {disputes.length} open dispute{disputes.length !== 1 ? "s" : ""} to
          review
        </Text>
      </View>

      <ScrollView
        className="flex-1 px-6 pt-4"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {loading ? (
          <ActivityIndicator size="large" color="#10b981" className="mt-10" />
        ) : disputes.length === 0 ? (
          <View className="items-center justify-center py-24">
            <Ionicons
              name="checkmark-done-circle-outline"
              size={80}
              color="#d1d5db"
            />
            <Text className="text-gray-400 mt-4 text-lg font-medium">
              No open disputes
            </Text>
            <Text className="text-gray-400 text-sm mt-1">
              All disputes have been resolved
            </Text>
          </View>
        ) : (
          disputes.map((dispute) => {
            const statusColors = getDisputeStatusColor(dispute.dispute?.status);
            return (
              <TouchableOpacity
                key={dispute._id}
                onPress={() => openModal(dispute)}
                className="bg-white rounded-2xl p-4 mb-4 border border-gray-200 shadow-sm"
              >
                {/* Top row */}
                <View className="flex-row items-start justify-between mb-3">
                  <View className="flex-1 mr-3">
                    <Text className="text-base font-bold text-gray-800">
                      {dispute.category}
                    </Text>
                    <Text className="text-sm text-gray-500 mt-0.5">
                      {formatDate(dispute.updatedAt)}
                    </Text>
                  </View>
                  <View
                    className={`px-3 py-1 rounded-full border ${statusColors.bg} ${statusColors.border}`}
                  >
                    <Text
                      className={`text-xs font-semibold capitalize ${statusColors.text}`}
                    >
                      {dispute.dispute?.status || "open"}
                    </Text>
                  </View>
                </View>

                {/* Parties */}
                <View className="flex-row mb-3 gap-2">
                  <View className="flex-1 bg-blue-50 rounded-xl p-3">
                    <Text className="text-xs text-blue-500 font-medium mb-1">
                      CUSTOMER
                    </Text>
                    <Text className="text-sm font-semibold text-gray-800">
                      {dispute.customerDetails.name}
                    </Text>
                    <Text className="text-xs text-gray-500">
                      {dispute.customerDetails.phone}
                    </Text>
                  </View>
                  <View className="flex-1 bg-emerald-50 rounded-xl p-3">
                    <Text className="text-xs text-emerald-500 font-medium mb-1">
                      PROVIDER
                    </Text>
                    <Text className="text-sm font-semibold text-gray-800">
                      {dispute.providerDetails.name}
                    </Text>
                    <Text className="text-xs text-gray-500">
                      {dispute.providerDetails.phone}
                    </Text>
                  </View>
                </View>

                {/* Dispute reason */}
                <View className="bg-orange-50 rounded-xl p-3 mb-3 border border-orange-100">
                  <Text className="text-xs text-orange-600 font-semibold mb-1">
                    ISSUE: {dispute.dispute?.reason}
                  </Text>
                  <Text className="text-sm text-gray-700" numberOfLines={2}>
                    {dispute.dispute?.description}
                  </Text>
                </View>

                {/* Footer */}
                <View className="flex-row items-center justify-between">
                  <Text className="text-xs text-gray-400">
                    {dispute.serviceAddress}
                  </Text>
                  <Text className="text-sm font-bold text-gray-800">
                    $
                    {dispute.pricing.finalAmount || dispute.pricing.totalAmount}
                  </Text>
                </View>

                <View className="mt-3 pt-3 border-t border-gray-100 flex-row items-center justify-end">
                  <Text className="text-emerald-600 text-sm font-semibold mr-1">
                    Review Dispute
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color="#10b981" />
                </View>
              </TouchableOpacity>
            );
          })
        )}
        <View className="h-6" />
      </ScrollView>

      {/* Resolve Modal */}
      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6">
            {/* Modal Header */}
            <View className="flex-row items-center justify-between mb-5">
              <Text className="text-xl font-bold text-gray-800">
                Review Dispute
              </Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close-circle" size={28} color="#9ca3af" />
              </TouchableOpacity>
            </View>

            {selectedDispute && (
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Dispute Details */}
                <View className="bg-orange-50 rounded-2xl p-4 mb-4 border border-orange-100">
                  <Text className="text-xs font-bold text-orange-600 mb-1">
                    REPORTED ISSUE
                  </Text>
                  <Text className="text-sm font-semibold text-gray-800 mb-1">
                    {selectedDispute.dispute?.reason}
                  </Text>
                  <Text className="text-sm text-gray-600">
                    {selectedDispute.dispute?.description}
                  </Text>
                </View>

                {/* Parties */}
                <View className="flex-row mb-4 gap-3">
                  <View className="flex-1 bg-blue-50 rounded-xl p-3">
                    <Text className="text-xs text-blue-500 font-bold mb-1">
                      CUSTOMER
                    </Text>
                    <Text className="text-sm font-semibold text-gray-800">
                      {selectedDispute.customerDetails.name}
                    </Text>
                    <Text className="text-xs text-gray-500">
                      {selectedDispute.customerDetails.email}
                    </Text>
                    <Text className="text-xs text-gray-500">
                      {selectedDispute.customerDetails.phone}
                    </Text>
                  </View>
                  <View className="flex-1 bg-emerald-50 rounded-xl p-3">
                    <Text className="text-xs text-emerald-500 font-bold mb-1">
                      PROVIDER
                    </Text>
                    <Text className="text-sm font-semibold text-gray-800">
                      {selectedDispute.providerDetails.name}
                    </Text>
                    <Text className="text-xs text-gray-500">
                      {selectedDispute.providerDetails.email}
                    </Text>
                    <Text className="text-xs text-gray-500">
                      {selectedDispute.providerDetails.phone}
                    </Text>
                  </View>
                </View>

                {/* Booking info */}
                <View className="bg-gray-50 rounded-xl p-3 mb-4 flex-row justify-between items-center">
                  <View>
                    <Text className="text-xs text-gray-500">Service</Text>
                    <Text className="text-sm font-semibold text-gray-800">
                      {selectedDispute.category}
                    </Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-xs text-gray-500">Amount</Text>
                    <Text className="text-sm font-bold text-gray-800">
                      $
                      {selectedDispute.pricing.finalAmount ||
                        selectedDispute.pricing.totalAmount}
                    </Text>
                  </View>
                </View>

                {/* Toggle Options */}
                <View className="mb-4">
                  <TouchableOpacity
                    onPress={() => setRefundCustomer(!refundCustomer)}
                    className={`flex-row items-center p-3 rounded-xl mb-2 border ${
                      refundCustomer
                        ? "bg-blue-50 border-blue-200"
                        : "bg-gray-50 border-gray-200"
                    }`}
                  >
                    <Ionicons
                      name={refundCustomer ? "checkbox" : "square-outline"}
                      size={22}
                      color={refundCustomer ? "#3b82f6" : "#9ca3af"}
                    />
                    <View className="ml-3">
                      <Text className="text-sm font-semibold text-gray-800">
                        Issue Refund to Customer
                      </Text>
                      <Text className="text-xs text-gray-500">
                        Mark payment as refunded
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setSuspendProvider(!suspendProvider)}
                    className={`flex-row items-center p-3 rounded-xl border ${
                      suspendProvider
                        ? "bg-red-50 border-red-200"
                        : "bg-gray-50 border-gray-200"
                    }`}
                  >
                    <Ionicons
                      name={suspendProvider ? "checkbox" : "square-outline"}
                      size={22}
                      color={suspendProvider ? "#ef4444" : "#9ca3af"}
                    />
                    <View className="ml-3">
                      <Text className="text-sm font-semibold text-gray-800">
                        Suspend Provider
                      </Text>
                      <Text className="text-xs text-gray-500">
                        Flag provider account for review
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>

                {/* Admin Note */}
                <TextInput
                  value={adminNote}
                  onChangeText={setAdminNote}
                  placeholder="Add an admin note (optional)..."
                  className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-5 text-gray-700 h-20"
                  multiline
                  textAlignVertical="top"
                />

                {/* Action Buttons */}
                <View className="flex-row gap-2 mb-3">
                  <TouchableOpacity
                    onPress={() => handleAction("resolve")}
                    disabled={actionLoading}
                    className="flex-1 bg-emerald-500 py-3 rounded-xl items-center"
                  >
                    {actionLoading ? (
                      <ActivityIndicator color="white" size="small" />
                    ) : (
                      <View className="flex-row items-center">
                        <Ionicons
                          name="checkmark-circle-outline"
                          size={18}
                          color="white"
                        />
                        <Text className="text-white font-bold ml-1">
                          Resolve
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleAction("reject")}
                    disabled={actionLoading}
                    className="flex-1 bg-red-50 border border-red-200 py-3 rounded-xl items-center"
                  >
                    <View className="flex-row items-center">
                      <Ionicons
                        name="close-circle-outline"
                        size={18}
                        color="#ef4444"
                      />
                      <Text className="text-red-600 font-bold ml-1">
                        Reject
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleAction("escalate")}
                    disabled={actionLoading}
                    className="flex-1 bg-orange-50 border border-orange-200 py-3 rounded-xl items-center"
                  >
                    <View className="flex-row items-center">
                      <Ionicons
                        name="arrow-up-circle-outline"
                        size={18}
                        color="#ea580c"
                      />
                      <Text className="text-orange-600 font-bold ml-1">
                        Escalate
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default DisputesScreen;

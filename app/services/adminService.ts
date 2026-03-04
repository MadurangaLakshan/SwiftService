import { authenticatedRequest } from "./apiService";

export const adminGetAllProviders = async () => {
  return authenticatedRequest("/admin/providers", { method: "GET" });
};

// verified=true → approve, verified=false + status="rejected" → reject
export const updateProviderStatus = async (
  providerId: string,
  verified: boolean,
  status?: "rejected",
) => {
  try {
    return await authenticatedRequest(`/admin/providers/${providerId}/verify`, {
      method: "PATCH",
      body: JSON.stringify({ verified, ...(status && { status }) }),
    });
  } catch (error: any) {
    console.error("Error updating provider status:", error);
    return { success: false, error: error.message };
  }
};

export const getAllDisputes = async () => {
  try {
    return await authenticatedRequest("/admin/disputes", { method: "GET" });
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const resolveDispute = async (
  bookingId: string,
  payload: {
    action: "resolve" | "reject" | "escalate";
    adminNote?: string;
    refundCustomer?: boolean;
    suspendProvider?: boolean;
  },
) => {
  try {
    return await authenticatedRequest(`/admin/disputes/${bookingId}/resolve`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

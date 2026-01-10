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

    const url = `${API_URL}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || data.message || "Request failed");
    }

    return { success: true, data };
  } catch (error: any) {
    console.error("API Request Error:", error);
    return { success: false, error: error.message };
  }
};

// Get all notifications
export const getNotifications = async () => {
  return authenticatedRequest("/notifications", {
    method: "GET",
  });
};

// Get unread notification count
export const getUnreadCount = async () => {
  return authenticatedRequest("/notifications/unread-count", {
    method: "GET",
  });
};

// Mark notification as read
export const markNotificationAsRead = async (notificationId: string) => {
  return authenticatedRequest(`/notifications/${notificationId}/read`, {
    method: "PUT",
  });
};

// Mark all notifications as read
export const markAllNotificationsAsRead = async () => {
  return authenticatedRequest("/notifications/mark-all-read", {
    method: "PUT",
  });
};

// Delete a notification
export const deleteNotification = async (notificationId: string) => {
  return authenticatedRequest(`/notifications/${notificationId}`, {
    method: "DELETE",
  });
};

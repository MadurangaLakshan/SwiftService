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

// Create or get conversation
export const createConversation = async (otherUserId: string) => {
  return authenticatedRequest("/messages/conversations", {
    method: "POST",
    body: JSON.stringify({ otherUserId }),
  });
};

// Get all conversations
export const getConversations = async () => {
  return authenticatedRequest("/messages/conversations", {
    method: "GET",
  });
};

// Send message (REST API fallback)
export const sendMessage = async (conversationId: string, text: string) => {
  return authenticatedRequest("/messages/messages", {
    method: "POST",
    body: JSON.stringify({ conversationId, text }),
  });
};

// Get messages for a conversation
export const getMessages = async (conversationId: string) => {
  return authenticatedRequest(`/messages/messages/${conversationId}`, {
    method: "GET",
  });
};

// Mark conversation as read
export const markAsRead = async (conversationId: string) => {
  return authenticatedRequest(
    `/messages/conversations/${conversationId}/read`,
    {
      method: "PATCH",
    }
  );
};

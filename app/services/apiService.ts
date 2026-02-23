import { auth } from "../config/firebase";

export const API_URL = __DEV__
  ? process.env.EXPO_PUBLIC_API_URL || "http://192.168.1.XXX:3000/api"
  : "https://production-domain.com/api";

export const authenticatedRequest = async (
  endpoint: string,
  options: RequestInit = {},
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

export const isApiAvailable = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_URL.replace("/api", "")}/health`);
    return response.ok;
  } catch (error) {
    console.error("API not available:", error);
    return false;
  }
};

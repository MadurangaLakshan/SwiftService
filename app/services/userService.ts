import { API_URL } from "./apiService";

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

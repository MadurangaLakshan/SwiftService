import { authenticatedRequest } from "./apiService";

export const registerCustomerProfile = async (customerData: any) => {
  return authenticatedRequest("/customers/register", {
    method: "POST",
    body: JSON.stringify(customerData),
  });
};

export const getCustomerProfile = async (userId: string) => {
  try {
    const result = await authenticatedRequest(`/customers/${userId}`, {
      method: "GET",
    });
    return result;
  } catch (error: any) {
    console.error("Error fetching customer profile:", error);
    return { success: false, error: error.message };
  }
};

export const updateCustomerProfile = async (userId: string, updates: any) => {
  return authenticatedRequest(`/customers/${userId}`, {
    method: "PUT",
    body: JSON.stringify(updates),
  });
};

export const updateCustomerProfilePicture = async (
  userId: string,
  imageUrl: string,
) => {
  try {
    const result = await authenticatedRequest(`/customers/${userId}`, {
      method: "PUT",
      body: JSON.stringify({ profilePhoto: imageUrl }),
    });

    if (result.success || result.data) {
      return {
        success: true,
        data: result.data || result,
      };
    }

    return result;
  } catch (error: any) {
    console.error("Error updating customer profile picture:", error);
    return { success: false, error: error.message };
  }
};

export const deleteCustomerProfile = async (userId: string) => {
  return authenticatedRequest(`/customers/${userId}`, {
    method: "DELETE",
  });
};

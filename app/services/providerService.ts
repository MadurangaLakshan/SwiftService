import { authenticatedRequest } from "./apiService";

export const registerProviderProfile = async (providerData: any) => {
  return authenticatedRequest("/providers/register", {
    method: "POST",
    body: JSON.stringify(providerData),
  });
};

export const getProviderProfile = async (userId: string) => {
  try {
    const result = authenticatedRequest(`/providers/${userId}`, {
      method: "GET",
    });
    return result;
  } catch (error: any) {
    console.error("Error fetching provider profile:", error);
    return { success: false, error: error.message };
  }
};

export const updateProviderProfile = async (userId: string, updates: any) => {
  return authenticatedRequest(`/providers/${userId}`, {
    method: "PUT",
    body: JSON.stringify(updates),
  });
};

export const updateProviderProfilePicture = async (
  userId: string,
  imageUrl: string,
) => {
  try {
    const result = await authenticatedRequest(`/providers/${userId}`, {
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
    console.error("Error updating provider profile picture:", error);
    return { success: false, error: error.message };
  }
};

export const deleteProviderProfile = async (userId: string) => {
  return authenticatedRequest(`/providers/${userId}`, {
    method: "DELETE",
  });
};

export const searchProviders = async (filters: {
  service?: string;
  city?: string;
  minRating?: number;
}) => {
  const params = new URLSearchParams();
  if (filters.service) params.append("service", filters.service);
  if (filters.city) params.append("city", filters.city);
  if (filters.minRating)
    params.append("minRating", filters.minRating.toString());

  const queryString = params.toString();
  const endpoint = queryString ? `/providers?${queryString}` : "/providers";

  return authenticatedRequest(endpoint, {
    method: "GET",
  });
};

export const getAllProviders = async (filters?: {
  service?: string;
  city?: string;
}) => {
  let endpoint = "/providers";

  if (filters) {
    const params = new URLSearchParams();
    if (filters.service) params.append("service", filters.service);
    if (filters.city) params.append("city", filters.city);

    const queryString = params.toString();
    if (queryString) {
      endpoint = `/providers?${queryString}`;
    }
  }

  return authenticatedRequest(endpoint, {
    method: "GET",
  });
};

export const getProviderAvailability = async (userId: string) => {
  return authenticatedRequest(`/providers/${userId}/availability`, {
    method: "GET",
  });
};

export const updateProviderAvailability = async (
  userId: string,
  availability: {
    date: string;
    dayName: string;
    isAvailable: boolean;
    slots: string[];
  }[],
) => {
  return authenticatedRequest(`/providers/${userId}/availability`, {
    method: "PUT",
    body: JSON.stringify({ availability }),
  });
};

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  adminGetAllProviders,
  updateProviderStatus,
} from "../services/adminService";

interface ProviderData {
  _id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  services: string[];
  customServices: string[];
  yearsExperience: number;
  businessName?: string;
  licenseNumber?: string;
  hourlyRate: number;
  bio?: string;
  location: {
    address: string;
    city: string;
    postalCode: string;
    serviceRadius: number;
    coordinates: { latitude: number; longitude: number };
  };
  rating: number;
  totalJobs: number;
  totalReviews: number;
  verified: boolean;
  status?: string;
  isActive: boolean;
  profilePhoto?: string;
  createdAt: string;
  updatedAt: string;
}

interface AdminContextType {
  pendingProviders: ProviderData[];
  loading: boolean;
  error: string | null;
  refreshList: () => Promise<void>;
  approveProvider: (id: string) => Promise<boolean>;
  rejectProvider: (id: string) => Promise<boolean>;
}

const AdminContext = createContext<AdminContextType>({
  pendingProviders: [],
  loading: true,
  error: null,
  refreshList: async () => {},
  approveProvider: async () => false,
  rejectProvider: async () => false,
});

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [pendingProviders, setPendingProviders] = useState<ProviderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPending = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminGetAllProviders();
      const data = response?.data?.data || response?.data || [];

      if (Array.isArray(data)) {
        // Show only unverified, non-rejected providers
        const pending = data.filter(
          (p: ProviderData) => !p.verified && p.status !== "rejected",
        );
        setPendingProviders(pending);
      } else {
        setError("Invalid data format received from server");
      }
    } catch (err: any) {
      console.error("Error fetching pending providers:", err);
      setError(err.message || "Failed to fetch providers");
    } finally {
      setLoading(false);
    }
  };

  const approveProvider = async (id: string) => {
    try {
      const response = await updateProviderStatus(id, true);
      if (response.success) {
        await fetchPending();
        return true;
      }
      return false;
    } catch (err) {
      console.error("Approval error:", err);
      return false;
    }
  };

  const rejectProvider = async (id: string) => {
    try {
      const response = await updateProviderStatus(id, false, "rejected");
      if (response.success) {
        await fetchPending();
        return true;
      }
      return false;
    } catch (err) {
      console.error("Rejection error:", err);
      return false;
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  return (
    <AdminContext.Provider
      value={{
        pendingProviders,
        loading,
        error,
        refreshList: fetchPending,
        approveProvider,
        rejectProvider,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) throw new Error("useAdmin must be used within AdminProvider");
  return context;
};

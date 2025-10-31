import React, { createContext, useContext, useEffect, useState } from "react";
import { auth } from "../config/firebase";
import { getProviderProfile } from "../services/apiService";

interface ProviderData {
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
  };
  rating: number;
  totalJobs: number;
  totalReviews: number;
  verified: boolean;
  isActive: boolean;
  profilePhoto?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ProviderContextType {
  providerData: ProviderData | null;
  loading: boolean;
  setProviderData: (data: ProviderData) => void;
  refreshProviderData: () => Promise<void>;
}

const ProviderContext = createContext<ProviderContextType>({
  providerData: null,
  loading: true,
  setProviderData: () => {},
  refreshProviderData: async () => {},
});

export const useProvider = () => useContext(ProviderContext);

export const ProviderProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [providerData, setProviderDataState] = useState<ProviderData | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  const setProviderData = (data: ProviderData) => {
    setProviderDataState(data);
    console.log("New provider data:", data);
    setLoading(false);
  };

  const fetchProviderData = async (retryCount = 0) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setProviderDataState(null);
        setLoading(false);
        return;
      }

      const response = await getProviderProfile(currentUser.uid);

      if (response.success && response.data) {
        setProviderDataState(response.data);
        setLoading(false);
      } else if (response.error === "Provider not found" && retryCount < 3) {
        console.log(`Provider not found, retrying... (${retryCount + 1}/3)`);
        setTimeout(() => fetchProviderData(retryCount + 1), 1000);
      } else {
        console.log("Provider profile not found after retries");
        setProviderDataState(null);
        setLoading(false);
      }
    } catch (error) {
      console.error("Error fetching provider data:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        fetchProviderData();
      } else {
        setProviderDataState(null);
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  return (
    <ProviderContext.Provider
      value={{
        providerData,
        loading,
        setProviderData,
        refreshProviderData: () => fetchProviderData(0),
      }}
    >
      {children}
    </ProviderContext.Provider>
  );
};

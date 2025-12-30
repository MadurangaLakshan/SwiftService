import React, { createContext, useContext, useEffect, useState } from "react";
import { auth } from "../config/firebase";
import { getCustomerProfile } from "../services/apiService";

interface CustomerData {
  _id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  location: {
    address: string;
    city: string;
    postalCode: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  propertyType: string;
  profilePhoto: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CustomerContextType {
  customerData: CustomerData | null;
  loading: boolean;
  error: string | null;
  refreshCustomerData: () => Promise<void>;
}

const CustomerContext = createContext<CustomerContextType>({
  customerData: null,
  loading: true,
  error: null,
  refreshCustomerData: async () => {},
});

export const useCustomer = () => useContext(CustomerContext);

export const CustomerProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [customerData, setCustomerData] = useState<CustomerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCustomerData = async () => {
    try {
      const user = auth.currentUser;

      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      const result = await getCustomerProfile(user.uid);

      if (result && "data" in result && result.data) {
        setCustomerData(result.data);
      } else if (result && typeof result === "object" && "_id" in result) {
        setCustomerData(result as unknown as CustomerData);
      } else {
        setError((result as any)?.error || "Failed to fetch customer data");
      }
    } catch (err: any) {
      console.error("Error fetching customer data:", err);
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const refreshCustomerData = async () => {
    await fetchCustomerData();
  };

  useEffect(() => {
    fetchCustomerData();
  }, []);

  return (
    <CustomerContext.Provider
      value={{
        customerData,
        loading,
        error,
        refreshCustomerData,
      }}
    >
      {children}
    </CustomerContext.Provider>
  );
};

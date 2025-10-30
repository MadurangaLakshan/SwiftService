import React, { createContext, useContext, useEffect, useState } from "react";
import { auth } from "../config/firebase";
import { getCustomerProfile } from "../services/apiService";

interface CustomerData {
  userId: string;
  name: string;
  email: string;
  phone: string;
  profilePhoto?: string;
  address?: string;
  city?: string;
  location?: {
    address: string;
    city: string;
    postalCode: string;
  };
  propertyType?: string;
}

interface CustomerContextType {
  customerData: CustomerData | null;
  loading: boolean;
  setCustomerData: (data: CustomerData) => void;
  refreshCustomerData: () => Promise<void>;
}

const CustomerContext = createContext<CustomerContextType>({
  customerData: null,
  loading: true,
  setCustomerData: () => {},
  refreshCustomerData: async () => {},
});

export const useCustomer = () => useContext(CustomerContext);

export const CustomerProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [customerData, setCustomerDataState] = useState<CustomerData | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  const setCustomerData = (data: CustomerData) => {
    setCustomerDataState(data);
    console.log("New customer data:", data);
    setLoading(false);
  };

  const fetchCustomerData = async (retryCount = 0) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setCustomerDataState(null);
        setLoading(false);
        return;
      }

      const response = await getCustomerProfile(currentUser.uid);

      if (response.success && response.data) {
        setCustomerDataState(response.data);
        setLoading(false);
      } else if (response.error === "Customer not found" && retryCount < 3) {
        console.log(`Customer not found, retrying... (${retryCount + 1}/3)`);
        setTimeout(() => fetchCustomerData(retryCount + 1), 1000);
      } else {
        console.log("Customer profile not found after retries");
        setCustomerDataState(null);
        setLoading(false);
      }
    } catch (error) {
      console.error("Error fetching customer data:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        fetchCustomerData();
      } else {
        setCustomerDataState(null);
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  return (
    <CustomerContext.Provider
      value={{
        customerData,
        loading,
        setCustomerData,
        refreshCustomerData: () => fetchCustomerData(0),
      }}
    >
      {children}
    </CustomerContext.Provider>
  );
};

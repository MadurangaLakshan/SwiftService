import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useCustomer } from "../context/CustomerContext";
import { getAllProviders } from "../services/apiService";
import { getUnreadCount } from "../services/notificationService";

interface Provider {
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
  };
  rating: number;
  totalJobs: number;
  totalReviews: number;
  verified: boolean;
  isActive: boolean;
  profilePhoto?: string;
}

const NotificationIconWithBadge = ({ color }: { color: string }) => {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadUnreadCount();

    // Refresh every 30 seconds
    const interval = setInterval(loadUnreadCount, 3000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const loadUnreadCount = async () => {
    try {
      const response = await getUnreadCount();
      if (response.success && response.data?.data?.count !== undefined) {
        setUnreadCount(response.data.data.count);
      }
    } catch (error) {
      console.error("Error loading unread count:", error);
    }
  };

  return (
    <View style={{ width: 26, height: 26, position: "relative" }}>
      <Ionicons name="notifications-outline" size={26} color={color} />
      {unreadCount > 0 && (
        <View
          style={{
            position: "absolute",
            top: -4,
            right: -8,
            backgroundColor: "#ef4444",
            borderRadius: 10,
            minWidth: 18,
            height: 18,
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 4,
            borderWidth: 2,
            borderColor: "white",
          }}
        >
          <Text style={{ color: "white", fontSize: 10, fontWeight: "bold" }}>
            {unreadCount > 9 ? "9+" : unreadCount}
          </Text>
        </View>
      )}
    </View>
  );
};

const HomeScreen = () => {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { customerData, loading } = useCustomer();

  const categories = [
    "All",
    "Electrical",
    "Plumbing",
    "Construction",
    "Carpentry",
    "Painting",
    "HVAC",
    "Landscaping",
  ];

  // Fetch providers from database
  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      setLoadingProviders(true);
      const response = await getAllProviders();

      if (response.success && response.data) {
        const providersData = Array.isArray(response.data) ? response.data : [];
        setProviders(providersData);
      } else {
        console.error("Failed to fetch providers:", response.error);
        setProviders([]);
      }
    } catch (error) {
      console.error("Error fetching providers:", error);
      setProviders([]);
    } finally {
      setLoadingProviders(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchProviders();
  };

  // Filter providers based on selected category and search query
  const filteredProviders = providers.filter((provider) => {
    const matchesCategory =
      selectedCategory === "All" ||
      provider.services.includes(selectedCategory) ||
      provider.customServices.includes(selectedCategory);

    const matchesSearch =
      searchQuery === "" ||
      provider.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      provider.services.some((service) =>
        service.toLowerCase().includes(searchQuery.toLowerCase())
      ) ||
      provider.customServices.some((service) =>
        service.toLowerCase().includes(searchQuery.toLowerCase())
      );

    return matchesCategory && matchesSearch;
  });

  // Get primary service for display
  const getPrimaryService = (provider: Provider) => {
    if (provider.services.length > 0) {
      return `${provider.services[0]} Services`;
    }
    if (provider.customServices.length > 0) {
      return provider.customServices[0];
    }
    return "General Services";
  };

  // Get specialties for display (max 2)
  const getSpecialties = (provider: Provider) => {
    const allServices = [...provider.services, ...provider.customServices];
    return allServices.slice(0, 2);
  };

  return (
    <View className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View className="flex-1">
            <View className="px-6">
              <View className="mt-12 mb-6" />

              <View className="flex-row items-center justify-between w-full mb-4">
                <View>
                  <Text className="text-2xl font-semibold text-gray-800">
                    <Text>Hey </Text>
                    <Text className="text-blue-700">
                      {customerData?.name ?? "Guest"}
                    </Text>
                  </Text>
                  <Text className="text-lg text-gray-500">
                    How's your day going?
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() => router.push("../customer/NotificationScreen")}
                >
                  <NotificationIconWithBadge color="black" />
                </TouchableOpacity>
              </View>

              <View className="flex-row items-center bg-gray-100 rounded-2xl px-4 py-3 mb-6">
                <Ionicons name="search-outline" size={22} color="gray" />
                <TextInput
                  placeholder="Search for a service..."
                  placeholderTextColor="#9ca3af"
                  className="ml-3 flex-1 text-gray-700 text-base"
                  returnKeyType="search"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>

              <View className="mb-4">
                <Text className="text-lg font-semibold text-gray-800 mb-3">
                  Top Services For You ✨
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  className="flex-row"
                >
                  {categories.map((category, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => setSelectedCategory(category)}
                      className={`mr-3 px-5 py-2.5 rounded-full ${
                        selectedCategory === category
                          ? "bg-yellow-400"
                          : "bg-gray-200"
                      }`}
                    >
                      <Text
                        className={`font-medium ${
                          selectedCategory === category
                            ? "text-gray-900"
                            : "text-gray-700"
                        }`}
                      >
                        {category}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            <ScrollView
              className="flex-1 px-6"
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor="#3b82f6"
                  colors={["#3b82f6"]}
                />
              }
            >
              <Text className="text-lg font-semibold text-gray-800 mb-4">
                {selectedCategory === "All"
                  ? "Available Providers"
                  : `${selectedCategory} Providers`}
              </Text>

              {loadingProviders ? (
                <View className="items-center justify-center py-12">
                  <ActivityIndicator size="large" color="#3b82f6" />
                  <Text className="text-gray-500 text-base mt-4">
                    Loading providers...
                  </Text>
                </View>
              ) : filteredProviders.length > 0 ? (
                filteredProviders.map((provider) => (
                  <TouchableOpacity
                    key={provider._id}
                    onPress={() =>
                      router.push({
                        pathname: "/customer/ProviderDetailsScreen",
                        params: {
                          id: provider._id,
                          userId: provider.userId,
                          name: provider.name,
                          service: getPrimaryService(provider),
                          category: provider.services[0] || "General",
                          rating: provider.rating,
                          reviews: provider.totalReviews,
                          price: `${provider.hourlyRate}/hr`,
                          image:
                            provider.profilePhoto ||
                            `https://i.pravatar.cc/150?u=${provider.userId}`,
                          verified: provider.verified,
                          specialties: JSON.stringify(getSpecialties(provider)),
                          bio: provider.bio || "",
                          phone: provider.phone,
                          email: provider.email,
                          location: JSON.stringify(provider.location),
                          yearsExperience: provider.yearsExperience,
                          businessName: provider.businessName || "",
                          totalJobs: provider.totalJobs,
                        },
                      } as any)
                    }
                    className="bg-white rounded-2xl p-4 mb-4 border border-gray-200 shadow-sm"
                  >
                    <View className="flex-row">
                      <Image
                        source={{
                          uri:
                            provider.profilePhoto ||
                            `https://i.pravatar.cc/150?u=${provider.userId}`,
                        }}
                        className="w-20 h-20 rounded-xl"
                      />

                      <View className="flex-1 ml-4">
                        <View className="flex-row items-center justify-between mb-1">
                          <View className="flex-row items-center">
                            <Text className="text-lg font-semibold text-gray-800">
                              {provider.name}
                            </Text>
                            {provider.verified && (
                              <Ionicons
                                name="checkmark-circle"
                                size={18}
                                color="#3b82f6"
                                style={{ marginLeft: 4 }}
                              />
                            )}
                          </View>
                        </View>

                        <Text className="text-sm text-gray-600 mb-2">
                          {getPrimaryService(provider)}
                        </Text>

                        {getSpecialties(provider).length > 0 && (
                          <View className="flex-row mb-2">
                            {getSpecialties(provider).map(
                              (specialty, index) => (
                                <View
                                  key={index}
                                  className="bg-blue-50 rounded-full px-2 py-1 mr-2"
                                >
                                  <Text className="text-xs text-blue-700">
                                    {specialty}
                                  </Text>
                                </View>
                              )
                            )}
                          </View>
                        )}

                        <View className="flex-row items-center justify-between">
                          <View className="flex-row items-center">
                            <Ionicons name="star" size={16} color="#fbbf24" />
                            <Text className="text-sm font-semibold text-gray-700 ml-1">
                              {provider.rating.toFixed(1)}
                            </Text>
                            <Text className="text-xs text-gray-500 ml-1">
                              ({provider.totalReviews})
                            </Text>
                          </View>
                          <Text className="text-sm font-semibold text-blue-600">
                            ${provider.hourlyRate}/hr
                          </Text>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))
              ) : (
                <View className="items-center justify-center py-12">
                  <Ionicons name="search-outline" size={64} color="#d1d5db" />
                  <Text className="text-gray-500 text-base mt-4">
                    No providers found
                    {searchQuery
                      ? ` for "${searchQuery}"`
                      : selectedCategory !== "All"
                      ? ` for ${selectedCategory}`
                      : ""}
                  </Text>
                  {!loadingProviders && providers.length === 0 && (
                    <TouchableOpacity
                      onPress={fetchProviders}
                      className="mt-4 bg-blue-600 px-6 py-3 rounded-xl"
                    >
                      <Text className="text-white font-semibold">
                        Retry Loading
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              <View className="h-4" />
            </ScrollView>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </View>
  );
};

export default HomeScreen;

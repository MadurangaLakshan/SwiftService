import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useCustomer } from "../context/CustomerContext";

const HomeScreen = () => {
  const [selectedCategory, setSelectedCategory] = React.useState("All");
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

  const serviceProviders = [
    {
      id: 1,
      name: "John Silva",
      service: "Electrical",
      category: "Electrical",
      rating: 4.8,
      reviews: 124,
      price: "$50/hr",
      image: "https://i.pravatar.cc/150?img=12",
      verified: true,
      specialties: ["Wiring", "Installation"],
    },
    {
      id: 2,
      name: "Sarah Perera",
      service: "Plumbing Services",
      category: "Plumbing",
      rating: 4.9,
      reviews: 98,
      price: "$45/hr",
      image: "https://i.pravatar.cc/150?img=45",
      verified: true,
      specialties: ["Repairs", "Maintenance"],
    },
    {
      id: 3,
      name: "Mike Fernando",
      service: "Construction Work",
      category: "Construction",
      rating: 4.7,
      reviews: 156,
      price: "$60/hr",
      image: "https://i.pravatar.cc/150?img=33",
      verified: true,
      specialties: ["Renovation", "Building"],
    },
    {
      id: 4,
      name: "David Kumar",
      service: "Carpentry Services",
      category: "Carpentry",
      rating: 4.6,
      reviews: 87,
      price: "$40/hr",
      image: "https://i.pravatar.cc/150?img=51",
      verified: true,
      specialties: ["Furniture", "Custom Work"],
    },
    {
      id: 5,
      name: "Lisa Jayawardena",
      service: "Painting Services",
      category: "Painting",
      rating: 4.8,
      reviews: 112,
      price: "$35/hr",
      image: "https://i.pravatar.cc/150?img=47",
      verified: true,
      specialties: ["Interior", "Exterior"],
    },
    {
      id: 6,
      name: "Robert Dias",
      service: "Electrical Services",
      category: "Electrical",
      rating: 4.7,
      reviews: 89,
      price: "$55/hr",
      image: "https://i.pravatar.cc/150?img=13",
      verified: true,
      specialties: ["Solar", "Smart Home"],
    },
    {
      id: 7,
      name: "Ahmed Hassan",
      service: "HVAC Services",
      category: "HVAC",
      rating: 4.9,
      reviews: 143,
      price: "$65/hr",
      image: "https://i.pravatar.cc/150?img=52",
      verified: true,
      specialties: ["AC Repair", "Installation"],
    },
    {
      id: 8,
      name: "Priya Wickramasinghe",
      service: "Landscaping Services",
      category: "Landscaping",
      rating: 4.6,
      reviews: 76,
      price: "$30/hr",
      image: "https://i.pravatar.cc/150?img=48",
      verified: true,
      specialties: ["Garden Design", "Maintenance"],
    },
    {
      id: 9,
      name: "Carlos Rodrigo",
      service: "Plumbing Services",
      category: "Plumbing",
      rating: 4.8,
      reviews: 134,
      price: "$48/hr",
      image: "https://i.pravatar.cc/150?img=14",
      verified: true,
      specialties: ["Emergency", "Installation"],
    },
    {
      id: 10,
      name: "Nina Fernando",
      service: "Painting Services",
      category: "Painting",
      rating: 4.7,
      reviews: 92,
      price: "$38/hr",
      image: "https://i.pravatar.cc/150?img=44",
      verified: true,
      specialties: ["Commercial", "Residential"],
    },
  ];

  const filteredProviders =
    selectedCategory === "All"
      ? serviceProviders
      : serviceProviders.filter(
          (provider) => provider.category === selectedCategory
        );

  return (
    <View className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View className="flex-1">
            <View className="px-6">
              <View className="flex-row items-center gap-2 mt-12 mb-6 justify-center">
                <Image
                  source={require("../../assets/images/SwiftService.png")}
                  className="w-16 h-16"
                />
                <Text className="text-2xl font-bold">
                  <Text className="text-blue-700">Swift</Text>
                  <Text className="text-gray-700">Service</Text>
                </Text>
              </View>

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
                  <Ionicons
                    name="notifications-outline"
                    size={28}
                    color="black"
                  />
                </TouchableOpacity>
              </View>

              <View className="flex-row items-center bg-gray-100 rounded-2xl px-4 py-3 mb-6">
                <Ionicons name="search-outline" size={22} color="gray" />
                <TextInput
                  placeholder="Search for a service..."
                  placeholderTextColor="#9ca3af"
                  className="ml-3 flex-1 text-gray-700 text-base"
                  returnKeyType="search"
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
            >
              <Text className="text-lg font-semibold text-gray-800 mb-4">
                {selectedCategory === "All"
                  ? "Available Providers"
                  : `${selectedCategory} Providers`}
              </Text>

              {filteredProviders.length > 0 ? (
                filteredProviders.map((provider) => (
                  <TouchableOpacity
                    key={provider.id}
                    onPress={() =>
                      router.push({
                        pathname: "/customer/ProviderDetailsScreen",
                        params: {
                          id: provider.id,
                          name: provider.name,
                          service: provider.service,
                          category: provider.category,
                          rating: provider.rating,
                          reviews: provider.reviews,
                          price: provider.price,
                          image: provider.image,
                          verified: provider.verified,
                          specialties: JSON.stringify(provider.specialties),
                        },
                      } as any)
                    }
                    className="bg-white rounded-2xl p-4 mb-4 border border-gray-200 shadow-sm"
                  >
                    <View className="flex-row">
                      <Image
                        source={{ uri: provider.image }}
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
                          {provider.service}
                        </Text>

                        <View className="flex-row mb-2">
                          {provider.specialties.map((specialty, index) => (
                            <View
                              key={index}
                              className="bg-blue-50 rounded-full px-2 py-1 mr-2"
                            >
                              <Text className="text-xs text-blue-700">
                                {specialty}
                              </Text>
                            </View>
                          ))}
                        </View>

                        <View className="flex-row items-center justify-between">
                          <View className="flex-row items-center">
                            <Ionicons name="star" size={16} color="#fbbf24" />
                            <Text className="text-sm font-semibold text-gray-700 ml-1">
                              {provider.rating}
                            </Text>
                            <Text className="text-xs text-gray-500 ml-1">
                              ({provider.reviews})
                            </Text>
                          </View>
                          <Text className="text-sm font-semibold text-blue-600">
                            {provider.price}
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
                    No providers found for {selectedCategory}
                  </Text>
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

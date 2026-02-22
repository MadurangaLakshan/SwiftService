import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth } from "../config/firebase";

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  images?: string[];
  timestamp: Date;
}

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
  distance?: number;
}

export default function AIChatScreen() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hi! I'm your AI assistant. Upload up to 3 photos or describe your issue, and I'll help you find the right tradesman.",
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [recommendedProviders, setRecommendedProviders] = useState<Provider[]>(
    [],
  );
  const scrollViewRef = useRef<ScrollView>(null);

  const pickImage = async () => {
    if (selectedImages.length >= 3) {
      Alert.alert("Limit reached", "You can only attach up to 3 photos");
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== "granted") {
      Alert.alert("Permission needed", "Please allow access to your photos");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.7,
      base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      setSelectedImages((prev) => [...prev, result.assets[0].uri]);
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const sendMessage = async () => {
    if (!inputText.trim() && selectedImages.length === 0) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isUser: true,
      images: selectedImages.length > 0 ? selectedImages : undefined,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    const imagesToSend = [...selectedImages];
    setSelectedImages([]);
    setIsLoading(true);

    try {
      let imagesBase64: string[] = [];
      if (imagesToSend.length > 0) {
        for (const imageUri of imagesToSend) {
          const response = await fetch(imageUri);
          const blob = await response.blob();
          const base64 = await blobToBase64(blob);
          imagesBase64.push(base64);
        }
      }

      const apiUrl = `${process.env.EXPO_PUBLIC_API_URL}/ai-chat/analyze`;
      const token = await auth.currentUser?.getIdToken();

      const apiResponse = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: userMessage.text,
          imagesBase64: imagesBase64,
        }),
      });

      const data = await apiResponse.json();

      if (data.success) {
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: `${data.analysis.issue}\n\n🔧 Service needed: ${data.analysis.serviceNeeded}\n⚡ Urgency: ${data.analysis.urgency}`,
          isUser: false,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, aiMessage]);
        setRecommendedProviders(data.recommendedProviders);

        if (data.recommendedProviders.length > 0) {
          const providersMessage: Message = {
            id: (Date.now() + 2).toString(),
            text: `I found ${data.recommendedProviders.length} recommended service providers for you:`,
            isUser: false,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, providersMessage]);
        } else {
          const noProvidersMessage: Message = {
            id: (Date.now() + 2).toString(),
            text: "Unfortunately, I couldn't find any available providers for this service in your area right now.",
            isUser: false,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, noProvidersMessage]);
        }
      } else {
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: `Error: ${data.error || "Unknown error from server"}`,
          isUser: false,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: `Sorry, I encountered an error: ${error instanceof Error ? error.message : "Unknown error"}. Please try again.`,
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        resolve(base64.split(",")[1]);
      };
      reader.readAsDataURL(blob);
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-100" edges={["top"]}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={90}
      >
        {/* Chat Messages */}
        <ScrollView
          ref={scrollViewRef}
          className="flex-1"
          contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
          onContentSizeChange={() =>
            scrollViewRef.current?.scrollToEnd({ animated: true })
          }
        >
          {messages.map((message) => (
            <View
              key={message.id}
              className={`max-w-[80%] p-3 rounded-2xl mb-3 ${
                message.isUser
                  ? "self-end bg-blue-500"
                  : "self-start bg-white border border-gray-200"
              }`}
            >
              {message.images && message.images.length > 0 && (
                <View className="flex-row flex-wrap gap-1 mb-2">
                  {message.images.map((img, idx) => (
                    <Image
                      key={idx}
                      source={{ uri: img }}
                      className="w-36 h-36 rounded-lg"
                    />
                  ))}
                </View>
              )}
              <Text
                className={`text-base leading-5 ${
                  message.isUser ? "text-white" : "text-black"
                }`}
              >
                {message.text}
              </Text>
            </View>
          ))}

          {/* Provider Cards */}
          {recommendedProviders.length > 0 && (
            <View className="mt-2">
              {recommendedProviders.map((provider) => (
                <TouchableOpacity
                  key={provider._id}
                  className="flex-row bg-white p-3 rounded-xl mb-2 items-center shadow-sm border border-gray-200"
                  onPress={() => {
                    router.push({
                      pathname: "/customer/ProviderDetailsScreen",
                      params: {
                        id: provider._id,
                        userId: provider.userId || provider._id,
                        name: provider.name,
                        service: provider.services[0] || "General",
                        category: provider.services[0] || "General",
                        rating: provider.rating,
                        reviews: provider.totalReviews,
                        price: `${provider.hourlyRate}/hr`,
                        image:
                          provider.profilePhoto ||
                          `https://i.pravatar.cc/150?u=${provider._id}`,
                        verified: provider.verified || false,
                        specialties: JSON.stringify(provider.services),
                        bio: provider.bio || "",
                        phone: provider.phone || "",
                        email: provider.email || "",
                        location: JSON.stringify(provider.location),
                        yearsExperience: provider.yearsExperience || 0,
                        businessName: provider.businessName || "",
                        totalJobs: provider.totalJobs || 0,
                      },
                    } as any);
                  }}
                >
                  <Image
                    source={{
                      uri:
                        provider.profilePhoto ||
                        "https://via.placeholder.com/50",
                    }}
                    className="w-12 h-12 rounded-full mr-3"
                  />
                  <View className="flex-1">
                    <Text className="text-base font-semibold mb-1">
                      {provider.name}
                    </Text>
                    <Text className="text-sm text-gray-600 mb-0.5">
                      ⭐ {provider.rating.toFixed(1)} ({provider.totalReviews}{" "}
                      reviews)
                    </Text>
                    <Text className="text-sm text-gray-600 mb-0.5">
                      💰 Rs.{provider.hourlyRate}/hr •{" "}
                      {provider.yearsExperience} years exp
                    </Text>
                    <Text className="text-sm text-gray-600">
                      📍 {provider.location.city}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={24} color="#666" />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {isLoading && (
            <View className="flex-row items-center self-start bg-white p-3 rounded-2xl border border-gray-200">
              <ActivityIndicator size="small" color="#007AFF" />
              <Text className="ml-2 text-gray-600">
                Analyzing your issue...
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Image Preview */}
        {selectedImages.length > 0 && (
          <View className="p-3 bg-white border-t border-gray-200">
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {selectedImages.map((image, index) => (
                <View key={index} className="mr-3 relative">
                  <Image
                    source={{ uri: image }}
                    className="w-20 h-20 rounded-lg"
                  />
                  <TouchableOpacity
                    className="absolute -top-2 -right-2 bg-white rounded-full"
                    onPress={() => removeImage(index)}
                  >
                    <Ionicons name="close-circle" size={24} color="#FF3B30" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
            <Text className="mt-2 text-xs text-gray-600 text-center">
              {selectedImages.length}/3 photos
            </Text>
          </View>
        )}

        {/* Input Area */}
        <View className="flex-row items-end p-3 bg-white border-t border-gray-200">
          <TouchableOpacity className="p-2 mr-2" onPress={pickImage}>
            <Ionicons name="image" size={24} color="#007AFF" />
          </TouchableOpacity>

          <TextInput
            className="flex-1 bg-gray-100 rounded-3xl px-4 py-2.5 mr-2 max-h-24 text-base"
            placeholder="Describe your issue..."
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
          />

          <TouchableOpacity
            className={`w-9 h-9 rounded-full justify-center items-center ${
              !inputText.trim() && selectedImages.length === 0
                ? "bg-gray-300"
                : "bg-blue-500"
            }`}
            onPress={sendMessage}
            disabled={!inputText.trim() && selectedImages.length === 0}
          >
            <Ionicons name="send" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const MessagesScreen = () => {
  const [searchQuery, setSearchQuery] = React.useState("");

  const conversations = [
    {
      id: 1,
      name: "John Silva",
      service: "Electrical Services",
      lastMessage: "I'll be there at 2 PM tomorrow",
      timestamp: "2m ago",
      unread: 2,
      image: "https://i.pravatar.cc/150?img=12",
      online: true,
    },
    {
      id: 2,
      name: "Sarah Perera",
      service: "Plumbing Services",
      lastMessage: "The job is complete. Please review",
      timestamp: "1h ago",
      unread: 0,
      image: "https://i.pravatar.cc/150?img=45",
      online: true,
    },
    {
      id: 3,
      name: "Mike Fernando",
      service: "Construction Work",
      lastMessage: "Can we reschedule to next week?",
      timestamp: "3h ago",
      unread: 1,
      image: "https://i.pravatar.cc/150?img=33",
      online: false,
    },
    {
      id: 4,
      name: "David Kumar",
      service: "Carpentry Services",
      lastMessage: "Thank you for the positive review!",
      timestamp: "1d ago",
      unread: 0,
      image: "https://i.pravatar.cc/150?img=51",
      online: false,
    },
    {
      id: 5,
      name: "Lisa Jayawardena",
      service: "Painting Services",
      lastMessage: "I have the color samples ready",
      timestamp: "2d ago",
      unread: 0,
      image: "https://i.pravatar.cc/150?img=47",
      online: false,
    },
    {
      id: 6,
      name: "Ahmed Hassan",
      service: "HVAC Services",
      lastMessage: "Your AC installation is scheduled",
      timestamp: "3d ago",
      unread: 0,
      image: "https://i.pravatar.cc/150?img=52",
      online: true,
    },
  ];

  const filteredConversations = conversations.filter(
    (conv) =>
      conv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.service.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const unreadCount = conversations.filter((conv) => conv.unread > 0).length;

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="px-6 pt-12 pb-4 bg-white border-b border-gray-200">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-2xl font-bold text-gray-800">Messages</Text>
          {unreadCount > 0 && (
            <View className="bg-blue-600 px-3 py-1 rounded-full">
              <Text className="text-white text-sm font-semibold">
                {unreadCount} new
              </Text>
            </View>
          )}
        </View>

        {/* Search Bar */}
        <View className="flex-row items-center bg-gray-100 rounded-2xl px-4 py-3">
          <Ionicons name="search-outline" size={20} color="gray" />
          <TextInput
            placeholder="Search conversations..."
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
            className="ml-3 flex-1 text-gray-700 text-base"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={20} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Conversations List */}
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {filteredConversations.length > 0 ? (
          filteredConversations.map((conversation) => (
            <TouchableOpacity
              key={conversation.id}
              onPress={() =>
                router.push({
                  pathname: "/customer/ChatScreen",
                  params: {
                    id: conversation.id,
                    name: conversation.name,
                    service: conversation.service,
                    image: conversation.image,
                  },
                })
              }
              className="px-6 py-4 border-b border-gray-100 bg-white active:bg-gray-50"
            >
              <View className="flex-row items-center">
                {/* Profile Image with Online Status */}
                <View className="relative">
                  <Image
                    source={{ uri: conversation.image }}
                    className="w-14 h-14 rounded-full"
                  />
                  {conversation.online && (
                    <View className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
                  )}
                </View>

                {/* Message Content */}
                <View className="flex-1 ml-4">
                  <View className="flex-row items-center justify-between mb-1">
                    <Text className="text-base font-semibold text-gray-800">
                      {conversation.name}
                    </Text>
                    <Text className="text-xs text-gray-400">
                      {conversation.timestamp}
                    </Text>
                  </View>

                  <Text className="text-xs text-gray-500 mb-1">
                    {conversation.service}
                  </Text>

                  <View className="flex-row items-center justify-between">
                    <Text
                      className={`text-sm flex-1 ${
                        conversation.unread > 0
                          ? "text-gray-800 font-medium"
                          : "text-gray-500"
                      }`}
                      numberOfLines={1}
                    >
                      {conversation.lastMessage}
                    </Text>
                    {conversation.unread > 0 && (
                      <View className="bg-blue-600 rounded-full w-6 h-6 items-center justify-center ml-2">
                        <Text className="text-white text-xs font-bold">
                          {conversation.unread}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View className="items-center justify-center py-20">
            <Ionicons
              name="chatbox-ellipses-outline"
              size={64}
              color="#d1d5db"
            />
            <Text className="text-gray-500 text-base mt-4">
              No conversations found
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default MessagesScreen;

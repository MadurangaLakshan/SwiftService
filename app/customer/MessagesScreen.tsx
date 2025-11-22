import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { auth } from "../config/firebase";
import { useMessageStore } from "../store/messageStore";

interface Conversation {
  _id: string;
  participantIds: string[];
  participants: {
    [userId: string]: {
      name: string;
      photo: string | null;
      userType: "provider" | "customer";
    };
  };
  lastMessage: string | null;
  lastMessageTime: Date;
  unreadCount: {
    [userId: string]: number;
  };
}

const MessagesScreen = () => {
  const currentUserId = auth.currentUser?.uid;
  const { conversations, loading, fetchConversations, markConversationAsRead } =
    useMessageStore();

  useFocusEffect(
    useCallback(() => {
      fetchConversations();
      return () => {};
    }, [])
  );

  const onRefresh = useCallback(() => {
    fetchConversations();
  }, []);

  const handleConversationPress = (conversation: Conversation) => {
    const otherUserId = conversation.participantIds.find(
      (id) => id !== currentUserId
    );

    if (!otherUserId) return;

    const otherUserData = conversation.participants[otherUserId];

    // Optimistically mark as read in the store
    markConversationAsRead(conversation._id);

    router.push({
      pathname: "/customer/ChatScreen",
      params: {
        conversationId: conversation._id,
        otherUserId: otherUserId,
        otherUserName: otherUserData.name,
        otherUserPhoto: otherUserData.photo || "",
      },
    });
  };

  const formatTime = (timestamp: Date) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = diffInMs / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diffInHours < 48) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString([], {
        month: "short",
        day: "numeric",
      });
    }
  };

  const renderConversation = ({ item }: { item: Conversation }) => {
    const otherUserId = item.participantIds.find((id) => id !== currentUserId);
    if (!otherUserId) return null;

    const otherUser = item.participants[otherUserId];
    const unreadCount = item.unreadCount[currentUserId!] || 0;

    return (
      <TouchableOpacity
        onPress={() => handleConversationPress(item)}
        className="flex-row items-center px-6 py-4 bg-white border-b border-gray-100"
      >
        <View className="relative">
          <Image
            source={{
              uri: otherUser.photo || "https://via.placeholder.com/50",
            }}
            className="w-14 h-14 rounded-full"
          />
          {unreadCount > 0 && (
            <View className="absolute -top-1 -right-1 bg-red-500 rounded-full min-w-[20px] h-5 justify-center items-center px-1">
              <Text className="text-white text-xs font-bold">
                {unreadCount > 9 ? "9+" : unreadCount}
              </Text>
            </View>
          )}
        </View>

        <View className="flex-1 ml-4">
          <View className="flex-row items-center justify-between mb-1">
            <Text className="text-base font-semibold text-gray-800 flex-1">
              {otherUser.name}
            </Text>
            <Text className="text-xs text-gray-500 ml-2">
              {formatTime(item.lastMessageTime)}
            </Text>
          </View>
          <View className="flex-row items-center">
            <Text
              className={`text-sm flex-1 ${
                unreadCount > 0
                  ? "text-gray-800 font-semibold"
                  : "text-gray-500"
              }`}
              numberOfLines={1}
            >
              {item.lastMessage || "No messages yet"}
            </Text>
            {unreadCount > 0 && (
              <View className="w-2 h-2 bg-blue-600 rounded-full ml-2" />
            )}
          </View>
          <Text className="text-xs text-gray-400 mt-1">
            {otherUser.userType === "provider" ? "Provider" : "Customer"}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && conversations.length === 0) {
    return (
      <View className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-6 pt-12 pb-4 border-b border-gray-200">
        <View className="flex-row items-center justify-between">
          <Text className="text-2xl font-bold text-gray-800">Messages</Text>
          <TouchableOpacity>
            <Ionicons name="create-outline" size={24} color="#3b82f6" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Conversations List */}
      <FlatList
        data={conversations}
        renderItem={renderConversation}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View className="flex-1 justify-center items-center py-20">
            <Ionicons name="chatbubbles-outline" size={64} color="#d1d5db" />
            <Text className="text-gray-500 mt-4 text-center text-base">
              No conversations yet
            </Text>
            <Text className="text-gray-400 text-sm text-center mt-2 px-8">
              Start chatting with providers or customers
            </Text>
          </View>
        }
      />
    </View>
  );
};

export default MessagesScreen;

import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { auth, db } from "../config/firebase";
import { getConversations } from "../services/messageService";

interface Conversation {
  id: string;
  participantIds: string[];
  participants: {
    [key: string]: {
      name: string;
      photo: string | null;
      userType: "provider" | "customer";
    };
  };
  lastMessage: string | null;
  lastMessageTime: any;
  unreadCount: {
    [key: string]: number;
  };
}

const MessagesScreen = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const currentUserId = auth.currentUser?.uid;

  useEffect(() => {
    fetchConversations();

    // Real-time listener for conversations
    if (!currentUserId) return;

    const conversationsRef = collection(db, "conversations");
    const q = query(
      conversationsRef,
      where("participantIds", "array-contains", currentUserId),
      orderBy("lastMessageTime", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const convs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Conversation[];
      setConversations(convs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUserId]);

  const fetchConversations = async () => {
    try {
      const response = await getConversations();
      if (response.success && response.data) {
        setConversations(response.data);
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchConversations();
  };

  const getOtherParticipant = (conversation: Conversation) => {
    const otherUserId = conversation.participantIds.find(
      (id) => id !== currentUserId
    );
    return otherUserId ? conversation.participants[otherUserId] : null;
  };

  const getTimestamp = (timestamp: any) => {
    if (!timestamp) return "";

    let date: Date;
    if (timestamp.toDate) {
      date = timestamp.toDate();
    } else if (timestamp.seconds) {
      date = new Date(timestamp.seconds * 1000);
    } else {
      date = new Date(timestamp);
    }

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const filteredConversations = conversations.filter((conv) => {
    const other = getOtherParticipant(conv);
    if (!other) return false;
    return other.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const unreadCount = conversations.filter(
    (conv) => currentUserId && conv.unreadCount[currentUserId] > 0
  ).length;

  if (loading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

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
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredConversations.length > 0 ? (
          filteredConversations.map((conversation) => {
            const otherUser = getOtherParticipant(conversation);
            if (!otherUser) return null;

            const unread = currentUserId
              ? conversation.unreadCount[currentUserId]
              : 0;

            return (
              <TouchableOpacity
                key={conversation.id}
                onPress={() =>
                  router.push({
                    pathname: "/serviceProvider/ChatScreen",
                    params: {
                      conversationId: conversation.id,
                      otherUserId: conversation.participantIds.find(
                        (id) => id !== currentUserId
                      ),
                      name: otherUser.name,
                      image:
                        otherUser.photo ||
                        `https://i.pravatar.cc/150?u=${conversation.participantIds.find(
                          (id) => id !== currentUserId
                        )}`,
                    },
                  })
                }
                className="px-6 py-4 border-b border-gray-100 bg-white active:bg-gray-50"
              >
                <View className="flex-row items-center">
                  {/* Profile Image */}
                  <View className="relative">
                    <Image
                      source={{
                        uri:
                          otherUser.photo ||
                          `https://i.pravatar.cc/150?u=${conversation.participantIds.find(
                            (id) => id !== currentUserId
                          )}`,
                      }}
                      className="w-14 h-14 rounded-full"
                    />
                  </View>

                  {/* Message Content */}
                  <View className="flex-1 ml-4">
                    <View className="flex-row items-center justify-between mb-1">
                      <Text className="text-base font-semibold text-gray-800">
                        {otherUser.name}
                      </Text>
                      <Text className="text-xs text-gray-400">
                        {getTimestamp(conversation.lastMessageTime)}
                      </Text>
                    </View>

                    <Text className="text-xs text-gray-500 mb-1">
                      {otherUser.userType === "customer"
                        ? "Customer"
                        : "Provider"}
                    </Text>

                    <View className="flex-row items-center justify-between">
                      <Text
                        className={`text-sm flex-1 ${
                          unread > 0
                            ? "text-gray-800 font-medium"
                            : "text-gray-500"
                        }`}
                        numberOfLines={1}
                      >
                        {conversation.lastMessage || "No messages yet"}
                      </Text>
                      {unread > 0 && (
                        <View className="bg-blue-600 rounded-full w-6 h-6 items-center justify-center ml-2">
                          <Text className="text-white text-xs font-bold">
                            {unread}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
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

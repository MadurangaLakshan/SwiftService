import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { auth } from "../config/firebase";
import { getMessages } from "../services/messageService";
import socketService from "../socket/socketService";

interface Message {
  _id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderPhoto: string | null;
  text: string;
  timestamp: Date;
  read: boolean;
}

const ChatScreen = () => {
  const params = useLocalSearchParams();
  const { conversationId, otherUserId, otherUserName, otherUserPhoto } = params;

  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentUserId = auth.currentUser?.uid;

  // Load messages
  useEffect(() => {
    loadMessages();
  }, [conversationId]);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      () => {
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
    };
  }, []);

  // Setup socket listeners
  useEffect(() => {
    if (!conversationId) return;

    const conversationIdStr = conversationId as string;

    if (!socketService.isConnected) {
      socketService.connect().catch((err) => {
        console.error("Failed to connect socket:", err);
      });
    }

    socketService.joinConversations([conversationIdStr]);

    socketService.onMessage(conversationIdStr, (message: Message) => {
      console.log("Received new message:", message);

      if (message.senderId === currentUserId) {
        return;
      }

      setMessages((prev) => {
        const exists = prev.some((msg) => msg._id === message._id);
        if (exists) return prev;
        return [...prev, message];
      });

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);

      socketService.markAsRead(conversationIdStr);
    });

    socketService.onMessage(conversationIdStr, (message: Message) => {
      console.log("Received new message:", message);

      if (message.senderId === currentUserId) {
        return;
      }

      setMessages((prev) => {
        const exists = prev.some((msg) => msg._id === message._id);
        if (exists) return prev;
        return [...prev, message];
      });

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);

      socketService.markAsRead(conversationIdStr);
    });

    socketService.onTyping((data: { userId: string; isTyping: boolean }) => {
      if (data.userId === otherUserId) {
        setIsTyping(data.isTyping);
      }
    });

    return () => {
      socketService.removeMessageListener(conversationIdStr);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [conversationId, otherUserId, currentUserId]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const response = await getMessages(conversationId as string);

      if (response.success && response.data) {
        setMessages(response.data);

        socketService.markAsRead(conversationId as string);
      }
    } catch (error) {
      console.error("Error loading messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || sending) return;

    const textToSend = messageText.trim();
    setMessageText("");
    setSending(true);

    try {
      socketService.typing(conversationId as string, false);

      const optimisticMessage: Message = {
        _id: `temp-${Date.now()}`, // Temporary ID
        conversationId: conversationId as string,
        senderId: currentUserId!,
        senderName: auth.currentUser?.displayName || "You",
        senderPhoto: auth.currentUser?.photoURL || null,
        text: textToSend,
        timestamp: new Date(),
        read: false,
      };

      setMessages((prev) => [...prev, optimisticMessage]);

      socketService.sendMessage(conversationId as string, textToSend);

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error("Error sending message:", error);
      setMessageText(textToSend);

      setMessages((prev) => prev.filter((msg) => !msg._id.startsWith("temp-")));
    } finally {
      setSending(false);
    }
  };

  const handleTyping = (text: string) => {
    setMessageText(text);

    socketService.typing(conversationId as string, text.length > 0);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (text.length > 0) {
      typingTimeoutRef.current = setTimeout(() => {
        socketService.typing(conversationId as string, false);
      }, 2000);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isCurrentUser = item.senderId === currentUserId;
    const messageTime = new Date(item.timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    return (
      <View
        className={`flex-row mb-3 ${
          isCurrentUser ? "justify-end" : "justify-start"
        }`}
      >
        {!isCurrentUser && (
          <Image
            source={{
              uri: item.senderPhoto || "https://via.placeholder.com/40",
            }}
            className="w-8 h-8 rounded-full mr-2"
          />
        )}
        <View
          className={`max-w-[85%] rounded-2xl px-4 py-2 ${
            isCurrentUser ? "bg-blue-600" : "bg-gray-200"
          }`}
        >
          {!isCurrentUser && (
            <Text className="text-xs font-semibold text-gray-700 mb-1">
              {item.senderName}
            </Text>
          )}
          <Text
            className={`text-base ${
              isCurrentUser ? "text-white" : "text-gray-800"
            }`}
          >
            {item.text}
          </Text>
          <Text
            className={`text-xs mt-1 ${
              isCurrentUser ? "text-blue-100" : "text-gray-500"
            }`}
          >
            {messageTime}
          </Text>
        </View>
        {isCurrentUser && (
          <Image
            source={{
              uri: item.senderPhoto || "https://via.placeholder.com/40",
            }}
            className="w-8 h-8 rounded-full ml-2"
          />
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-white"
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View className="bg-white px-4 pt-12 pb-3 border-b border-gray-200">
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => router.push("/customer/MessagesScreen")}
            className="mr-3"
          >
            <Ionicons name="arrow-back" size={24} color="black" />
          </TouchableOpacity>
          <Image
            source={{
              uri:
                (otherUserPhoto as string) || "https://via.placeholder.com/40",
            }}
            className="w-10 h-10 rounded-full mr-3"
          />
          <View className="flex-1">
            <Text className="text-lg font-bold text-gray-800">
              {otherUserName}
            </Text>
            {isTyping && (
              <Text className="text-xs text-gray-500">typing...</Text>
            )}
          </View>
          <TouchableOpacity className="mr-2">
            <Ionicons name="call-outline" size={24} color="#3b82f6" />
          </TouchableOpacity>
          <TouchableOpacity>
            <Ionicons
              name="information-circle-outline"
              size={24}
              color="#3b82f6"
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item, index) => item._id || `message-${index}`}
        contentContainerStyle={{ padding: 16 }}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => {
          // Scroll to end when content size changes (i.e., when messages load)
          if (messages.length > 0) {
            flatListRef.current?.scrollToEnd({ animated: false });
          }
        }}
        onLayout={() => {
          // Also scroll on initial layout
          if (messages.length > 0) {
            flatListRef.current?.scrollToEnd({ animated: false });
          }
        }}
        ListEmptyComponent={
          <View className="flex-1 justify-center items-center py-20">
            <Ionicons name="chatbubbles-outline" size={64} color="#d1d5db" />
            <Text className="text-gray-500 mt-4 text-center">
              No messages yet.{"\n"}Start the conversation!
            </Text>
          </View>
        }
      />

      {/* Input */}
      <View className="bg-white border-t border-gray-200 px-4 py-3">
        <View className="flex-row items-center bg-gray-100 rounded-full px-4 py-2">
          <TouchableOpacity className="mr-3">
            <Ionicons name="add-circle-outline" size={24} color="#3b82f6" />
          </TouchableOpacity>
          {/* <TextInput
            value={messageText}
            onChangeText={handleTyping}
            placeholder="Type a message..."
            className="flex-1 text-base text-gray-800"
            multiline
            maxLength={5000}
          /> */}
          <TextInput
            value={messageText}
            onChangeText={handleTyping}
            onFocus={() => {
              // Scroll to bottom when input is focused
              setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
              }, 300); // Slightly longer delay to wait for keyboard animation
            }}
            placeholder="Type a message..."
            className="flex-1 text-base text-gray-800"
            multiline
            maxLength={5000}
          />
          <TouchableOpacity
            onPress={handleSendMessage}
            disabled={!messageText.trim() || sending}
            className="ml-3"
          >
            {sending ? (
              <ActivityIndicator size="small" color="#3b82f6" />
            ) : (
              <Ionicons
                name="send"
                size={24}
                color={messageText.trim() ? "#3b82f6" : "#d1d5db"}
              />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

export default ChatScreen;

import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const ChatScreen = () => {
  const params = useLocalSearchParams();
  const { name, service, image } = params;

  const [message, setMessage] = React.useState("");
  const scrollViewRef = React.useRef<ScrollView>(null);

  const [messages, setMessages] = React.useState([
    {
      id: 1,
      text: "Hi! I saw your service request",
      sender: "provider",
      timestamp: "10:30 AM",
    },
    {
      id: 2,
      text: "Yes, I need help with electrical wiring",
      sender: "customer",
      timestamp: "10:32 AM",
    },
    {
      id: 3,
      text: "I can help with that. When would be a good time?",
      sender: "provider",
      timestamp: "10:33 AM",
    },
    {
      id: 4,
      text: "Tomorrow afternoon would be perfect",
      sender: "customer",
      timestamp: "10:35 AM",
    },
    {
      id: 5,
      text: "Great! I'll be there at 2 PM tomorrow",
      sender: "provider",
      timestamp: "10:36 AM",
    },
    {
      id: 6,
      text: "Perfect, see you then!",
      sender: "customer",
      timestamp: "10:37 AM",
    },
  ]);

  const sendMessage = () => {
    if (message.trim().length > 0) {
      const newMessage = {
        id: messages.length + 1,
        text: message.trim(),
        sender: "customer",
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setMessages([...messages, newMessage]);
      setMessage("");

      // Scroll to bottom
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-white px-6 pt-12 pb-4 border-b border-gray-200">
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => router.push("/customer/MessagesScreen")}
            className="mr-4"
          >
            <Ionicons name="arrow-back" size={24} color="black" />
          </TouchableOpacity>

          <View className="relative mr-3">
            <Image
              source={{ uri: image as string }}
              className="w-10 h-10 rounded-full"
            />
            <View className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
          </View>

          <View className="flex-1">
            <Text className="text-lg font-semibold text-gray-800">{name}</Text>
            <Text className="text-xs text-gray-500">{service}</Text>
          </View>

          <TouchableOpacity className="ml-2">
            <Ionicons name="call-outline" size={24} color="#3b82f6" />
          </TouchableOpacity>
          <TouchableOpacity className="ml-4">
            <Ionicons name="ellipsis-vertical" size={24} color="#6b7280" />
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
        keyboardVerticalOffset={0}
      >
        <ScrollView
          ref={scrollViewRef}
          className="flex-1 px-4 py-4"
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() =>
            scrollViewRef.current?.scrollToEnd({ animated: true })
          }
        >
          <View className="items-center my-4">
            <View className="bg-gray-200 px-4 py-1 rounded-full">
              <Text className="text-xs text-gray-600">Today</Text>
            </View>
          </View>

          {messages.map((msg) => (
            <View
              key={msg.id}
              className={`mb-3 ${
                msg.sender === "customer" ? "items-end" : "items-start"
              }`}
            >
              <View
                className={`max-w-[75%] px-4 py-3 rounded-2xl ${
                  msg.sender === "customer"
                    ? "bg-blue-600 rounded-br-sm"
                    : "bg-white rounded-bl-sm border border-gray-200"
                }`}
              >
                <Text
                  className={`text-base ${
                    msg.sender === "customer" ? "text-white" : "text-gray-800"
                  }`}
                >
                  {msg.text}
                </Text>
              </View>
              <Text className="text-xs text-gray-400 mt-1 px-2">
                {msg.timestamp}
              </Text>
            </View>
          ))}
        </ScrollView>

        <View className="bg-white px-4 py-3 border-t border-gray-200">
          <View className="flex-row items-center">
            <TouchableOpacity className="mr-3">
              <Ionicons name="add-circle-outline" size={28} color="#3b82f6" />
            </TouchableOpacity>

            <View className="flex-1 flex-row items-center bg-gray-100 rounded-full px-4 py-2">
              <TextInput
                placeholder="Type a message..."
                placeholderTextColor="#9ca3af"
                value={message}
                onChangeText={setMessage}
                className="flex-1 text-gray-800 text-base"
                multiline
                maxLength={500}
              />
              <TouchableOpacity className="ml-2">
                <Ionicons name="happy-outline" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={sendMessage}
              className={`ml-3 w-10 h-10 rounded-full items-center justify-center ${
                message.trim().length > 0 ? "bg-blue-600" : "bg-gray-300"
              }`}
              disabled={message.trim().length === 0}
            >
              <Ionicons name="send" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

export default ChatScreen;

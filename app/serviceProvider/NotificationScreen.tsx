import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

const NotificationsScreen = () => {
  const notifications = [
    {
      id: 1,
      title: "Booking Confirmed",
      message:
        "Your booking with John Silva has been confirmed for tomorrow at 2 PM",
      time: "2 hours ago",
      read: false,
      type: "booking",
    },
    {
      id: 2,
      title: "New Message",
      message: "Sarah Perera sent you a message",
      time: "5 hours ago",
      read: false,
      type: "message",
    },
    {
      id: 3,
      title: "Service Completed",
      message: "Mike Fernando has completed your service request",
      time: "1 day ago",
      read: true,
      type: "service",
    },
    {
      id: 4,
      title: "Payment Successful",
      message: "Your payment of $50 has been processed",
      time: "2 days ago",
      read: true,
      type: "payment",
    },
  ];

  const getIconName = (type: string) => {
    switch (type) {
      case "booking":
        return "calendar";
      case "message":
        return "chatbox";
      case "service":
        return "checkmark-circle";
      case "payment":
        return "card";
      default:
        return "notifications";
    }
  };

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="px-6 pt-12 pb-4 bg-white border-b border-gray-200">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="black" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-800">Notifications</Text>
          <TouchableOpacity>
            <Text className="text-blue-600 font-medium">Mark all read</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Notifications List */}
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {notifications.map((notification) => (
          <TouchableOpacity
            key={notification.id}
            className={`px-6 py-4 border-b border-gray-100 ${
              !notification.read ? "bg-blue-50" : "bg-white"
            }`}
          >
            <View className="flex-row">
              <View
                className={`w-12 h-12 rounded-full items-center justify-center ${
                  !notification.read ? "bg-blue-100" : "bg-gray-100"
                }`}
              >
                <Ionicons
                  name={getIconName(notification.type)}
                  size={24}
                  color={!notification.read ? "#3b82f6" : "#6b7280"}
                />
              </View>

              <View className="flex-1 ml-4">
                <View className="flex-row items-center justify-between mb-1">
                  <Text className="text-base font-semibold text-gray-800">
                    {notification.title}
                  </Text>
                  {!notification.read && (
                    <View className="w-2 h-2 bg-blue-600 rounded-full" />
                  )}
                </View>
                <Text className="text-sm text-gray-600 mb-2">
                  {notification.message}
                </Text>
                <Text className="text-xs text-gray-400">
                  {notification.time}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}

        {notifications.length === 0 && (
          <View className="items-center justify-center py-20">
            <Ionicons name="notifications-outline" size={64} color="#d1d5db" />
            <Text className="text-gray-500 text-base mt-4">
              No notifications yet
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default NotificationsScreen;

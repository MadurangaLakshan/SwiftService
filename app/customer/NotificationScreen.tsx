import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../services/notificationService";

interface Notification {
  _id: string;
  userId: string;
  title: string;
  message: string;
  type: "booking" | "message" | "service" | "payment" | "review" | "general";
  relatedId?: string;
  read: boolean;
  createdAt: string;
  updatedAt: string;
}

const NotificationsScreen = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const response = await getNotifications();
      if (response.success) {
        setNotifications(response.data.data);
      }
    } catch (error) {
      console.error("Error loading notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const handleNotificationPress = async (notification: Notification) => {
    // Mark as read if unread
    if (!notification.read) {
      await markNotificationAsRead(notification._id);
      // Update local state
      setNotifications((prev) =>
        prev.map((n) => (n._id === notification._id ? { ...n, read: true } : n))
      );
    }

    // Navigate based on notification type
    if (notification.type === "booking" && notification.relatedId) {
      router.push({
        pathname: "/customer/BookingDetailsScreen",
        params: { bookingId: notification.relatedId },
      });
    } else if (notification.type === "message" && notification.relatedId) {
      router.push({
        pathname: "/customer/ChatScreen",
        params: { id: notification.relatedId },
      });
    } else if (notification.type === "review" && notification.relatedId) {
      router.push({
        pathname: "/customer/ProviderDetailsScreen",
        params: { id: notification.relatedId },
      });
    }
  };

  const handleMarkAllRead = async () => {
    const response = await markAllNotificationsAsRead();
    if (response.success) {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    }
  };

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
      case "review":
        return "star";
      default:
        return "notifications";
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / 60000);
    const diffInHours = Math.floor(diffInMs / 3600000);
    const diffInDays = Math.floor(diffInMs / 86400000);

    if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes !== 1 ? "s" : ""} ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours !== 1 ? "s" : ""} ago`;
    } else if (diffInDays < 7) {
      return `${diffInDays} day${diffInDays !== 1 ? "s" : ""} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

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
        <View className="flex-row items-center justify-between">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="black" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-800">Notifications</Text>
          <TouchableOpacity onPress={handleMarkAllRead}>
            <Text className="text-blue-600 font-medium">Mark all read</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Notifications List */}
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {notifications.map((notification) => (
          <TouchableOpacity
            key={notification._id}
            className={`px-6 py-4 border-b border-gray-100 ${
              !notification.read ? "bg-blue-50" : "bg-white"
            }`}
            onPress={() => handleNotificationPress(notification)}
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
                  {formatTime(notification.createdAt)}
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

import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React, { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { auth } from "../config/firebase";
import { ProviderProvider } from "../context/ProviderContext";
import { getConversations } from "../services/messageService";
import socketService from "../socket/socketService";

const MessagesIconWithBadge = ({ color }: { color: string }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const currentUserId = auth.currentUser?.uid;

  useEffect(() => {
    if (!currentUserId) return;

    // Initial fetch of conversations
    const fetchUnreadCount = async () => {
      try {
        const response = await getConversations();
        if (response.success && response.data) {
          const conversations = response.data;
          const totalUnread = conversations.filter(
            (conv: any) =>
              conv.unreadCount &&
              (conv.unreadCount[currentUserId] ||
                conv.unreadCount.get?.(currentUserId) ||
                0) > 0
          ).length;
          setUnreadCount(totalUnread);
        }
      } catch (error) {
        console.error("Error fetching unread count:", error);
      }
    };

    fetchUnreadCount();

    // Listen for real-time updates via socket
    const handleConversationUpdate = (data: any) => {
      console.log("Conversation updated:", data);
      // Refetch conversations when there's an update
      fetchUnreadCount();
    };

    socketService.onConversationUpdate(handleConversationUpdate);

    // Refresh every 30 seconds as fallback
    const interval = setInterval(fetchUnreadCount, 30000);

    return () => {
      clearInterval(interval);
      socketService.removeMessageListener("conversation-update");
    };
  }, [currentUserId]);

  return (
    <View style={{ width: 26, height: 26, position: "relative" }}>
      <Ionicons name="chatbox-ellipses-outline" size={26} color={color} />
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

export default function ProviderLayout() {
  return (
    <ProviderProvider>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: "white",
            borderTopWidth: 1,
            borderTopColor: "#e5e7eb",
            paddingBottom: 24,
            paddingTop: 12,
            height: 88,
          },
          tabBarActiveTintColor: "#3b82f6",
          tabBarInactiveTintColor: "#9ca3af",
        }}
      >
        <Tabs.Screen
          name="HomeScreen"
          options={{
            title: "Home",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name="home" size={26} color={color} />
            ),
            tabBarLabel: ({ color }) => (
              <Text style={{ color, fontSize: 12, marginTop: 4 }}>Home</Text>
            ),
          }}
        />
        <Tabs.Screen
          name="BookingsScreen"
          options={{
            title: "Bookings",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name="calendar-outline" size={26} color={color} />
            ),
            tabBarLabel: ({ color }) => (
              <Text style={{ color, fontSize: 12, marginTop: 4 }}>
                Bookings
              </Text>
            ),
          }}
        />
        <Tabs.Screen
          name="Dashboard"
          options={{
            title: "Dashboard",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name="bar-chart-outline" size={26} color={color} />
            ),
            tabBarLabel: ({ color }) => (
              <Text style={{ color, fontSize: 12, marginTop: 4 }}>
                Dashboard
              </Text>
            ),
          }}
        />
        <Tabs.Screen
          name="MessagesScreen"
          options={{
            title: "Messages",
            tabBarIcon: ({ color, focused }) => (
              <MessagesIconWithBadge color={color} />
            ),
            tabBarLabel: ({ color }) => (
              <Text style={{ color, fontSize: 12, marginTop: 4 }}>
                Messages
              </Text>
            ),
          }}
        />
        <Tabs.Screen
          name="ProfileScreen"
          options={{
            title: "Profile",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name="person-outline" size={26} color={color} />
            ),
            tabBarLabel: ({ color }) => (
              <Text style={{ color, fontSize: 12, marginTop: 4 }}>Profile</Text>
            ),
          }}
        />
        <Tabs.Screen
          name="NotificationScreen"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="ChatScreen"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="BookingDetailsScreen"
          options={{
            href: null,
          }}
        />
      </Tabs>
    </ProviderProvider>
  );
}

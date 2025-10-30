import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { Text } from "react-native";
import { CustomerProvider } from "../context/CustomerContext";

export default function CustomerLayout() {
  return (
    <CustomerProvider>
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
          name="MessagesScreen"
          options={{
            title: "Messages",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name="chatbox-ellipses-outline"
                size={26}
                color={color}
              />
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
    </CustomerProvider>
  );
}

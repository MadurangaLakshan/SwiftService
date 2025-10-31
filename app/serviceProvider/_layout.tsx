import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { Text } from "react-native";
import { ProviderProvider } from "../context/ProviderContext";

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
      </Tabs>
    </ProviderProvider>
  );
}

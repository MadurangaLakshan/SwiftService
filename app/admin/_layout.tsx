import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { Platform, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AdminProvider } from "../context/AdminContext";

const AdminBadge = ({ count }: { count: number }) =>
  count > 0 ? (
    <View
      style={{
        position: "absolute",
        top: -4,
        right: -8,
        backgroundColor: "#10b981",
        borderRadius: 10,
        minWidth: 18,
        height: 18,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 2,
        borderColor: "white",
      }}
    >
      <Text style={{ color: "white", fontSize: 10, fontWeight: "bold" }}>
        {count}
      </Text>
    </View>
  ) : null;

export default function AdminLayout() {
  const insets = useSafeAreaInsets();

  return (
    <AdminProvider>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: "white",
            borderTopWidth: 1,
            borderTopColor: "#e5e7eb",
            paddingBottom: Platform.OS === "android" ? insets.bottom + 12 : 24,
            paddingTop: 12,
            height: Platform.OS === "android" ? 64 + insets.bottom : 88,
          },
          tabBarActiveTintColor: "#10b981",
          tabBarInactiveTintColor: "#9ca3af",
        }}
      >
        <Tabs.Screen
          name="DisputesScreen"
          options={{
            title: "Disputes",
            tabBarIcon: ({ color }) => (
              <Ionicons name="alert-circle-outline" size={26} color={color} />
            ),
            tabBarLabel: ({ color }) => (
              <Text style={{ color, fontSize: 12, marginTop: 4 }}>
                Disputes
              </Text>
            ),
          }}
        />

        <Tabs.Screen
          name="ApprovalsScreen"
          options={{
            title: "Approvals",
            tabBarIcon: ({ color }) => (
              <View style={{ width: 26, height: 26 }}>
                <Ionicons
                  name="shield-checkmark-outline"
                  size={26}
                  color={color}
                />
              </View>
            ),
            tabBarLabel: ({ color }) => (
              <Text style={{ color, fontSize: 12, marginTop: 4 }}>Verify</Text>
            ),
          }}
        />

        <Tabs.Screen
          name="ProfileScreen"
          options={{
            title: "Profile",
            tabBarIcon: ({ color }) => (
              <Ionicons name="people-outline" size={26} color={color} />
            ),
            tabBarLabel: ({ color }) => (
              <Text style={{ color, fontSize: 12, marginTop: 4 }}>Profile</Text>
            ),
          }}
        />

        <Tabs.Screen name="ProviderDetailsScreen" options={{ href: null }} />
      </Tabs>
    </AdminProvider>
  );
}

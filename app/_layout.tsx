import { Stack } from "expo-router";
import { useEffect } from "react";
import { auth } from "./config/firebase";
import "./globals.css";
import socketService from "./socket/socketService";

export default function RootLayout() {
  useEffect(() => {
    let mounted = true;

    const initSocket = () => {
      // Listen for auth state changes
      const unsubscribe = auth.onAuthStateChanged(async (user) => {
        if (user && mounted) {
          try {
            console.log("✅ User authenticated:", user.uid);
            console.log("🔌 Initializing socket connection...");

            await socketService.connect();

            if (socketService.isConnected) {
              console.log("✅ Socket connected successfully");
            } else {
              console.warn(
                "⚠️ Socket connection initiated but not yet connected"
              );
            }
          } catch (error) {
            console.error("❌ Failed to connect socket:", error);
          }
        } else if (!user && mounted) {
          console.log("👤 User logged out, disconnecting socket...");
          socketService.disconnect();
        }
      });

      return unsubscribe;
    };

    const unsubscribe = initSocket();

    // Cleanup on unmount
    return () => {
      mounted = false;
      unsubscribe();
      socketService.disconnect();
      console.log("🧹 Socket cleanup completed");
    };
  }, []);

  return <Stack screenOptions={{ headerShown: false }} />;
}

import * as Location from "expo-location";
import { useEffect, useRef } from "react";
import { updateProviderLocation } from "../services/apiService";

export const useProviderLocationTracking = (
  bookingId: string,
  isTracking: boolean
) => {
  const locationSubscription = useRef<Location.LocationSubscription | null>(
    null
  );

  useEffect(() => {
    if (isTracking) {
      startTracking();
    } else {
      stopTracking();
    }

    return () => stopTracking();
  }, [isTracking, bookingId]);

  const startTracking = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.error("Location permission denied");
        return;
      }

      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 10000, // Update every 10 seconds
          distanceInterval: 10, // Or when moved 10 meters
        },
        async (location) => {
          try {
            await updateProviderLocation(bookingId, {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              heading: location.coords.heading || undefined,
              speed: location.coords.speed || undefined,
            });
          } catch (error) {
            console.error("Error updating location:", error);
          }
        }
      );
    } catch (error) {
      console.error("Error starting tracking:", error);
    }
  };

  const stopTracking = () => {
    if (locationSubscription.current) {
      locationSubscription.current.remove();
      locationSubscription.current = null;
    }
  };
};

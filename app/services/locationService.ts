// import * as Location from "expo-location";
// import { authenticatedRequest } from "./apiService";

// export const geocodeAddress = async (address: string) => {
//   try {
//     const response = await authenticatedRequest("/location/geocode", {
//       method: "POST",
//       body: JSON.stringify({ address }),
//     });
//     return response;
//   } catch (error) {
//     console.error("Error geocoding address:", error);
//     throw error;
//   }
// };

// export const reverseGeocode = async (latitude: number, longitude: number) => {
//   try {
//     const response = await authenticatedRequest("/location/reverse-geocode", {
//       method: "POST",
//       body: JSON.stringify({ latitude, longitude }),
//     });
//     return response;
//   } catch (error) {
//     console.error("Error reverse geocoding:", error);
//     throw error;
//   }
// };

// export const updateProviderLocation = async (
//   bookingId: string,
//   locationData: {
//     latitude: number;
//     longitude: number;
//     heading?: number;
//     speed?: number;
//   },
// ) => {
//   try {
//     const response = await authenticatedRequest(
//       `/location/${bookingId}/location`,
//       {
//         method: "PUT",
//         body: JSON.stringify(locationData),
//       },
//     );
//     return response;
//   } catch (error) {
//     console.error("Error updating provider location:", error);
//     throw error;
//   }
// };

// export const getBookingTracking = async (bookingId: string) => {
//   try {
//     const response = await authenticatedRequest(
//       `/location/${bookingId}/location`,
//       {
//         method: "GET",
//       },
//     );
//     return response;
//   } catch (error) {
//     console.error("Error fetching tracking data:", error);
//     throw error;
//   }
// };

// export const startLocationTracking = async (
//   bookingId: string,
// ): Promise<Location.LocationSubscription | null> => {
//   try {
//     const { status } = await Location.requestForegroundPermissionsAsync();
//     if (status !== "granted") {
//       console.error("Location permission not granted");
//       throw new Error("Location permission not granted");
//     }

//     const subscription = await Location.watchPositionAsync(
//       {
//         accuracy: Location.Accuracy.High,
//         timeInterval: 10000,
//         distanceInterval: 10,
//       },
//       async (location) => {
//         try {
//           await updateProviderLocation(bookingId, {
//             latitude: location.coords.latitude,
//             longitude: location.coords.longitude,
//             heading: location.coords.heading || undefined,
//             speed: location.coords.speed || undefined,
//           });
//           console.log("Location updated successfully");
//         } catch (error) {
//           console.error("Error updating location:", error);
//         }
//       },
//     );

//     return subscription;
//   } catch (error) {
//     console.error("Error starting location tracking:", error);
//     return null;
//   }
// };

// export const stopLocationTracking = (
//   locationSubscription: Location.LocationSubscription | null,
// ) => {
//   if (locationSubscription) {
//     locationSubscription.remove();
//     console.log("Location tracking stopped");
//   }
// };

import * as Location from "expo-location";
import { authenticatedRequest } from "./apiService";

export const geocodeAddress = async (address: string) => {
  try {
    const response = await authenticatedRequest("/location/geocode", {
      method: "POST",
      body: JSON.stringify({ address }),
    });
    return response;
  } catch (error) {
    console.error("Error geocoding address:", error);
    throw error;
  }
};

export const reverseGeocode = async (latitude: number, longitude: number) => {
  try {
    const response = await authenticatedRequest("/location/reverse-geocode", {
      method: "POST",
      body: JSON.stringify({ latitude, longitude }),
    });
    return response;
  } catch (error) {
    console.error("Error reverse geocoding:", error);
    throw error;
  }
};

export const updateProviderLocation = async (
  bookingId: string,
  locationData: {
    latitude: number;
    longitude: number;
    heading?: number;
    speed?: number;
  },
) => {
  try {
    const response = await authenticatedRequest(
      `/location/booking/${bookingId}/location`,
      {
        method: "POST",
        body: JSON.stringify(locationData),
      },
    );
    return response;
  } catch (error) {
    console.error("Error updating provider location:", error);
    throw error;
  }
};

export const getBookingTracking = async (bookingId: string) => {
  try {
    const response = await authenticatedRequest(
      `/location/booking/${bookingId}/location`,
      {
        method: "GET",
      },
    );
    return response;
  } catch (error) {
    console.error("Error fetching tracking data:", error);
    throw error;
  }
};

export const startLocationTracking = async (
  bookingId: string,
): Promise<Location.LocationSubscription | null> => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      console.error("Location permission not granted");
      throw new Error("Location permission not granted");
    }

    const subscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 10000,
        distanceInterval: 10,
      },
      async (location) => {
        try {
          await updateProviderLocation(bookingId, {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            heading: location.coords.heading || undefined,
            speed: location.coords.speed || undefined,
          });
          console.log("Location updated successfully");
        } catch (error) {
          console.error("Error updating location:", error);
        }
      },
    );

    return subscription;
  } catch (error) {
    console.error("Error starting location tracking:", error);
    return null;
  }
};

export const stopLocationTracking = (
  locationSubscription: Location.LocationSubscription | null,
) => {
  if (locationSubscription) {
    locationSubscription.remove();
    console.log("Location tracking stopped");
  }
};

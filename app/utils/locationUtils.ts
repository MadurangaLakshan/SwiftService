import * as Location from "expo-location";

export interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * Request location permissions and get current location
 */
export const getCurrentLocation = async (): Promise<Coordinates | null> => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status !== "granted") {
      console.log("Location permission denied");
      return null;
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
  } catch (error) {
    console.error("Error getting location:", error);
    return null;
  }
};

export interface GeocodingResult {
  coordinates: Coordinates;
  formattedAddress: string;
  locationType: string;
  accuracy: "high" | "medium" | "low";
}

/**
 * Convert address text to coordinates using Google Geocoding API
 * Optimized for Sri Lanka addresses with accuracy checking
 */
export const geocodeAddress = async (
  address: string
): Promise<Coordinates | null> => {
  const result = await geocodeAddressDetailed(address);
  return result?.coordinates || null;
};

/**
 * Convert address to coordinates with detailed accuracy information
 */
export const geocodeAddressDetailed = async (
  address: string
): Promise<GeocodingResult | null> => {
  try {
    const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!GOOGLE_API_KEY) {
      console.error("Google Maps API key is missing");
      return null;
    }

    // Clean and prepare the address
    const cleanAddress = address.trim();
    if (!cleanAddress) {
      console.error("Empty address provided");
      return null;
    }

    // Append "Sri Lanka" if not already present
    const fullAddress = cleanAddress.toLowerCase().includes("sri lanka")
      ? cleanAddress
      : `${cleanAddress}, Sri Lanka`;

    const encodedAddress = encodeURIComponent(fullAddress);

    // Use region biasing for Sri Lanka (lk = Sri Lanka country code)
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&region=lk&key=${GOOGLE_API_KEY}`;

    console.log("Geocoding address:", fullAddress);

    const response = await fetch(url);
    const data = await response.json();

    console.log("Google Geocoding Status:", data.status);

    if (data.status === "OK" && data.results.length > 0) {
      const result = data.results[0];
      const location = result.geometry.location;
      const locationType = result.geometry.location_type;
      const formattedAddress = result.formatted_address;

      // Determine accuracy level
      let accuracy: "high" | "medium" | "low";
      if (locationType === "ROOFTOP" || locationType === "RANGE_INTERPOLATED") {
        accuracy = "high";
      } else if (locationType === "GEOMETRIC_CENTER") {
        accuracy = "medium";
      } else {
        accuracy = "low";
      }

      return {
        coordinates: {
          latitude: location.lat,
          longitude: location.lng,
        },
        formattedAddress,
        locationType,
        accuracy,
      };
    }

    // Log specific errors for debugging
    if (data.status === "ZERO_RESULTS") {
      console.warn("No results found for address:", fullAddress);
    } else if (data.status === "INVALID_REQUEST") {
      console.error("Invalid geocoding request");
    } else if (data.status === "OVER_QUERY_LIMIT") {
      console.error("Google API quota exceeded");
    } else if (data.status === "REQUEST_DENIED") {
      console.error("API key invalid or request denied");
    } else {
      console.error(
        "Geocoding failed with status:",
        data.status,
        data.error_message
      );
    }

    return null;
  } catch (error) {
    console.error("Error geocoding address:", error);
    return null;
  }
};

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
export const calculateDistance = (
  coord1: Coordinates,
  coord2: Coordinates
): number => {
  const R = 6371; // Radius of the Earth in km
  const dLat = toRad(coord2.latitude - coord1.latitude);
  const dLon = toRad(coord2.longitude - coord1.longitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(coord1.latitude)) *
      Math.cos(toRad(coord2.latitude)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  const roundedDistance = Math.round(distance * 10) / 10;
  console.log("  ✅ Calculated distance:", roundedDistance, "km");

  return roundedDistance;
};

const toRad = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

/**
 * Filter providers by distance from user location
 * OPTIMIZED: Uses pre-stored coordinates when available, only geocodes if needed
 */
export const filterProvidersByDistance = async <
  T extends {
    address: string;
    location?: any; // Accept any location structure
  }
>(
  providers: T[],
  userLocation: Coordinates,
  maxDistanceKm: number
): Promise<(T & { distance: number; coordinates?: Coordinates })[]> => {
  const providersWithDistance = await Promise.all(
    providers.map(async (provider, index) => {
      let providerCoords: Coordinates | null = null;

      // Try to use stored coordinates from various possible structures
      if (
        provider.location?.coordinates?.latitude &&
        provider.location?.coordinates?.longitude
      ) {
        providerCoords = provider.location.coordinates;
        console.log("  ✅ Using stored coordinates:", providerCoords);
      } else if (provider.location?.lat && provider.location?.lng) {
        providerCoords = {
          latitude: provider.location.lat,
          longitude: provider.location.lng,
        };
        console.log("  ✅ Using stored coordinates (lat/lng):", providerCoords);
      } else {
        // Fallback: Geocode the address (slower)
        console.log("  ⚠️ No stored coordinates, geocoding...");
        providerCoords = await geocodeAddress(provider.address);

        if (providerCoords) {
          console.log("  ✅ Geocoded to:", providerCoords);
        } else {
          console.log("  ❌ Geocoding failed");
        }
      }

      if (!providerCoords) {
        console.warn("  ⚠️ SKIPPING: No coordinates available");
        return null;
      }

      const distance = calculateDistance(userLocation, providerCoords);

      console.log("  Distance:", distance, "km");
      console.log(
        "  Within radius?",
        distance <= maxDistanceKm ? "YES ✅" : "NO ❌"
      );

      return {
        ...provider,
        distance,
        coordinates: providerCoords,
      };
    })
  );

  // Filter out nulls (failed geocoding), apply distance filter, and sort
  const filtered = providersWithDistance
    .filter((p): p is NonNullable<typeof p> => p !== null)
    .filter((p) => p.distance <= maxDistanceKm)
    .sort((a, b) => a.distance - b.distance);

  console.log("\n✅ Filtering complete:");
  console.log(
    "  Found:",
    filtered.length,
    "providers within",
    maxDistanceKm,
    "km"
  );
  if (filtered.length > 0) {
    console.log(
      "  Distances:",
      filtered
        .map((p) => `${(p as any).name || "Unknown"}: ${p.distance}km`)
        .join(", ")
    );
  }

  return filtered;
};

/**
 * LEGACY: Filter providers by distance (geocodes on-the-fly - SLOWER)
 * Use this only if providers don't have stored coordinates
 */
export const filterProvidersByDistanceLegacy = async <
  T extends { address: string }
>(
  providers: T[],
  userLocation: Coordinates,
  maxDistanceKm: number
): Promise<(T & { distance: number; coordinates?: Coordinates })[]> => {
  const providersWithDistance = await Promise.all(
    providers.map(async (provider) => {
      // Geocode provider address
      const providerCoords = await geocodeAddress(provider.address);

      if (!providerCoords) {
        console.warn("Failed to geocode provider address:", provider.address);
        return null; // Skip if geocoding fails
      }

      const distance = calculateDistance(userLocation, providerCoords);

      return {
        ...provider,
        distance,
        coordinates: providerCoords,
      };
    })
  );

  // Filter out nulls (failed geocoding), apply distance filter, and sort
  return providersWithDistance
    .filter((p): p is NonNullable<typeof p> => p !== null)
    .filter((p) => p.distance <= maxDistanceKm)
    .sort((a, b) => a.distance - b.distance);
};

/**
 * Get readable distance string
 */
export const getDistanceString = (distanceKm: number): string => {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}m away`;
  }
  return `${distanceKm.toFixed(1)}km away`;
};

/**
 * Get user's location choice: current GPS or saved address
 * Returns coordinates for filtering
 */
export const getUserLocationForSearch = async (
  useCurrentLocation: boolean,
  savedAddress?: string
): Promise<Coordinates | null> => {
  if (useCurrentLocation) {
    // Use live GPS
    const location = await getCurrentLocation();
    if (!location) {
      console.error("Failed to get current location");
    }
    return location;
  } else if (savedAddress) {
    // Geocode saved address
    const coords = await geocodeAddress(savedAddress);
    if (!coords) {
      console.error("Failed to geocode saved address:", savedAddress);
    }
    return coords;
  }

  console.error("No location method provided");
  return null;
};

/**
 * Validate if an address can be geocoded with good accuracy
 * Returns validation result with suggestions
 */
export const validateAddress = async (
  address: string
): Promise<{
  isValid: boolean;
  accuracy: "high" | "medium" | "low" | null;
  formattedAddress?: string;
  message: string;
}> => {
  if (!address || address.trim().length < 5) {
    return {
      isValid: false,
      accuracy: null,
      message: "Address is too short. Please provide a complete address.",
    };
  }

  const result = await geocodeAddressDetailed(address);

  if (!result) {
    return {
      isValid: false,
      accuracy: null,
      message: "Address not found. Please check and try again.",
    };
  }

  // Check if Google matched to something much shorter/vaguer than input
  const inputWords = address
    .toLowerCase()
    .split(/[\s,]+/)
    .filter((w) => w.length > 2);
  const matchedWords = result.formattedAddress
    .toLowerCase()
    .split(/[\s,]+/)
    .filter((w) => w.length > 2);
  const matchRatio =
    matchedWords.filter((w) => inputWords.includes(w)).length /
    inputWords.length;

  if (result.accuracy === "low" || matchRatio < 0.3) {
    return {
      isValid: false,
      accuracy: "low",
      formattedAddress: result.formattedAddress,
      message: `Address is too vague. Google only found: "${result.formattedAddress}". Try adding a nearby landmark (e.g., "Near Railway Station" or "Opposite Post Office").`,
    };
  }

  if (result.accuracy === "medium") {
    return {
      isValid: true,
      accuracy: "medium",
      formattedAddress: result.formattedAddress,
      message: `Address verified: "${result.formattedAddress}". Accuracy: ~500m. Consider adding a landmark for better accuracy.`,
    };
  }

  return {
    isValid: true,
    accuracy: "high",
    formattedAddress: result.formattedAddress,
    message: `Address verified: "${result.formattedAddress}". High accuracy.`,
  };
};

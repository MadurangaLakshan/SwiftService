import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Image,
  Linking,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, {
  Marker,
  Polyline,
  PROVIDER_GOOGLE,
  Region,
} from "react-native-maps";
import { getBookingTracking } from "../services/apiService";

interface TrackingScreenProps {
  bookingId: string;
  onClose: () => void;
}

interface TrackingData {
  trackingAvailable: boolean;
  status: string;
  providerLocation?: {
    latitude: number;
    longitude: number;
    lastUpdated: string;
    heading?: number;
    speed?: number;
  };
  serviceLocation: {
    latitude: number;
    longitude: number;
    formattedAddress: string;
  };
  tracking?: {
    estimatedDistance?: number;
    estimatedDuration?: number;
  };
  providerDetails: {
    name: string;
    phone: string;
    profilePhoto?: string;
  };
}

const TrackingScreen: React.FC<TrackingScreenProps> = ({
  bookingId,
  onClose,
}) => {
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [mapRegion, setMapRegion] = useState<Region | null>(null);
  const mapRef = useRef<MapView>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    fetchTrackingData();
    const interval = setInterval(fetchTrackingData, 10000); // Update every 10 seconds

    // Pulse animation for provider marker
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.3,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    return () => clearInterval(interval);
  }, [bookingId]);

  useEffect(() => {
    if (
      trackingData?.providerLocation &&
      trackingData?.serviceLocation &&
      mapRef.current
    ) {
      // Fit map to show both locations
      const coordinates = [
        {
          latitude: trackingData.providerLocation.latitude,
          longitude: trackingData.providerLocation.longitude,
        },
        {
          latitude: trackingData.serviceLocation.latitude,
          longitude: trackingData.serviceLocation.longitude,
        },
      ];

      mapRef.current.fitToCoordinates(coordinates, {
        edgePadding: { top: 100, right: 50, bottom: 300, left: 50 },
        animated: true,
      });
    }
  }, [trackingData]);

  const fetchTrackingData = async () => {
    try {
      const response = await getBookingTracking(bookingId);

      if (response.success && response.data) {
        setTrackingData(response.data);

        if (response.data.providerLocation && !mapRegion) {
          setMapRegion({
            latitude: response.data.providerLocation.latitude,
            longitude: response.data.providerLocation.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          });
        }
      }
    } catch (error) {
      console.error("Error fetching tracking data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCall = () => {
    if (trackingData?.providerDetails.phone) {
      Linking.openURL(`tel:${trackingData.providerDetails.phone}`);
    }
  };

  const formatETA = (seconds?: number) => {
    if (!seconds) return "Calculating...";
    const minutes = Math.ceil(seconds / 60);
    return `${minutes} min${minutes !== 1 ? "s" : ""}`;
  };

  const formatDistance = (meters?: number) => {
    if (!meters) return "Calculating...";
    if (meters < 1000) {
      return `${Math.round(meters)} m`;
    }
    return `${(meters / 1000).toFixed(1)} km`;
  };

  if (loading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="text-gray-500 mt-4">Loading tracking...</Text>
      </View>
    );
  }

  if (!trackingData?.trackingAvailable) {
    return (
      <View className="flex-1 bg-white items-center justify-center px-6">
        <Ionicons name="location-outline" size={64} color="#9ca3af" />
        <Text className="text-xl font-bold text-gray-800 mt-4 mb-2">
          Tracking Not Available
        </Text>
        <Text className="text-gray-600 text-center mb-6">
          Real-time tracking will be available once the provider starts their
          journey.
        </Text>
        <TouchableOpacity
          onPress={onClose}
          className="bg-blue-600 px-8 py-3 rounded-xl"
        >
          <Text className="text-white font-semibold">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const getStatusMessage = () => {
    switch (trackingData.status) {
      case "on-the-way":
        return "Provider is on the way";
      case "arrived":
        return "Provider has arrived";
      case "in-progress":
        return "Service in progress";
      default:
        return "Tracking active";
    }
  };

  const getStatusColor = () => {
    switch (trackingData.status) {
      case "on-the-way":
        return "bg-indigo-600";
      case "arrived":
        return "bg-green-600";
      case "in-progress":
        return "bg-purple-600";
      default:
        return "bg-blue-600";
    }
  };

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="absolute top-0 left-0 right-0 z-10 px-6 pt-12 pb-4 bg-white/95 backdrop-blur-lg border-b border-gray-200">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity
            onPress={onClose}
            className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center"
          >
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text className="text-lg font-bold text-gray-800">Live Tracking</Text>
          <TouchableOpacity
            onPress={fetchTrackingData}
            className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center"
          >
            <Ionicons name="refresh" size={20} color="#000" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Map */}
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={{ flex: 1 }}
        initialRegion={mapRegion || undefined}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={true}
      >
        {/* Provider Location Marker */}
        {trackingData.providerLocation && (
          <Marker
            coordinate={{
              latitude: trackingData.providerLocation.latitude,
              longitude: trackingData.providerLocation.longitude,
            }}
            anchor={{ x: 0.5, y: 0.5 }}
            rotation={trackingData.providerLocation.heading || 0}
          >
            <Animated.View
              style={{
                transform: [{ scale: pulseAnim }],
              }}
              className="items-center justify-center"
            >
              <View className="w-16 h-16 bg-blue-600 rounded-full items-center justify-center border-4 border-white shadow-lg">
                {trackingData.providerDetails.profilePhoto ? (
                  <Image
                    source={{ uri: trackingData.providerDetails.profilePhoto }}
                    className="w-full h-full rounded-full"
                  />
                ) : (
                  <Ionicons name="person" size={28} color="white" />
                )}
              </View>
              <View className="absolute -bottom-2 w-4 h-4 bg-blue-600 rounded-full border-2 border-white" />
            </Animated.View>
          </Marker>
        )}

        {/* Destination Marker */}
        <Marker
          coordinate={{
            latitude: trackingData.serviceLocation.latitude,
            longitude: trackingData.serviceLocation.longitude,
          }}
        >
          <View className="items-center">
            <View className="bg-red-600 rounded-full p-3 border-4 border-white shadow-lg">
              <Ionicons name="home" size={24} color="white" />
            </View>
            <View className="w-2 h-2 bg-red-600 rounded-full mt-1" />
          </View>
        </Marker>

        {/* Route Polyline */}
        {trackingData.providerLocation && (
          <Polyline
            coordinates={[
              {
                latitude: trackingData.providerLocation.latitude,
                longitude: trackingData.providerLocation.longitude,
              },
              {
                latitude: trackingData.serviceLocation.latitude,
                longitude: trackingData.serviceLocation.longitude,
              },
            ]}
            strokeColor="#3b82f6"
            strokeWidth={4}
            lineDashPattern={[1, 10]}
          />
        )}
      </MapView>

      {/* Bottom Info Card */}
      <View className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl px-6 py-6">
        {/* Status Banner */}
        <View
          className={`${getStatusColor()} rounded-2xl p-4 mb-4 flex-row items-center`}
        >
          <Ionicons name="location" size={24} color="white" />
          <Text className="flex-1 ml-3 text-white font-bold text-base">
            {getStatusMessage()}
          </Text>
        </View>

        {/* ETA and Distance */}
        {trackingData.status === "on-the-way" && (
          <View className="flex-row mb-4">
            <View className="flex-1 bg-blue-50 rounded-xl p-4 mr-2">
              <View className="flex-row items-center mb-2">
                <Ionicons name="time-outline" size={20} color="#3b82f6" />
                <Text className="text-xs text-blue-600 ml-2 font-medium">
                  ETA
                </Text>
              </View>
              <Text className="text-2xl font-bold text-blue-700">
                {formatETA(trackingData.tracking?.estimatedDuration)}
              </Text>
            </View>
            <View className="flex-1 bg-green-50 rounded-xl p-4 ml-2">
              <View className="flex-row items-center mb-2">
                <Ionicons name="navigate-outline" size={20} color="#10b981" />
                <Text className="text-xs text-green-600 ml-2 font-medium">
                  Distance
                </Text>
              </View>
              <Text className="text-2xl font-bold text-green-700">
                {formatDistance(trackingData.tracking?.estimatedDistance)}
              </Text>
            </View>
          </View>
        )}

        {/* Provider Info */}
        <View className="flex-row items-center mb-4 bg-gray-50 rounded-xl p-4">
          <Image
            source={{
              uri:
                trackingData.providerDetails.profilePhoto ||
                "https://via.placeholder.com/60",
            }}
            className="w-14 h-14 rounded-full"
          />
          <View className="flex-1 ml-4">
            <Text className="text-lg font-bold text-gray-800">
              {trackingData.providerDetails.name}
            </Text>
            <Text className="text-sm text-gray-600">Service Provider</Text>
          </View>
          <TouchableOpacity
            onPress={handleCall}
            className="w-12 h-12 bg-blue-600 rounded-full items-center justify-center"
          >
            <Ionicons name="call" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* Destination Address */}
        <View className="bg-gray-50 rounded-xl p-4">
          <View className="flex-row items-start">
            <Ionicons
              name="location-sharp"
              size={20}
              color="#ef4444"
              style={{ marginTop: 2 }}
            />
            <View className="flex-1 ml-3">
              <Text className="text-xs text-gray-500 mb-1">
                Service Location
              </Text>
              <Text className="text-sm font-medium text-gray-800">
                {trackingData.serviceLocation.formattedAddress}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

export default TrackingScreen;

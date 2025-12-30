import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker, Region } from "react-native-maps";
import colors from "tailwindcss/colors";
import { Coordinates, getCurrentLocation } from "./locationUtils";

interface LocationData {
  latitude: number;
  longitude: number;
  formattedAddress: string;
  isCustomAddress: boolean;
}

interface BookingAddressSelectorProps {
  onSelectLocation: (location: LocationData) => void;
  userProfileAddress?: string;
  userProfileCoordinates?: Coordinates;
  initialLocation?: LocationData;
}

const BookingAddressSelector: React.FC<BookingAddressSelectorProps> = ({
  onSelectLocation,
  userProfileAddress,
  userProfileCoordinates,
  initialLocation,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(
    initialLocation || null
  );
  const [markerCoords, setMarkerCoords] = useState<Coordinates | null>(
    initialLocation
      ? {
          latitude: initialLocation.latitude,
          longitude: initialLocation.longitude,
        }
      : userProfileCoordinates || null
  );
  const [loadingGeocode, setLoadingGeocode] = useState(false);
  const [loadingCurrentLocation, setLoadingCurrentLocation] = useState(false);
  const mapRef = useRef<MapView>(null);

  // Default center of Sri Lanka (Kandy)
  const [mapRegion, setMapRegion] = useState<Region>({
    latitude: userProfileCoordinates?.latitude || 7.2906,
    longitude: userProfileCoordinates?.longitude || 80.6337,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  });

  // Auto-center map when modal opens
  useEffect(() => {
    if (showModal && markerCoords && mapRef.current) {
      setTimeout(() => {
        mapRef.current?.animateToRegion({
          latitude: markerCoords.latitude,
          longitude: markerCoords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
      }, 100);
    }
  }, [showModal]);

  const handleUseProfileAddress = async () => {
    if (!userProfileAddress || !userProfileCoordinates) {
      Alert.alert("Error", "Profile address not available");
      return;
    }

    setMarkerCoords(userProfileCoordinates);
    setMapRegion({
      latitude: userProfileCoordinates.latitude,
      longitude: userProfileCoordinates.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });

    mapRef.current?.animateToRegion({
      latitude: userProfileCoordinates.latitude,
      longitude: userProfileCoordinates.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });
  };

  const handleUseCurrentLocation = async () => {
    setLoadingCurrentLocation(true);
    try {
      const location = await getCurrentLocation();
      if (location) {
        setMarkerCoords(location);
        setMapRegion({
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });

        mapRef.current?.animateToRegion({
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
      } else {
        Alert.alert(
          "Location Error",
          "Could not get your current location. Please enable location services."
        );
      }
    } catch (error) {
      Alert.alert("Error", "Failed to get current location");
    } finally {
      setLoadingCurrentLocation(false);
    }
  };

  const handleMapPress = (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setMarkerCoords({ latitude, longitude });
  };

  const handleConfirmLocation = async () => {
    if (!markerCoords) {
      Alert.alert(
        "No Location Selected",
        "Please tap on the map to set your location."
      );
      return;
    }

    // Reverse geocode to get formatted address
    try {
      setLoadingGeocode(true);

      // Use Google Reverse Geocoding API
      const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${markerCoords.latitude},${markerCoords.longitude}&key=${GOOGLE_API_KEY}`;

      const response = await fetch(url);
      const data = await response.json();

      let formattedAddress = "";
      let isCustomAddress = true;

      if (data.status === "OK" && data.results.length > 0) {
        formattedAddress = data.results[0].formatted_address;
      } else {
        formattedAddress = `${markerCoords.latitude.toFixed(
          6
        )}, ${markerCoords.longitude.toFixed(6)}`;
      }

      // Check if this is the profile address
      if (
        userProfileCoordinates &&
        Math.abs(markerCoords.latitude - userProfileCoordinates.latitude) <
          0.0001 &&
        Math.abs(markerCoords.longitude - userProfileCoordinates.longitude) <
          0.0001
      ) {
        isCustomAddress = false;
        formattedAddress = userProfileAddress || formattedAddress;
      }

      const locationData: LocationData = {
        latitude: markerCoords.latitude,
        longitude: markerCoords.longitude,
        formattedAddress,
        isCustomAddress,
      };

      setSelectedLocation(locationData);
      onSelectLocation(locationData);
      setShowModal(false);

      Alert.alert(
        "Location Confirmed",
        "Your service location has been saved. This will help providers find you accurately."
      );
    } catch (error) {
      console.error("Error reverse geocoding:", error);

      // Fallback: use coordinates as address
      const locationData: LocationData = {
        latitude: markerCoords.latitude,
        longitude: markerCoords.longitude,
        formattedAddress: `${markerCoords.latitude.toFixed(
          6
        )}, ${markerCoords.longitude.toFixed(6)}`,
        isCustomAddress: true,
      };

      setSelectedLocation(locationData);
      onSelectLocation(locationData);
      setShowModal(false);
    } finally {
      setLoadingGeocode(false);
    }
  };

  return (
    <View>
      {/* Address Display / Selection Button */}
      <TouchableOpacity
        onPress={() => setShowModal(true)}
        className="w-full border border-gray-300 rounded-xl p-4 mb-4 bg-white"
      >
        {selectedLocation ? (
          <View>
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-row items-center flex-1">
                <View className="w-10 h-10 bg-blue-50 rounded-full items-center justify-center mr-3">
                  <Ionicons name="location" size={20} color="#3b82f6" />
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-gray-500 mb-1">
                    {selectedLocation.isCustomAddress
                      ? "Custom Location"
                      : "My Address"}
                  </Text>
                  <Text
                    className="text-sm font-medium text-gray-800"
                    numberOfLines={2}
                  >
                    {selectedLocation.formattedAddress}
                  </Text>
                </View>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.gray[400]}
              />
            </View>
            <View className="flex-row items-center">
              <Ionicons name="checkmark-circle" size={16} color="#10b981" />
              <Text className="text-xs text-green-600 ml-1">
                Location confirmed • Tap to change
              </Text>
            </View>
          </View>
        ) : (
          <View className="flex-row items-center">
            <View className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center mr-3">
              <Ionicons
                name="location-outline"
                size={20}
                color={colors.gray[500]}
              />
            </View>
            <View className="flex-1">
              <Text className="text-gray-800 font-medium">
                Select Service Location
              </Text>
              <Text className="text-xs text-gray-500 mt-1">
                Choose where you need the service
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.gray[400]}
            />
          </View>
        )}
      </TouchableOpacity>

      {/* Map Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View className="flex-1 bg-white">
          {/* Header */}
          <View className="bg-blue-500 pt-12 pb-4 px-6">
            <View className="flex-row items-center justify-between">
              <Text className="text-white text-xl font-bold">
                Select Service Location
              </Text>
              <TouchableOpacity
                onPress={() => setShowModal(false)}
                className="w-10 h-10 bg-white/20 rounded-full items-center justify-center"
              >
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Instructions */}
          <View className="bg-blue-50 p-4 border-b border-blue-100">
            <View className="flex-row items-start">
              <Ionicons name="information-circle" size={20} color="#3b82f6" />
              <Text className="flex-1 ml-3 text-sm text-blue-800">
                Choose your service location. You can use your profile address,
                current location, or tap anywhere on the map for a custom
                location.
              </Text>
            </View>
          </View>

          {/* Quick Actions */}
          <View className="px-6 py-4 bg-gray-50">
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {userProfileAddress && userProfileCoordinates && (
                <TouchableOpacity
                  onPress={handleUseProfileAddress}
                  className="bg-white border border-blue-200 rounded-xl px-4 py-3 mr-3 flex-row items-center shadow-sm"
                >
                  <Ionicons name="home" size={20} color="#3b82f6" />
                  <Text className="text-blue-600 font-medium ml-2">
                    My Address
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={handleUseCurrentLocation}
                disabled={loadingCurrentLocation}
                className="bg-white border border-green-200 rounded-xl px-4 py-3 mr-3 flex-row items-center shadow-sm"
              >
                {loadingCurrentLocation ? (
                  <ActivityIndicator size="small" color="#10b981" />
                ) : (
                  <>
                    <Ionicons name="locate" size={20} color="#10b981" />
                    <Text className="text-green-600 font-medium ml-2">
                      Current Location
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>

          {/* Map */}
          <View className="flex-1">
            <MapView
              ref={mapRef}
              style={{ flex: 1 }}
              initialRegion={mapRegion}
              onPress={handleMapPress}
              showsUserLocation
              showsMyLocationButton
              showsCompass
            >
              {markerCoords && (
                <Marker
                  coordinate={markerCoords}
                  draggable
                  onDragEnd={(e: any) =>
                    setMarkerCoords(e.nativeEvent.coordinate)
                  }
                >
                  <View className="items-center">
                    <View className="bg-blue-600 rounded-full p-3 border-4 border-white shadow-lg">
                      <Ionicons name="home" size={24} color="white" />
                    </View>
                    <View className="w-2 h-2 bg-blue-600 rounded-full mt-1" />
                  </View>
                </Marker>
              )}
            </MapView>

            {/* Map Instruction Overlay */}
            <View className="absolute top-4 left-4 right-4 bg-white/95 backdrop-blur rounded-xl p-3 shadow-lg">
              <Text className="text-sm text-gray-700 text-center font-medium">
                📍 Tap on map or drag marker to set exact location
              </Text>
            </View>
          </View>

          {/* Selected Location Preview */}
          {markerCoords && (
            <View className="px-6 py-3 bg-gray-50 border-t border-gray-200">
              <View className="flex-row items-center">
                <Ionicons name="location" size={20} color="#3b82f6" />
                <View className="flex-1 ml-3">
                  <Text className="text-xs text-gray-500">
                    Selected Coordinates
                  </Text>
                  <Text className="text-sm font-medium text-gray-800">
                    {markerCoords.latitude.toFixed(6)},{" "}
                    {markerCoords.longitude.toFixed(6)}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Confirm Button */}
          <View className="px-6 py-4 bg-white border-t border-gray-200">
            <TouchableOpacity
              onPress={handleConfirmLocation}
              disabled={!markerCoords || loadingGeocode}
              className={`py-4 rounded-xl flex-row items-center justify-center ${
                markerCoords && !loadingGeocode ? "bg-blue-600" : "bg-gray-300"
              }`}
            >
              {loadingGeocode ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={24} color="white" />
                  <Text className="text-white font-bold text-lg ml-2">
                    Confirm Location
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default BookingAddressSelector;

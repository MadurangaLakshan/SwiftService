import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE, Region } from "react-native-maps";
import colors from "tailwindcss/colors";
import {
  Coordinates,
  geocodeAddress,
  getCurrentLocation,
  validateAddress,
} from "../utils/locationUtils";

interface AddressPickerProps {
  address: string;
  city: string;
  postalCode: string;
  onAddressChange: (address: string) => void;
  onCityChange: (city: string) => void;
  onPostalCodeChange: (postalCode: string) => void;
  onCoordinatesConfirm: (coordinates: Coordinates) => void;
  errors?: {
    address?: string;
    city?: string;
    postalCode?: string;
  };
}

const AddressPickerWithMap: React.FC<AddressPickerProps> = ({
  address,
  city,
  postalCode,
  onAddressChange,
  onCityChange,
  onPostalCodeChange,
  onCoordinatesConfirm,
  errors = {},
}) => {
  const [showMap, setShowMap] = useState(false);
  const [markerCoords, setMarkerCoords] = useState<Coordinates | null>(null);
  const [loadingGeocode, setLoadingGeocode] = useState(false);
  const [loadingCurrentLocation, setLoadingCurrentLocation] = useState(false);
  const [addressAccuracy, setAddressAccuracy] = useState<string>("");
  const mapRef = useRef<MapView>(null);

  // Default center of Sri Lanka (Kandy)
  const [mapRegion, setMapRegion] = useState<Region>({
    latitude: 7.2906,
    longitude: 80.6337,
    latitudeDelta: 0.5,
    longitudeDelta: 0.5,
  });

  // Auto-geocode when user opens map
  useEffect(() => {
    if (showMap && !markerCoords && address && city) {
      handleFindOnMap();
    }
  }, [showMap]);

  const handleFindOnMap = async () => {
    if (!address.trim() || !city.trim()) {
      Alert.alert(
        "Address Required",
        "Please enter your address and city first."
      );
      return;
    }

    setLoadingGeocode(true);
    const fullAddress = `${address}, ${city}, ${postalCode}`;

    try {
      // Validate address accuracy
      const validation = await validateAddress(fullAddress);

      if (validation.isValid) {
        const coords = await geocodeAddress(fullAddress);
        if (coords) {
          setMarkerCoords(coords);
          setMapRegion({
            latitude: coords.latitude,
            longitude: coords.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          });

          // Animate to location
          mapRef.current?.animateToRegion({
            latitude: coords.latitude,
            longitude: coords.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          });

          if (validation.accuracy === "low") {
            setAddressAccuracy("low");
            Alert.alert(
              "Location Found",
              `We found an approximate location for your address. Please adjust the pin to your exact location.\n\n${validation.message}`,
              [{ text: "OK" }]
            );
          } else {
            setAddressAccuracy(validation.accuracy || "");
          }
        }
      } else {
        Alert.alert("Address Not Found", validation.message);
      }
    } catch (error) {
      Alert.alert("Error", "Could not find your address. Please try again.");
    } finally {
      setLoadingGeocode(false);
    }
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

        setAddressAccuracy("high");
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
    setAddressAccuracy("high"); // Manual placement is most accurate
  };

  const handleConfirmLocation = () => {
    if (markerCoords) {
      onCoordinatesConfirm(markerCoords);
      setShowMap(false);
      Alert.alert(
        "Location Confirmed",
        "Your exact location has been saved. This will help provide accurate distance calculations."
      );
    } else {
      Alert.alert(
        "No Location Selected",
        "Please tap on the map to set your location."
      );
    }
  };

  return (
    <>
      {/* Address Inputs */}
      <TextInput
        placeholder="Street Address"
        placeholderTextColor={colors.gray[500]}
        value={address}
        onChangeText={onAddressChange}
        className={`w-full border p-3 rounded mb-1 px-4 ${
          errors.address ? "border-red-500" : "border-gray-300"
        }`}
      />
      {errors.address ? (
        <Text className="text-red-500 text-sm mb-3 self-start">
          {errors.address}
        </Text>
      ) : (
        <View className="mb-3" />
      )}

      <TextInput
        placeholder="City"
        placeholderTextColor={colors.gray[500]}
        value={city}
        onChangeText={onCityChange}
        className={`w-full border p-3 rounded mb-1 px-4 ${
          errors.city ? "border-red-500" : "border-gray-300"
        }`}
      />
      {errors.city ? (
        <Text className="text-red-500 text-sm mb-3 self-start">
          {errors.city}
        </Text>
      ) : (
        <View className="mb-3" />
      )}

      <TextInput
        placeholder="Postal Code"
        placeholderTextColor={colors.gray[500]}
        value={postalCode}
        onChangeText={onPostalCodeChange}
        keyboardType="numeric"
        className={`w-full border p-3 rounded mb-1 px-4 ${
          errors.postalCode ? "border-red-500" : "border-gray-300"
        }`}
      />
      {errors.postalCode ? (
        <Text className="text-red-500 text-sm mb-3 self-start">
          {errors.postalCode}
        </Text>
      ) : (
        <View className="mb-3" />
      )}

      {/* Pin Location Button */}
      <TouchableOpacity
        onPress={() => setShowMap(true)}
        className="bg-blue-500 p-4 rounded-xl flex-row items-center justify-center mb-4"
      >
        <Ionicons name="location" size={20} color="white" />
        <Text className="text-white font-bold ml-2">
          {markerCoords ? "Update Location on Map" : "Pin Your Exact Location"}
        </Text>
      </TouchableOpacity>

      {markerCoords && (
        <View className="bg-green-50 p-3 rounded-xl border border-green-200 mb-4">
          <View className="flex-row items-center">
            <Ionicons name="checkmark-circle" size={20} color="#10b981" />
            <Text className="text-green-700 font-semibold ml-2">
              Location confirmed on map
            </Text>
          </View>
          <Text className="text-xs text-green-600 mt-1">
            Lat: {markerCoords.latitude.toFixed(6)}, Lng:{" "}
            {markerCoords.longitude.toFixed(6)}
          </Text>
        </View>
      )}

      {/* Map Modal */}
      <Modal visible={showMap} animationType="slide">
        <View className="flex-1 bg-white">
          {/* Header */}
          <View className="bg-blue-500 pt-12 pb-4 px-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-white text-xl font-bold">
                Pin Your Location
              </Text>
              <TouchableOpacity onPress={() => setShowMap(false)}>
                <Ionicons name="close" size={28} color="white" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Instructions */}
          <View className="bg-amber-50 p-4 border-b border-amber-200">
            <View className="flex-row items-start">
              <Ionicons name="information-circle" size={20} color="#f59e0b" />
              <Text className="flex-1 ml-2 text-sm text-amber-800">
                Tap on the map to set your exact location. This ensures accurate
                distance calculations when finding service providers.
              </Text>
            </View>
          </View>

          {/* Map */}
          <MapView
            provider={PROVIDER_GOOGLE}
            ref={mapRef}
            style={{ flex: 1 }}
            initialRegion={mapRegion}
            onPress={handleMapPress}
            showsUserLocation
            showsMyLocationButton
          >
            {markerCoords && (
              <Marker
                coordinate={markerCoords}
                draggable
                onDragEnd={(e: any) =>
                  setMarkerCoords(e.nativeEvent.coordinate as Coordinates)
                }
              >
                <View className="items-center">
                  <Ionicons name="location" size={40} color="#ef4444" />
                </View>
              </Marker>
            )}
          </MapView>

          {/* Bottom Controls */}
          <View className="bg-white p-4 border-t border-gray-200">
            {/* Quick Actions */}
            <View className="flex-row gap-3 mb-4">
              <TouchableOpacity
                onPress={handleFindOnMap}
                disabled={loadingGeocode}
                className="flex-1 bg-gray-200 p-3 rounded-xl flex-row items-center justify-center"
              >
                {loadingGeocode ? (
                  <ActivityIndicator size="small" color={colors.gray[700]} />
                ) : (
                  <>
                    <Ionicons
                      name="search"
                      size={20}
                      color={colors.gray[700]}
                    />
                    <Text className="text-gray-700 font-semibold ml-2">
                      Find Address
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleUseCurrentLocation}
                disabled={loadingCurrentLocation}
                className="flex-1 bg-gray-200 p-3 rounded-xl flex-row items-center justify-center"
              >
                {loadingCurrentLocation ? (
                  <ActivityIndicator size="small" color={colors.gray[700]} />
                ) : (
                  <>
                    <Ionicons
                      name="navigate"
                      size={20}
                      color={colors.gray[700]}
                    />
                    <Text className="text-gray-700 font-semibold ml-2">
                      Use GPS
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Confirm Button */}
            <TouchableOpacity
              onPress={handleConfirmLocation}
              disabled={!markerCoords}
              className={`p-4 rounded-xl flex-row items-center justify-center ${
                markerCoords ? "bg-blue-500" : "bg-gray-300"
              }`}
            >
              <Ionicons name="checkmark-circle" size={24} color="white" />
              <Text className="text-white font-bold text-lg ml-2">
                Confirm Location
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

export default AddressPickerWithMap;

import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  Coordinates,
  geocodeAddress,
  getCurrentLocation,
} from "../utils/locationUtils";

interface LocationFilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApplyFilter: (filterOptions: FilterOptions) => Promise<void>;
  userAddress?: string; // Just the address text string
}

export interface FilterOptions {
  useCurrentLocation: boolean;
  location: Coordinates;
  radiusKm: number;
  locationName: string;
}

const LocationFilterModal: React.FC<LocationFilterModalProps> = ({
  visible,
  onClose,
  onApplyFilter,
  userAddress,
}) => {
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);
  const [radiusKm, setRadiusKm] = useState(10);
  const [loadingLocation, setLoadingLocation] = useState(false);

  const handleApply = async () => {
    setLoadingLocation(true);

    try {
      let location: Coordinates;
      let locationName: string;

      if (useCurrentLocation) {
        // Get GPS coordinates
        const currentLoc = await getCurrentLocation();
        if (!currentLoc) {
          Alert.alert(
            "Location Error",
            "Could not get your current location. Please enable location services."
          );
          setLoadingLocation(false);
          return;
        }
        location = currentLoc;
        locationName = "Current Location";
      } else {
        // Convert saved address text to coordinates
        if (!userAddress) {
          Alert.alert(
            "Address Error",
            "No saved address found. Please add your address in settings."
          );
          setLoadingLocation(false);
          return;
        }

        const coords = await geocodeAddress(userAddress);
        if (!coords) {
          Alert.alert(
            "Geocoding Error",
            "Could not find coordinates for your address. Please check your address."
          );
          setLoadingLocation(false);
          return;
        }

        location = coords;
        locationName = userAddress;
      }

      onApplyFilter({
        useCurrentLocation,
        location,
        radiusKm,
        locationName,
      });

      onClose();
    } catch (error) {
      Alert.alert("Error", "Failed to apply location filter");
    } finally {
      setLoadingLocation(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/50">
        <View className="bg-white rounded-t-3xl p-6 max-h-[80%]">
          {/* Header */}
          <View className="flex-row items-center justify-between mb-6">
            <Text className="text-2xl font-bold text-gray-800">
              Location Filter
            </Text>
            <TouchableOpacity
              onPress={onClose}
              className="w-8 h-8 items-center justify-center"
            >
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {/* Use Current Location Toggle */}
          <View className="mb-6">
            <View className="flex-row items-center justify-between bg-gray-50 p-4 rounded-xl">
              <View className="flex-row items-center flex-1">
                <Ionicons name="navigate" size={24} color="#3b82f6" />
                <View className="ml-3 flex-1">
                  <Text className="text-base font-semibold text-gray-800">
                    Use Current Location
                  </Text>
                  <Text className="text-sm text-gray-600">
                    Find providers near you right now
                  </Text>
                </View>
              </View>
              <Switch
                value={useCurrentLocation}
                onValueChange={setUseCurrentLocation}
                trackColor={{ false: "#d1d5db", true: "#93c5fd" }}
                thumbColor={useCurrentLocation ? "#3b82f6" : "#f3f4f6"}
              />
            </View>
          </View>

          {/* Saved Address Info */}
          {!useCurrentLocation && (
            <View className="mb-6 bg-blue-50 p-4 rounded-xl border border-blue-200">
              <View className="flex-row items-start">
                <Ionicons name="home" size={20} color="#3b82f6" />
                <View className="ml-3 flex-1">
                  <Text className="text-sm font-semibold text-blue-900 mb-1">
                    Using Saved Address
                  </Text>
                  <Text className="text-sm text-blue-700">
                    {userAddress || "No address saved"}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Radius Slider */}
          <View className="mb-6">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-base font-semibold text-gray-800">
                Search Radius
              </Text>
              <View className="bg-blue-100 px-3 py-1 rounded-full">
                <Text className="text-blue-700 font-bold">{radiusKm} km</Text>
              </View>
            </View>

            <Slider
              style={{ width: "100%", height: 40 }}
              minimumValue={1}
              maximumValue={50}
              step={1}
              value={radiusKm}
              onValueChange={setRadiusKm}
              minimumTrackTintColor="#3b82f6"
              maximumTrackTintColor="#d1d5db"
              thumbTintColor="#3b82f6"
            />

            <View className="flex-row justify-between">
              <Text className="text-xs text-gray-500">1 km</Text>
              <Text className="text-xs text-gray-500">50 km</Text>
            </View>
          </View>

          {/* Info Box */}
          <View className="bg-amber-50 p-4 rounded-xl border border-amber-200 mb-6">
            <View className="flex-row items-start">
              <Ionicons name="information-circle" size={20} color="#f59e0b" />
              <Text className="text-sm text-amber-800 ml-2 flex-1">
                We'll show service providers within {radiusKm}km of your{" "}
                {useCurrentLocation ? "current location" : "saved address"}
              </Text>
            </View>
          </View>

          {/* Apply Button */}
          <TouchableOpacity
            onPress={handleApply}
            disabled={loadingLocation}
            className={`bg-blue-600 p-4 rounded-xl flex-row items-center justify-center ${
              loadingLocation ? "opacity-50" : ""
            }`}
          >
            {loadingLocation ? (
              <>
                <ActivityIndicator color="white" size="small" />
                <Text className="text-white font-bold text-base ml-2">
                  Getting Location...
                </Text>
              </>
            ) : (
              <>
                <Ionicons name="funnel" size={20} color="white" />
                <Text className="text-white font-bold text-base ml-2">
                  Apply Filter
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default LocationFilterModal;

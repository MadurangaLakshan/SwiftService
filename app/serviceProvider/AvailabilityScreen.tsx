import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { auth } from "../config/firebase";
import {
  getProviderAvailability,
  updateProviderAvailability,
} from "../services/providerService";

const TIME_SLOTS = [
  "Morning (8:00 AM – 12:00 PM)",
  "Afternoon (12:00 PM – 4:00 PM)",
  "Evening (4:00 PM – 8:00 PM)",
];

interface DayAvailability {
  date: string;
  dayName: string;
  isAvailable: boolean;
  slots: string[];
}

const getLocalDateString = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Generate next 7 days from today
const generateNextSevenDays = (): DayAvailability[] => {
  const days = [];
  const dayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  for (let i = 0; i < 7; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);

    const dateString = getLocalDateString(date);
    const dayName = dayNames[date.getDay()];

    days.push({ date: dateString, dayName, isAvailable: false, slots: [] });
  }

  return days;
};

const formatDisplayDate = (dateString: string): string => {
  const date = new Date(dateString + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

const AvailabilityScreen = () => {
  const [availability, setAvailability] = useState<DayAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);

  useEffect(() => {
    fetchAvailability();
  }, []);

  const fetchAvailability = async () => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      const nextSevenDays = generateNextSevenDays();
      const response = await getProviderAvailability(userId);

      if (response.success && response.data) {
        const actualData = Array.isArray(response.data)
          ? response.data
          : response.data.data;

        if (actualData && actualData.length > 0) {
          const merged = nextSevenDays.map((day) => {
            const saved = actualData.find(
              (d: DayAvailability) => d.date === day.date,
            );
            return saved || day;
          });
          setAvailability(merged);
        } else {
          setAvailability(nextSevenDays);
        }
      }
    } catch (error) {
      console.log("Error fetching availability:", error);
      setAvailability(generateNextSevenDays());
    } finally {
      setLoading(false);
    }
  };

  const toggleDay = (date: string) => {
    setAvailability((prev) =>
      prev.map((d) =>
        d.date === date
          ? {
              ...d,
              isAvailable: !d.isAvailable,
              slots: !d.isAvailable ? [] : d.slots,
            }
          : d,
      ),
    );
    setExpandedDay((prev) => (prev === date ? null : date));
  };

  const toggleSlot = (date: string, slot: string) => {
    setAvailability((prev) =>
      prev.map((d) =>
        d.date === date
          ? {
              ...d,
              slots: d.slots.includes(slot)
                ? d.slots.filter((s) => s !== slot)
                : [...d.slots, slot].sort(),
            }
          : d,
      ),
    );
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      const response = await updateProviderAvailability(userId, availability);

      if (response.success) {
        Alert.alert("Success", "Availability updated successfully!");
        router.back();
      } else {
        Alert.alert("Error", response.error || "Failed to update availability");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to update availability");
    } finally {
      setSaving(false);
    }
  };

  const isToday = (dateString: string): boolean => {
    return dateString === getLocalDateString();
  };

  if (loading) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-6 pt-12 pb-4 border-b border-gray-200">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="black" />
          </TouchableOpacity>
          <Text className="flex-1 text-xl font-bold text-gray-800 ml-4">
            Manage Availability
          </Text>
        </View>
        <Text className="text-sm text-gray-500 mt-1 ml-10">
          Set your available dates and time slots for the next 7 days
        </Text>
      </View>

      <ScrollView className="flex-1 px-6 pt-4">
        {availability.map((dayData) => (
          <View
            key={dayData.date}
            className="bg-white rounded-2xl border border-gray-200 mb-3 overflow-hidden"
          >
            {/* Day Row */}
            <TouchableOpacity
              onPress={() => toggleDay(dayData.date)}
              className="flex-row items-center px-4 py-4"
            >
              {/* Date Badge */}
              <View
                className={`w-12 h-12 rounded-xl items-center justify-center ${
                  isToday(dayData.date)
                    ? "bg-blue-500"
                    : dayData.isAvailable
                      ? "bg-blue-100"
                      : "bg-gray-100"
                }`}
              >
                <Text
                  className={`text-xs font-medium ${
                    isToday(dayData.date)
                      ? "text-white"
                      : dayData.isAvailable
                        ? "text-blue-600"
                        : "text-gray-400"
                  }`}
                >
                  {formatDisplayDate(dayData.date).split(" ")[0]}
                </Text>
                <Text
                  className={`text-base font-bold ${
                    isToday(dayData.date)
                      ? "text-white"
                      : dayData.isAvailable
                        ? "text-blue-700"
                        : "text-gray-500"
                  }`}
                >
                  {formatDisplayDate(dayData.date).split(" ")[1]}
                </Text>
              </View>

              {/* Day Name */}
              <View className="flex-1 ml-4">
                <View className="flex-row items-center">
                  <Text
                    className={`text-base font-semibold ${
                      dayData.isAvailable ? "text-gray-800" : "text-gray-400"
                    }`}
                  >
                    {dayData.dayName}
                  </Text>
                  {isToday(dayData.date) && (
                    <View className="ml-2 bg-blue-100 px-2 py-0.5 rounded-full">
                      <Text className="text-xs text-blue-600 font-medium">
                        Today
                      </Text>
                    </View>
                  )}
                </View>
                {dayData.isAvailable && dayData.slots.length > 0 && (
                  <Text className="text-xs text-blue-500 mt-0.5">
                    {dayData.slots.length} slot
                    {dayData.slots.length !== 1 ? "s" : ""} selected
                  </Text>
                )}
                {dayData.isAvailable && dayData.slots.length === 0 && (
                  <Text className="text-xs text-orange-400 mt-0.5">
                    No slots selected yet
                  </Text>
                )}
              </View>

              {/* Toggle Switch */}
              <View
                className={`w-12 h-6 rounded-full ${
                  dayData.isAvailable ? "bg-blue-500" : "bg-gray-300"
                } justify-center px-0.5`}
              >
                <View
                  className={`w-5 h-5 rounded-full bg-white shadow ${
                    dayData.isAvailable ? "self-end" : "self-start"
                  }`}
                />
              </View>
            </TouchableOpacity>

            {/* Time Slots */}
            {dayData.isAvailable && (
              <View className="px-4 pb-4 border-t border-gray-100">
                <Text className="text-xs text-gray-500 mt-3 mb-2 font-medium">
                  SELECT AVAILABLE TIME SLOTS
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {TIME_SLOTS.map((slot) => {
                    const isSelected = dayData.slots.includes(slot);
                    return (
                      <TouchableOpacity
                        key={slot}
                        onPress={() => toggleSlot(dayData.date, slot)}
                        className={`px-3 py-2 rounded-xl border ${
                          isSelected
                            ? "bg-blue-500 border-blue-500"
                            : "bg-gray-50 border-gray-200"
                        }`}
                      >
                        <Text
                          className={`text-sm font-medium ${
                            isSelected ? "text-white" : "text-gray-600"
                          }`}
                        >
                          {slot}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}
          </View>
        ))}

        <View className="h-24" />
      </ScrollView>

      {/* Save Button */}
      <View className="bg-white px-6 py-4 border-t border-gray-200">
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          className="bg-blue-600 py-4 rounded-xl items-center justify-center"
        >
          {saving ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-bold text-base">
              Save Availability
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default AvailabilityScreen;

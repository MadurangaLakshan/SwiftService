import React from "react";
import { Text, View } from "react-native";
import { useProvider } from "../context/ProviderContext";

const HomeScreen = () => {
  const { providerData } = useProvider();
  return (
    <View className="flex-1 bg-white justify-center items-center">
      <Text>Hey </Text>
      <Text>{providerData?.name}</Text>
    </View>
  );
};

export default HomeScreen;

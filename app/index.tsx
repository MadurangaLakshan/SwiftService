import { useRouter } from "expo-router";
import { Image, Text, TouchableOpacity, View } from "react-native";

export default function Index() {
  const router = useRouter();

  return (
    <View className="flex-1 justify-center items-center bg-white p-6">
      <View className="flex-row items-center gap-2">
        <Image
          source={require("../assets/images/SwiftService.png")}
          className="w-32 h-32 mb-6"
        />
        <Text className="text-4xl font-bold pb-4">
          <Text className="text-blue-700">Swift</Text>
          <Text className="text-gray-700">Service</Text>
        </Text>
      </View>

      <Text className="text-lg text-gray-600 mb-12 text-center">
        Get started by logging in or creating a new account.
      </Text>

      <Image
        source={require("../assets/images/Homepage.png")}
        className="w-3/4 h-64 mb-12"
      />

      <TouchableOpacity
        onPress={() => router.push("/login")}
        className="bg-blue-500 w-3/4 p-4 rounded-full mb-4"
      >
        <Text className="text-white text-center font-bold text-lg ">Login</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.push("/registerOptions")}
        className="bg-blue-500 w-3/4  p-4 rounded-full"
      >
        <Text className="text-white text-center font-bold text-lg">
          Register
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.push("/customerHomeScreen")}
        className="bg-blue-500 w-3/4  p-4 rounded-full"
      >
        <Text className="text-white text-center font-bold text-lg">
          customerHomepage
        </Text>
      </TouchableOpacity>
    </View>
  );
}

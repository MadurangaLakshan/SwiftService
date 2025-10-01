import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import colors from "tailwindcss/colors";

export default function RegisterScreen() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = () => {
    // TODO: connect with Firebase or backend
    console.log("Registering:", { name, email, password });
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
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
          <Text className="text-3xl font-bold mb-6">Register</Text>
          <Image
            source={require("../assets/images/Register.png")}
            className="w-64 h-64 mb-12"
          />
          <TextInput
            placeholder="Full Name"
            placeholderTextColor={colors.gray[500]}
            value={name}
            onChangeText={setName}
            className="w-full border p-3 rounded mb-4"
          />

          <TextInput
            placeholder="Email"
            placeholderTextColor={colors.gray[500]}
            value={email}
            onChangeText={setEmail}
            className="w-full border p-3 rounded mb-4"
          />

          <TextInput
            placeholder="Password"
            placeholderTextColor={colors.gray[500]}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            className="w-full border p-3 rounded mb-4"
          />

          <TouchableOpacity
            onPress={handleRegister}
            className="bg-blue-500 w-full p-3 rounded"
          >
            <Text className="text-white text-center font-bold">Register</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push("/login")}>
            <Text className="text-blue-500 mt-4">
              Already have an account? Login
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

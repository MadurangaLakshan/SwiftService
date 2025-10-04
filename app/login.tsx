import { Ionicons } from "@expo/vector-icons";
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

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const validateEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const handleLogin = () => {
    if (!validateEmail(email)) {
      setError("Please enter a valid email");
      return;
    }
    if (!password) {
      setError("Password cannot be empty");
      return;
    }

    setError("");
    setEmailError("");
    console.log("Logging in:", email, password);
    // TODO: connect with Firebase or backend
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
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

          <Text className="text-3xl font-bold mb-6">Login</Text>

          <Image
            source={require("../assets/images/Login.png")}
            className="w-64 h-64 mb-12"
          />

          <TextInput
            placeholder="Email"
            placeholderTextColor={colors.gray[500]}
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              setEmailError("");
            }}
            onBlur={() => {
              if (email && !validateEmail(email)) {
                setEmailError("Please enter a valid email");
              }
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            className={`w-full border p-3 rounded mb-1 px-5 ${
              emailError ? "border-red-500" : "border-gray-300"
            }`}
          />

          {emailError ? (
            <Text className="text-red-500 text-sm mb-4 self-start">
              {emailError}
            </Text>
          ) : (
            <View className="mb-4" />
          )}

          <View
            className={`w-full flex-row items-center border rounded mb-4 px-2 ${
              error ? "border-red-500" : "border-gray-300"
            }`}
          >
            <TextInput
              placeholder="Password"
              placeholderTextColor={colors.gray[500]}
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setError("");
              }}
              className="flex-1 p-3"
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons
                name={showPassword ? "eye-off" : "eye"}
                size={24}
                color={colors.gray[500]}
              />
            </TouchableOpacity>
          </View>

          {error ? (
            <Text className="text-red-500 text-base mb-4 text-center">
              {error}
            </Text>
          ) : null}

          <TouchableOpacity
            onPress={handleLogin}
            className="bg-blue-500 w-full p-3 rounded"
          >
            <Text className="text-white text-center font-bold">Login</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push("/registerOptions")}>
            <Text className="text-gray-600 mt-4">
              Don't have an account?{" "}
              <Text className="text-blue-500 font-semibold">Log In</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

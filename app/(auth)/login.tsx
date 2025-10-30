import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useState } from "react";
import {
  ActivityIndicator,
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
import { auth } from "../config/firebase";
import { getUserType } from "../services/apiService";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const validateEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const handleLogin = async () => {
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
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      const userId = userCredential.user.uid;
      console.log("User logged in:", userId);

      const userTypeResult = await getUserType(userId);

      if (!userTypeResult.success) {
        setError("Failed to fetch user information");
        return;
      }

      if (userTypeResult.userType === "provider") {
        router.replace("/serviceProvider/HomeScreen");
      } else if (userTypeResult.userType === "customer") {
        router.replace("/customer/HomeScreen");
      } else {
        setError("Unknown user type");
      }
    } catch (error: any) {
      console.error("Login error:", error.code, error.message);

      // Handle specific Firebase errors
      switch (error.code) {
        case "auth/invalid-email":
          setError("Invalid email address");
          break;
        case "auth/user-disabled":
          setError("This account has been disabled");
          break;
        case "auth/user-not-found":
          setError("No account found with this email");
          break;
        case "auth/wrong-password":
          setError("Incorrect password");
          break;
        case "auth/invalid-credential":
          setError("Invalid email or password");
          break;
        case "auth/too-many-requests":
          setError("Too many failed attempts. Please try again later");
          break;
        default:
          setError("Login failed. Please try again");
      }
    } finally {
      setLoading(false);
    }
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
              source={require("../../assets/images/SwiftService.png")}
              className="w-32 h-32 mb-6"
            />
            <Text className="text-4xl font-bold pb-4">
              <Text className="text-blue-700">Swift</Text>
              <Text className="text-gray-700">Service</Text>
            </Text>
          </View>

          <Text className="text-3xl font-bold mb-6">Login</Text>

          <Image
            source={require("../../assets/images/Login.png")}
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
            disabled={loading}
            className="bg-blue-500 w-full p-3 rounded"
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white text-center font-bold">Login</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push("/registerOptions")}>
            <Text className="text-gray-600 mt-4">
              Don't have an account?{" "}
              <Text className="text-blue-500 font-semibold">Sign Up</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

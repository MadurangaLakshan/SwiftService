import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import colors from "tailwindcss/colors";
import { useCustomer } from "../context/CustomerContext";
import { registerCustomerProfile } from "../services/apiService";
import { registerWithFirebase } from "../services/authService";
import ProfilePictureUpload from "../utils/ProfilePictureUpload";
import AddressPickerWithMap from "../utils/AddressPickerWithMaps";

interface Coordinates {
  latitude: number;
  longitude: number;
}

export default function RegisterCustomer() {
  const router = useRouter();
  const customerContext = useCustomer() as any;
  const [step, setStep] = useState(1);
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);

  const [profilePictureUrl, setProfilePictureUrl] = useState<string>("");
  const [tempUserId, setTempUserId] = useState<string>("");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [propertyType, setPropertyType] = useState<string>("");

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);

  const propertyTypes = [
    { id: "house", name: "House", icon: "home" },
    { id: "apartment", name: "Apartment", icon: "business" },
    { id: "condo", name: "Condo", icon: "home-outline" },
    { id: "commercial", name: "Commercial", icon: "briefcase" },
  ];

  const validateEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const validatePhone = (phone: string) => {
    const regex = /^[0-9]{8,15}$/;
    return regex.test(phone.replace(/\s/g, ""));
  };

  const validateStep1 = () => {
    const newErrors: { [key: string]: string } = {};

    if (!fullName.trim()) newErrors.fullName = "Full name is required";
    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!validateEmail(email)) {
      newErrors.email = "Please enter a valid email";
    }
    if (!phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!validatePhone(phone)) {
      newErrors.phone = "Please enter a valid phone number";
    }
    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: { [key: string]: string } = {};

    if (!address.trim()) newErrors.address = "Address is required";
    if (!city.trim()) newErrors.city = "City is required";
    if (!postalCode.trim()) newErrors.postalCode = "Postal code is required";
    if (!propertyType) newErrors.propertyType = "Please select a property type";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = () => {
    // Profile picture is optional, always valid
    return true;
  };

  const handleNext = () => {
    let isValid = false;

    switch (step) {
      case 1:
        isValid = validateStep1();
        break;
      case 2:
        isValid = validateStep2();
        break;
      case 3:
        isValid = validateStep3();
        break;
    }

    if (isValid && step < 3) {
      setStep(step + 1);
    } else if (isValid && step === 3) {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    setLoading(true);

    try {
      console.log("🔐 Creating Firebase account...");
      const authResult = await registerWithFirebase(email, password);

      if (!authResult.success) {
        Alert.alert("Registration Failed", authResult.error);
        setLoading(false);
        return;
      }

      const newUserId = authResult.userId ?? "";
      setTempUserId(newUserId);
      console.log("✅ Firebase account created. User ID:", newUserId);

      // Prepare customer data with profile picture
      console.log("💼 Creating customer profile...");

      const finalProfilePictureUrl = profilePictureUrl || "";

      if (finalProfilePictureUrl) {
        console.log(
          "📸 Profile picture included (length):",
          finalProfilePictureUrl.length
        );
      } else {
        console.log("ℹ️ No profile picture selected");
      }

      const customerData = {
  userId: newUserId,
  name: fullName,
  email: email,
  phone: phone,
  location: {
    address,
    city,
    postalCode,
    coordinates: coordinates || undefined, 
  },
  propertyType,
  profilePhoto: finalProfilePictureUrl,
};

      console.log("Sending customer data:", {
        ...customerData,
        profilePhoto: customerData.profilePhoto ? "base64..." : "",
      });

      const result = await registerCustomerProfile(customerData);

      if (result.success) {
        console.log("🎉 Customer registered successfully:", result.data);

        // Set customer data in context
        customerContext.setCustomerData?.(result.data);

        Alert.alert("Success!", "Your account has been created successfully!", [
          {
            text: "OK",
            onPress: () => {
              router.replace("/customer/HomeScreen");
            },
          },
        ]);
      } else {
        console.error("❌ Customer registration failed:", result.error);
        Alert.alert("Error", result.error);
      }
    } catch (error: any) {
      console.error("❌ Registration error:", error);
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderProgressBar = () => (
    <View className="flex-row items-center mb-6 px-4">
      {[1, 2, 3].map((num) => (
        <React.Fragment key={num}>
          <View
            className={`w-8 h-8 rounded-full items-center justify-center ${
              step >= num ? "bg-blue-500" : "bg-gray-300"
            }`}
          >
            <Text
              className={`font-bold ${
                step >= num ? "text-white" : "text-gray-600"
              }`}
            >
              {num}
            </Text>
          </View>
          {num < 3 && (
            <View
              className={`flex-1 h-1 ${
                step > num ? "bg-blue-500" : "bg-gray-300"
              }`}
            />
          )}
        </React.Fragment>
      ))}
    </View>
  );

  const renderStep1 = () => (
    <View className="w-full">
      <Text className="text-2xl font-bold mb-2">Create Your Account</Text>
      <Text className="text-gray-600 mb-6">
        Let's get started with your details
      </Text>

      <TextInput
        placeholder="Full Name"
        placeholderTextColor={colors.gray[500]}
        value={fullName}
        onChangeText={(text) => {
          setFullName(text);
          setErrors({ ...errors, fullName: "" });
        }}
        className={`w-full border p-3 rounded mb-1 px-4 ${
          errors.fullName ? "border-red-500" : "border-gray-300"
        }`}
      />
      {errors.fullName ? (
        <Text className="text-red-500 text-sm mb-3 self-start">
          {errors.fullName}
        </Text>
      ) : (
        <View className="mb-3" />
      )}

      <TextInput
        placeholder="Email"
        placeholderTextColor={colors.gray[500]}
        value={email}
        onChangeText={(text) => {
          setEmail(text);
          setErrors({ ...errors, email: "" });
        }}
        keyboardType="email-address"
        autoCapitalize="none"
        className={`w-full border p-3 rounded mb-1 px-4 ${
          errors.email ? "border-red-500" : "border-gray-300"
        }`}
      />
      {errors.email ? (
        <Text className="text-red-500 text-sm mb-3 self-start">
          {errors.email}
        </Text>
      ) : (
        <View className="mb-3" />
      )}

      <TextInput
        placeholder="Phone Number"
        placeholderTextColor={colors.gray[500]}
        value={phone}
        onChangeText={(text) => {
          setPhone(text);
          setErrors({ ...errors, phone: "" });
        }}
        keyboardType="phone-pad"
        className={`w-full border p-3 rounded mb-1 px-4 ${
          errors.phone ? "border-red-500" : "border-gray-300"
        }`}
      />
      {errors.phone ? (
        <Text className="text-red-500 text-sm mb-3 self-start">
          {errors.phone}
        </Text>
      ) : (
        <View className="mb-3" />
      )}

      <View
        className={`w-full flex-row items-center border rounded mb-1 px-1 ${
          errors.password ? "border-red-500" : "border-gray-300"
        }`}
      >
        <TextInput
          placeholder="Password"
          placeholderTextColor={colors.gray[500]}
          secureTextEntry={!showPassword}
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            setErrors({ ...errors, password: "" });
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
      {errors.password ? (
        <Text className="text-red-500 text-sm mb-3 self-start">
          {errors.password}
        </Text>
      ) : (
        <View className="mb-3" />
      )}

      <View
        className={`w-full flex-row items-center border rounded mb-1 px-1 ${
          errors.confirmPassword ? "border-red-500" : "border-gray-300"
        }`}
      >
        <TextInput
          placeholder="Confirm Password"
          placeholderTextColor={colors.gray[500]}
          secureTextEntry={!showConfirmPassword}
          value={confirmPassword}
          onChangeText={(text) => {
            setConfirmPassword(text);
            setErrors({ ...errors, confirmPassword: "" });
          }}
          className="flex-1 p-3"
        />
        <TouchableOpacity
          onPress={() => setShowConfirmPassword(!showConfirmPassword)}
        >
          <Ionicons
            name={showConfirmPassword ? "eye-off" : "eye"}
            size={24}
            color={colors.gray[500]}
          />
        </TouchableOpacity>
      </View>
      {errors.confirmPassword ? (
        <Text className="text-red-500 text-sm mb-3 self-start">
          {errors.confirmPassword}
        </Text>
      ) : (
        <View className="mb-3" />
      )}
    </View>
  );

 const renderStep2 = () => (
  <View className="w-full">
    <Text className="text-2xl font-bold mb-2">Your Location</Text>
    <Text className="text-gray-600 mb-6">
      Help us connect you with nearby service providers
    </Text>

    <AddressPickerWithMap
      address={address}
      city={city}
      postalCode={postalCode}
      onAddressChange={(text) => {
        setAddress(text);
        setErrors({ ...errors, address: "" });
      }}
      onCityChange={(text) => {
        setCity(text);
        setErrors({ ...errors, city: "" });
      }}
      onPostalCodeChange={(text) => {
        setPostalCode(text);
        setErrors({ ...errors, postalCode: "" });
      }}
      onCoordinatesConfirm={setCoordinates}
      errors={{
        address: errors.address,
        city: errors.city,
        postalCode: errors.postalCode,
      }}
    />

      <Text className="text-gray-700 font-semibold mb-3 mt-3">
        Property Type
      </Text>
      {errors.propertyType && (
        <Text className="text-red-500 text-sm mb-2">{errors.propertyType}</Text>
      )}

      <View className="flex-row flex-wrap gap-3 mb-4">
        {propertyTypes.map((type) => (
          <TouchableOpacity
            key={type.id}
            onPress={() => {
              setPropertyType(type.id);
              setErrors({ ...errors, propertyType: "" });
            }}
            className={`flex-1 min-w-[45%] flex-row items-center justify-center px-4 py-4 rounded-lg border-2 ${
              propertyType === type.id
                ? "bg-blue-100 border-blue-500"
                : "bg-white border-gray-300"
            }`}
          >
            <Ionicons
              name={type.icon as any}
              size={24}
              color={
                propertyType === type.id ? colors.blue[600] : colors.gray[600]
              }
            />
            <Text
              className={`ml-2 font-semibold ${
                propertyType === type.id ? "text-blue-700" : "text-gray-700"
              }`}
            >
              {type.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View className="bg-blue-50 p-4 rounded-lg border border-blue-200 mt-2">
        <View className="flex-row items-start">
          <Ionicons
            name="information-circle"
            size={20}
            color={colors.blue[600]}
          />
          <Text className="flex-1 ml-2 text-sm text-blue-800">
            This information helps us match you with the best service providers
            in your area. You can update it anytime in your profile settings.
          </Text>
        </View>
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View className="w-full">
      <Text className="text-2xl font-bold mb-2">Profile Picture</Text>
      <Text className="text-gray-600 mb-6">Add a profile photo (optional)</Text>

      <ProfilePictureUpload
        currentImageUrl={profilePictureUrl}
        userId={tempUserId}
        userType="customer"
        onUploadComplete={(url) => setProfilePictureUrl(url)}
        isRegistration={true}
      />

      <View className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <View className="flex-row items-start">
          <Ionicons
            name="information-circle"
            size={20}
            color={colors.blue[600]}
          />
          <Text className="flex-1 ml-2 text-sm text-blue-800">
            Adding a profile photo helps service providers recognize you. You
            can skip this and add it later in your profile settings.
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View className="flex-1">
          <ScrollView
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
          >
            <View className="p-6 pt-12">
              <View className="flex-row items-center justify-center gap-2 mb-6 p-12">
                <Image
                  source={require("../../assets/images/SwiftService.png")}
                  className="w-20 h-20"
                />
                <Text className="text-3xl font-bold">
                  <Text className="text-blue-700">Swift</Text>
                  <Text className="text-gray-700">Service</Text>
                </Text>
              </View>

              {renderProgressBar()}

              {step === 1 && renderStep1()}
              {step === 2 && renderStep2()}
              {step === 3 && renderStep3()}

              <View className="flex-row gap-3 mt-6">
                {step > 1 && (
                  <TouchableOpacity
                    onPress={() => setStep(step - 1)}
                    className="flex-1 bg-gray-200 p-3 rounded justify-center"
                  >
                    <Text className="text-gray-700 text-center font-bold ">
                      Back
                    </Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={handleNext}
                  disabled={loading}
                  className={`flex-1 p-3 rounded ${
                    loading ? "bg-blue-300" : "bg-blue-500"
                  }`}
                >
                  {loading && step === 3 ? (
                    <View className="flex-row items-center justify-center">
                      <ActivityIndicator size="small" color="white" />
                      <Text className="text-white text-center font-bold ml-2">
                        Creating your account...
                      </Text>
                    </View>
                  ) : (
                    <Text className="text-white text-center font-bold">
                      {step === 3 ? "Complete Registration" : "Next"}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                onPress={() => router.push("/login")}
                className="mt-6"
              >
                <Text className="text-center text-gray-600">
                  Already have an account?{" "}
                  <Text className="text-blue-500 font-semibold">Log In</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

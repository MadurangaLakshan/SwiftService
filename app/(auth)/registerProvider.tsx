import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { updateProfile } from "firebase/auth";
import React, { useState } from "react";
import {
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
import { auth } from "../config/firebase";
import { registerProviderProfile } from "../services/apiService";
import { registerWithFirebase } from "../services/authService";
import ProfilePictureUpload from "../utils/ProfilePictureUpload";

type ServiceType = {
  id: string;
  name: string;
  icon: string;
};

const services: ServiceType[] = [
  { id: "plumber", name: "Plumber", icon: "water" },
  { id: "electrician", name: "Electrician", icon: "flash" },
  { id: "carpenter", name: "Carpenter", icon: "hammer" },
  { id: "painter", name: "Painter", icon: "color-palette" },
  { id: "hvac", name: "HVAC", icon: "thermometer" },
  { id: "locksmith", name: "Locksmith", icon: "key" },
  { id: "cleaner", name: "Cleaner", icon: "sparkles" },
  { id: "gardener", name: "Gardener", icon: "leaf" },
];

export default function RegisterProvider() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [customService, setCustomService] = useState("");
  const [customServices, setCustomServices] = useState<string[]>([]);

  const [yearsExperience, setYearsExperience] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [bio, setBio] = useState("");

  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [serviceRadius, setServiceRadius] = useState("10");

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const [profilePictureUrl, setProfilePictureUrl] = useState<string>("");
  const [tempUserId, setTempUserId] = useState<string>("");

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
    if (selectedServices.length === 0 && customServices.length === 0) {
      setErrors({ services: "Please select at least one service" });
      return false;
    }
    setErrors({});
    return true;
  };

  const validateStep3 = () => {
    const newErrors: { [key: string]: string } = {};

    if (!yearsExperience) {
      newErrors.yearsExperience = "Years of experience is required";
    } else if (parseInt(yearsExperience) < 0) {
      newErrors.yearsExperience = "Please enter a valid number";
    }
    if (!hourlyRate) {
      newErrors.hourlyRate = "Hourly rate is required";
    } else if (parseFloat(hourlyRate) <= 0) {
      newErrors.hourlyRate = "Please enter a valid rate";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep4 = () => {
    const newErrors: { [key: string]: string } = {};

    if (!address.trim()) newErrors.address = "Address is required";
    if (!city.trim()) newErrors.city = "City is required";
    if (!postalCode.trim()) newErrors.postalCode = "Postal code is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep5 = () => {
    return true;
  };

  const handleNext = () => {
    let isValid = false;

    switch (step) {
      case 1:
        isValid = validateStep1();
        console.log("validating step 1 ");
        break;
      case 2:
        isValid = validateStep2();
        break;
      case 3:
        isValid = validateStep3();
        break;
      case 4:
        isValid = validateStep4();
        break;
      case 5:
        isValid = validateStep5();
        break;
    }

    if (isValid && step < 5) {
      setStep(step + 1);
    } else if (isValid && step === 5) {
      handleSubmit();
      console.log("submitting");
    }
  };

  const handleSubmit = async () => {
    setLoading(true);

    try {
      const authResult = await registerWithFirebase(email, password);

      if (!authResult.success) {
        Alert.alert("Registration Failed", authResult.error);
        return;
      }

      setTempUserId(authResult.userId ?? "");

      if (auth.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName: fullName,
        });
      }

      const providerData = {
        userId: authResult.userId,
        name: fullName,
        email: email,
        phone: phone,
        services: selectedServices,
        customServices,
        yearsExperience: parseInt(yearsExperience) || 0,
        businessName,
        licenseNumber,
        hourlyRate: parseFloat(hourlyRate),
        bio,
        location: {
          address,
          city,
          postalCode,
          serviceRadius: parseInt(serviceRadius),
        },
        serviceRadius: parseInt(serviceRadius),
        profilePhoto: profilePictureUrl,
      };

      const result = await registerProviderProfile(providerData);

      if (result.success) {
        Alert.alert("Success!", "Your provider account has been created!", [
          {
            text: "OK",
            onPress: () => router.replace("/serviceProvider/HomeScreen"),
          },
        ]);
        console.log("provider registered");
      } else {
        Alert.alert("Error", result.error);
      }
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleService = (serviceId: string) => {
    if (selectedServices.includes(serviceId)) {
      setSelectedServices(selectedServices.filter((id) => id !== serviceId));
    } else {
      setSelectedServices([...selectedServices, serviceId]);
    }
  };

  const addCustomService = () => {
    if (customService.trim()) {
      setCustomServices([...customServices, customService.trim()]);
      setCustomService("");
      setErrors({ ...errors, services: "" });
    }
  };

  const removeCustomService = (index: number) => {
    setCustomServices(customServices.filter((_, i) => i !== index));
  };

  const renderProgressBar = () => (
    <View className="flex-row items-center mb-6 px-4">
      {[1, 2, 3, 4, 5].map((num) => (
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
          {num < 5 && (
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
      <Text className="text-2xl font-bold mb-2">Basic Information</Text>
      <Text className="text-gray-600 mb-6">Let's start with your details</Text>

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
      <Text className="text-2xl font-bold mb-2">Select Your Services</Text>
      <Text className="text-gray-600 mb-6">
        Choose all services you provide
      </Text>

      {errors.services && (
        <Text className="text-red-500 text-sm mb-3">{errors.services}</Text>
      )}

      <View className="flex-row flex-wrap gap-3 mb-4">
        {services.map((service) => (
          <TouchableOpacity
            key={service.id}
            onPress={() => toggleService(service.id)}
            className={`flex-row items-center px-4 py-3 rounded-lg border-2 ${
              selectedServices.includes(service.id)
                ? "bg-blue-100 border-blue-500"
                : "bg-white border-gray-300"
            }`}
          >
            <Ionicons
              name={service.icon as any}
              size={20}
              color={
                selectedServices.includes(service.id)
                  ? colors.blue[600]
                  : colors.gray[600]
              }
            />
            <Text
              className={`ml-2 font-semibold ${
                selectedServices.includes(service.id)
                  ? "text-blue-700"
                  : "text-gray-700"
              }`}
            >
              {service.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Custom services display */}
      {customServices.length > 0 && (
        <View className="flex-row flex-wrap gap-3 mb-4">
          {customServices.map((service, index) => (
            <View
              key={`custom-${index}`}
              className="flex-row items-center px-4 py-3 rounded-lg border-2 bg-green-100 border-green-500"
            >
              <Ionicons name="add-circle" size={20} color={colors.green[600]} />
              <Text className="ml-2 font-semibold text-green-700">
                {service}
              </Text>
              <TouchableOpacity
                onPress={() => removeCustomService(index)}
                className="ml-2"
              >
                <Ionicons
                  name="close-circle"
                  size={20}
                  color={colors.green[600]}
                />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* Custom service input */}
      <View className="border-t border-gray-200 pt-4 mt-2">
        <Text className="text-gray-700 font-semibold mb-2">
          Can't find your service?
        </Text>
        <View className="flex-row gap-2">
          <TextInput
            placeholder="Type custom service..."
            placeholderTextColor={colors.gray[500]}
            value={customService}
            onChangeText={setCustomService}
            className="flex-1 border border-gray-300 p-3 rounded"
          />
          <TouchableOpacity
            onPress={addCustomService}
            className="bg-green-500 px-4 rounded justify-center items-center"
          >
            <Ionicons name="add" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View className="w-full">
      <Text className="text-2xl font-bold mb-2">Professional Details</Text>
      <Text className="text-gray-600 mb-6">Tell us about your experience</Text>

      <TextInput
        placeholder="Years of Experience"
        placeholderTextColor={colors.gray[500]}
        value={yearsExperience}
        onChangeText={(text) => {
          setYearsExperience(text);
          setErrors({ ...errors, yearsExperience: "" });
        }}
        keyboardType="numeric"
        className={`w-full border p-3 rounded mb-1 ${
          errors.yearsExperience ? "border-red-500" : "border-gray-300"
        }`}
      />
      {errors.yearsExperience ? (
        <Text className="text-red-500 text-sm mb-3 self-start">
          {errors.yearsExperience}
        </Text>
      ) : (
        <View className="mb-3" />
      )}

      <TextInput
        placeholder="Business Name (Optional)"
        placeholderTextColor={colors.gray[500]}
        value={businessName}
        onChangeText={setBusinessName}
        className="w-full border border-gray-300 p-3 rounded mb-3"
      />

      <TextInput
        placeholder="License Number (Optional)"
        placeholderTextColor={colors.gray[500]}
        value={licenseNumber}
        onChangeText={setLicenseNumber}
        className="w-full border border-gray-300 p-3 rounded mb-3"
      />

      <View className="flex-row items-center w-full border p-3 rounded mb-1 border-gray-300">
        <Text className="text-gray-600 mr-2">$</Text>
        <TextInput
          placeholder="Hourly Rate"
          placeholderTextColor={colors.gray[500]}
          value={hourlyRate}
          onChangeText={(text) => {
            setHourlyRate(text);
            setErrors({ ...errors, hourlyRate: "" });
          }}
          keyboardType="decimal-pad"
          className="flex-1"
        />
        <Text className="text-gray-600 ml-2">/hr</Text>
      </View>
      {errors.hourlyRate ? (
        <Text className="text-red-500 text-sm mb-3 self-start">
          {errors.hourlyRate}
        </Text>
      ) : (
        <View className="mb-3" />
      )}

      <TextInput
        placeholder="Brief bio (Optional)"
        placeholderTextColor={colors.gray[500]}
        value={bio}
        onChangeText={setBio}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
        className="w-full border border-gray-300 p-3 rounded mb-3"
      />
    </View>
  );

  const renderStep4 = () => (
    <View className="w-full">
      <Text className="text-2xl font-bold mb-2">Service Location</Text>
      <Text className="text-gray-600 mb-6">Where do you provide services?</Text>

      <TextInput
        placeholder="Street Address"
        placeholderTextColor={colors.gray[500]}
        value={address}
        onChangeText={(text) => {
          setAddress(text);
          setErrors({ ...errors, address: "" });
        }}
        className={`w-full border p-3 rounded mb-1 ${
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
        onChangeText={(text) => {
          setCity(text);
          setErrors({ ...errors, city: "" });
        }}
        className={`w-full border p-3 rounded mb-1 ${
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
        onChangeText={(text) => {
          setPostalCode(text);
          setErrors({ ...errors, postalCode: "" });
        }}
        className={`w-full border p-3 rounded mb-1 ${
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

      <Text className="text-gray-700 font-semibold mb-2">Service Radius</Text>
      <View className="flex-row items-center mb-6">
        <TextInput
          value={serviceRadius}
          onChangeText={setServiceRadius}
          keyboardType="numeric"
          className="border border-gray-300 p-3 rounded w-20 text-center mr-3"
        />
        <Text className="text-gray-600">kilometers</Text>
      </View>
    </View>
  );

  const renderStep5 = () => (
    <View className="w-full">
      <Text className="text-2xl font-bold mb-2">Profile Picture</Text>
      <Text className="text-gray-600 mb-6">
        Add a professional photo (optional)
      </Text>

      <ProfilePictureUpload
        currentImageUrl={profilePictureUrl}
        userId={tempUserId}
        userType="provider"
        onUploadComplete={(url) => setProfilePictureUrl(url)}
      />

      <View className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <View className="flex-row items-start">
          <Ionicons
            name="information-circle"
            size={20}
            color={colors.blue[600]}
          />
          <Text className="flex-1 ml-2 text-sm text-blue-800">
            A professional photo helps customers trust your services. You can
            skip this and add it later.
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
              {step === 4 && renderStep4()}
              {step === 5 && renderStep5()}

              <View className="flex-row gap-3 mt-6">
                {step > 1 && (
                  <TouchableOpacity
                    onPress={() => setStep(step - 1)}
                    className="flex-1 bg-gray-200 p-3 rounded justify-center"
                  >
                    <Text className="text-gray-700 text-center font-bold">
                      Back
                    </Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={handleNext}
                  className="flex-1 bg-blue-500 p-3 rounded"
                >
                  <Text className="text-white text-center font-bold">
                    {step === 5 ? "Complete Registration" : "Next"}
                  </Text>
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

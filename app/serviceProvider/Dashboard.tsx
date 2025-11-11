// import { Ionicons } from "@expo/vector-icons";
// import { router } from "expo-router";
// import React, { useEffect, useState } from "react";
// import {
//   ActivityIndicator,
//   Image,
//   RefreshControl,
//   ScrollView,
//   Text,
//   TouchableOpacity,
//   View,
// } from "react-native";
// import { useProvider } from "../context/ProviderContext";
// import { getProviderBookings } from "../services/apiService";

// interface Booking {
//   _id: string;
//   customerDetails: {
//     name: string;
//     phone: string;
//     email: string;
//     image?: string;
//   };
//   category: string;
//   status: string;
//   scheduledDate: string;
//   timeSlot: string;
//   pricing: {
//     totalAmount: number;
//   };
//   serviceAddress: string;
// }

// interface Stats {
//   totalBookings: number;
//   pendingBookings: number;
//   completedBookings: number;
//   totalEarnings: number;
//   todayBookings: number;
// }

// export default function Dashboard() {
//   const { providerData, loading: providerLoading } = useProvider();
//   const [bookings, setBookings] = useState<Booking[]>([]);
//   const [stats, setStats] = useState<Stats>({
//     totalBookings: 0,
//     pendingBookings: 0,
//     completedBookings: 0,
//     totalEarnings: 0,
//     todayBookings: 0,
//   });
//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);

//   useEffect(() => {
//     if (providerData?.userId) {
//       fetchDashboardData();
//     }
//   }, [providerData]);

//   const fetchDashboardData = async () => {
//     try {
//       setLoading(true);
//       const response = await getProviderBookings(providerData!.userId);

//       if (response.success) {
//         const bookingsData = response.data.data;
//         setBookings(bookingsData);
//         calculateStats(bookingsData);
//       }
//     } catch (err) {
//       console.error("Error fetching dashboard data:", err);
//     } finally {
//       setLoading(false);
//       setRefreshing(false);
//     }
//   };

//   const calculateStats = (bookingsData: Booking[]) => {
//     const today = new Date().toDateString();

//     const stats = {
//       totalBookings: bookingsData.length,
//       pendingBookings: bookingsData.filter((b) => b.status === "pending")
//         .length,
//       completedBookings: bookingsData.filter((b) => b.status === "completed")
//         .length,
//       totalEarnings: bookingsData
//         .filter((b) => b.status === "completed")
//         .reduce((sum, b) => sum + (b.pricing.totalAmount || 0), 0),
//       todayBookings: bookingsData.filter(
//         (b) => new Date(b.scheduledDate).toDateString() === today
//       ).length,
//     };

//     setStats(stats);
//   };

//   const onRefresh = () => {
//     setRefreshing(true);
//     fetchDashboardData();
//   };

//   const formatDate = (dateString: string) => {
//     const date = new Date(dateString);
//     const today = new Date();

//     if (date.toDateString() === today.toDateString()) {
//       return "Today";
//     }

//     return date.toLocaleDateString("en-US", {
//       month: "short",
//       day: "numeric",
//     });
//   };

//   const getUpcomingBookings = () => {
//     const now = new Date();
//     return bookings
//       .filter(
//         (b) =>
//           (b.status === "pending" || b.status === "confirmed") &&
//           new Date(b.scheduledDate) >= now
//       )
//       .sort(
//         (a, b) =>
//           new Date(a.scheduledDate).getTime() -
//           new Date(b.scheduledDate).getTime()
//       )
//       .slice(0, 3);
//   };

//   if (providerLoading || loading) {
//     return (
//       <View className="flex-1 bg-white items-center justify-center">
//         <ActivityIndicator size="large" color="#3b82f6" />
//         <Text className="text-gray-600 mt-4">Loading Dashboard...</Text>
//       </View>
//     );
//   }

//   const upcomingBookings = getUpcomingBookings();

//   return (
//     <View className="flex-1 bg-gray-50">
//       {/* Header */}
//       <View className="bg-white px-6 pt-12 pb-6 border-b border-gray-200">
//         <View className="flex-row items-center justify-between mb-6">
//           <View>
//             <Text className="text-2xl font-bold text-gray-800">Dashboard</Text>
//             <Text className="text-sm text-gray-600 mt-1">
//               Welcome back, {providerData?.name || "Provider"}!
//             </Text>
//           </View>
//           <TouchableOpacity
//             onPress={() => router.push("/serviceProvider/ProfileScreen")}
//           >
//             <Image
//               source={{
//                 uri:
//                   providerData?.profilePhoto ||
//                   `https://i.pravatar.cc/150?u=${providerData?.email}`,
//               }}
//               className="w-12 h-12 rounded-full"
//             />
//           </TouchableOpacity>
//         </View>
//       </View>

//       <ScrollView
//         className="flex-1"
//         showsVerticalScrollIndicator={false}
//         refreshControl={
//           <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
//         }
//       >
//         {/* Stats Grid */}
//         <View className="px-6 py-4">
//           <View className="flex-row flex-wrap gap-3">
//             {/* Total Bookings */}
//             <View className="bg-white rounded-2xl p-4 flex-1 min-w-[45%] border border-gray-200">
//               <View className="w-10 h-10 bg-blue-100 rounded-full items-center justify-center mb-3">
//                 <Ionicons name="calendar" size={20} color="#3b82f6" />
//               </View>
//               <Text className="text-2xl font-bold text-gray-800">
//                 {stats.totalBookings}
//               </Text>
//               <Text className="text-sm text-gray-600 mt-1">Total Bookings</Text>
//             </View>

//             {/* Pending */}
//             <View className="bg-white rounded-2xl p-4 flex-1 min-w-[45%] border border-gray-200">
//               <View className="w-10 h-10 bg-yellow-100 rounded-full items-center justify-center mb-3">
//                 <Ionicons name="time" size={20} color="#f59e0b" />
//               </View>
//               <Text className="text-2xl font-bold text-gray-800">
//                 {stats.pendingBookings}
//               </Text>
//               <Text className="text-sm text-gray-600 mt-1">Pending</Text>
//             </View>

//             {/* Completed */}
//             <View className="bg-white rounded-2xl p-4 flex-1 min-w-[45%] border border-gray-200">
//               <View className="w-10 h-10 bg-green-100 rounded-full items-center justify-center mb-3">
//                 <Ionicons name="checkmark-done" size={20} color="#10b981" />
//               </View>
//               <Text className="text-2xl font-bold text-gray-800">
//                 {stats.completedBookings}
//               </Text>
//               <Text className="text-sm text-gray-600 mt-1">Completed</Text>
//             </View>

//             {/* Total Earnings */}
//             <View className="bg-white rounded-2xl p-4 flex-1 min-w-[45%] border border-gray-200">
//               <View className="w-10 h-10 bg-purple-100 rounded-full items-center justify-center mb-3">
//                 <Ionicons name="wallet" size={20} color="#8b5cf6" />
//               </View>
//               <Text className="text-2xl font-bold text-gray-800">
//                 ${stats.totalEarnings}
//               </Text>
//               <Text className="text-sm text-gray-600 mt-1">Total Earnings</Text>
//             </View>
//           </View>
//         </View>

//         {/* Today's Schedule */}
//         {stats.todayBookings > 0 && (
//           <View className="px-6 py-2">
//             <View className="bg-blue-50 rounded-2xl p-4 border border-blue-200">
//               <View className="flex-row items-center">
//                 <View className="w-10 h-10 bg-blue-600 rounded-full items-center justify-center">
//                   <Ionicons name="today" size={20} color="white" />
//                 </View>
//                 <View className="ml-3 flex-1">
//                   <Text className="text-base font-bold text-blue-900">
//                     {stats.todayBookings} booking
//                     {stats.todayBookings !== 1 ? "s" : ""} today
//                   </Text>
//                   <Text className="text-sm text-blue-700">
//                     Check your schedule
//                   </Text>
//                 </View>
//                 <TouchableOpacity
//                   onPress={() => router.push("/serviceProvider/BookingsScreen")}
//                   className="bg-blue-600 rounded-lg px-4 py-2"
//                 >
//                   <Text className="text-white font-semibold text-sm">View</Text>
//                 </TouchableOpacity>
//               </View>
//             </View>
//           </View>
//         )}

//         {/* Quick Actions */}
//         <View className="px-6 py-4">
//           <Text className="text-lg font-bold text-gray-800 mb-3">
//             Quick Actions
//           </Text>
//           <View className="flex-row gap-3">
//             <TouchableOpacity
//               onPress={() => router.push("/serviceProvider/BookingsScreen")}
//               className="flex-1 bg-white rounded-2xl p-4 border border-gray-200"
//             >
//               <View className="w-12 h-12 bg-blue-100 rounded-full items-center justify-center mb-2">
//                 <Ionicons name="list" size={24} color="#3b82f6" />
//               </View>
//               <Text className="text-sm font-semibold text-gray-800">
//                 View All
//               </Text>
//               <Text className="text-xs text-gray-600 mt-1">Bookings</Text>
//             </TouchableOpacity>

//             <TouchableOpacity
//               onPress={() => router.push("/serviceProvider/ProfileScreen")}
//               className="flex-1 bg-white rounded-2xl p-4 border border-gray-200"
//             >
//               <View className="w-12 h-12 bg-purple-100 rounded-full items-center justify-center mb-2">
//                 <Ionicons name="person" size={24} color="#8b5cf6" />
//               </View>
//               <Text className="text-sm font-semibold text-gray-800">
//                 My Profile
//               </Text>
//               <Text className="text-xs text-gray-600 mt-1">Edit details</Text>
//             </TouchableOpacity>

//             <TouchableOpacity
//               onPress={() => router.push("/serviceProvider/ProfileScreen")}
//               className="flex-1 bg-white rounded-2xl p-4 border border-gray-200"
//             >
//               <View className="w-12 h-12 bg-yellow-100 rounded-full items-center justify-center mb-2">
//                 <Ionicons name="star" size={24} color="#f59e0b" />
//               </View>
//               <Text className="text-sm font-semibold text-gray-800">
//                 Reviews
//               </Text>
//               <Text className="text-xs text-gray-600 mt-1">See feedback</Text>
//             </TouchableOpacity>
//           </View>
//         </View>

//         {/* Upcoming Bookings */}
//         <View className="px-6 py-2">
//           <View className="flex-row items-center justify-between mb-3">
//             <Text className="text-lg font-bold text-gray-800">
//               Upcoming Bookings
//             </Text>
//             {upcomingBookings.length > 0 && (
//               <TouchableOpacity
//                 onPress={() => router.push("/serviceProvider/BookingsScreen")}
//               >
//                 <Text className="text-sm text-blue-600 font-semibold">
//                   See All
//                 </Text>
//               </TouchableOpacity>
//             )}
//           </View>

//           {upcomingBookings.length > 0 ? (
//             upcomingBookings.map((booking) => (
//               <TouchableOpacity
//                 key={booking._id}
//                 className="bg-white rounded-2xl p-4 mb-3 border border-gray-200"
//                 onPress={() =>
//                   router.push({
//                     pathname: "/serviceProvider/BookingDetailsScreen",
//                     params: { bookingId: booking._id },
//                   })
//                 }
//               >
//                 <View className="flex-row">
//                   <Image
//                     source={{
//                       uri:
//                         booking.customerDetails.image ||
//                         `https://i.pravatar.cc/150?u=${booking.customerDetails.email}`,
//                     }}
//                     className="w-14 h-14 rounded-xl"
//                   />

//                   <View className="flex-1 ml-3">
//                     <Text className="text-base font-semibold text-gray-800">
//                       {booking.customerDetails.name}
//                     </Text>
//                     <Text className="text-sm text-gray-600 mt-1">
//                       {booking.category}
//                     </Text>

//                     <View className="flex-row items-center justify-between mt-2">
//                       <View className="flex-row items-center">
//                         <Ionicons
//                           name="calendar-outline"
//                           size={14}
//                           color="#6b7280"
//                         />
//                         <Text className="text-xs text-gray-500 ml-1">
//                           {formatDate(booking.scheduledDate)} •{" "}
//                           {booking.timeSlot}
//                         </Text>
//                       </View>

//                       <View
//                         className={`rounded-full px-3 py-1 ${
//                           booking.status === "pending"
//                             ? "bg-yellow-100"
//                             : "bg-blue-100"
//                         }`}
//                       >
//                         <Text
//                           className={`text-xs font-semibold capitalize ${
//                             booking.status === "pending"
//                               ? "text-yellow-700"
//                               : "text-blue-700"
//                           }`}
//                         >
//                           {booking.status}
//                         </Text>
//                       </View>
//                     </View>
//                   </View>
//                 </View>
//               </TouchableOpacity>
//             ))
//           ) : (
//             <View className="bg-white rounded-2xl p-8 border border-gray-200 items-center">
//               <View className="w-16 h-16 bg-gray-100 rounded-full items-center justify-center mb-3">
//                 <Ionicons name="calendar-outline" size={32} color="#9ca3af" />
//               </View>
//               <Text className="text-gray-600 text-center">
//                 No upcoming bookings
//               </Text>
//               <Text className="text-gray-500 text-sm text-center mt-1">
//                 New bookings will appear here
//               </Text>
//             </View>
//           )}
//         </View>

//         {/* Performance Insights */}
//         {stats.completedBookings > 0 && (
//           <View className="px-6 py-4 mb-6">
//             <Text className="text-lg font-bold text-gray-800 mb-3">
//               Performance
//             </Text>
//             <View className="bg-white rounded-2xl p-4 border border-gray-200">
//               <View className="flex-row items-center justify-between mb-3">
//                 <Text className="text-sm text-gray-600">Completion Rate</Text>
//                 <Text className="text-sm font-bold text-gray-800">
//                   {Math.round(
//                     (stats.completedBookings / stats.totalBookings) * 100
//                   )}
//                   %
//                 </Text>
//               </View>
//               <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
//                 <View
//                   className="h-full bg-green-600 rounded-full"
//                   style={{
//                     width: `${
//                       (stats.completedBookings / stats.totalBookings) * 100
//                     }%`,
//                   }}
//                 />
//               </View>

//               <View className="flex-row items-center justify-between mt-4">
//                 <Text className="text-sm text-gray-600">Average Earnings</Text>
//                 <Text className="text-sm font-bold text-gray-800">
//                   $
//                   {stats.completedBookings > 0
//                     ? Math.round(stats.totalEarnings / stats.completedBookings)
//                     : 0}
//                   /job
//                 </Text>
//               </View>
//             </View>
//           </View>
//         )}
//       </ScrollView>
//     </View>
//   );
// }

import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useProvider } from "../context/ProviderContext";
import { getProviderBookings } from "../services/apiService";

interface Booking {
  _id: string;
  customerDetails: {
    name: string;
    phone: string;
    email: string;
    image?: string;
  };
  category: string;
  status: string;
  scheduledDate: string;
  timeSlot: string;
  pricing: {
    totalAmount: number;
  };
  serviceAddress: string;
}

interface Stats {
  totalBookings: number;
  pendingBookings: number;
  completedBookings: number;
  totalEarnings: number;
  todayBookings: number;
  weeklyBookings: number;
  weeklyEarnings: number;
  weeklyCompleted: number;
}

export default function Dashboard() {
  const { providerData, loading: providerLoading } = useProvider();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalBookings: 0,
    pendingBookings: 0,
    completedBookings: 0,
    totalEarnings: 0,
    todayBookings: 0,
    weeklyBookings: 0,
    weeklyEarnings: 0,
    weeklyCompleted: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (providerData?.userId) {
      fetchDashboardData();
    }
  }, [providerData]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await getProviderBookings(providerData!.userId);

      if (response.success) {
        const bookingsData = response.data.data;
        setBookings(bookingsData);
        calculateStats(bookingsData);
      }
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const calculateStats = (bookingsData: Booking[]) => {
    const today = new Date();
    const todayStr = today.toDateString();

    // Get date 7 days ago
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    // Filter bookings from last 7 days
    const weeklyBookings = bookingsData.filter(
      (b) =>
        new Date(b.scheduledDate) >= weekAgo &&
        new Date(b.scheduledDate) <= today
    );

    const stats = {
      totalBookings: bookingsData.length,
      pendingBookings: bookingsData.filter((b) => b.status === "pending")
        .length,
      completedBookings: bookingsData.filter((b) => b.status === "completed")
        .length,
      totalEarnings: bookingsData
        .filter((b) => b.status === "completed")
        .reduce((sum, b) => sum + (b.pricing.totalAmount || 0), 0),
      todayBookings: bookingsData.filter(
        (b) => new Date(b.scheduledDate).toDateString() === todayStr
      ).length,
      weeklyBookings: weeklyBookings.length,
      weeklyCompleted: weeklyBookings.filter((b) => b.status === "completed")
        .length,
      weeklyEarnings: weeklyBookings
        .filter((b) => b.status === "completed")
        .reduce((sum, b) => sum + (b.pricing.totalAmount || 0), 0),
    };

    setStats(stats);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    }

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const getUpcomingBookings = () => {
    const now = new Date();
    return bookings
      .filter(
        (b) =>
          (b.status === "pending" || b.status === "confirmed") &&
          new Date(b.scheduledDate) >= now
      )
      .sort(
        (a, b) =>
          new Date(a.scheduledDate).getTime() -
          new Date(b.scheduledDate).getTime()
      )
      .slice(0, 3);
  };

  if (providerLoading || loading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="text-gray-600 mt-4">Loading Dashboard...</Text>
      </View>
    );
  }

  const upcomingBookings = getUpcomingBookings();

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-6 pt-12 pb-6 border-b border-gray-200">
        <View className="flex-row items-center justify-between mb-6">
          <View>
            <Text className="text-2xl font-bold text-gray-800">Dashboard</Text>
            <Text className="text-sm text-gray-600 mt-1">
              Welcome back, {providerData?.name || "Provider"}!
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push("/serviceProvider/ProfileScreen")}
          >
            <Image
              source={{
                uri:
                  providerData?.profilePhoto ||
                  `https://i.pravatar.cc/150?u=${providerData?.email}`,
              }}
              className="w-12 h-12 rounded-full"
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Stats Grid */}
        <View className="px-6 py-4">
          <View className="flex-row flex-wrap gap-3">
            {/* Total Bookings */}
            <View className="bg-white rounded-2xl p-4 flex-1 min-w-[45%] border border-gray-200">
              <View className="w-10 h-10 bg-blue-100 rounded-full items-center justify-center mb-3">
                <Ionicons name="calendar" size={20} color="#3b82f6" />
              </View>
              <Text className="text-2xl font-bold text-gray-800">
                {stats.totalBookings}
              </Text>
              <Text className="text-sm text-gray-600 mt-1">Total Bookings</Text>
            </View>

            {/* Pending */}
            <View className="bg-white rounded-2xl p-4 flex-1 min-w-[45%] border border-gray-200">
              <View className="w-10 h-10 bg-yellow-100 rounded-full items-center justify-center mb-3">
                <Ionicons name="time" size={20} color="#f59e0b" />
              </View>
              <Text className="text-2xl font-bold text-gray-800">
                {stats.pendingBookings}
              </Text>
              <Text className="text-sm text-gray-600 mt-1">Pending</Text>
            </View>

            {/* Completed */}
            <View className="bg-white rounded-2xl p-4 flex-1 min-w-[45%] border border-gray-200">
              <View className="w-10 h-10 bg-green-100 rounded-full items-center justify-center mb-3">
                <Ionicons name="checkmark-done" size={20} color="#10b981" />
              </View>
              <Text className="text-2xl font-bold text-gray-800">
                {stats.completedBookings}
              </Text>
              <Text className="text-sm text-gray-600 mt-1">Completed</Text>
            </View>

            {/* Total Earnings */}
            <View className="bg-white rounded-2xl p-4 flex-1 min-w-[45%] border border-gray-200">
              <View className="w-10 h-10 bg-purple-100 rounded-full items-center justify-center mb-3">
                <Ionicons name="wallet" size={20} color="#8b5cf6" />
              </View>
              <Text className="text-2xl font-bold text-gray-800">
                ${stats.totalEarnings}
              </Text>
              <Text className="text-sm text-gray-600 mt-1">Total Earnings</Text>
            </View>
          </View>
        </View>

        {/* Today's Schedule */}
        {stats.todayBookings > 0 && (
          <View className="px-6 py-2">
            <View className="bg-blue-50 rounded-2xl p-4 border border-blue-200">
              <View className="flex-row items-center">
                <View className="w-10 h-10 bg-blue-600 rounded-full items-center justify-center">
                  <Ionicons name="today" size={20} color="white" />
                </View>
                <View className="ml-3 flex-1">
                  <Text className="text-base font-bold text-blue-900">
                    {stats.todayBookings} booking
                    {stats.todayBookings !== 1 ? "s" : ""} today
                  </Text>
                  <Text className="text-sm text-blue-700">
                    Check your schedule
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => router.push("/serviceProvider/BookingsScreen")}
                  className="bg-blue-600 rounded-lg px-4 py-2"
                >
                  <Text className="text-white font-semibold text-sm">View</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Weekly Summary */}
        <View className="px-6 py-4">
          <Text className="text-lg font-bold text-gray-800 mb-3">
            This Week's Summary
          </Text>
          <View className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
            <View className="flex-row items-center mb-4">
              <View className="w-10 h-10 bg-purple-100 rounded-full items-center justify-center">
                <Ionicons name="trending-up" size={24} color="#8b5cf6" />
              </View>
              <Text className="text-gray-800 text-lg font-bold ml-3">
                Last 7 Days
              </Text>
            </View>

            <View className="flex-row flex-wrap gap-4">
              {/* Weekly Bookings */}
              <View className="flex-1 min-w-[45%] bg-blue-50 rounded-xl p-4 border border-blue-100">
                <View className="flex-row items-center justify-between mb-2">
                  <Ionicons name="calendar" size={20} color="#3b82f6" />
                  <Text className="text-blue-700 text-xs font-semibold">
                    Bookings
                  </Text>
                </View>
                <Text className="text-gray-800 text-2xl font-bold">
                  {stats.weeklyBookings}
                </Text>
                <Text className="text-gray-600 text-xs mt-1">
                  Total this week
                </Text>
              </View>

              {/* Weekly Completed */}
              <View className="flex-1 min-w-[45%] bg-green-50 rounded-xl p-4 border border-green-100">
                <View className="flex-row items-center justify-between mb-2">
                  <Ionicons name="checkmark-done" size={20} color="#10b981" />
                  <Text className="text-green-700 text-xs font-semibold">
                    Completed
                  </Text>
                </View>
                <Text className="text-gray-800 text-2xl font-bold">
                  {stats.weeklyCompleted}
                </Text>
                <Text className="text-gray-600 text-xs mt-1">
                  Jobs finished
                </Text>
              </View>

              {/* Weekly Earnings */}
              <View className="w-full bg-purple-50 rounded-xl p-4 border border-purple-100">
                <View className="flex-row items-center justify-between mb-2">
                  <Ionicons name="wallet" size={20} color="#8b5cf6" />
                  <Text className="text-purple-700 text-xs font-semibold">
                    Earnings
                  </Text>
                </View>
                <Text className="text-gray-800 text-3xl font-bold">
                  ${stats.weeklyEarnings}
                </Text>
                <Text className="text-gray-600 text-xs mt-1">
                  Revenue this week
                  {stats.weeklyCompleted > 0 && (
                    <Text>
                      {" "}
                      • Avg $
                      {Math.round(stats.weeklyEarnings / stats.weeklyCompleted)}
                      /job
                    </Text>
                  )}
                </Text>
              </View>
            </View>

            {/* Weekly Performance Indicator */}
            {stats.weeklyBookings > 0 && (
              <View className="mt-4 pt-4 border-t border-gray-200">
                <View className="flex-row items-center justify-between">
                  <Text className="text-gray-700 text-sm">Completion Rate</Text>
                  <Text className="text-gray-800 font-bold text-sm">
                    {Math.round(
                      (stats.weeklyCompleted / stats.weeklyBookings) * 100
                    )}
                    %
                  </Text>
                </View>
                <View className="h-2 bg-gray-200 rounded-full overflow-hidden mt-2">
                  <View
                    className="h-full bg-purple-600 rounded-full"
                    style={{
                      width: `${
                        (stats.weeklyCompleted / stats.weeklyBookings) * 100
                      }%`,
                    }}
                  />
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Quick Actions */}
        <View className="px-6 py-4">
          <Text className="text-lg font-bold text-gray-800 mb-3">
            Quick Actions
          </Text>
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={() => router.push("/serviceProvider/BookingsScreen")}
              className="flex-1 bg-white rounded-2xl p-4 border border-gray-200"
            >
              <View className="w-12 h-12 bg-blue-100 rounded-full items-center justify-center mb-2">
                <Ionicons name="list" size={24} color="#3b82f6" />
              </View>
              <Text className="text-sm font-semibold text-gray-800">
                View All
              </Text>
              <Text className="text-xs text-gray-600 mt-1">Bookings</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push("/serviceProvider/ProfileScreen")}
              className="flex-1 bg-white rounded-2xl p-4 border border-gray-200"
            >
              <View className="w-12 h-12 bg-purple-100 rounded-full items-center justify-center mb-2">
                <Ionicons name="person" size={24} color="#8b5cf6" />
              </View>
              <Text className="text-sm font-semibold text-gray-800">
                My Profile
              </Text>
              <Text className="text-xs text-gray-600 mt-1">Edit details</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push("/serviceProvider/ProfileScreen")}
              className="flex-1 bg-white rounded-2xl p-4 border border-gray-200"
            >
              <View className="w-12 h-12 bg-yellow-100 rounded-full items-center justify-center mb-2">
                <Ionicons name="star" size={24} color="#f59e0b" />
              </View>
              <Text className="text-sm font-semibold text-gray-800">
                Reviews
              </Text>
              <Text className="text-xs text-gray-600 mt-1">See feedback</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Upcoming Bookings */}
        <View className="px-6 py-2">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-lg font-bold text-gray-800">
              Upcoming Bookings
            </Text>
            {upcomingBookings.length > 0 && (
              <TouchableOpacity
                onPress={() => router.push("/serviceProvider/BookingsScreen")}
              >
                <Text className="text-sm text-blue-600 font-semibold">
                  See All
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {upcomingBookings.length > 0 ? (
            upcomingBookings.map((booking) => (
              <TouchableOpacity
                key={booking._id}
                className="bg-white rounded-2xl p-4 mb-3 border border-gray-200"
                onPress={() =>
                  router.push({
                    pathname: "/serviceProvider/BookingDetailsScreen",
                    params: { bookingId: booking._id },
                  })
                }
              >
                <View className="flex-row">
                  <Image
                    source={{
                      uri:
                        booking.customerDetails.image ||
                        `https://i.pravatar.cc/150?u=${booking.customerDetails.email}`,
                    }}
                    className="w-14 h-14 rounded-xl"
                  />

                  <View className="flex-1 ml-3">
                    <Text className="text-base font-semibold text-gray-800">
                      {booking.customerDetails.name}
                    </Text>
                    <Text className="text-sm text-gray-600 mt-1">
                      {booking.category}
                    </Text>

                    <View className="flex-row items-center justify-between mt-2">
                      <View className="flex-row items-center">
                        <Ionicons
                          name="calendar-outline"
                          size={14}
                          color="#6b7280"
                        />
                        <Text className="text-xs text-gray-500 ml-1">
                          {formatDate(booking.scheduledDate)} •{" "}
                          {booking.timeSlot}
                        </Text>
                      </View>

                      <View
                        className={`rounded-full px-3 py-1 ${
                          booking.status === "pending"
                            ? "bg-yellow-100"
                            : "bg-blue-100"
                        }`}
                      >
                        <Text
                          className={`text-xs font-semibold capitalize ${
                            booking.status === "pending"
                              ? "text-yellow-700"
                              : "text-blue-700"
                          }`}
                        >
                          {booking.status}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View className="bg-white rounded-2xl p-8 border border-gray-200 items-center">
              <View className="w-16 h-16 bg-gray-100 rounded-full items-center justify-center mb-3">
                <Ionicons name="calendar-outline" size={32} color="#9ca3af" />
              </View>
              <Text className="text-gray-600 text-center">
                No upcoming bookings
              </Text>
              <Text className="text-gray-500 text-sm text-center mt-1">
                New bookings will appear here
              </Text>
            </View>
          )}
        </View>

        {/* Performance Insights */}
        {stats.completedBookings > 0 && (
          <View className="px-6 py-4 mb-6">
            <Text className="text-lg font-bold text-gray-800 mb-3">
              Performance
            </Text>
            <View className="bg-white rounded-2xl p-4 border border-gray-200">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-sm text-gray-600">Completion Rate</Text>
                <Text className="text-sm font-bold text-gray-800">
                  {Math.round(
                    (stats.completedBookings / stats.totalBookings) * 100
                  )}
                  %
                </Text>
              </View>
              <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <View
                  className="h-full bg-green-600 rounded-full"
                  style={{
                    width: `${
                      (stats.completedBookings / stats.totalBookings) * 100
                    }%`,
                  }}
                />
              </View>

              <View className="flex-row items-center justify-between mt-4">
                <Text className="text-sm text-gray-600">Average Earnings</Text>
                <Text className="text-sm font-bold text-gray-800">
                  $
                  {stats.completedBookings > 0
                    ? Math.round(stats.totalEarnings / stats.completedBookings)
                    : 0}
                  /job
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

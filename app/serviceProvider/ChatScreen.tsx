// import { Ionicons } from "@expo/vector-icons";
// import { router, useLocalSearchParams } from "expo-router";
// import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
// import React, { useEffect, useRef, useState } from "react";
// import {
//   ActivityIndicator,
//   Image,
//   KeyboardAvoidingView,
//   Platform,
//   ScrollView,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   View,
// } from "react-native";
// import { auth, db } from "../config/firebase";
// import {
//   markAsRead,
//   sendMessage as sendMessageAPI,
// } from "../services/messageService";

// interface Message {
//   id: string;
//   senderId: string;
//   senderName: string;
//   senderPhoto: string | null;
//   text: string;
//   timestamp: any;
//   read: boolean;
// }

// const ChatScreen = () => {
//   const params = useLocalSearchParams();
//   const { conversationId, otherUserId, name, image } = params;

//   const [message, setMessage] = useState("");
//   const [messages, setMessages] = useState<Message[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [sending, setSending] = useState(false);
//   const scrollViewRef = useRef<ScrollView>(null);
//   const currentUserId = auth.currentUser?.uid;

//   // Real-time listener for messages
//   useEffect(() => {
//     if (!conversationId) {
//       console.error("No conversation ID provided");
//       setLoading(false);
//       return;
//     }

//     const messagesRef = collection(
//       db,
//       "conversations",
//       conversationId as string,
//       "messages"
//     );
//     const q = query(messagesRef, orderBy("timestamp", "asc"));

//     const unsubscribe = onSnapshot(q, (snapshot) => {
//       const msgs = snapshot.docs.map((doc) => ({
//         id: doc.id,
//         ...doc.data(),
//       })) as Message[];
//       setMessages(msgs);
//       setLoading(false);

//       // Scroll to bottom when new messages arrive
//       setTimeout(() => {
//         scrollViewRef.current?.scrollToEnd({ animated: true });
//       }, 100);
//     });

//     // Mark conversation as read when opening
//     if (currentUserId) {
//       markAsRead(conversationId as string);
//     }

//     return () => unsubscribe();
//   }, [conversationId, currentUserId]);

//   const handleSendMessage = async () => {
//     if (message.trim().length === 0 || !conversationId || sending) return;

//     const messageText = message.trim();
//     setMessage("");
//     setSending(true);

//     try {
//       const response = await sendMessageAPI(
//         conversationId as string,
//         messageText
//       );

//       if (!response.success) {
//         console.error("Failed to send message:", response.error);
//         setMessage(messageText);
//         alert("Failed to send message. Please try again.");
//       }
//     } catch (error) {
//       console.error("Error sending message:", error);
//       setMessage(messageText);
//       alert("Failed to send message. Please try again.");
//     } finally {
//       setSending(false);
//     }
//   };

//   const formatTimestamp = (timestamp: any) => {
//     if (!timestamp) return "";

//     let date: Date;
//     if (timestamp.toDate) {
//       date = timestamp.toDate();
//     } else if (timestamp.seconds) {
//       date = new Date(timestamp.seconds * 1000);
//     } else {
//       date = new Date(timestamp);
//     }

//     return date.toLocaleTimeString([], {
//       hour: "2-digit",
//       minute: "2-digit",
//     });
//   };

//   const formatDateHeader = () => {
//     const today = new Date();
//     return today.toLocaleDateString([], {
//       weekday: "long",
//       month: "short",
//       day: "numeric",
//     });
//   };

//   if (loading) {
//     return (
//       <View className="flex-1 bg-gray-50 items-center justify-center">
//         <ActivityIndicator size="large" color="#3b82f6" />
//         <Text className="text-gray-500 mt-4">Loading conversation...</Text>
//       </View>
//     );
//   }

//   return (
//     <View className="flex-1 bg-gray-50">
//       {/* Header */}
//       <View className="bg-white px-6 pt-12 pb-4 border-b border-gray-200">
//         <View className="flex-row items-center">
//           <TouchableOpacity onPress={() => router.back()} className="mr-4">
//             <Ionicons name="arrow-back" size={24} color="black" />
//           </TouchableOpacity>

//           <View className="relative mr-3">
//             <Image
//               source={{
//                 uri:
//                   (image as string) ||
//                   `https://i.pravatar.cc/150?u=${otherUserId}`,
//               }}
//               className="w-10 h-10 rounded-full"
//             />
//           </View>

//           <View className="flex-1">
//             <Text className="text-lg font-semibold text-gray-800">{name}</Text>
//             <Text className="text-xs text-gray-500">
//               {messages.length === 0 ? "Start a conversation" : "Active"}
//             </Text>
//           </View>

//           <TouchableOpacity className="ml-4">
//             <Ionicons name="ellipsis-vertical" size={24} color="#6b7280" />
//           </TouchableOpacity>
//         </View>
//       </View>

//       <KeyboardAvoidingView
//         behavior={Platform.OS === "ios" ? "padding" : undefined}
//         className="flex-1"
//         keyboardVerticalOffset={0}
//       >
//         <ScrollView
//           ref={scrollViewRef}
//           className="flex-1 px-4 py-4"
//           showsVerticalScrollIndicator={false}
//           onContentSizeChange={() =>
//             scrollViewRef.current?.scrollToEnd({ animated: false })
//           }
//         >
//           {/* Date Header */}
//           <View className="items-center my-4">
//             <View className="bg-gray-200 px-4 py-1 rounded-full">
//               <Text className="text-xs text-gray-600">
//                 {formatDateHeader()}
//               </Text>
//             </View>
//           </View>

//           {/* Messages */}
//           {messages.length === 0 ? (
//             <View className="items-center justify-center py-12">
//               <Ionicons
//                 name="chatbox-ellipses-outline"
//                 size={64}
//                 color="#d1d5db"
//               />
//               <Text className="text-gray-500 text-base mt-4">
//                 No messages yet
//               </Text>
//               <Text className="text-gray-400 text-sm mt-2">
//                 Start the conversation!
//               </Text>
//             </View>
//           ) : (
//             messages.map((msg) => (
//               <View
//                 key={msg.id}
//                 className={`mb-3 ${
//                   msg.senderId === currentUserId ? "items-end" : "items-start"
//                 }`}
//               >
//                 <View
//                   className={`max-w-[75%] px-4 py-3 rounded-2xl ${
//                     msg.senderId === currentUserId
//                       ? "bg-blue-600 rounded-br-sm"
//                       : "bg-white rounded-bl-sm border border-gray-200"
//                   }`}
//                 >
//                   <Text
//                     className={`text-base ${
//                       msg.senderId === currentUserId
//                         ? "text-white"
//                         : "text-gray-800"
//                     }`}
//                   >
//                     {msg.text}
//                   </Text>
//                 </View>
//                 <Text className="text-xs text-gray-400 mt-1 px-2">
//                   {formatTimestamp(msg.timestamp)}
//                 </Text>
//               </View>
//             ))
//           )}
//         </ScrollView>

//         {/* Input Area */}
//         <View className="bg-white px-4 py-3 border-t border-gray-200">
//           <View className="flex-row items-center">
//             <View className="flex-1 flex-row items-center bg-gray-100 rounded-full px-4 py-2">
//               <TextInput
//                 placeholder="Type a message..."
//                 placeholderTextColor="#9ca3af"
//                 value={message}
//                 onChangeText={setMessage}
//                 className="flex-1 text-gray-800 text-base"
//                 multiline
//                 maxLength={500}
//                 onSubmitEditing={handleSendMessage}
//               />
//             </View>

//             <TouchableOpacity
//               onPress={handleSendMessage}
//               className={`ml-3 w-10 h-10 rounded-full items-center justify-center ${
//                 message.trim().length > 0 && !sending
//                   ? "bg-blue-600"
//                   : "bg-gray-300"
//               }`}
//               disabled={message.trim().length === 0 || sending}
//             >
//               {sending ? (
//                 <ActivityIndicator size="small" color="white" />
//               ) : (
//                 <Ionicons name="send" size={20} color="white" />
//               )}
//             </TouchableOpacity>
//           </View>
//         </View>
//       </KeyboardAvoidingView>
//     </View>
//   );
// };

// export default ChatScreen;

import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { auth, db } from "../config/firebase";
import {
  markAsRead,
  sendMessage as sendMessageAPI,
} from "../services/messageService";

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderPhoto: string | null;
  text: string;
  timestamp: any;
  read: boolean;
}

// ------------------------------------
// HELPER FUNCTIONS (Moved from component body for clarity)
// ------------------------------------

// Formats the message timestamp
const formatTimestamp = (timestamp: any): string => {
  if (!timestamp) return "";

  let date: Date;
  if (timestamp.toDate) {
    date = timestamp.toDate();
  } else if (timestamp.seconds) {
    date = new Date(timestamp.seconds * 1000);
  } else {
    date = new Date(timestamp);
  }

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Formats the current date for the header
const formatDateHeader = (): string => {
  const today = new Date();
  return today.toLocaleDateString([], {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
};

// ------------------------------------
// MESSAGE ITEM COMPONENT
// ------------------------------------

// Component to render a single message for better list performance and clean code
const MessageItem = ({
  msg,
  currentUserId,
}: {
  msg: Message;
  currentUserId: string | undefined;
}) => {
  const isCurrentUser = msg.senderId === currentUserId;

  return (
    <View className={`mb-3 ${isCurrentUser ? "items-end" : "items-start"}`}>
      <View
        className={`max-w-[75%] px-4 py-3 rounded-2xl ${
          isCurrentUser
            ? "bg-blue-600 rounded-br-sm"
            : "bg-white rounded-bl-sm border border-gray-200"
        }`}
      >
        <Text
          className={`text-base ${
            isCurrentUser ? "text-white" : "text-gray-800"
          }`}
        >
          {msg.text}
        </Text>
      </View>
      <Text className="text-xs text-gray-400 mt-1 px-2">
        {formatTimestamp(msg.timestamp)}
      </Text>
    </View>
  );
};

// ------------------------------------
// MAIN SCREEN
// ------------------------------------

const ChatScreen = () => {
  const params = useLocalSearchParams();
  const { conversationId, otherUserId, name, image } = params;

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  // Ref for the FlatList
  const flatListRef = useRef<FlatList<Message>>(null);
  const currentUserId = auth.currentUser?.uid;

  // Real-time listener for messages
  useEffect(() => {
    if (!conversationId) {
      console.error("No conversation ID provided");
      setLoading(false);
      return;
    }

    const messagesRef = collection(
      db,
      "conversations",
      conversationId as string,
      "messages"
    );
    const q = query(messagesRef, orderBy("timestamp", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Message[];
      setMessages(msgs);
      setLoading(false);
    });

    // Mark conversation as read when opening
    if (currentUserId) {
      markAsRead(conversationId as string);
    }

    return () => unsubscribe();
  }, [conversationId, currentUserId]);

  const handleSendMessage = async () => {
    if (message.trim().length === 0 || !conversationId || sending) return;

    const messageText = message.trim();
    setMessage("");
    setSending(true);

    try {
      const response = await sendMessageAPI(
        conversationId as string,
        messageText
      );

      if (!response.success) {
        console.error("Failed to send message:", response.error);
        setMessage(messageText);
        alert("Failed to send message. Please try again.");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setMessage(messageText);
      alert("Failed to send message. Please try again.");
    } finally {
      setSending(false);
    }
  };

  // Custom Header Component for FlatList (includes Date Header and Empty state)
  const ListHeaderComponent = () => (
    <>
      {/* Date Header */}
      <View className="items-center my-4">
        <View className="bg-gray-200 px-4 py-1 rounded-full">
          <Text className="text-xs text-gray-600">{formatDateHeader()}</Text>
        </View>
      </View>

      {/* Empty State */}
      {messages.length === 0 && (
        <View className="items-center justify-center py-12">
          <Ionicons name="chatbox-ellipses-outline" size={64} color="#d1d5db" />
          <Text className="text-gray-500 text-base mt-4">No messages yet</Text>
          <Text className="text-gray-400 text-sm mt-2">
            Start the conversation!
          </Text>
        </View>
      )}
    </>
  );

  if (loading) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="text-gray-500 mt-4">Loading conversation...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-6 pt-12 pb-4 border-b border-gray-200">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <Ionicons name="arrow-back" size={24} color="black" />
          </TouchableOpacity>

          <View className="relative mr-3">
            <Image
              source={{
                uri:
                  (image as string) ||
                  `https://i.pravatar.cc/150?u=${otherUserId}`,
              }}
              className="w-10 h-10 rounded-full"
            />
          </View>

          <View className="flex-1">
            <Text className="text-lg font-semibold text-gray-800">{name}</Text>
            <Text className="text-xs text-gray-500">
              {messages.length === 0 ? "Start a conversation" : "Active"}
            </Text>
          </View>

          <TouchableOpacity className="ml-4">
            <Ionicons name="ellipsis-vertical" size={24} color="#6b7280" />
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
        keyboardVerticalOffset={0}
      >
        {/* Messages List (FlatList for stability) */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={({ item }) => (
            <MessageItem msg={item} currentUserId={currentUserId} />
          )}
          // IMPORTANT: keyExtractor uses item.id to ensure each message is unique
          keyExtractor={(item) => item.id}
          className="flex-1 px-4 py-4"
          showsVerticalScrollIndicator={false}
          // Scrolls to the end when content size changes (new message arrives)
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
          // Header component for the Date and Empty State
          ListHeaderComponent={ListHeaderComponent}
        />

        {/* Input Area */}
        <View className="bg-white px-4 py-3 border-t border-gray-200">
          <View className="flex-row items-center">
            <View className="flex-1 flex-row items-center bg-gray-100 rounded-full px-4 py-2">
              <TextInput
                placeholder="Type a message..."
                placeholderTextColor="#9ca3af"
                value={message}
                onChangeText={setMessage}
                className="flex-1 text-gray-800 text-base"
                multiline
                maxLength={500}
                // Removed onSubmitEditing as it can interfere with multiline/send button logic
              />
            </View>

            <TouchableOpacity
              onPress={handleSendMessage}
              className={`ml-3 w-10 h-10 rounded-full items-center justify-center ${
                message.trim().length > 0 && !sending
                  ? "bg-blue-600"
                  : "bg-gray-300"
              }`}
              disabled={message.trim().length === 0 || sending}
            >
              {sending ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Ionicons name="send" size={20} color="white" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

export default ChatScreen;

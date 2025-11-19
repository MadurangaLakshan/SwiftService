import { Server } from "socket.io";
import { AuthenticatedSocket } from "../middleware/socketAuthMiddleware";
import Customer from "../models/Customer";
import { Conversation, Message } from "../models/Message";
import Provider from "../models/Provider";
import User from "../models/User";

// Helper function to get user details
const getUserDetails = async (userId: string) => {
  const user = await User.findOne({ userId });

  if (!user) {
    return null;
  }

  if (user.userType === "customer") {
    const customer = await Customer.findOne({ userId }).select(
      "name profilePhoto"
    );
    return customer
      ? {
          name: customer.name,
          photo: customer.profilePhoto,
          userType: "customer" as const,
        }
      : null;
  } else {
    const provider = await Provider.findOne({ userId }).select(
      "name profilePhoto"
    );
    return provider
      ? {
          name: provider.name,
          photo: provider.profilePhoto,
          userType: "provider" as const,
        }
      : null;
  }
};

export const handleSocketConnection = (
  io: Server,
  socket: AuthenticatedSocket
) => {
  const userId = socket.userId;

  if (!userId) {
    socket.disconnect();
    return;
  }

  // Join user to their personal room
  socket.join(userId);

  // Join all user's conversations
  socket.on("join-conversations", async (conversationIds: string[]) => {
    conversationIds.forEach((id) => socket.join(id));
    console.log(
      `👤 User ${userId} joined ${conversationIds.length} conversations`
    );
  });

  // Handle sending messages
  socket.on(
    "send-message",
    async (data: { conversationId: string; text: string }) => {
      try {
        const { conversationId, text } = data;

        if (!text || text.trim() === "") {
          socket.emit("error", { message: "Message text is required" });
          return;
        }

        // Get sender details
        const senderDetails = await getUserDetails(userId);
        if (!senderDetails) {
          socket.emit("error", { message: "User profile not found" });
          return;
        }

        // Get conversation
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
          socket.emit("error", { message: "Conversation not found" });
          return;
        }

        // Verify user is part of conversation
        if (!conversation.participantIds.includes(userId)) {
          socket.emit("error", { message: "Unauthorized" });
          return;
        }

        // Create message
        const message = await Message.create({
          conversationId,
          senderId: userId,
          senderName: senderDetails.name,
          senderPhoto: senderDetails.photo || null,
          text: text.trim(),
          timestamp: new Date(),
          read: false,
        });

        // Update conversation
        const otherUserId = conversation.participantIds.find(
          (id) => id !== userId
        );

        conversation.lastMessage = text.trim();
        conversation.lastMessageTime = new Date();

        if (otherUserId) {
          const currentUnread = conversation.unreadCount.get(otherUserId) || 0;
          conversation.unreadCount.set(otherUserId, currentUnread + 1);
        }

        await conversation.save();

        // Broadcast message to conversation participants
        io.to(conversationId).emit("new-message", {
          id: message._id,
          conversationId: message.conversationId,
          senderId: message.senderId,
          senderName: message.senderName,
          senderPhoto: message.senderPhoto,
          text: message.text,
          timestamp: message.timestamp,
          read: message.read,
        });

        // Emit conversation update
        io.to(otherUserId!).emit("conversation-updated", {
          id: conversation._id,
          lastMessage: conversation.lastMessage,
          lastMessageTime: conversation.lastMessageTime,
          unreadCount: Object.fromEntries(conversation.unreadCount),
        });

        console.log(`📨 Message sent in conversation ${conversationId}`);
      } catch (error: any) {
        console.error("Send message error:", error);
        socket.emit("error", { message: error.message });
      }
    }
  );

  // Handle typing indicator
  socket.on("typing", (data: { conversationId: string; isTyping: boolean }) => {
    socket.to(data.conversationId).emit("user-typing", {
      userId,
      isTyping: data.isTyping,
    });
  });

  // Mark messages as read
  socket.on("mark-as-read", async (conversationId: string) => {
    try {
      const conversation = await Conversation.findById(conversationId);

      if (conversation && conversation.participantIds.includes(userId)) {
        conversation.unreadCount.set(userId, 0);
        await conversation.save();

        // Notify other user
        const otherUserId = conversation.participantIds.find(
          (id) => id !== userId
        );
        io.to(otherUserId!).emit("messages-read", { conversationId });
      }
    } catch (error) {
      console.error("Mark as read error:", error);
    }
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    console.log(`❌ User disconnected: ${socket.id}`);
  });
};

import { Response } from "express";
import { AuthRequest } from "../middleware/authMiddleware";
import { Conversation } from "../models/Conversation";
import Customer from "../models/Customer";
import { Message } from "../models/Message";
import Provider from "../models/Provider";
import User from "../models/User";

// Helper function to get user details
const getUserDetails = async (
  userId: string
): Promise<{
  name: string;
  photo: string | null;
  userType: "customer" | "provider";
} | null> => {
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
          photo: customer.profilePhoto || null,
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
          photo: provider.profilePhoto || null,
          userType: "provider" as const,
        }
      : null;
  }
};

export const createConversation = async (req: AuthRequest, res: Response) => {
  try {
    const { otherUserId } = req.body;
    const currentUserId = req.user!.uid;

    if (!otherUserId) {
      return res.status(400).json({ message: "otherUserId is required" });
    }

    // Check if conversation already exists
    const existingConv = await Conversation.findOne({
      participantIds: { $all: [currentUserId, otherUserId] },
    });

    if (existingConv) {
      // Fetch fresh user details for the response
      const [currentUserDetails, otherUserDetails] = await Promise.all([
        getUserDetails(currentUserId),
        getUserDetails(otherUserId),
      ]);

      return res.json({
        conversationId: existingConv._id,
        _id: existingConv._id,
        participantIds: existingConv.participantIds,
        participants: {
          [currentUserId]: currentUserDetails,
          [otherUserId]: otherUserDetails,
        },
        lastMessage: existingConv.lastMessage,
        lastMessageTime: existingConv.lastMessageTime,
        unreadCount: Object.fromEntries(existingConv.unreadCount),
        createdAt: existingConv.createdAt,
        updatedAt: existingConv.updatedAt,
      });
    }

    // Verify both users exist
    const [currentUserDetails, otherUserDetails] = await Promise.all([
      getUserDetails(currentUserId),
      getUserDetails(otherUserId),
    ]);

    if (!currentUserDetails) {
      return res
        .status(404)
        .json({ message: "Current user profile not found" });
    }

    if (!otherUserDetails) {
      return res.status(404).json({ message: "Other user not found" });
    }

    // Create new conversation - ONLY store participantIds
    const conversation = await Conversation.create({
      participantIds: [currentUserId, otherUserId],
      lastMessage: null,
      lastMessageTime: new Date(),
      unreadCount: {
        [currentUserId]: 0,
        [otherUserId]: 0,
      },
    });

    // Return response with dynamically fetched user details
    res.json({
      conversationId: conversation._id,
      _id: conversation._id,
      participantIds: conversation.participantIds,
      participants: {
        [currentUserId]: currentUserDetails,
        [otherUserId]: otherUserDetails,
      },
      lastMessage: conversation.lastMessage,
      lastMessageTime: conversation.lastMessageTime,
      unreadCount: Object.fromEntries(conversation.unreadCount),
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
    });
  } catch (error: any) {
    console.error("Create conversation error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const getConversations = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.uid;

    // Fetch conversations
    const conversations = await Conversation.find({
      participantIds: userId,
    })
      .sort({ lastMessageTime: -1 })
      .lean();

    // Dynamically fetch participant details for each conversation
    const conversationsWithDetails = await Promise.all(
      conversations.map(async (conversation) => {
        const participants: {
          [key: string]: {
            name: string;
            photo: string | null;
            userType: "provider" | "customer";
          };
        } = {};

        // Fetch details for each participant
        for (const participantId of conversation.participantIds) {
          const userDetails = await getUserDetails(participantId);
          if (userDetails) {
            participants[participantId] = userDetails;
          }
        }

        return {
          _id: conversation._id,
          participantIds: conversation.participantIds,
          participants, // Fresh data from Customer/Provider collections
          lastMessage: conversation.lastMessage,
          lastMessageTime: conversation.lastMessageTime,
          unreadCount: conversation.unreadCount,
          createdAt: conversation.createdAt,
          updatedAt: conversation.updatedAt,
        };
      })
    );

    res.json(conversationsWithDetails);
  } catch (error: any) {
    console.error("Get conversations error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const sendMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { conversationId, text } = req.body;
    const currentUserId = req.user!.uid;

    if (!conversationId) {
      return res.status(400).json({ message: "conversationId is required" });
    }

    if (!text || text.trim() === "") {
      return res.status(400).json({ message: "Message text is required" });
    }

    // Get current user details
    const currentUserDetails = await getUserDetails(currentUserId);

    if (!currentUserDetails) {
      return res.status(404).json({ message: "User profile not found" });
    }

    // Create message
    const message = await Message.create({
      conversationId,
      senderId: currentUserId,
      senderName: currentUserDetails.name,
      senderPhoto: currentUserDetails.photo || null,
      text: text.trim(),
      timestamp: new Date(),
      read: false,
    });

    // Update conversation
    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    const otherUserId = conversation.participantIds.find(
      (id) => id !== currentUserId
    );

    conversation.lastMessage = text.trim();
    conversation.lastMessageTime = new Date();

    if (otherUserId) {
      const currentUnread = conversation.unreadCount.get(otherUserId) || 0;
      conversation.unreadCount.set(otherUserId, currentUnread + 1);
    }

    await conversation.save();

    // Emit via Socket.io (if available)
    const io = req.app.get("io");
    if (io) {
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

      io.to(otherUserId!).emit("conversation-updated", {
        id: conversation._id,
        lastMessage: conversation.lastMessage,
        lastMessageTime: conversation.lastMessageTime,
        unreadCount: Object.fromEntries(conversation.unreadCount),
      });
    }

    res.json({ messageId: message._id, success: true });
  } catch (error: any) {
    console.error("Send message error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const getMessages = async (req: AuthRequest, res: Response) => {
  try {
    const { conversationId } = req.params;
    const { limit = 50 } = req.query;
    const userId = req.user!.uid;

    const messages = await Message.find({ conversationId })
      .sort({ timestamp: -1 })
      .limit(Number(limit))
      .lean();

    // Mark messages as read
    await Conversation.findByIdAndUpdate(conversationId, {
      [`unreadCount.${userId}`]: 0,
    });

    res.json(messages.reverse());
  } catch (error: any) {
    console.error("Get messages error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const markAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user!.uid;

    await Conversation.findByIdAndUpdate(conversationId, {
      [`unreadCount.${userId}`]: 0,
    });

    res.json({ success: true });
  } catch (error: any) {
    console.error("Mark as read error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const deleteConversation = async (req: AuthRequest, res: Response) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user!.uid;

    // Verify user is part of conversation
    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    if (!conversation.participantIds.includes(userId)) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Delete all messages
    await Message.deleteMany({ conversationId });

    // Delete conversation
    await Conversation.findByIdAndDelete(conversationId);

    res.json({ success: true });
  } catch (error: any) {
    console.error("Delete conversation error:", error);
    res.status(500).json({ message: error.message });
  }
};

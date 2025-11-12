import { Request, Response } from "express";
import admin, { db } from "../config/firebase";
import Customer from "../models/Customer";
import Provider from "../models/Provider";
import User from "../models/User";

// Helper function to get user details based on type
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
          userType: "customer",
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
          userType: "provider",
        }
      : null;
  }
};

export const createConversation = async (req: Request, res: Response) => {
  try {
    const { otherUserId } = req.body;
    const currentUserId = req.user!.uid; // Firebase UID from your auth middleware

    if (!otherUserId) {
      return res.status(400).json({ message: "otherUserId is required" });
    }

    // Check if conversation already exists
    const existingConv = await db
      .collection("conversations")
      .where("participantIds", "array-contains", currentUserId)
      .get();

    const existing = existingConv.docs.find((doc) => {
      const data = doc.data();
      return data.participantIds.includes(otherUserId);
    });

    if (existing) {
      return res.json({ conversationId: existing.id, ...existing.data() });
    }

    // Fetch user details from MongoDB
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

    // Create new conversation in Firestore
    const conversationRef = await db.collection("conversations").add({
      participantIds: [currentUserId, otherUserId],
      participants: {
        [currentUserId]: {
          name: currentUserDetails.name,
          photo: currentUserDetails.photo || null,
          userType: currentUserDetails.userType,
        },
        [otherUserId]: {
          name: otherUserDetails.name,
          photo: otherUserDetails.photo || null,
          userType: otherUserDetails.userType,
        },
      },
      lastMessage: null,
      lastMessageTime: admin.firestore.FieldValue.serverTimestamp(),
      unreadCount: {
        [currentUserId]: 0,
        [otherUserId]: 0,
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    const conversation = await conversationRef.get();
    res.json({ conversationId: conversationRef.id, ...conversation.data() });
  } catch (error: any) {
    console.error("Create conversation error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const getConversations = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.uid;

    const snapshot = await db
      .collection("conversations")
      .where("participantIds", "array-contains", userId)
      .orderBy("lastMessageTime", "desc")
      .get();

    const conversations = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json(conversations);
  } catch (error: any) {
    console.error("Get conversations error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const sendMessage = async (req: Request, res: Response) => {
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

    // Add message to Firestore
    const messageRef = await db
      .collection("conversations")
      .doc(conversationId)
      .collection("messages")
      .add({
        senderId: currentUserId,
        senderName: currentUserDetails.name,
        senderPhoto: currentUserDetails.photo || null,
        text: text.trim(),
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        read: false,
      });

    // Update conversation last message
    const conversationRef = db.collection("conversations").doc(conversationId);
    const conversation = await conversationRef.get();

    if (!conversation.exists) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    const conversationData = conversation.data();
    const otherUserId = conversationData!.participantIds.find(
      (id: string) => id !== currentUserId
    );

    await conversationRef.update({
      lastMessage: text.trim(),
      lastMessageTime: admin.firestore.FieldValue.serverTimestamp(),
      [`unreadCount.${otherUserId}`]: admin.firestore.FieldValue.increment(1),
    });

    res.json({ messageId: messageRef.id, success: true });
  } catch (error: any) {
    console.error("Send message error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const getMessages = async (req: Request, res: Response) => {
  try {
    const { conversationId } = req.params;
    const { limit = 50 } = req.query;
    const userId = req.user!.uid;

    const snapshot = await db
      .collection("conversations")
      .doc(conversationId)
      .collection("messages")
      .orderBy("timestamp", "desc")
      .limit(Number(limit))
      .get();

    const messages = snapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      .reverse(); // Reverse to show oldest first

    // Mark messages as read
    await db
      .collection("conversations")
      .doc(conversationId)
      .update({
        [`unreadCount.${userId}`]: 0,
      });

    res.json(messages);
  } catch (error: any) {
    console.error("Get messages error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const markAsRead = async (req: Request, res: Response) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user!.uid;

    await db
      .collection("conversations")
      .doc(conversationId)
      .update({
        [`unreadCount.${userId}`]: 0,
      });

    res.json({ success: true });
  } catch (error: any) {
    console.error("Mark as read error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const deleteConversation = async (req: Request, res: Response) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user!.uid;

    // Verify user is part of conversation
    const conversation = await db
      .collection("conversations")
      .doc(conversationId)
      .get();

    if (!conversation.exists) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    const data = conversation.data();
    if (!data?.participantIds.includes(userId)) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Delete all messages in the conversation
    const messagesSnapshot = await db
      .collection("conversations")
      .doc(conversationId)
      .collection("messages")
      .get();

    const batch = db.batch();
    messagesSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    // Delete the conversation
    batch.delete(db.collection("conversations").doc(conversationId));

    await batch.commit();

    res.json({ success: true });
  } catch (error: any) {
    console.error("Delete conversation error:", error);
    res.status(500).json({ message: error.message });
  }
};

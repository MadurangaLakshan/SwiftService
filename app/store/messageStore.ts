import { create } from "zustand";
import { auth } from "../config/firebase";
import { getConversations } from "../services/messageService";
import socketService from "../socket/socketService";

interface Conversation {
  _id: string;
  participantIds: string[];
  participants: {
    [userId: string]: {
      name: string;
      photo: string | null;
      userType: "provider" | "customer";
    };
  };
  lastMessage: string | null;
  lastMessageTime: Date;
  unreadCount: {
    [userId: string]: number;
  };
}

interface MessageState {
  conversations: Conversation[];
  unreadCount: number;
  loading: boolean;
  isInitialized: boolean;

  // Actions
  fetchConversations: () => Promise<void>;
  markConversationAsRead: (conversationId: string) => void;
  updateUnreadCount: () => void;
  initializeSocketListeners: () => void;
  cleanupSocketListeners: () => void;
}

export const useMessageStore = create<MessageState>((set, get) => ({
  conversations: [],
  unreadCount: 0,
  loading: false,
  isInitialized: false,

  fetchConversations: async () => {
    const currentUserId = auth.currentUser?.uid;
    if (!currentUserId) return;

    set({ loading: true });

    try {
      const response = await getConversations();

      if (response.success && response.data) {
        const filtered = response.data.filter(
          (conv: Conversation) =>
            conv.lastMessage !== null && conv.lastMessage !== ""
        );

        const sortedConversations = filtered.sort(
          (a: Conversation, b: Conversation) =>
            new Date(b.lastMessageTime).getTime() -
            new Date(a.lastMessageTime).getTime()
        );

        set({ conversations: sortedConversations });
        get().updateUnreadCount();

        // Join all conversations via socket
        const conversationIds = sortedConversations.map(
          (conv: Conversation) => conv._id
        );
        if (conversationIds.length > 0) {
          socketService.joinConversations(conversationIds);
        }
      }
    } catch (error) {
      console.error("Error loading conversations:", error);
    } finally {
      set({ loading: false });
    }
  },

  markConversationAsRead: (conversationId: string) => {
    const currentUserId = auth.currentUser?.uid;
    if (!currentUserId) return;

    set((state) => ({
      conversations: state.conversations.map((conv) =>
        conv._id === conversationId
          ? {
              ...conv,
              unreadCount: {
                ...conv.unreadCount,
                [currentUserId]: 0,
              },
            }
          : conv
      ),
    }));

    // Immediately update badge count
    get().updateUnreadCount();

    console.log("✅ Marked conversation as read locally");
  },

  updateUnreadCount: () => {
    const currentUserId = auth.currentUser?.uid;
    if (!currentUserId) return;

    const { conversations } = get();

    const totalUnread = conversations.filter(
      (conv) => conv.unreadCount && (conv.unreadCount[currentUserId] || 0) > 0
    ).length;

    set({ unreadCount: totalUnread });
    console.log("🔔 Updated badge count:", totalUnread);
  },

  initializeSocketListeners: () => {
    if (get().isInitialized) return;

    const handleConversationUpdate = (data: any) => {
      console.log("🔔 Conversation updated via socket");
      get().fetchConversations();
    };

    const handleMessageRead = (data: any) => {
      console.log("🔔 Message read event received");
      // Refetch to get accurate data from server
      get().fetchConversations();
    };

    socketService.onConversationUpdate(handleConversationUpdate);
    socketService.onMessageRead(handleMessageRead);

    set({ isInitialized: true });
    console.log("✅ Socket listeners initialized");
  },

  cleanupSocketListeners: () => {
    socketService.removeMessageListener("conversation-update");
    socketService.removeMessageListener("message-read");
    set({ isInitialized: false });
    console.log("🧹 Socket listeners cleaned up");
  },
}));

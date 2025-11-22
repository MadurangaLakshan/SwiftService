import { io, Socket } from "socket.io-client";
import { auth } from "../config/firebase";

const BASE_URL = __DEV__
  ? process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000/api"
  : "https://production-domain.com";

const SOCKET_URL = (BASE_URL ?? "").replace(/\/api$/, "");

class SocketService {
  private socket: Socket | null = null;
  private messageListeners: Map<string, Function> = new Map();
  private reconnectAttempt = 0;
  private maxReconnectAttempts = 5;

  async connect() {
    if (this.socket?.connected) {
      console.log("Socket already connected");
      return;
    }

    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        throw new Error("No authentication token");
      }

      console.log("🔌 Connecting to:", SOCKET_URL);

      this.socket = io(SOCKET_URL, {
        auth: { token },
        transports: ["websocket", "polling"], // Try websocket first, fallback to polling
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
        forceNew: true,
      });

      this.setupEventListeners();
    } catch (error) {
      console.error("Failed to initialize socket:", error);
      throw error;
    }
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on("connect", () => {
      console.log("✅ Socket connected:", this.socket?.id);
      this.reconnectAttempt = 0;
    });

    this.socket.on("disconnect", (reason) => {
      console.log("❌ Socket disconnected:", reason);
      if (reason === "io server disconnect") {
        // Server disconnected, manual reconnect needed
        this.socket?.connect();
      }
    });

    this.socket.on("connect_error", (error) => {
      this.reconnectAttempt++;
      console.error(
        `Socket connection error (attempt ${this.reconnectAttempt}/${this.maxReconnectAttempts}):`,
        error.message
      );

      // Provide helpful error messages
      if (error.message.includes("websocket error")) {
        console.log(
          "💡 Tip: Check if your server is running and the IP address is correct"
        );
        console.log("💡 Current URL:", SOCKET_URL);
      }
    });

    this.socket.on("reconnect_attempt", (attempt) => {
      console.log(`🔄 Reconnection attempt ${attempt}`);
    });

    this.socket.on("reconnect_failed", () => {
      console.error("❌ Failed to reconnect after maximum attempts");
    });

    this.socket.on("new-message", (message) => {
      const listener = this.messageListeners.get(message.conversationId);
      if (listener) {
        listener(message);
      }
    });

    this.socket.on("conversation-updated", (data) => {
      const listener = this.messageListeners.get("conversation-update");
      if (listener) {
        listener(data);
      }
    });

    this.socket.on("message-read", (data) => {
      const listener = this.messageListeners.get("message-read");
      if (listener) {
        listener(data);
      }
    });

    this.socket.on("error", (error) => {
      console.error("Socket error:", error);
    });

    this.socket.on("user-typing", (data) => {
      const listener = this.messageListeners.get("typing");
      if (listener) {
        listener(data);
      }
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.messageListeners.clear();
      console.log("Socket disconnected and cleaned up");
    }
  }

  joinConversations(conversationIds: string[]) {
    if (this.socket?.connected) {
      this.socket.emit("join-conversations", conversationIds);
      console.log(`Joined ${conversationIds.length} conversations`);
    } else {
      console.warn("Cannot join conversations: Socket not connected");
    }
  }

  sendMessage(conversationId: string, text: string) {
    if (this.socket?.connected) {
      this.socket.emit("send-message", { conversationId, text });
    } else {
      console.warn("Cannot send message: Socket not connected");
      throw new Error("Socket not connected");
    }
  }

  onMessage(conversationId: string, callback: (message: any) => void) {
    this.messageListeners.set(conversationId, callback);
  }

  onConversationUpdate(callback: (data: any) => void) {
    this.messageListeners.set("conversation-update", callback);
  }

  onMessageRead(callback: (data: any) => void) {
    this.messageListeners.set("message-read", callback);
  }

  removeMessageListener(conversationId: string) {
    this.messageListeners.delete(conversationId);
  }

  typing(conversationId: string, isTyping: boolean) {
    if (this.socket?.connected) {
      this.socket.emit("typing", { conversationId, isTyping });
    }
  }

  onTyping(callback: (data: { userId: string; isTyping: boolean }) => void) {
    this.messageListeners.set("typing", callback);
  }

  markAsRead(conversationId: string) {
    if (this.socket?.connected) {
      this.socket.emit("mark-as-read", conversationId);
    }
  }

  get isConnected() {
    return this.socket?.connected || false;
  }

  // Helper method to check connection status
  getConnectionStatus() {
    return {
      connected: this.socket?.connected || false,
      id: this.socket?.id || null,
      reconnectAttempt: this.reconnectAttempt,
    };
  }
}

export default new SocketService();

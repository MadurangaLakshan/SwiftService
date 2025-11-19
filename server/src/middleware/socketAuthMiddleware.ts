import { Socket } from "socket.io";
import auth from "../config/firebase";

export interface AuthenticatedSocket extends Socket {
  userId?: string;
}

export const authenticateSocket = async (
  socket: AuthenticatedSocket,
  next: (err?: Error) => void
) => {
  try {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error("Authentication token missing"));
    }

    // Verify Firebase token
    const decodedToken = await auth.auth().verifyIdToken(token);
    socket.userId = decodedToken.uid;

    console.log(`🔐 Socket authenticated for user: ${socket.userId}`);
    next();
  } catch (error) {
    console.error("Socket authentication error:", error);
    next(new Error("Authentication failed"));
  }
};

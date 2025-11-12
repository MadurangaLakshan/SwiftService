import express from "express";
import {
  createConversation,
  getConversations,
  getMessages,
  markAsRead,
  sendMessage,
} from "../controllers/messageController";
import { authenticateUser } from "../middleware/authMiddleware";

const router = express.Router();

router.use(authenticateUser);

router.post("/conversations", createConversation);
router.get("/conversations", getConversations);
router.post("/messages", sendMessage);
router.get("/messages/:conversationId", getMessages);
router.patch("/conversations/:conversationId/read", markAsRead);

export default router;

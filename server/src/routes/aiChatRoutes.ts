import express from "express";
import { chatbotAnalyze } from "../controllers/aiChatController";
import { authenticateUser } from "../middleware/authMiddleware";

const router = express.Router();

router.post("/analyze", authenticateUser, chatbotAnalyze);

export default router;

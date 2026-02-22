import express from "express";
import * as notificationController from "../controllers/notificationController";
import { authenticateUser } from "../middleware/authMiddleware";

const router = express.Router();

// Get all notifications for the authenticated user
router.get("/", authenticateUser, notificationController.getAllNotifications);

// Get unread count for the authenticated user
router.get(
  "/unread-count",
  authenticateUser,
  notificationController.getUnreadCount,
);

// Mark a notification as read
router.put(
  "/:notificationId/read",
  authenticateUser,
  notificationController.markAsRead,
);

// Mark all notifications as read
router.put(
  "/mark-all-read",
  authenticateUser,
  notificationController.markAllAsRead,
);

// Delete a notification
router.delete(
  "/:notificationId",
  authenticateUser,
  notificationController.deleteNotification,
);

export default router;

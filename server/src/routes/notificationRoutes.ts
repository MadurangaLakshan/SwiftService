import express from "express";
import { authenticateUser, AuthRequest } from "../middleware/authMiddleware";
import Notification from "../models/Notification";

const router = express.Router();

// Get all notifications for a user
router.get("/", authenticateUser, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.uid;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      success: true,
      data: notifications,
    });
  } catch (error: any) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({
      error: "Failed to fetch notifications",
      details: error.message,
    });
  }
});

// Get unread notification count
router.get("/unread-count", authenticateUser, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.uid;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const count = await Notification.countDocuments({ userId, read: false });

    res.json({
      success: true,
      data: { count },
    });
  } catch (error: any) {
    console.error("Error fetching unread count:", error);
    res.status(500).json({
      error: "Failed to fetch unread count",
      details: error.message,
    });
  }
});

// Mark notification as read
router.put(
  "/:notificationId/read",
  authenticateUser,
  async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.uid;
      const { notificationId } = req.params;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const notification = await Notification.findOneAndUpdate(
        { _id: notificationId, userId },
        { read: true },
        { new: true }
      );

      if (!notification) {
        return res.status(404).json({ error: "Notification not found" });
      }

      res.json({
        success: true,
        data: notification,
      });
    } catch (error: any) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({
        error: "Failed to mark notification as read",
        details: error.message,
      });
    }
  }
);

// Mark all notifications as read
router.put(
  "/mark-all-read",
  authenticateUser,
  async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.uid;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      await Notification.updateMany({ userId, read: false }, { read: true });

      res.json({
        success: true,
        message: "All notifications marked as read",
      });
    } catch (error: any) {
      console.error("Error marking all notifications as read:", error);
      res.status(500).json({
        error: "Failed to mark all notifications as read",
        details: error.message,
      });
    }
  }
);

// Delete a notification
router.delete(
  "/:notificationId",
  authenticateUser,
  async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.uid;
      const { notificationId } = req.params;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const notification = await Notification.findOneAndDelete({
        _id: notificationId,
        userId,
      });

      if (!notification) {
        return res.status(404).json({ error: "Notification not found" });
      }

      res.json({
        success: true,
        message: "Notification deleted",
      });
    } catch (error: any) {
      console.error("Error deleting notification:", error);
      res.status(500).json({
        error: "Failed to delete notification",
        details: error.message,
      });
    }
  }
);

export default router;

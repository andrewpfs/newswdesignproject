const express = require("express");
const { Notification } = require("../models");
const { authenticateToken } = require("./auth");

const router = express.Router();

// Get all notifications for a user
router.get("/", authenticateToken, async (req, res) => {
  try {
    // Get userId from query or use authenticated user's ID
    const userId = req.query.userId || req.user.sub;

    // Ensure user can only see their own notifications (unless admin)
    const targetUserId = req.user.role === "admin" ? (req.query.userId || req.user.sub) : req.user.sub;

    const notifications = await Notification.findAll({
      where: { userId: targetUserId },
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({
      ok: true,
      data: notifications,
    });
  } catch (error) {
    console.error("Get notifications error:", error);
    return res.status(500).json({
      ok: false,
      error: "Failed to fetch notifications",
    });
  }
});

// Create a notification
router.post("/", async (req, res) => {
  try {
    const { userId, message, type, eventName } = req.body;

    if (!userId || !message || !type) {
      return res.status(400).json({
        ok: false,
        error: "User ID, message, and type are required",
      });
    }

    const notification = await Notification.create({
      userId,
      message,
      type,
      eventName,
      read: false,
    });

    return res.status(201).json({
      ok: true,
      data: notification,
      message: "Notification created",
    });
  } catch (error) {
    console.error("Create notification error:", error);
    return res.status(500).json({
      ok: false,
      error: "Failed to create notification",
    });
  }
});

// Mark notification as read
router.put("/:id/read", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findByPk(id);

    if (!notification) {
      return res.status(404).json({
        ok: false,
        error: "Notification not found",
      });
    }

    // Ensure user can only mark their own notifications (unless admin)
    if (req.user.role !== "admin" && notification.userId !== req.user.sub) {
      return res.status(403).json({
        ok: false,
        error: "You can only mark your own notifications as read",
      });
    }

    notification.read = true;
    await notification.save();

    return res.status(200).json({
      ok: true,
      data: notification,
      message: "Notification marked as read",
    });
  } catch (error) {
    console.error("Mark as read error:", error);
    return res.status(500).json({
      ok: false,
      error: "Failed to mark as read",
    });
  }
});

// Delete notification
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findByPk(id);

    if (!notification) {
      return res.status(404).json({
        ok: false,
        error: "Notification not found",
      });
    }

    // Ensure user can only delete their own notifications (unless admin)
    if (req.user.role !== "admin" && notification.userId !== req.user.sub) {
      return res.status(403).json({
        ok: false,
        error: "You can only delete your own notifications",
      });
    }

    await notification.destroy();

    return res.status(200).json({
      ok: true,
      message: "Notification deleted",
    });
  } catch (error) {
    console.error("Delete notification error:", error);
    return res.status(500).json({
      ok: false,
      error: "Failed to delete notification",
    });
  }
});

module.exports = router;


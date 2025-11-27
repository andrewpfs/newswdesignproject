const express = require("express");
const { Notification } = require("../models");

const router = express.Router();

// Get all notifications for a user
router.get("/", async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        ok: false,
        error: "User ID is required",
      });
    }

    const notifications = await Notification.findAll({
      where: { userId },
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
router.put("/:id/read", async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findByPk(id);

    if (!notification) {
      return res.status(404).json({
        ok: false,
        error: "Notification not found",
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
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findByPk(id);

    if (!notification) {
      return res.status(404).json({
        ok: false,
        error: "Notification not found",
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


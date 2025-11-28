const express = require("express");
const { VolunteerHistory } = require("../models");
const { authenticateToken } = require("./auth");

const router = express.Router();

// Get volunteer history
router.get("/", authenticateToken, async (req, res) => {
  try {
    // Get userId from query or use authenticated user's ID
    const userId = req.query.userId || req.user.sub;

    // Ensure user can only see their own history (unless admin)
    const targetUserId = req.user.role === "admin" ? (req.query.userId || req.user.sub) : req.user.sub;

    const history = await VolunteerHistory.findAll({
      where: { userId: targetUserId },
      order: [["eventDate", "DESC"]],
    });

    // Format times to strings for consistent display
    const formattedHistory = history.map(record => {
      const recordData = record.toJSON();
      
      // Format startTime and endTime to HH:MM:SS strings
      // SQL Server TIME comes as string, but Sequelize might convert it
      if (recordData.startTime) {
        if (recordData.startTime instanceof Date) {
          // If it's a Date object, use UTC methods to avoid timezone issues
          // TIME fields don't have date info, so we use UTC to preserve the time
          const hours = recordData.startTime.getUTCHours().toString().padStart(2, '0');
          const minutes = recordData.startTime.getUTCMinutes().toString().padStart(2, '0');
          const seconds = recordData.startTime.getUTCSeconds().toString().padStart(2, '0');
          recordData.startTime = `${hours}:${minutes}:${seconds}`;
        } else if (typeof recordData.startTime === 'string') {
          // Already a string, ensure it's in HH:MM:SS format
          const parts = recordData.startTime.split(':');
          if (parts.length >= 2) {
            const hours = parts[0].padStart(2, '0');
            const minutes = (parts[1] || '00').padStart(2, '0');
            const seconds = (parts[2] || '00').padStart(2, '0');
            recordData.startTime = `${hours}:${minutes}:${seconds}`;
          }
        }
      }
      
      if (recordData.endTime) {
        if (recordData.endTime instanceof Date) {
          // Use UTC methods to avoid timezone issues
          const hours = recordData.endTime.getUTCHours().toString().padStart(2, '0');
          const minutes = recordData.endTime.getUTCMinutes().toString().padStart(2, '0');
          const seconds = recordData.endTime.getUTCSeconds().toString().padStart(2, '0');
          recordData.endTime = `${hours}:${minutes}:${seconds}`;
        } else if (typeof recordData.endTime === 'string') {
          // Already a string, ensure it's in HH:MM:SS format
          const parts = recordData.endTime.split(':');
          if (parts.length >= 2) {
            const hours = parts[0].padStart(2, '0');
            const minutes = (parts[1] || '00').padStart(2, '0');
            const seconds = (parts[2] || '00').padStart(2, '0');
            recordData.endTime = `${hours}:${minutes}:${seconds}`;
          }
        }
      }
      
      return recordData;
    });

    return res.status(200).json({
      ok: true,
      data: formattedHistory,
    });
  } catch (error) {
    console.error("Get history error:", error);
    return res.status(500).json({
      ok: false,
      error: "Failed to fetch history",
    });
  }
});

// Create history record (log participation)
router.post("/", authenticateToken, async (req, res) => {
  try {
    const {
      userId,
      eventId,
      eventName,
      eventDescription,
      eventLocation,
      requiredSkills,
      urgency,
      eventDate,
      startTime,
      endTime,
      status,
    } = req.body;

    if (!userId || !eventId || !eventName) {
      return res.status(400).json({
        ok: false,
        error: "User ID, Event ID, and Event Name are required",
      });
    }

    const historyRecord = await VolunteerHistory.create({
      userId,
      eventId,
      eventName,
      eventDescription,
      eventLocation,
      requiredSkills,
      urgency,
      eventDate,
      startTime,
      endTime,
      status: status || "upcoming",
    });

    return res.status(201).json({
      ok: true,
      data: historyRecord,
      message: "History record created",
    });
  } catch (error) {
    console.error("Create history error:", error);
    return res.status(500).json({
      ok: false,
      error: "Failed to create history record",
    });
  }
});

// Update participation status
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        ok: false,
        error: "Status is required",
      });
    }

    const historyRecord = await VolunteerHistory.findByPk(id);

    if (!historyRecord) {
      return res.status(404).json({
        ok: false,
        error: "History record not found",
      });
    }

    // Ensure user can only update their own history (unless admin)
    if (req.user.role !== "admin" && historyRecord.userId !== req.user.sub) {
      return res.status(403).json({
        ok: false,
        error: "You can only update your own history",
      });
    }

    historyRecord.status = status;
    await historyRecord.save();

    return res.status(200).json({
      ok: true,
      data: historyRecord,
      message: "Status updated",
    });
  } catch (error) {
    console.error("Update history error:", error);
    return res.status(500).json({
      ok: false,
      error: "Failed to update history",
    });
  }
});

module.exports = router;


const express = require("express");
const { VolunteerHistory } = require("../models");

const router = express.Router();

// Get volunteer history
router.get("/", async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        ok: false,
        error: "User ID is required",
      });
    }

    const history = await VolunteerHistory.findAll({
      where: { userId },
      order: [["eventDate", "DESC"]],
    });

    return res.status(200).json({
      ok: true,
      data: history,
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
router.post("/", async (req, res) => {
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
router.put("/:id", async (req, res) => {
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


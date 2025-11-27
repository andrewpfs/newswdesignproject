const express = require("express");
const { UserProfile, Event, VolunteerHistory } = require("../models");
const { authenticateToken, requireAdmin } = require("../middleware/rbac");

const router = express.Router();

// Get all volunteers with profiles (admin only)
router.get("/volunteers", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const volunteers = await UserProfile.findAll({
      attributes: [
        "userId",
        "fullName",
        "city",
        "state",
        "skills",
        "availability",
        "preferences",
      ],
    });

    return res.status(200).json({
      ok: true,
      data: volunteers,
    });
  } catch (error) {
    console.error("Get volunteers error:", error);
    return res.status(500).json({
      ok: false,
      error: "Failed to fetch volunteers",
    });
  }
});

// Get matching suggestions for an event (admin only)
router.get("/suggestions/:eventId", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { eventId } = req.params;

    // Get event details
    const event = await Event.findByPk(eventId);

    if (!event) {
      return res.status(404).json({
        ok: false,
        error: "Event not found",
      });
    }

    // Get all volunteers
    const volunteers = await UserProfile.findAll();

    // Check who's already assigned
    const assignedVolunteers = await VolunteerHistory.findAll({
      where: { eventId },
      attributes: ["userId"],
    });

    const assignedUserIds = assignedVolunteers.map((v) => v.userId);

    // Filter and score volunteers
    const eventSkills = event.requiredSkills || [];
    const eventDate = new Date(event.eventDate);

    const matchedVolunteers = volunteers
      .map((volunteer) => {
        const volSkills = volunteer.skills || [];
        const volAvailability = volunteer.availability || [];

        // Calculate skill match
        const matchingSkills = volSkills.filter((skill) =>
          eventSkills.includes(skill)
        );
        const skillScore =
          eventSkills.length > 0
            ? (matchingSkills.length / eventSkills.length) * 100
            : 0;

        // Check availability
        const isAvailable = volAvailability.some((date) => {
          const availDate = new Date(date);
          return availDate.toDateString() === eventDate.toDateString();
        });

        return {
          userId: volunteer.userId,
          fullName: volunteer.fullName,
          city: volunteer.city,
          state: volunteer.state,
          skills: volSkills,
          availability: volAvailability,
          preferences: volunteer.preferences,
          matchScore: skillScore,
          isAvailable,
          assigned: assignedUserIds.includes(volunteer.userId),
        };
      })
      .filter((v) => v.matchScore > 0 || v.isAvailable) // Only show volunteers with some match
      .sort((a, b) => b.matchScore - a.matchScore); // Sort by match score

    return res.status(200).json({
      ok: true,
      data: matchedVolunteers,
    });
  } catch (error) {
    console.error("Get suggestions error:", error);
    return res.status(500).json({
      ok: false,
      error: "Failed to get suggestions",
    });
  }
});

// Assign volunteer to event (admin only)
router.post("/assign", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { volunteerId, eventId } = req.body;

    if (!volunteerId || !eventId) {
      return res.status(400).json({
        ok: false,
        error: "Volunteer ID and Event ID are required",
      });
    }

    // Check if already assigned
    const existing = await VolunteerHistory.findOne({
      where: { userId: volunteerId, eventId },
    });

    if (existing) {
      return res.status(409).json({
        ok: false,
        error: "Volunteer already assigned to this event",
      });
    }

    // Get event details
    const event = await Event.findByPk(eventId);

    if (!event) {
      return res.status(404).json({
        ok: false,
        error: "Event not found",
      });
    }

    // Create history record
    const historyRecord = await VolunteerHistory.create({
      userId: volunteerId,
      eventId,
      eventName: event.eventName,
      eventDescription: event.eventDescription,
      eventLocation: event.eventLocation,
      requiredSkills: event.requiredSkills,
      urgency: event.urgency,
      eventDate: event.eventDate,
      startTime: event.startTime,
      endTime: event.endTime,
      status: "upcoming",
    });

    // TODO: Create notification for the volunteer

    return res.status(201).json({
      ok: true,
      data: historyRecord,
      message: "Volunteer assigned successfully",
    });
  } catch (error) {
    console.error("Assign volunteer error:", error);
    return res.status(500).json({
      ok: false,
      error: "Failed to assign volunteer",
    });
  }
});

module.exports = router;


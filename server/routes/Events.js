const express = require("express");
const router = express.Router();
const { Event } = require("../models");
const { authenticateToken } = require("./auth");

// Constants for validation
const ALLOWED_SKILLS = [
  "Communication", "Teamwork", "Organized",
  "Adaptability", "Driving", "English", "Spanish"
];
const ALLOWED_URGENCIES = ["low", "medium", "high", "critical"];

// Get all events
router.get("/", authenticateToken, async (req, res) => {
  try {
    const listOfEvents = await Event.findAll();
    return res.status(200).json({
      success: true,
      data: listOfEvents
    });
  } catch (error) {
    console.error("Error fetching events:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch events"
    });
  }
});

// Get single event by ID
router.get("/:id", async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.id);
    if (!event) {
      return res.status(404).json({
        success: false,
        error: "Event not found"
      });
    }
    return res.status(200).json({
      success: true,
      data: event
    });
  } catch (error) {
    console.error("Error fetching event:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch event"
    });
  }
});

// Create new event with validation (admin only)
router.post("/", authenticateToken, async (req, res) => {
  // Check if user is admin
  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      error: "Only admins can create events"
    });
  }

  try {
    const {
      eventName,
      eventDescription,
      eventLocation,
      requiredSkills,
      urgency,
      eventDate,
      startTime,
      endTime
    } = req.body;

    const errors = [];

    // Validation
    if (!eventName || eventName.trim().length === 0)
      errors.push("Event name is required.");
    else if (eventName.length > 100)
      errors.push("Event name must be under 100 characters.");

    if (!eventDescription || eventDescription.trim().length === 0)
      errors.push("Event description is required.");

    if (!eventLocation || eventLocation.trim().length === 0)
      errors.push("Event location is required.");

    if (!requiredSkills || (Array.isArray(requiredSkills) && requiredSkills.length === 0))
      errors.push("At least one skill must be selected.");
    else {
      const skills = Array.isArray(requiredSkills) ? requiredSkills : [requiredSkills];
      for (const s of skills) {
        if (!ALLOWED_SKILLS.includes(s)) {
          errors.push(`Invalid skill: ${s}`);
        }
      }
    }

    if (!urgency || !ALLOWED_URGENCIES.includes(urgency))
      errors.push("Invalid urgency level.");

    if (!eventDate)
      errors.push("Event date is required.");
    else {
      const eventDateObj = new Date(eventDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (eventDateObj < today)
        errors.push("Event date cannot be in the past.");
    }

    if (!startTime || !endTime) {
      errors.push("Start and end times are required.");
    } else {
      // Normalize time format and compare (convert to minutes for proper comparison)
      const parseTime = (timeStr) => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + (minutes || 0);
      };
      
      try {
        const startMinutes = parseTime(startTime);
        const endMinutes = parseTime(endTime);
        
        if (isNaN(startMinutes) || isNaN(endMinutes)) {
          errors.push("Invalid time format. Use HH:MM format (e.g., 09:00 or 14:30).");
        } else if (startMinutes >= endMinutes) {
          errors.push("End time must be after start time.");
        }
      } catch (e) {
        errors.push("Invalid time format. Use HH:MM format (e.g., 09:00 or 14:30).");
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        errors
      });
    }

    // Normalize time format for database (ensure HH:MM:SS format)
    const normalizeTime = (timeStr) => {
      // Handle formats like "9:00", "09:00", "9:00:00"
      const parts = timeStr.split(':');
      const hours = parts[0].padStart(2, '0');
      const minutes = (parts[1] || '00').padStart(2, '0');
      const seconds = (parts[2] || '00').padStart(2, '0');
      return `${hours}:${minutes}:${seconds}`;
    };

    // Create event
    const newEvent = await Event.create({
      eventName,
      eventDescription,
      eventLocation,
      requiredSkills,
      urgency,
      eventDate,
      startTime: normalizeTime(startTime),
      endTime: normalizeTime(endTime)
    });

    console.log("Event created successfully:", newEvent);

    return res.status(201).json({
      success: true,
      message: "Event created successfully!",
      data: newEvent
    });
  } catch (error) {
    console.error("Error creating event:", error);
    console.error("Error stack:", error.stack);
    console.error("Request body:", req.body);
    return res.status(500).json({
      success: false,
      error: "Failed to create event",
      details: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
});

// Update event
router.put("/:id", async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.id);
    if (!event) {
      return res.status(404).json({
        success: false,
        error: "Event not found"
      });
    }

    await event.update(req.body);
    return res.status(200).json({
      success: true,
      message: "Event updated successfully",
      data: event
    });
  } catch (error) {
    console.error("Error updating event:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to update event"
    });
  }
});

// Delete event
router.delete("/:id", async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.id);
    if (!event) {
      return res.status(404).json({
        success: false,
        error: "Event not found"
      });
    }

    await event.destroy();
    return res.status(200).json({
      success: true,
      message: "Event deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting event:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to delete event"
    });
  }
});

module.exports = router;
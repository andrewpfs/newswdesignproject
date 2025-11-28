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
    // Parse requiredSkills - might be JSON string from database
    let eventSkills = [];
    if (Array.isArray(event.requiredSkills)) {
      eventSkills = event.requiredSkills;
    } else if (typeof event.requiredSkills === 'string') {
      try {
        eventSkills = JSON.parse(event.requiredSkills);
      } catch (e) {
        console.error("Error parsing event requiredSkills:", e);
        eventSkills = [];
      }
    }
    
    const eventDate = new Date(event.eventDate);

    const matchedVolunteers = volunteers
      .map((volunteer) => {
        // Parse volunteer skills - might be JSON string from database
        let volSkills = [];
        if (Array.isArray(volunteer.skills)) {
          volSkills = volunteer.skills;
        } else if (typeof volunteer.skills === 'string') {
          try {
            volSkills = JSON.parse(volunteer.skills);
          } catch (e) {
            volSkills = [];
          }
        }
        
        // Parse volunteer availability - might be JSON string from database
        let volAvailability = [];
        if (Array.isArray(volunteer.availability)) {
          volAvailability = volunteer.availability;
        } else if (typeof volunteer.availability === 'string') {
          try {
            volAvailability = JSON.parse(volunteer.availability);
          } catch (e) {
            volAvailability = [];
          }
        }

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
    let { volunteerId, eventId } = req.body;

    // Ensure IDs are integers
    volunteerId = parseInt(volunteerId, 10);
    eventId = parseInt(eventId, 10);

    if (!volunteerId || !eventId || isNaN(volunteerId) || isNaN(eventId)) {
      return res.status(400).json({
        ok: false,
        error: "Valid Volunteer ID and Event ID are required",
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

    // Verify user exists
    const { User } = require("../models");
    const user = await User.findByPk(volunteerId);
    if (!user) {
      return res.status(404).json({
        ok: false,
        error: "Volunteer not found",
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

    // Parse requiredSkills if it's a JSON string
    let requiredSkills = event.requiredSkills;
    if (typeof requiredSkills === 'string') {
      try {
        requiredSkills = JSON.parse(requiredSkills);
      } catch (e) {
        console.error("Error parsing requiredSkills:", e);
        requiredSkills = [];
      }
    }
    
    // Ensure requiredSkills is an array
    if (!Array.isArray(requiredSkills)) {
      requiredSkills = [];
    }

    // Validate required fields
    if (!event.eventName || !event.eventDescription || !event.eventLocation || !event.eventDate) {
      return res.status(400).json({
        ok: false,
        error: "Event is missing required fields",
      });
    }

    // Validate string lengths
    if (event.eventName.length > 100) {
      return res.status(400).json({
        ok: false,
        error: "Event name is too long (max 100 characters)",
      });
    }

    // Format date if needed (ensure it's a valid date string)
    let eventDate = event.eventDate;
    if (eventDate instanceof Date) {
      eventDate = eventDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD
    } else if (typeof eventDate === 'string') {
      // Ensure date is in YYYY-MM-DD format
      const dateObj = new Date(eventDate);
      if (isNaN(dateObj.getTime())) {
        return res.status(400).json({
          ok: false,
          error: "Invalid event date format",
        });
      }
      eventDate = dateObj.toISOString().split('T')[0];
    }

    // Ensure urgency is valid and within length limit
    let urgency = (event.urgency || "medium").toLowerCase();
    if (urgency.length > 20) {
      urgency = urgency.substring(0, 20);
    }

    // Convert time values to TIME string format (HH:MM:SS) for SQL Server
    // SQL Server TIME type expects string format, not Date objects
    const formatTimeForSQL = (timeValue) => {
      if (!timeValue) return null;
      
      // If it's already a string in HH:MM format, convert to HH:MM:SS
      if (typeof timeValue === 'string') {
        const parts = timeValue.split(':');
        const hours = parts[0].padStart(2, '0');
        const minutes = (parts[1] || '00').padStart(2, '0');
        const seconds = (parts[2] || '00').padStart(2, '0');
        return `${hours}:${minutes}:${seconds}`;
      }
      
      // If it's a Date object, extract time portion
      if (timeValue instanceof Date) {
        const hours = timeValue.getHours().toString().padStart(2, '0');
        const minutes = timeValue.getMinutes().toString().padStart(2, '0');
        const seconds = timeValue.getSeconds().toString().padStart(2, '0');
        return `${hours}:${minutes}:${seconds}`;
      }
      
      return null;
    };

    const startTimeFormatted = formatTimeForSQL(event.startTime);
    const endTimeFormatted = formatTimeForSQL(event.endTime);

    // Create history record
    // Sequelize will automatically handle JSON serialization and field name conversion (underscored: true)
    const historyRecord = await VolunteerHistory.create({
      userId: volunteerId,
      eventId: eventId,
      eventName: event.eventName.trim().substring(0, 100),
      eventDescription: event.eventDescription.trim(),
      eventLocation: event.eventLocation.trim().substring(0, 255),
      requiredSkills: requiredSkills, // Sequelize will stringify this JSON field
      urgency: urgency,
      eventDate: eventDate,
      startTime: startTimeFormatted,
      endTime: endTimeFormatted,
      status: "upcoming",
    });

    // Create notification for the volunteer
    const { Notification } = require("../models");
    const eventDateFormatted = new Date(eventDate).toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    // Format time for notification (convert 24-hour to 12-hour with AM/PM)
    // Use the original event.startTime string, not the formatted one (to avoid timezone issues)
    let timeText = '';
    if (event.startTime) {
      // Parse the original time string directly
      let timeStr = event.startTime;
      if (typeof timeStr === 'string') {
        const timeParts = timeStr.split(':');
        const hour24 = parseInt(timeParts[0]) || 0;
        const minutes = (timeParts[1] || '00').padStart(2, '0');
        const hour12 = hour24 === 0 ? 12 : (hour24 > 12 ? hour24 - 12 : hour24);
        const ampm = hour24 >= 12 ? 'PM' : 'AM';
        timeText = ` at ${hour12}:${minutes} ${ampm}`;
      }
    }
    
    await Notification.create({
      userId: volunteerId,
      message: `You have an event coming up! "${event.eventName}" on ${eventDateFormatted}${timeText} at ${event.eventLocation}.`,
      type: "assignment",
      eventName: event.eventName,
      read: false,
    });

    return res.status(201).json({
      ok: true,
      data: historyRecord,
      message: "Volunteer assigned successfully",
    });
  } catch (error) {
    console.error("Assign volunteer error:", error);
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    console.error("Request body:", req.body);
    
    // Handle Sequelize validation errors
    if (error.name === 'SequelizeValidationError') {
      const errors = error.errors.map(e => e.message).join(', ');
      return res.status(400).json({
        ok: false,
        error: `Validation error: ${errors}`,
      });
    }
    
    // Handle Sequelize database errors
    if (error.name === 'SequelizeDatabaseError') {
      console.error("Database error details:", error.original);
      console.error("SQL:", error.sql);
      return res.status(500).json({
        ok: false,
        error: "Database error occurred",
        details: process.env.NODE_ENV === "development" ? (error.original?.message || error.message) : undefined
      });
    }
    
    // Handle foreign key constraint errors
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({
        ok: false,
        error: "Invalid user or event ID",
        details: process.env.NODE_ENV === "development" ? error.message : undefined
      });
    }
    
    return res.status(500).json({
      ok: false,
      error: "Failed to assign volunteer",
      details: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
});

module.exports = router;


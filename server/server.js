
const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");

const db = require('./models')
const app = express();
const cors = require('cors')
const PORT = 3001;

app.use(express.json());
app.use(cors());

const eventsRouter = require("./routes/events");
app.use("/api/events", eventsRouter);
const profileRouter = require("./routes/profile");
app.use("/profile", profileRouter);
const { router: authRouter } = require("./routes/auth");
app.use("/api/auth", authRouter);
const matchingRouter = require("./routes/matching");
app.use("/api/matching", matchingRouter);
const notificationsRouter = require("./routes/notifications");
app.use("/api/notifications", notificationsRouter);
const historyRouter = require("./routes/history");
app.use("/api/history", historyRouter);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, "public")));

const ALLOWED_SKILLS = [
  "Communication", "Teamwork", "Organized",
  "Adaptability", "Driving", "English", "Spanish"
];
const ALLOWED_URGENCIES = ["low", "medium", "high", "critical"];

app.post("/create-event", (req, res) => {
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

  if (!startTime || !endTime)
    errors.push("Start and end times are required.");
  else if (startTime >= endTime)
    errors.push("End time must be after start time.");

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      errors
    });
  }

  const newEvent = {
    eventName,
    eventDescription,
    eventLocation,
    requiredSkills,
    urgency,
    eventDate,
    startTime,
    endTime
  };

  console.log("Event created successfully:", newEvent);

  return res.json({
    success: true,
    message: "Event created successfully!",
    event: newEvent
  });
});

db.sequelize.sync().then(() => {
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
});
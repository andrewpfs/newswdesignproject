
const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");

const db = require('./models')
const app = express();
const cors = require('cors')
const PORT = process.env.PORT || 3001;

// Middleware configuration - must be before routes
app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

// Route handlers
const eventsRouter = require("./routes/events");
app.use("/api/events", eventsRouter);

const profileRouter = require("./routes/profile");
app.use("/api/profile", profileRouter);

const { router: authRouter } = require("./routes/auth");
app.use("/api/auth", authRouter);

const matchingRouter = require("./routes/matching");
app.use("/api/matching", matchingRouter);

const notificationsRouter = require("./routes/notifications");
app.use("/api/notifications", notificationsRouter);

const historyRouter = require("./routes/history");
app.use("/api/history", historyRouter);

// Database connection and server start
db.sequelize.sync()
  .then(() => {
    console.log("Database connected successfully");
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Unable to connect to the database:", err);
    process.exit(1);
  });
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { User } = require("../models");

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

// Email validation
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Password validation
const isValidPassword = (password) => {
  return typeof password === "string" && password.length >= 8 && password.length <= 128;
};

// Register endpoint
router.post("/register", async (req, res) => {
  try {
    const { email, password, role } = req.body;

    // Validate email
    if (!email || !isValidEmail(email)) {
      return res.status(400).json({
        ok: false,
        error: "Invalid email format",
      });
    }

    // Validate password
    if (!isValidPassword(password)) {
      return res.status(400).json({
        ok: false,
        error: "Password must be between 8 and 128 characters",
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return res.status(409).json({
        ok: false,
        error: "Email already registered",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user (allow specifying role, default to volunteer)
    const userRole = role && ["volunteer", "admin"].includes(role) ? role : "volunteer";
    
    const user = await User.create({
      email: email.toLowerCase(),
      password_hash: hashedPassword,
      role: userRole,
    });

    return res.status(201).json({
      ok: true,
      data: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      message: "Registration successful",
    });
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({
      ok: false,
      error: "Server error during registration",
    });
  }
});

// Login endpoint
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !isValidEmail(email)) {
      return res.status(400).json({
        ok: false,
        error: "Invalid email format",
      });
    }

    if (!password || !isValidPassword(password)) {
      return res.status(400).json({
        ok: false,
        error: "Invalid password",
      });
    }

    // Find user
    const user = await User.findOne({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return res.status(401).json({
        ok: false,
        error: "Invalid credentials",
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({
        ok: false,
        error: "Invalid credentials",
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    return res.status(200).json({
      ok: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
      },
      message: "Login successful",
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      ok: false,
      error: "Server error during login",
    });
  }
});

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      ok: false,
      error: "Access token required",
    });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        ok: false,
        error: "Invalid or expired token",
      });
    }
    req.user = user;
    next();
  });
};

// Get current user endpoint
router.get("/me", authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.sub, {
      attributes: ["id", "email", "role", "createdAt"],
    });

    if (!user) {
      return res.status(404).json({
        ok: false,
        error: "User not found",
      });
    }

    return res.status(200).json({
      ok: true,
      data: user,
    });
  } catch (error) {
    console.error("Get user error:", error);
    return res.status(500).json({
      ok: false,
      error: "Server error",
    });
  }
});

module.exports = { router, authenticateToken };


const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

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

// Middleware to check if user is admin
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      ok: false,
      error: "Authentication required",
    });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({
      ok: false,
      error: "Admin access required",
    });
  }

  next();
};

// Middleware to check if user is volunteer or admin
const requireVolunteerOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      ok: false,
      error: "Authentication required",
    });
  }

  if (!["volunteer", "admin"].includes(req.user.role)) {
    return res.status(403).json({
      ok: false,
      error: "Volunteer or admin access required",
    });
  }

  next();
};

// Middleware to check if user owns the resource or is admin
const requireOwnerOrAdmin = (resourceUserIdField = "userId") => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        ok: false,
        error: "Authentication required",
      });
    }

    const resourceUserId =
      req.params[resourceUserIdField] ||
      req.body[resourceUserIdField] ||
      req.query[resourceUserIdField];

    if (
      req.user.role === "admin" ||
      req.user.sub === parseInt(resourceUserId)
    ) {
      next();
    } else {
      return res.status(403).json({
        ok: false,
        error: "You can only access your own resources",
      });
    }
  };
};

module.exports = {
  authenticateToken,
  requireAdmin,
  requireVolunteerOrAdmin,
  requireOwnerOrAdmin,
};


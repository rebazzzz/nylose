const jwt = require("jsonwebtoken");
const db = require("../database/init");

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await db.getUserById(decoded.userId);

    if (!user || !user.is_active) {
      return res.status(401).json({ error: "Invalid or inactive user" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Token verification error:", error);
    return res.status(403).json({ error: "Invalid or expired token" });
  }
};

// Middleware to check if user is admin
const requireAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
};

// Middleware to check if user is member or admin
const requireMember = (req, res, next) => {
  if (req.user.role !== "member" && req.user.role !== "admin") {
    return res.status(403).json({ error: "Member access required" });
  }
  next();
};

// Middleware to check if user owns the resource or is admin
const requireOwnershipOrAdmin = (resourceUserIdField) => {
  return (req, res, next) => {
    const resourceUserId =
      req.params[resourceUserIdField] || req.body[resourceUserIdField];

    if (req.user.role === "admin" || req.user.id == resourceUserId) {
      next();
    } else {
      return res.status(403).json({ error: "Access denied" });
    }
  };
};

// Input validation middleware
const validateRegistration = (req, res, next) => {
  const {
    email,
    password,
    first_name,
    last_name,
    personnummer,
    phone,
    address,
  } = req.body;

  const errors = [];

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    errors.push("Valid email is required");
  }

  // Password validation
  if (!password || password.length < 6) {
    errors.push("Password must be at least 6 characters long");
  }

  // Required fields
  if (!first_name || !last_name) {
    errors.push("First name and last name are required");
  }

  // Swedish personnummer validation (basic)
  const personnummerRegex = /^\d{8}-\d{4}$/;
  if (!personnummer || !personnummerRegex.test(personnummer)) {
    errors.push("Valid personnummer (YYYYMMDD-XXXX) is required");
  }

  // Phone validation (basic)
  const phoneRegex = /^[\+]?[0-9\s\-\(\)]{8,}$/;
  if (!phone || !phoneRegex.test(phone)) {
    errors.push("Valid phone number is required");
  }

  if (!address) {
    errors.push("Address is required");
  }

  if (errors.length > 0) {
    return res
      .status(400)
      .json({ error: "Validation failed", details: errors });
  }

  next();
};

const validateLogin = (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  next();
};

const validateSport = (req, res, next) => {
  const { name, description } = req.body;

  if (!name || name.trim().length === 0) {
    return res.status(400).json({ error: "Sport name is required" });
  }

  if (!description || description.trim().length === 0) {
    return res.status(400).json({ error: "Sport description is required" });
  }

  next();
};

const validateSchedule = (req, res, next) => {
  const { sport_id, day_of_week, start_time, end_time, age_group } = req.body;

  const days = [
    "Måndag",
    "Tisdag",
    "Onsdag",
    "Torsdag",
    "Fredag",
    "Lördag",
    "Söndag",
  ];
  if (!days.includes(day_of_week)) {
    return res.status(400).json({ error: "Invalid day of week" });
  }

  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  if (!timeRegex.test(start_time) || !timeRegex.test(end_time)) {
    return res
      .status(400)
      .json({ error: "Invalid time format (HH:MM required)" });
  }

  if (start_time >= end_time) {
    return res
      .status(400)
      .json({ error: "Start time must be before end time" });
  }

  next();
};

module.exports = {
  authenticateToken,
  requireAdmin,
  requireMember,
  requireOwnershipOrAdmin,
  validateRegistration,
  validateLogin,
  validateSport,
  validateSchedule,
};

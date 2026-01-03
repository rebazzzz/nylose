const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../database/init");
const { validateRegistration, validateLogin } = require("../middleware/auth");

const router = express.Router();

// Register new member
router.post("/register", validateRegistration, async (req, res) => {
  try {
    const {
      email,
      password,
      first_name,
      last_name,
      personnummer,
      phone,
      address,
    } = req.body;

    // Check if user already exists
    const existingUser = await db.getUserByEmail(email);
    if (existingUser) {
      return res
        .status(409)
        .json({ error: "User with this email already exists" });
    }

    // Check if personnummer already exists
    const existingPersonnummer = await db.getQuery(
      "SELECT id FROM users WHERE personnummer = ?",
      [personnummer]
    );
    if (existingPersonnummer) {
      return res
        .status(409)
        .json({ error: "User with this personnummer already exists" });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const result = await db.runQuery(
      "INSERT INTO users (email, password_hash, first_name, last_name, personnummer, phone, address, role) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [
        email,
        passwordHash,
        first_name,
        last_name,
        personnummer,
        phone,
        address,
        "member",
      ]
    );

    // Create membership (pending payment)
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 3); // 3 months membership

    await db.runQuery(
      "INSERT INTO memberships (user_id, start_date, end_date, status, payment_status, amount_paid) VALUES (?, ?, ?, ?, ?, ?)",
      [
        result.id,
        startDate.toISOString().split("T")[0],
        endDate.toISOString().split("T")[0],
        "active",
        "pending",
        600.0,
      ]
    );

    // Generate JWT token
    const token = jwt.sign(
      { userId: result.id, email, role: "member" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      message: "Registration successful",
      token,
      user: {
        id: result.id,
        email,
        first_name,
        last_name,
        role: "member",
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Registration failed" });
  }
});

// Login
router.post("/login", validateLogin, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await db.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Check if user is active
    if (!user.is_active) {
      return res.status(401).json({ error: "Account is deactivated" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Login failed" });
  }
});

// Get current user profile
router.get(
  "/profile",
  require("../middleware/auth").authenticateToken,
  async (req, res) => {
    try {
      const user = await db.getUserById(req.user.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Get membership info
      const membership = await db.getQuery(
        "SELECT * FROM memberships WHERE user_id = ? ORDER BY created_at DESC LIMIT 1",
        [user.id]
      );

      res.json({
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          phone: user.phone,
          address: user.address,
          personnummer: user.personnummer,
          role: user.role,
          is_active: user.is_active,
          created_at: user.created_at,
        },
        membership,
      });
    } catch (error) {
      console.error("Profile fetch error:", error);
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  }
);

// Update profile
router.put(
  "/profile",
  require("../middleware/auth").authenticateToken,
  async (req, res) => {
    try {
      const { first_name, last_name, phone, address } = req.body;
      const userId = req.user.id;

      await db.runQuery(
        "UPDATE users SET first_name = ?, last_name = ?, phone = ?, address = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [first_name, last_name, phone, address, userId]
      );

      const updatedUser = await db.getUserById(userId);
      res.json({
        message: "Profile updated successfully",
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          first_name: updatedUser.first_name,
          last_name: updatedUser.last_name,
          phone: updatedUser.phone,
          address: updatedUser.address,
          role: updatedUser.role,
        },
      });
    } catch (error) {
      console.error("Profile update error:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  }
);

module.exports = router;

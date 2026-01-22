const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../database/init");
const {
  validateRegistration,
  validateLogin,
  authenticateToken,
} = require("../middleware/auth");
// const emailService = require("../services/emailService"); // Disabled for now

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
      [personnummer],
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
      ],
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
      ],
    );

    // Generate JWT token
    const token = jwt.sign(
      { userId: result.id, email, role: "member" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
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

    // Send confirmation email (disabled for now - configure email credentials first)
    /*
    emailService
      .sendRegistrationConfirmation(email, {
        first_name,
        last_name,
        email,
        phone,
        membership_start: startDate.toISOString().split("T")[0],
        membership_end: endDate.toISOString().split("T")[0],
      })
      .catch((error) => {
        console.error("Failed to send registration email:", error);
      });
    */
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
      { expiresIn: "7d" },
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

// Process payment (mock implementation)
router.post(
  "/payment",
  require("../middleware/auth").authenticateToken,
  async (req, res) => {
    try {
      const { membership_id, payment_method } = req.body;
      const userId = req.user.id;

      // Verify membership belongs to user
      const membership = await db.getQuery(
        "SELECT * FROM memberships WHERE id = ? AND user_id = ?",
        [membership_id, userId],
      );

      if (!membership) {
        return res.status(404).json({ error: "Membership not found" });
      }

      if (membership.payment_status === "paid") {
        return res.status(400).json({ error: "Membership already paid" });
      }

      // Mock payment processing (in real implementation, integrate with Swish)
      const transactionId = `mock_txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Update membership payment status
      await db.runQuery(
        "UPDATE memberships SET payment_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        ["paid", membership_id],
      );

      // Create payment record
      await db.runQuery(
        "INSERT INTO payments (membership_id, amount, payment_method, transaction_id, status, payment_date) VALUES (?, ?, ?, ?, ?, ?)",
        [
          membership_id,
          membership.amount_paid,
          payment_method || "swish",
          transactionId,
          "completed",
          new Date().toISOString(),
        ],
      );

      // Get user info for email
      const user = await db.getUserById(userId);

      res.json({
        message: "Payment processed successfully",
        payment: {
          transaction_id: transactionId,
          amount: membership.amount_paid,
          payment_method: payment_method || "swish",
          status: "completed",
        },
      });

      // Send payment confirmation email (disabled for now - configure email credentials first)
      /*
    emailService
      .sendPaymentConfirmation(user.email, {
        first_name: user.first_name,
        last_name: user.last_name,
        amount: membership.amount_paid,
        payment_method: payment_method || "swish",
        transaction_id: transactionId,
        payment_date: new Date().toISOString(),
        membership_start: membership.start_date,
        membership_end: membership.end_date,
      })
      .catch((error) => {
        console.error("Failed to send payment confirmation email:", error);
      });
    */
    } catch (error) {
      console.error("Payment processing error:", error);
      res.status(500).json({ error: "Payment processing failed" });
    }
  },
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
        [first_name, last_name, phone, address, userId],
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
  },
);

module.exports = router;

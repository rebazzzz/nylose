const express = require("express");
const multer = require("multer");
const path = require("path");
const db = require("../database/init");
const {
  authenticateToken,
  requireAdmin,
  validateSport,
  validateSchedule,
} = require("../middleware/auth");

const router = express.Router();

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../../images"));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "sport-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

// Apply authentication and admin check to all routes
router.use(authenticateToken);
router.use(requireAdmin);

// ===== SPORTS MANAGEMENT =====

// Get all sports (including inactive)
router.get("/sports", async (req, res) => {
  try {
    const sports = await db.getAllQuery("SELECT * FROM sports ORDER BY name");

    // Parse age_groups JSON
    const formattedSports = sports.map((sport) => ({
      ...sport,
      age_groups: JSON.parse(sport.age_groups),
    }));

    res.json(formattedSports);
  } catch (error) {
    console.error("Error fetching sports:", error);
    res.status(500).json({ error: "Failed to fetch sports" });
  }
});

// Create new sport
router.post(
  "/sports",
  upload.single("image"),
  validateSport,
  async (req, res) => {
    try {
      const { name, description, age_groups } = req.body;
      const image_path = req.file ? req.file.filename : null;

      const result = await db.runQuery(
        "INSERT INTO sports (name, description, image_path, age_groups) VALUES (?, ?, ?, ?)",
        [name, description, image_path, JSON.stringify(age_groups)],
      );

      res.status(201).json({
        message: "Sport created successfully",
        sport: {
          id: result.id,
          name,
          description,
          image_path,
          age_groups,
          is_active: true,
        },
      });
    } catch (error) {
      console.error("Error creating sport:", error);
      if (error.code === "SQLITE_CONSTRAINT") {
        res.status(409).json({ error: "Sport with this name already exists" });
      } else {
        res.status(500).json({ error: "Failed to create sport" });
      }
    }
  },
);

// Update sport
router.put(
  "/sports/:id",
  upload.single("image"),
  validateSport,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { name, description, age_groups, is_active } = req.body;
      const image_path = req.file
        ? req.file.filename
        : req.body.existing_image_path;

      const result = await db.runQuery(
        "UPDATE sports SET name = ?, description = ?, image_path = ?, age_groups = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [
          name,
          description,
          image_path,
          JSON.stringify(age_groups),
          is_active ? 1 : 0,
          id,
        ],
      );

      if (result.changes === 0) {
        return res.status(404).json({ error: "Sport not found" });
      }

      res.json({
        message: "Sport updated successfully",
        sport: {
          id: parseInt(id),
          name,
          description,
          image_path,
          age_groups,
          is_active: !!is_active,
        },
      });
    } catch (error) {
      console.error("Error updating sport:", error);
      res.status(500).json({ error: "Failed to update sport" });
    }
  },
);

// Delete sport
router.delete("/sports/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Check if sport has active schedules
    const schedules = await db.getAllQuery(
      "SELECT id FROM schedules WHERE sport_id = ? AND is_active = 1",
      [id],
    );
    if (schedules.length > 0) {
      return res
        .status(409)
        .json({ error: "Cannot delete sport with active schedules" });
    }

    const result = await db.runQuery("DELETE FROM sports WHERE id = ?", [id]);

    if (result.changes === 0) {
      return res.status(404).json({ error: "Sport not found" });
    }

    res.json({ message: "Sport deleted successfully" });
  } catch (error) {
    console.error("Error deleting sport:", error);
    res.status(500).json({ error: "Failed to delete sport" });
  }
});

// ===== SCHEDULE MANAGEMENT =====

// Get all schedules
router.get("/schedules", async (req, res) => {
  try {
    const schedules = await db.getAllQuery(`
      SELECT s.*, sp.name as sport_name, sp.description as sport_description
      FROM schedules s
      JOIN sports sp ON s.sport_id = sp.id
      ORDER BY
        CASE s.day_of_week
          WHEN 'Måndag' THEN 1
          WHEN 'Tisdag' THEN 2
          WHEN 'Onsdag' THEN 3
          WHEN 'Torsdag' THEN 4
          WHEN 'Fredag' THEN 5
          WHEN 'Lördag' THEN 6
          WHEN 'Söndag' THEN 7
        END,
        s.start_time
    `);

    res.json(schedules);
  } catch (error) {
    console.error("Error fetching schedules:", error);
    res.status(500).json({ error: "Failed to fetch schedules" });
  }
});

// Create new schedule
router.post("/schedules", validateSchedule, async (req, res) => {
  try {
    const {
      sport_id,
      day_of_week,
      start_time,
      end_time,
      age_group,
      max_participants,
    } = req.body;

    // Verify sport exists and is active
    const sport = await db.getQuery(
      "SELECT id, name FROM sports WHERE id = ? AND is_active = 1",
      [sport_id],
    );
    if (!sport) {
      return res.status(400).json({ error: "Invalid or inactive sport" });
    }

    const result = await db.runQuery(
      "INSERT INTO schedules (sport_id, day_of_week, start_time, end_time, age_group, max_participants) VALUES (?, ?, ?, ?, ?, ?)",
      [
        sport_id,
        day_of_week,
        start_time,
        end_time,
        age_group,
        max_participants || 20,
      ],
    );

    res.status(201).json({
      message: "Schedule created successfully",
      schedule: {
        id: result.id,
        sport_id,
        sport_name: sport.name,
        day_of_week,
        start_time,
        end_time,
        age_group,
        max_participants: max_participants || 20,
        is_active: true,
      },
    });
  } catch (error) {
    console.error("Error creating schedule:", error);
    res.status(500).json({ error: "Failed to create schedule" });
  }
});

// Update schedule
router.put("/schedules/:id", validateSchedule, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      sport_id,
      day_of_week,
      start_time,
      end_time,
      age_group,
      max_participants,
      is_active,
    } = req.body;

    // Verify sport exists and is active
    const sport = await db.getQuery(
      "SELECT id, name FROM sports WHERE id = ? AND is_active = 1",
      [sport_id],
    );
    if (!sport) {
      return res.status(400).json({ error: "Invalid or inactive sport" });
    }

    const result = await db.runQuery(
      "UPDATE schedules SET sport_id = ?, day_of_week = ?, start_time = ?, end_time = ?, age_group = ?, max_participants = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [
        sport_id,
        day_of_week,
        start_time,
        end_time,
        age_group,
        max_participants || 20,
        is_active ? 1 : 0,
        id,
      ],
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: "Schedule not found" });
    }

    res.json({
      message: "Schedule updated successfully",
      schedule: {
        id: parseInt(id),
        sport_id,
        sport_name: sport.name,
        day_of_week,
        start_time,
        end_time,
        age_group,
        max_participants: max_participants || 20,
        is_active: !!is_active,
      },
    });
  } catch (error) {
    console.error("Error updating schedule:", error);
    res.status(500).json({ error: "Failed to update schedule" });
  }
});

// Delete schedule
router.delete("/schedules/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.runQuery("DELETE FROM schedules WHERE id = ?", [
      id,
    ]);

    if (result.changes === 0) {
      return res.status(404).json({ error: "Schedule not found" });
    }

    res.json({ message: "Schedule deleted successfully" });
  } catch (error) {
    console.error("Error deleting schedule:", error);
    res.status(500).json({ error: "Failed to delete schedule" });
  }
});

// ===== STATISTICS =====

// Get dashboard statistics
router.get("/statistics", async (req, res) => {
  try {
    const stats = {};

    // Total members
    const totalMembers = await db.getQuery(
      'SELECT COUNT(*) as count FROM users WHERE role = "member" AND is_active = 1',
    );
    stats.total_members = totalMembers.count;

    // Active memberships
    const activeMemberships = await db.getQuery(`
      SELECT COUNT(*) as count FROM memberships
      WHERE status = 'active' AND end_date >= date('now')
    `);
    stats.active_memberships = activeMemberships.count;

    // Total sports
    const totalSports = await db.getQuery(
      "SELECT COUNT(*) as count FROM sports WHERE is_active = 1",
    );
    stats.total_sports = totalSports.count;

    // Total schedule sessions
    const totalSessions = await db.getQuery(
      "SELECT COUNT(*) as count FROM schedules WHERE is_active = 1",
    );
    stats.total_sessions = totalSessions.count;

    // Recent registrations (last 30 days)
    const recentRegistrations = await db.getQuery(`
      SELECT COUNT(*) as count FROM users
      WHERE role = 'member' AND created_at >= date('now', '-30 days')
    `);
    stats.recent_registrations = recentRegistrations.count;

    // Payment statistics
    const paymentStats = await db.getQuery(`
      SELECT
        COUNT(*) as total_payments,
        SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as total_revenue,
        AVG(CASE WHEN status = 'completed' THEN amount ELSE NULL END) as avg_payment
      FROM payments
    `);
    stats.payment_stats = {
      total_payments: paymentStats.total_payments,
      total_revenue: paymentStats.total_revenue || 0,
      avg_payment: paymentStats.avg_payment || 0,
    };

    // Monthly registrations trend (last 12 months)
    const monthlyRegistrations = await db.getAllQuery(`
      SELECT
        strftime('%Y-%m', created_at) as month,
        COUNT(*) as count
      FROM users
      WHERE role = 'member' AND created_at >= date('now', '-12 months')
      GROUP BY strftime('%Y-%m', created_at)
      ORDER BY month
    `);
    stats.monthly_registrations = monthlyRegistrations;

    res.json(stats);
  } catch (error) {
    console.error("Error fetching statistics:", error);
    res.status(500).json({ error: "Failed to fetch statistics" });
  }
});

// ===== USER MANAGEMENT =====

// Get all users (admin view)
router.get("/users", async (req, res) => {
  try {
    const users = await db.getAllQuery(`
      SELECT u.id, u.email, u.first_name, u.last_name, u.phone, u.role, u.is_active, u.created_at,
             m.status as membership_status, m.end_date as membership_end
      FROM users u
      LEFT JOIN memberships m ON u.id = m.user_id AND m.status = 'active'
      ORDER BY u.created_at DESC
    `);

    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// Update user status
router.put("/users/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    const result = await db.runQuery(
      "UPDATE users SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [is_active ? 1 : 0, id],
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ message: "User status updated successfully" });
  } catch (error) {
    console.error("Error updating user status:", error);
    res.status(500).json({ error: "Failed to update user status" });
  }
});

module.exports = router;

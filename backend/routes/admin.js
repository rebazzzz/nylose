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
      const { name, description } = req.body;
      const image_path = req.file ? req.file.filename : null;

      const result = await db.runQuery(
        "INSERT INTO sports (name, description, image_path) VALUES (?, ?, ?)",
        [name, description, image_path],
      );

      res.status(201).json({
        message: "Sport created successfully",
        sport: {
          id: result.id,
          name,
          description,
          image_path,
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
      const { name, description, is_active } = req.body;
      const image_path = req.file
        ? req.file.filename
        : req.body.existing_image_path;

      const result = await db.runQuery(
        "UPDATE sports SET name = ?, description = ?, image_path = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [name, description, image_path, is_active ? 1 : 0, id],
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

// ===== SOCIAL MEDIA LINKS MANAGEMENT =====

// Get all social media links
router.get("/social-media", async (req, res) => {
  try {
    const links = await db.getAllQuery(
      "SELECT * FROM social_media_links ORDER BY display_order, platform",
    );
    res.json(links);
  } catch (error) {
    console.error("Error fetching social media links:", error);
    res.status(500).json({ error: "Failed to fetch social media links" });
  }
});

// Add new social media link
router.post("/social-media", async (req, res) => {
  try {
    const { platform, url, icon_class, display_order } = req.body;

    if (!platform || !url || !icon_class) {
      return res.status(400).json({
        error: "Platform, URL, and icon class are required",
      });
    }

    const result = await db.runQuery(
      "INSERT INTO social_media_links (platform, url, icon_class, display_order) VALUES (?, ?, ?, ?)",
      [platform, url, icon_class, display_order || 0],
    );

    res.status(201).json({
      id: result.lastID,
      message: "Social media link added successfully",
    });
  } catch (error) {
    console.error("Error adding social media link:", error);
    res.status(500).json({ error: "Failed to add social media link" });
  }
});

// Update social media link
router.put("/social-media/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { platform, url, icon_class, display_order, is_active } = req.body;

    if (!platform || !url || !icon_class) {
      return res.status(400).json({
        error: "Platform, URL, and icon class are required",
      });
    }

    await db.runQuery(
      "UPDATE social_media_links SET platform = ?, url = ?, icon_class = ?, display_order = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [platform, url, icon_class, display_order || 0, !!is_active, id],
    );

    res.json({ message: "Social media link updated successfully" });
  } catch (error) {
    console.error("Error updating social media link:", error);
    res.status(500).json({ error: "Failed to update social media link" });
  }
});

// Delete social media link
router.delete("/social-media/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.runQuery(
      "DELETE FROM social_media_links WHERE id = ?",
      [id],
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: "Social media link not found" });
    }

    res.json({ message: "Social media link deleted successfully" });
  } catch (error) {
    console.error("Error deleting social media link:", error);
    res.status(500).json({ error: "Failed to delete social media link" });
  }
});

// ===== CONTACT INFORMATION MANAGEMENT =====

// Get all contact information
router.get("/contact-info", async (req, res) => {
  try {
    const contacts = await db.getAllQuery(
      "SELECT * FROM contact_info ORDER BY display_order, type",
    );
    res.json(contacts);
  } catch (error) {
    console.error("Error fetching contact information:", error);
    res.status(500).json({ error: "Failed to fetch contact information" });
  }
});

// Add new contact information
router.post("/contact-info", async (req, res) => {
  try {
    const { type, label, value, href, display_order } = req.body;

    if (!type || !label || !value) {
      return res.status(400).json({
        error: "Type, label, and value are required",
      });
    }

    const result = await db.runQuery(
      "INSERT INTO contact_info (type, label, value, href, display_order) VALUES (?, ?, ?, ?, ?)",
      [type, label, value, href || null, display_order || 0],
    );

    res.status(201).json({
      id: result.lastID,
      message: "Contact information added successfully",
    });
  } catch (error) {
    console.error("Error adding contact information:", error);
    res.status(500).json({ error: "Failed to add contact information" });
  }
});

// Update contact information
router.put("/contact-info/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { type, label, value, href, display_order, is_active } = req.body;

    if (!type || !label || !value) {
      return res.status(400).json({
        error: "Type, label, and value are required",
      });
    }

    await db.runQuery(
      "UPDATE contact_info SET type = ?, label = ?, value = ?, href = ?, display_order = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [type, label, value, href || null, display_order || 0, !!is_active, id],
    );

    res.json({ message: "Contact information updated successfully" });
  } catch (error) {
    console.error("Error updating contact information:", error);
    res.status(500).json({ error: "Failed to update contact information" });
  }
});

// Delete contact information
router.delete("/contact-info/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.runQuery("DELETE FROM contact_info WHERE id = ?", [
      id,
    ]);

    if (result.changes === 0) {
      return res.status(404).json({ error: "Contact information not found" });
    }

    res.json({ message: "Contact information deleted successfully" });
  } catch (error) {
    console.error("Error deleting contact information:", error);
    res.status(500).json({ error: "Failed to delete contact information" });
  }
});

// ===== STATISTICS =====

// Get dashboard statistics
router.get("/statistics", async (req, res) => {
  try {
    const stats = {};

    // Total admins
    const totalAdmins = await db.getQuery(
      'SELECT COUNT(*) as count FROM users WHERE role = "admin"',
    );
    stats.total_admins = totalAdmins.count;

    // Active admins
    const activeAdmins = await db.getQuery(
      'SELECT COUNT(*) as count FROM users WHERE role = "admin" AND is_active = 1',
    );
    stats.active_admins = activeAdmins.count;

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

    // Recent admin registrations (last 30 days)
    const recentAdminRegistrations = await db.getQuery(`
      SELECT COUNT(*) as count FROM users
      WHERE role = 'admin' AND created_at >= date('now', '-30 days')
    `);
    stats.recent_admin_registrations = recentAdminRegistrations.count;

    // System health stats
    const systemStats = await db.getQuery(`
      SELECT
        COUNT(DISTINCT sport_id) as sports_with_schedules,
        COUNT(*) as total_schedule_entries
      FROM schedules WHERE is_active = 1
    `);
    stats.system_stats = {
      sports_with_schedules: systemStats.sports_with_schedules,
      total_schedule_entries: systemStats.total_schedule_entries,
    };

    // Monthly admin registrations trend (last 12 months)
    const monthlyAdminRegistrations = await db.getAllQuery(`
      SELECT
        strftime('%Y-%m', created_at) as month,
        COUNT(*) as count
      FROM users
      WHERE role = 'admin' AND created_at >= date('now', '-12 months')
      GROUP BY strftime('%Y-%m', created_at)
      ORDER BY month
    `);
    stats.monthly_admin_registrations = monthlyAdminRegistrations;

    res.json(stats);
  } catch (error) {
    console.error("Error fetching statistics:", error);
    res.status(500).json({ error: "Failed to fetch statistics" });
  }
});

// ===== MEMBER MANAGEMENT =====

// Get all members (admin view)
router.get("/members", async (req, res) => {
  console.log("Members endpoint called");
  try {
    const members = await db.getAllQuery(`
      SELECT id, email, first_name, last_name, personnummer, phone, address,
             parent_name, parent_lastname, parent_phone, role, is_active, created_at
      FROM users
      WHERE role = 'member'
      ORDER BY created_at DESC
    `);

    console.log("Members:", members.length);
    res.json(members);
  } catch (error) {
    console.error("Error fetching members:", error);
    res.status(500).json({ error: "Failed to fetch members" });
  }
});

// ===== ADMIN MANAGEMENT =====

// Get all admins (admin view)
router.get("/admins", async (req, res) => {
  try {
    const admins = await db.getAllQuery(`
      SELECT id, email, first_name, last_name, phone, role, is_active, created_at
      FROM users
      WHERE role = 'admin'
      ORDER BY created_at DESC
    `);

    res.json(admins);
  } catch (error) {
    console.error("Error fetching admins:", error);
    res.status(500).json({ error: "Failed to fetch admins" });
  }
});

// Update admin status
router.put("/admins/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    const result = await db.runQuery(
      "UPDATE users SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND role = 'admin'",
      [is_active ? 1 : 0, id],
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: "Admin not found" });
    }

    res.json({ message: "Admin status updated successfully" });
  } catch (error) {
    console.error("Error updating admin status:", error);
    res.status(500).json({ error: "Failed to update admin status" });
  }
});

module.exports = router;

const express = require("express");
const db = require("../database/init");

const router = express.Router();

// Get all active sports
router.get("/sports", async (req, res) => {
  try {
    const sports = await db.getAllQuery(
      "SELECT id, name, description, age_groups FROM sports WHERE is_active = 1 ORDER BY name"
    );

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

// Get schedule for all sports
router.get("/schedule", async (req, res) => {
  try {
    const schedule = await db.getAllQuery(`
      SELECT s.id, s.day_of_week, s.start_time, s.end_time, s.age_group, s.max_participants,
             sp.name as sport_name, sp.description as sport_description
      FROM schedules s
      JOIN sports sp ON s.sport_id = sp.id
      WHERE s.is_active = 1 AND sp.is_active = 1
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

    res.json(schedule);
  } catch (error) {
    console.error("Error fetching schedule:", error);
    res.status(500).json({ error: "Failed to fetch schedule" });
  }
});

// Get schedule filtered by sport
router.get("/schedule/:sport", async (req, res) => {
  try {
    const sportName = req.params.sport;

    const schedule = await db.getAllQuery(
      `
      SELECT s.id, s.day_of_week, s.start_time, s.end_time, s.age_group, s.max_participants,
             sp.name as sport_name, sp.description as sport_description
      FROM schedules s
      JOIN sports sp ON s.sport_id = sp.id
      WHERE s.is_active = 1 AND sp.is_active = 1 AND LOWER(sp.name) = LOWER(?)
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
    `,
      [sportName]
    );

    res.json(schedule);
  } catch (error) {
    console.error("Error fetching filtered schedule:", error);
    res.status(500).json({ error: "Failed to fetch schedule" });
  }
});

// Get membership pricing info
router.get("/pricing", async (req, res) => {
  try {
    // This could be made configurable in the database later
    res.json({
      term_price: 600,
      currency: "SEK",
      term_length: "3 months",
      description: "Access to all sports and training sessions",
    });
  } catch (error) {
    console.error("Error fetching pricing:", error);
    res.status(500).json({ error: "Failed to fetch pricing information" });
  }
});

// Health check for public API
router.get("/status", async (req, res) => {
  try {
    // Check database connection
    await db.getQuery("SELECT 1");

    res.json({
      status: "OK",
      message: "Nylöse SportCenter API is running",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Health check failed:", error);
    res.status(500).json({
      status: "ERROR",
      message: "Database connection failed",
      timestamp: new Date().toISOString(),
    });
  }
});

module.exports = router;

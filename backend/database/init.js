const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const bcrypt = require("bcryptjs");

const DB_PATH = path.join(__dirname, "nylose.db");

class Database {
  constructor() {
    this.db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error("Error opening database:", err.message);
      } else {
        console.log("Connected to SQLite database.");
      }
    });

    // Enable foreign keys
    this.db.run("PRAGMA foreign_keys = ON");
  }

  async initDatabase() {
    try {
      await this.createTables();
      await this.runMigrations();
      await this.seedInitialData();
      console.log("Database initialized successfully");
    } catch (error) {
      console.error("Error initializing database:", error);
      throw error;
    }
  }

  createTables() {
    return new Promise((resolve, reject) => {
      const tables = [
        // Users table (members and admins)
        `CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT,
          first_name TEXT NOT NULL,
          last_name TEXT NOT NULL,
          personnummer TEXT UNIQUE,
          phone TEXT,
          address TEXT,
          parent_name TEXT,
          parent_lastname TEXT,
          parent_phone TEXT,
          role TEXT NOT NULL CHECK (role IN ('member', 'admin')),
          is_active BOOLEAN DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,

        // Sports table
        `CREATE TABLE IF NOT EXISTS sports (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          description TEXT,
          image_path TEXT, -- Path to sport image
          age_groups TEXT, -- JSON array of age groups
          is_active BOOLEAN DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,

        // Schedules table
        `CREATE TABLE IF NOT EXISTS schedules (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          sport_id INTEGER NOT NULL,
          day_of_week TEXT NOT NULL, -- Monday, Tuesday, etc.
          start_time TEXT NOT NULL, -- HH:MM format
          end_time TEXT NOT NULL, -- HH:MM format
          age_group TEXT NOT NULL,
          max_participants INTEGER DEFAULT 20,
          is_active BOOLEAN DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (sport_id) REFERENCES sports (id) ON DELETE CASCADE
        )`,

        // Memberships table
        `CREATE TABLE IF NOT EXISTS memberships (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          start_date DATE NOT NULL,
          end_date DATE NOT NULL,
          status TEXT NOT NULL CHECK (status IN ('active', 'expired', 'cancelled')),
          payment_status TEXT NOT NULL CHECK (payment_status IN ('pending', 'paid', 'failed')),
          amount_paid REAL DEFAULT 600.00,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )`,

        // Payments table
        `CREATE TABLE IF NOT EXISTS payments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          membership_id INTEGER NOT NULL,
          amount REAL NOT NULL,
          payment_method TEXT NOT NULL, -- 'swish', 'bank_transfer', etc.
          transaction_id TEXT UNIQUE,
          status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
          payment_date DATETIME,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (membership_id) REFERENCES memberships (id) ON DELETE CASCADE
        )`,

        // Statistics table for tracking various metrics
        `CREATE TABLE IF NOT EXISTS statistics (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          metric_type TEXT NOT NULL, -- 'registration', 'payment', 'attendance', etc.
          metric_value REAL NOT NULL,
          date_recorded DATE NOT NULL,
          additional_data TEXT, -- JSON for extra info
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,

        // Social media links table
        `CREATE TABLE IF NOT EXISTS social_media_links (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          platform TEXT NOT NULL, -- 'facebook', 'instagram', 'tiktok', etc.
          url TEXT NOT NULL,
          icon_class TEXT NOT NULL, -- FontAwesome icon class
          display_order INTEGER DEFAULT 0,
          is_active BOOLEAN DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,

        // Contact information table
        `CREATE TABLE IF NOT EXISTS contact_info (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          type TEXT NOT NULL, -- 'phone', 'email', 'address'
          label TEXT NOT NULL, -- Display label
          value TEXT NOT NULL, -- The actual contact value
          href TEXT, -- Optional href for links (tel:, mailto:)
          display_order INTEGER DEFAULT 0,
          is_active BOOLEAN DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
      ];

      let completed = 0;
      const total = tables.length;

      tables.forEach((sql) => {
        this.db.run(sql, (err) => {
          if (err) {
            reject(err);
          } else {
            completed++;
            if (completed === total) {
              // Run migrations after all tables are created
              this.runMigrations()
                .then(() => {
                  resolve();
                })
                .catch(reject);
            }
          }
        });
      });
    });
  }

  runMigrations() {
    return new Promise((resolve, reject) => {
      // Check if personnummer column exists in users table, add it if not
      this.db.all("PRAGMA table_info(users)", (err, columns) => {
        if (err) {
          reject(err);
          return;
        }

        const hasPersonnummer = columns.some(
          (col) => col.name === "personnummer",
        );
        const hasAddress = columns.some((col) => col.name === "address");
        const hasParentName = columns.some((col) => col.name === "parent_name");
        const hasParentLastname = columns.some(
          (col) => col.name === "parent_lastname",
        );
        const hasParentPhone = columns.some(
          (col) => col.name === "parent_phone",
        );

        if (
          !hasPersonnummer ||
          !hasAddress ||
          !hasParentName ||
          !hasParentLastname ||
          !hasParentPhone
        ) {
          console.log("Adding missing columns to users table...");
          let alterQueries = [];

          if (!hasPersonnummer) {
            alterQueries.push(
              "ALTER TABLE users ADD COLUMN personnummer TEXT UNIQUE",
            );
          }

          if (!hasAddress) {
            alterQueries.push("ALTER TABLE users ADD COLUMN address TEXT");
          }

          if (!hasParentName) {
            alterQueries.push("ALTER TABLE users ADD COLUMN parent_name TEXT");
          }

          if (!hasParentLastname) {
            alterQueries.push(
              "ALTER TABLE users ADD COLUMN parent_lastname TEXT",
            );
          }

          if (!hasParentPhone) {
            alterQueries.push("ALTER TABLE users ADD COLUMN parent_phone TEXT");
          }

          // Execute alter queries sequentially
          let completed = 0;
          alterQueries.forEach((sql) => {
            this.db.run(sql, (err) => {
              if (err) {
                reject(err);
                return;
              }
              completed++;
              if (completed === alterQueries.length) {
                // Update role constraint to allow 'member' role
                this.db.run(
                  "UPDATE sqlite_master SET sql = REPLACE(sql, 'CHECK (role IN (''admin''))', 'CHECK (role IN (''member'', ''admin''))') WHERE type = 'table' AND name = 'users'",
                  (err) => {
                    if (err) {
                      console.log(
                        "Could not update role constraint (might already be updated):",
                        err.message,
                      );
                    }
                    console.log("Successfully migrated users table");
                    resolve();
                  },
                );
              }
            });
          });

          if (alterQueries.length === 0) {
            resolve();
          }
        } else {
          resolve();
        }
      });
    });
  }

  async seedInitialData() {
    try {
      // Check if we already have data by counting users
      const userCount = await this.getQuery(
        "SELECT COUNT(*) as count FROM users",
      );
      if (userCount.count > 0) {
        console.log("Initial data already exists, skipping seed");
        return;
      }

      // Create default admin user
      const adminPassword = await bcrypt.hash("admin123", 10);
      await this.runQuery(
        "INSERT INTO users (email, password_hash, first_name, last_name, role) VALUES (?, ?, ?, ?, ?)",
        ["admin@nylose.se", adminPassword, "Admin", "User", "admin"],
      );

      // Seed initial sports (only if they don't exist)
      const sports = [
        {
          name: "Brottning",
          description: "Greco-Roman och Freestyle brottning",
          age_groups: JSON.stringify(["6-15 år", "15+"]),
        },
        {
          name: "Wresfit",
          description: "Funktionell styrketräning inspirerad av brottning",
          age_groups: JSON.stringify(["Alla åldrar"]),
        },
        {
          name: "Girls Only",
          description: "Boxning för tjejer i trygg miljö",
          age_groups: JSON.stringify(["7-13 år", "13+"]),
        },
      ];

      for (const sport of sports) {
        const existingSport = await this.getQuery(
          "SELECT id FROM sports WHERE name = ?",
          [sport.name],
        );
        if (!existingSport) {
          await this.runQuery(
            "INSERT INTO sports (name, description, age_groups) VALUES (?, ?, ?)",
            [sport.name, sport.description, sport.age_groups],
          );
        }
      }

      // Seed initial schedule (matching the actual schedule provided by user)
      const scheduleData = [
        {
          sport_name: "Brottning",
          day: "Måndag",
          start: "18:00",
          end: "19:00",
          age_group: "6-15 år",
        },
        {
          sport_name: "Brottning",
          day: "Måndag",
          start: "19:00",
          end: "20:30",
          age_group: "15+",
        },
        {
          sport_name: "Girls Only",
          day: "Tisdag",
          start: "17:30",
          end: "18:30",
          age_group: "7-13 år",
        },
        {
          sport_name: "Girls Only",
          day: "Tisdag",
          start: "18:30",
          end: "19:45",
          age_group: "13+",
        },
        {
          sport_name: "Brottning",
          day: "Onsdag",
          start: "18:00",
          end: "19:00",
          age_group: "6-15 år",
        },
        {
          sport_name: "Brottning",
          day: "Onsdag",
          start: "19:00",
          end: "20:30",
          age_group: "15+",
        },
        {
          sport_name: "Girls Only",
          day: "Torsdag",
          start: "17:30",
          end: "18:30",
          age_group: "7-13 år",
        },
        {
          sport_name: "Girls Only",
          day: "Torsdag",
          start: "18:30",
          end: "19:45",
          age_group: "13+",
        },
        {
          sport_name: "Wresfit",
          day: "Fredag",
          start: "18:00",
          end: "20:00",
          age_group: "Alla åldrar",
        },
        {
          sport_name: "Brottning",
          day: "Söndag",
          start: "13:00",
          end: "14:00",
          age_group: "6-15 år",
        },
      ];

      for (const session of scheduleData) {
        const sport = await this.getQuery(
          "SELECT id FROM sports WHERE name = ?",
          [session.sport_name],
        );
        if (sport) {
          // Check if schedule already exists
          const existingSchedule = await this.getQuery(
            "SELECT id FROM schedules WHERE sport_id = ? AND day_of_week = ? AND start_time = ? AND age_group = ?",
            [sport.id, session.day, session.start, session.age_group],
          );
          if (!existingSchedule) {
            await this.runQuery(
              "INSERT INTO schedules (sport_id, day_of_week, start_time, end_time, age_group) VALUES (?, ?, ?, ?, ?)",
              [
                sport.id,
                session.day,
                session.start,
                session.end,
                session.age_group,
              ],
            );
          }
        }
      }

      // Seed initial social media links
      const socialMediaLinks = [
        {
          platform: "facebook",
          url: "https://www.facebook.com/NSCABK/",
          icon_class: "fab fa-facebook-f",
          display_order: 1,
        },
        {
          platform: "instagram",
          url: "https://www.instagram.com/nylosegirls/",
          icon_class: "fab fa-instagram",
          display_order: 2,
        },
        {
          platform: "tiktok",
          url: "https://www.tiktok.com/@nylosegirls",
          icon_class: "fab fa-tiktok",
          display_order: 3,
        },
      ];

      for (const link of socialMediaLinks) {
        const existingLink = await this.getQuery(
          "SELECT id FROM social_media_links WHERE platform = ?",
          [link.platform],
        );
        if (!existingLink) {
          await this.runQuery(
            "INSERT INTO social_media_links (platform, url, icon_class, display_order) VALUES (?, ?, ?, ?)",
            [link.platform, link.url, link.icon_class, link.display_order],
          );
        }
      }

      // Seed initial contact information
      const contactInfo = [
        {
          type: "address",
          label: "Adress",
          value: "Bergsgårdsgärdet 89C, 424 32 Angered",
          display_order: 1,
        },
        {
          type: "phone",
          label: "Tel 1",
          value: "072-910 25 75",
          href: "tel:072-910 25 75",
          display_order: 2,
        },
        {
          type: "phone",
          label: "Tel 2",
          value: "070-042 42 21",
          href: "tel:070-042 42 21",
          display_order: 3,
        },
        {
          type: "email",
          label: "E-post",
          value: "nylosesportcenter@gmail.com",
          href: "mailto:nylosesportcenter@gmail.com",
          display_order: 4,
        },
      ];

      for (const contact of contactInfo) {
        const existingContact = await this.getQuery(
          "SELECT id FROM contact_info WHERE type = ? AND value = ?",
          [contact.type, contact.value],
        );
        if (!existingContact) {
          await this.runQuery(
            "INSERT INTO contact_info (type, label, value, href, display_order) VALUES (?, ?, ?, ?, ?)",
            [
              contact.type,
              contact.label,
              contact.value,
              contact.href || null,
              contact.display_order,
            ],
          );
        }
      }

      console.log("Initial data seeded successfully");
    } catch (error) {
      console.error("Error seeding initial data:", error);
      throw error;
    }
  }

  // Helper method to run queries
  runQuery(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function (err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, changes: this.changes });
        }
      });
    });
  }

  // Helper method to get single row
  getQuery(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  // Helper method to get all rows
  getAllQuery(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // User-specific queries
  async getUserByEmail(email) {
    return this.getQuery("SELECT * FROM users WHERE email = ?", [email]);
  }

  async getUserById(id) {
    return this.getQuery(
      "SELECT id, email, first_name, last_name, phone, address, personnummer, role, is_active, created_at FROM users WHERE id = ?",
      [id],
    );
  }

  close() {
    this.db.close((err) => {
      if (err) {
        console.error("Error closing database:", err.message);
      } else {
        console.log("Database connection closed.");
      }
    });
  }
}

// Export singleton instance
const db = new Database();
module.exports = db;

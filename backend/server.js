const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
if (process.env.NODE_ENV === "production") {
  app.use(helmet());
} else {
  app.use(
    helmet({
      contentSecurityPolicy: false, // Disable CSP in development
    }),
  );
}
app.use(
  cors({
    origin: process.env.FRONTEND_URL || [
      "http://localhost:3000",
      "http://localhost:8000",
    ],
    credentials: true,
  }),
);

// Rate limiting - disabled for admin routes in development
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});

// No rate limiting for admin routes in development
app.use(generalLimiter);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Static files for uploads (if needed)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Remove static file serving - frontend should be served by the frontend server only
// app.use(express.static(path.join(__dirname, "..")));

// Import routes
const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/admin");
const memberRoutes = require("./routes/member");
const publicRoutes = require("./routes/public");

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/member", memberRoutes);
app.use("/api/public", publicRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: "Something went wrong!",
    message:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Internal server error",
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Initialize database and start server
const db = require("./database/init");

db.initDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
    });
  })
  .catch((err) => {
    console.error("Failed to initialize database:", err);
    process.exit(1);
  });

module.exports = app;

import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/route.js";
import bcrypt from "bcryptjs";
import path from "path";
import fs from "fs";
import optionalAuth, { checkFrozenStatus } from "./middleware/auth.js";
import projectRoutes from "./routes/projects.js";
import applicationRoutes from "./routes/applications.js";
import taskRoutes from "./routes/tasks.js";
import messageRoutes from "./routes/messages.js";
import bookmarkRoutes from "./routes/bookmarks.js";
import notificationRoutes from "./routes/notifications.js";
import certificateRoutes from "./routes/certificates.js";
import labAccessRoutes from "./routes/labAccess.js";
import timelineExtensionRoutes from "./routes/timelineExtensions.js";
import computerRoutes from "./routes/computers.js";
import pcRequestRoutes from "./routes/pcRequests.js";
import adminRoutes from "./routes/admin.js";
import matchingRoutes from "./routes/matching.js";
import User from "./models/model.js";

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
  origin: [
    "http://localhost:3000",
    "http://127.0.0.1:3000"
  ],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Cache-Control", "X-Requested-With", "pragma"],
  credentials: true,
}));


// Serve static files for uploaded images
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Ensure uploads directories exist
const ensureDirs = [
  path.join(process.cwd(), 'uploads'),
  path.join(process.cwd(), 'uploads', 'applications')
];
for (const dir of ensureDirs) {
  try {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  } catch (e) {
    console.warn('Could not create uploads dir', dir, e.message);
  }
}


// Connect MongoDB
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log("MongoDB connection error:", err));

// Debug middleware to log all requests (must be before routes)
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Optional auth middleware (sets req.user if Authorization: Bearer <token> present)
app.use(optionalAuth);

// Routes
app.use("/api", authRoutes);  // This includes /api/profile routes

// Apply frozen status check to all protected routes
app.use("/api/projects", checkFrozenStatus, projectRoutes);
app.use("/api/applications", checkFrozenStatus, applicationRoutes);
app.use("/api/tasks", checkFrozenStatus, taskRoutes);
app.use("/api/messages", checkFrozenStatus, messageRoutes);
app.use("/api/bookmarks", checkFrozenStatus, bookmarkRoutes);
app.use("/api/notifications", checkFrozenStatus, notificationRoutes);
app.use("/api/certificates", checkFrozenStatus, certificateRoutes);
app.use("/api/lab-access", checkFrozenStatus, labAccessRoutes);
app.use("/api/timeline-extensions", checkFrozenStatus, timelineExtensionRoutes);
app.use("/api/computers", checkFrozenStatus, computerRoutes);
app.use("/api/pc-requests", checkFrozenStatus, pcRequestRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/matching", checkFrozenStatus, matchingRoutes);

// Return JSON for unmatched API routes to avoid HTML responses in frontend
app.use('/api', (req, res) => {
  res.status(404).json({ message: 'Not Found' });
});

// Generic error handler to ensure JSON error for API routes
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  if (req.path && req.path.startsWith('/api/')) {
    return res.status(500).json({ message: 'Server error' });
  }
  res.status(500).send('Server error');
});

// Seed default admin after DB connection is ready
mongoose.connection.once('open', async () => {
  try {
    const adminEmail = 'admin@rp.com';
    // Find admin by new or old email
    let admin = await User.findOne({ email: adminEmail });
    if (!admin) {
      const legacy = await User.findOne({ email: 'admin' });
      if (legacy) {
        // Migrate legacy admin to new email
        legacy.email = adminEmail;
        legacy.role = 'admin';
        if (!legacy.password || typeof legacy.password !== 'string' || legacy.password.length < 20) {
          // Re-hash known password to ensure login works
          legacy.password = await bcrypt.hash('bracu471', 10);
        }
        await legacy.save();
        console.log('Legacy admin migrated to admin@rp.com');
        admin = legacy;
      }
    }
    if (!admin) {
      const hashed = await bcrypt.hash('bracu471', 10);
      admin = new User({ name: 'Administrator', email: adminEmail, password: hashed, role: 'admin' });
      await admin.save();
      console.log('Default admin user created');
    } else if (admin.role !== 'admin') {
      // Ensure existing doc is admin
      admin.role = 'admin';
      await admin.save();
      console.log('Default admin role enforced');
    }
  } catch (e) {
    console.error('Error seeding admin:', e);
  }
});

// Start server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/route.js";
import bcrypt from "bcryptjs";
import path from "path";
import projectRoutes from "./routes/projects.js";
import applicationRoutes from "./routes/applications.js";
import taskRoutes from "./routes/tasks.js";
import messageRoutes from "./routes/messages.js";
import User from "./models/model.js";

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
  origin: "http://localhost:3000",  // your frontend URL
  credentials: true,                // allow cookies
}));

// Serve static files for uploaded images
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));


// Connect MongoDB
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log("MongoDB connection error:", err));

// Debug middleware to log all requests (must be before routes)
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/messages", messageRoutes);

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

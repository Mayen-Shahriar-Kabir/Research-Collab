import User from "../models/model.js";
import bcrypt from "bcryptjs";
import multer from "multer";
import path from "path";

// Register user (already exists)
export const registerUser = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    // Reserve the seeded admin email only
    if (email === 'admin@rp.com') {
      return res.status(400).json({ message: "This email is reserved" });
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "Email already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Login user (new)
export const loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      console.log('Login failed: user not found for email', email);
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('Login failed: password mismatch for email', email);
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Send back user info
    res.status(200).json({
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        roleRequest: user.roleRequest || null,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};


//Fathin 

// Configure multer for profile photos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/profile-photos/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Configure multer for publication files (e.g., pdf/doc)
const pubStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/publications/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'pub-' + uniqueSuffix + path.extname(file.originalname));
  }
});

export const uploadPublicationFileMiddleware = multer({
  storage: pubStorage,
  limits: {
    fileSize: 20 * 1024 * 1024 // 20MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|doc|docx|ppt|pptx|jpeg|jpg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype || extname) return cb(null, true);
    cb(new Error('File type not allowed'));
  }
});

// Get user profile
export const getProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('Getting profile for userId:', userId);
    
    // Check if userId is valid MongoDB ObjectId format
    if (!userId || userId.length !== 24) {
      console.log('Invalid userId format:', userId);
      return res.status(400).json({ message: "Invalid user ID format" });
    }
    
    const user = await User.findById(userId);
    console.log('User found:', user ? 'Yes' : 'No');
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const profileData = {
      profile: {
        name: user.name,
        email: user.email,
        institution: user.institution || '',
        academicInterests: user.academicInterests || [],
        publications: user.publications || [],
        profilePhoto: user.profilePhoto || null
      }
    };
    
    console.log('Sending profile data:', profileData);
    res.status(200).json(profileData);
  } catch (err) {
    console.error('Error in getProfile:', err);
    res.status(500).json({ message: "Server error: " + err.message });
  }
};

// Update user profile
export const updateProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, institution, academicInterests, publications } = req.body;
    
    console.log('Updating profile for userId:', userId);
    console.log('Request body:', req.body);

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        name,
        institution,
        academicInterests,
        publications
      },
      { new: true }
    );

    if (!updatedUser) {
      console.log('User not found with ID:', userId);
      return res.status(404).json({ message: "User not found" });
    }

    console.log('Profile updated successfully:', updatedUser);

    res.status(200).json({
      profile: {
        name: updatedUser.name,
        email: updatedUser.email,
        institution: updatedUser.institution || '',
        academicInterests: updatedUser.academicInterests || [],
        publications: updatedUser.publications || [],
        profilePhoto: updatedUser.profilePhoto || null
      }
    });
  } catch (err) {
    console.error('Error updating profile:', err);
    res.status(500).json({ message: "Server error: " + err.message });
  }
};

// Upload profile photo
export const uploadProfilePhoto = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const photoPath = `/uploads/profile-photos/${req.file.filename}`;
    
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { profilePhoto: photoPath },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "Profile photo uploaded successfully",
      profilePhoto: photoPath
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export { upload };

// =========================
// Publications
// =========================

// Create a link-only publication
export const createPublication = async (req, res) => {
  try {
    const { userId } = req.params;
    const { title, url } = req.body;
    if (!title || title.trim() === '') {
      return res.status(400).json({ message: 'Title is required' });
    }
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (!['student', 'faculty'].includes(user.role)) {
      return res.status(403).json({ message: 'Only students or faculties can add publications' });
    }
    user.publications = user.publications || [];
    user.publications.push({ title: title.trim(), url: url || '', file: '' });
    await user.save();
    return res.status(201).json({ message: 'Publication added', publications: user.publications });
  } catch (err) {
    console.error('createPublication error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Upload a publication file (optionally with title/url)
export const uploadPublicationFile = async (req, res) => {
  try {
    const { userId } = req.params;
    const { title, url } = req.body;
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    if (!title || title.trim() === '') {
      return res.status(400).json({ message: 'Title is required' });
    }
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (!['student', 'faculty'].includes(user.role)) {
      return res.status(403).json({ message: 'Only students or faculties can upload publications' });
    }
    const filePath = `/uploads/publications/${req.file.filename}`;
    user.publications = user.publications || [];
    user.publications.push({ title: title.trim(), url: url || '', file: filePath });
    await user.save();
    return res.status(201).json({ message: 'Publication file uploaded', publications: user.publications });
  } catch (err) {
    console.error('uploadPublicationFile error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// List publications for a user
export const listPublications = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.status(200).json({ publications: user.publications || [] });
  } catch (err) {
    console.error('listPublications error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Users request a role (student or faculty). Admin cannot be requested.
export const requestRole = async (req, res) => {
  try {
    const { userId, role } = req.body;
    if (!['student', 'faculty'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role request' });
    }
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.role === 'admin') return res.status(400).json({ message: 'Admin cannot request role' });
    user.roleRequest = role;
    await user.save();
    return res.status(200).json({ message: 'Role requested', roleRequest: user.roleRequest });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Admin approves a pending role request for a user
export const approveRole = async (req, res) => {
  try {
    const { adminId, userId } = req.body;
    const admin = await User.findById(adminId);
    if (!admin || admin.role !== 'admin') {
      return res.status(403).json({ message: 'Only admin can approve roles' });
    }
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (!user.roleRequest) return res.status(400).json({ message: 'No pending role request' });
    user.role = user.roleRequest;
    user.roleRequest = null;
    await user.save();
    res.status(200).json({ message: 'Role updated', user: { id: user._id, role: user.role } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Admin can list pending role requests
export const listRoleRequests = async (req, res) => {
  try {
    const { adminId } = req.query;
    const admin = await User.findById(adminId);
    if (!admin || admin.role !== 'admin') {
      return res.status(403).json({ message: 'Only admin can view requests' });
    }
    const requests = await User.find({ roleRequest: { $ne: null } }, { name: 1, email: 1, roleRequest: 1 });
    res.status(200).json({ requests });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Admin: list all users
export const getUsers = async (req, res) => {
  try {
    const { adminId } = req.query;
    const admin = await User.findById(adminId);
    if (!admin || admin.role !== 'admin') {
      return res.status(403).json({ message: 'Only admin can list users' });
    }
    const users = await User.find({}, { name: 1, email: 1, role: 1, roleRequest: 1 });
    res.status(200).json({ users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Admin: directly set a user's role
export const setUserRole = async (req, res) => {
  try {
    const { adminId, role } = req.body;
    const { userId } = req.params;

    if (!['student', 'faculty', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const admin = await User.findById(adminId);
    if (!admin || admin.role !== 'admin') {
      return res.status(403).json({ message: 'Only admin can set roles' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.role = role;
    user.roleRequest = null;
    await user.save();

    res.status(200).json({ message: 'Role set', user: { id: user._id, role: user.role } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
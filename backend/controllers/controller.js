import User from "../models/model.js";
import bcrypt from "bcryptjs";
import multer from "multer";
import path from "path";

// Register user (already exists)
export const registerUser = async (req, res) => {
  const { name, email, password } = req.body;
  try {
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
    if (!user) return res.status(400).json({ message: "Invalid email or password" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid email or password" });

    // Send back user info
    res.status(200).json({
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// fathin 


// Configure multer for file uploads
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
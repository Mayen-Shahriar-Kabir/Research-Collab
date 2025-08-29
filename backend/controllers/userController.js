const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const FacultyProfile = require('../models/FacultyProfile');
const jwt = require('jsonwebtoken');

const generateToken = (user) => {
  return jwt.sign({ id: user._id, role: user.role }, 'your_jwt_secret', { expiresIn: '1d' });
};

//Sadman
const registerUser = async (req, res) => {
  const { name, email, password, confirmPassword } = req.body;

  if (!name || !email || !password || !confirmPassword) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ message: 'Passwords do not match' });
  }

  const userExists = await User.findOne({ email });
  if (userExists) {
    return res.status(400).json({ message: 'User already exists' });
  }

  const user = await User.create({ name, email, password });

  res.status(201).json({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
  });
};


const loginUser = async (req, res) => {
  const { email, password, role } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    return res.status(401).json({ message: 'Email not found' }); 
  }

  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    return res.status(401).json({ message: 'Incorrect password' }); 
  }

  if (!user.role) {
    return res.status(401).json({ message: 'Role not assigned yet' });
  }

  if (user.role.toLowerCase() !== role.toLowerCase()) {
    return res.status(401).json({ message: 'Incorrect role' });
  }

  res.json({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    token: generateToken(user),
  });
};

//Tauba
const assignRole = async (req, res) => {
  const { role } = req.body; 
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  if (!['student', 'faculty'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role' });
  }

  user.role = role;
  await user.save();

  if (role === 'student') {
    const exists = await StudentProfile.findOne({ user: user._id });
    if (!exists) await StudentProfile.create({ user: user._id });
  }
  if (role === 'faculty') {
    const exists = await FacultyProfile.findOne({ user: user._id });
    if (!exists) await FacultyProfile.create({ user: user._id });
  }

  res.json({ message: `Role ${role} assigned to ${user.name}` });
};

const getAllUsers = async (req, res) => {
  const users = await User.find().select('-password'); 
  res.json(users);
};

const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.role === 'student') {
      const StudentProfile = require('../models/StudentProfile');
      await StudentProfile.findOneAndDelete({ user: user._id });
    } else if (user.role === 'faculty') {
      const FacultyProfile = require('../models/FacultyProfile');
      await FacultyProfile.findOneAndDelete({ user: user._id });
    }

    await User.findByIdAndDelete(req.params.id); 
    res.json({ message: `User ${user.name} deleted successfully` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while deleting user' });
  }
};

// Freeze/Unfreeze user functionality for admin
const freezeUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ message: 'Cannot freeze admin users' });
    }

    user.frozen = true;
    await user.save();

    res.json({ message: `User ${user.name} has been frozen` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while freezing user' });
  }
};

const unfreezeUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.frozen = false;
    await user.save();

    res.json({ message: `User ${user.name} has been unfrozen` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while unfreezing user' });
  }
};

module.exports = { registerUser, loginUser, assignRole, getAllUsers, deleteUser, freezeUser, unfreezeUser };
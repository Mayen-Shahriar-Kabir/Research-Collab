import User from "../models/model.js";
import Project from "../models/Project.js";
import Task from "../models/Task.js";
import Application from "../models/Application.js";
import Notification from "../models/Notification.js";
import Certificate from "../models/Certificate.js";
import LabAccessRequest from "../models/LabAccessRequest.js";
import TimelineExtensionRequest from "../models/TimelineExtensionRequest.js";
import Computer from "../models/Computer.js";
import PcRequest from "../models/PcRequest.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import multer from "multer";
import path from "path";
import fs from "fs";

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

    // Check if user is frozen
    if (user.frozen) {
      return res.status(403).json({ 
        message: "Your account has been frozen. Please contact an administrator.",
        frozen: true 
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '1d' }
    );

    // Send back user info with token
    res.status(200).json({
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        roleRequest: user.roleRequest || null,
      },
      token: token
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
    
    // Check if userId is provided
    if (!userId) {
      console.log('No userId provided');
      return res.status(400).json({ message: "User ID is required" });
    }
    
    // Check if userId is valid MongoDB ObjectId format
    if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
      console.log('Invalid userId format:', userId, 'Length:', userId.length);
      return res.status(400).json({ message: "Invalid user ID format" });
    }
    
    const user = await User.findById(userId);
    console.log('User found:', user ? 'Yes' : 'No');
    console.log('Full user object:', JSON.stringify(user, null, 2));
    console.log('User object fields:', {
      name: user?.name,
      email: user?.email,
      studentId: user?.studentId,
      program: user?.program,
      department: user?.department,
      institution: user?.institution,
      cgpa: user?.cgpa,
      academicInterests: user?.academicInterests,
      publications: user?.publications,
      profilePhoto: user?.profilePhoto
    });
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const profileData = {
      profile: {
        name: user.name || '',
        email: user.email || '',
        role: user.role || '',
        studentId: user.studentId || '',
        program: user.program || '',
        department: user.department || '',
        institution: user.institution || '',
        academicInterests: user.academicInterests || [],
        publications: user.publications || [],
        profilePhoto: user.profilePhoto || null,
        cgpa: user.cgpa || null
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
    const { name, studentId, program, department, institution, academicInterests, publications, cgpa } = req.body;
    
    console.log('Updating profile for userId:', userId);
    console.log('Request body:', req.body);

    // Validate userId format
    if (!userId || !userId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        name,
        studentId,
        program,
        department,
        institution,
        academicInterests,
        publications,
        cgpa: cgpa ? parseFloat(cgpa) : null
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
        name: updatedUser.name || '',
        email: updatedUser.email || '',
        role: updatedUser.role || '',
        studentId: updatedUser.studentId || '',
        program: updatedUser.program || '',
        department: updatedUser.department || '',
        institution: updatedUser.institution || '',
        academicInterests: updatedUser.academicInterests || [],
        publications: updatedUser.publications || [],
        profilePhoto: updatedUser.profilePhoto || null,
        cgpa: updatedUser.cgpa || null
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
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (req.user.role !== 'admin') {
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
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admin can set roles' });
    }

    const { role } = req.body;
    const { userId } = req.params;

    if (!['student', 'faculty', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
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

// =========================
// BOOKMARK FUNCTIONALITY
// =========================

// Add project to bookmarks
export const bookmarkProject = async (req, res) => {
  try {
    const { userId, projectId } = req.body;
    
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.role !== 'student') return res.status(403).json({ message: 'Only students can bookmark projects' });

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    if (user.bookmarks.includes(projectId)) {
      return res.status(400).json({ message: 'Project already bookmarked' });
    }

    user.bookmarks.push(projectId);
    await user.save();

    res.status(200).json({ message: 'Project bookmarked successfully', bookmarks: user.bookmarks });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Remove project from bookmarks
export const removeBookmark = async (req, res) => {
  try {
    const { userId, projectId } = req.body;
    
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.bookmarks = user.bookmarks.filter(bookmark => bookmark.toString() !== projectId);
    await user.save();

    res.status(200).json({ message: 'Bookmark removed successfully', bookmarks: user.bookmarks });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get user's bookmarked projects
export const getBookmarkedProjects = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const userId = req.user.id;
    
    const user = await User.findById(userId).populate({
      path: 'bookmarks',
      populate: { path: 'faculty', select: 'name email' }
    });
    
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.status(200).json(user.bookmarks || []);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// =========================
// TASK APPROVAL SYSTEM
// =========================

// Approve/Reject task completion by faculty
export const approveTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { approved, feedback, facultyId } = req.body;

    const faculty = await User.findById(facultyId);
    if (!faculty || faculty.role !== 'faculty') {
      return res.status(403).json({ message: 'Only faculty can approve tasks' });
    }

    const task = await Task.findById(taskId).populate('project');
    if (!task) return res.status(404).json({ message: 'Task not found' });

    if (task.project.faculty.toString() !== facultyId) {
      return res.status(403).json({ message: 'Only project faculty can approve this task' });
    }

    // Find the latest completed update
    const latestUpdate = task.updates[task.updates.length - 1];
    if (!latestUpdate || latestUpdate.status !== 'completed') {
      return res.status(400).json({ message: 'Task must be completed before approval' });
    }

    // Update the latest task update with approval
    latestUpdate.approved = approved;
    latestUpdate.approvedBy = facultyId;
    latestUpdate.approvedAt = new Date();
    latestUpdate.feedback = feedback || '';
    
    // If disapproved, reset task status to in_progress for revision
    if (!approved) {
      task.status = 'in_progress';
      task.updates.push({
        status: 'in_progress',
        comments: `Task needs revision. Faculty feedback: ${feedback || 'No specific feedback provided'}`,
        updatedBy: facultyId
      });
    }

    // If approved, update project progress
    if (approved) {
      await updateProjectProgress(task.project._id);
    }

    await task.save();

    // Create notification for student
    await createNotification({
      user: task.assignedTo,
      type: 'task',
      title: `Task ${approved ? 'Approved' : 'Needs Revision'}`,
      body: `Your task "${task.title}" has been ${approved ? 'approved' : 'rejected'}. ${feedback ? `Feedback: ${feedback}` : ''}`,
      link: `/tasks/${task._id}`
    });

    res.status(200).json({ 
      message: `Task ${approved ? 'approved' : 'rejected'} successfully`, 
      task,
      feedback: feedback || ''
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Calculate and update project progress
const updateProjectProgress = async (projectId) => {
  try {
    const project = await Project.findById(projectId);
    if (!project) return;

    const tasks = await Task.find({ project: projectId });
    
    // Calculate progress based on approved completed tasks
    let approvedTasks = 0;
    
    tasks.forEach(task => {
      const latestUpdate = task.updates[task.updates.length - 1];
      if (latestUpdate && latestUpdate.status === 'completed' && latestUpdate.approved) {
        approvedTasks++;
      }
    });

    // Use requiredTasksCount if set, otherwise use total tasks
    const requiredTasks = project.requiredTasksCount > 0 ? project.requiredTasksCount : tasks.length;

    // Calculate stage-based progress
    let stageProgress = 0;
    if (project.stages && project.stages.length > 0) {
      const totalWeight = project.stages.reduce((sum, stage) => sum + stage.weight, 0);
      const completedWeight = project.stages
        .filter(stage => stage.completed)
        .reduce((sum, stage) => sum + stage.weight, 0);
      
      stageProgress = totalWeight > 0 ? (completedWeight / totalWeight) * 100 : 0;
    }

    // Combine task and stage progress (70% tasks, 30% stages)
    const taskProgress = requiredTasks > 0 ? (approvedTasks / requiredTasks) * 100 : 0;
    const combinedProgress = Math.round((taskProgress * 0.7) + (stageProgress * 0.3));

    project.progressPercentage = Math.min(combinedProgress, 100);
    await project.save();

    return project.progressPercentage;
  } catch (err) {
    console.error('Error updating project progress:', err);
  }
};

// =========================
// TASK MANAGEMENT
// =========================

// Create task (faculty only)
export const createTask = async (req, res) => {
  try {
    const { title, description, priority, dueDate, projectId, assignedTo, createdBy } = req.body;

    const faculty = await User.findById(createdBy);
    if (!faculty || faculty.role !== 'faculty') {
      return res.status(403).json({ message: 'Only faculty can create tasks' });
    }

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    if (project.faculty.toString() !== createdBy) {
      return res.status(403).json({ message: 'Only project faculty can create tasks' });
    }

    const student = await User.findById(assignedTo);
    if (!student || student.role !== 'student') {
      return res.status(400).json({ message: 'Task must be assigned to a student' });
    }

    if (!project.currentStudents.includes(assignedTo)) {
      return res.status(400).json({ message: 'Student must be part of the project' });
    }

    const task = new Task({
      title,
      description,
      priority: priority || 'medium',
      dueDate: dueDate ? new Date(dueDate) : null,
      project: projectId,
      assignedTo,
      createdBy
    });

    await task.save();

    // Create notification for student
    await createNotification({
      user: assignedTo,
      type: 'task',
      title: 'New Task Assigned',
      body: `You have been assigned a new task: ${title}`,
      link: `/tasks/${task._id}`,
      dueDate: dueDate ? new Date(dueDate) : null
    });

    res.status(201).json({ message: 'Task created successfully', task });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update task status (students can update their own tasks)
export const updateTaskStatus = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status, comments, userId } = req.body;

    // Validate status
    const validStatuses = ['pending', 'in_progress', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Must be pending, in_progress, or completed' });
    }

    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Students can only update their own tasks, faculty can update any task in their projects
    if (user.role === 'student' && task.assignedTo.toString() !== userId) {
      return res.status(403).json({ message: 'You can only update your own tasks' });
    }

    if (user.role === 'faculty') {
      const project = await Project.findById(task.project);
      if (project.faculty.toString() !== userId) {
        return res.status(403).json({ message: 'You can only update tasks in your projects' });
      }
    }

    const oldStatus = task.status;
    task.status = status;
    task.updates.push({
      status,
      comments: comments || `Status changed from ${oldStatus} to ${status}`,
      updatedBy: userId
    });

    await task.save();

    // Create notification for faculty when student updates task
    if (user.role === 'student') {
      const project = await Project.findById(task.project);
      await createNotification({
        user: project.faculty,
        type: 'task',
        title: 'Task Updated',
        body: `${user.name} updated task: ${task.title} to ${status}`,
        link: `/tasks/${task._id}`
      });
    }

    // Update milestone progress if task is completed
    if (status === 'completed') {
      await updateMilestoneProgress(task.project);
    }

    res.status(200).json({ message: 'Task updated successfully', task });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get tasks for a project
export const getProjectTasks = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const { projectId } = req.params;
    const currentUserId = req.user.id;
    const currentUserRole = req.user.role;
    
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Authorization checks
    if (currentUserRole === 'student') {
      // Students can only see project tasks if they're part of the project
      if (!project.currentStudents.includes(currentUserId)) {
        return res.status(403).json({ message: 'Access denied - you are not part of this project' });
      }
      
      // Students can only see tasks assigned to them within this project
      const tasks = await Task.find({ 
        project: projectId,
        assignedTo: currentUserId 
      })
        .populate('assignedTo', 'name email')
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 });

      return res.status(200).json({ tasks });
    } else if (currentUserRole === 'faculty') {
      // Faculty can only see tasks for their own projects
      if (project.faculty.toString() !== currentUserId) {
        return res.status(403).json({ message: 'Access denied - not your project' });
      }
    }
    // Admin can see all project tasks
    
    const tasks = await Task.find({ project: projectId })
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({ tasks });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get tasks assigned to a student
export const getStudentTasks = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const { studentId } = req.params;
    const currentUserId = req.user.id;
    const currentUserRole = req.user.role;
    
    // Students can only access their own tasks
    if (currentUserRole === 'student' && studentId !== currentUserId) {
      return res.status(403).json({ message: 'Access denied - you can only view your own tasks' });
    }
    
    // Faculty can only view tasks for students in their projects
    if (currentUserRole === 'faculty') {
      const facultyProjects = await Project.find({ faculty: currentUserId }).select('_id currentStudents');
      const isStudentInFacultyProject = facultyProjects.some(project => 
        project.currentStudents.includes(studentId)
      );
      
      if (!isStudentInFacultyProject) {
        return res.status(403).json({ message: 'Access denied - student not in your projects' });
      }
    }
    
    const tasks = await Task.find({ assignedTo: studentId })
      .populate('project', 'title')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({ tasks });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// =========================
// NOTIFICATION SYSTEM
// =========================

// Helper function to create notifications
const createNotification = async (notificationData) => {
  try {
    const notification = new Notification(notificationData);
    await notification.save();
    return notification;
  } catch (err) {
    console.error('Error creating notification:', err);
  }
};

// Get notifications for a user
export const getUserNotifications = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;
    
    const notifications = await Notification.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    res.status(200).json(notifications);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Mark notification as read
export const markNotificationRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    
    await Notification.findByIdAndUpdate(notificationId, { read: true });
    
    res.status(200).json({ message: 'Notification marked as read' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Mark notification as unread
export const markNotificationUnread = async (req, res) => {
  try {
    const { notificationId } = req.params;
    
    await Notification.findByIdAndUpdate(notificationId, { read: false, readAt: undefined });
    
    res.status(200).json({ message: 'Notification marked as unread' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete notification
export const deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    
    await Notification.findByIdAndDelete(notificationId);
    
    res.status(200).json({ message: 'Notification deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Mark all notifications as read
export const markAllNotificationsRead = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const userId = req.user.id;
    
    await Notification.updateMany({ user: userId }, { read: true, readAt: new Date() });
    
    res.status(200).json({ message: 'All notifications marked as read' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// =========================
// MILESTONE TRACKER
// =========================

// Helper function to update milestone progress based on task completion
const updateMilestoneProgress = async (projectId) => {
  try {
    const project = await Project.findById(projectId);
    if (!project) return;

    const tasks = await Task.find({ project: projectId });
    const completedTasks = tasks.filter(task => task.status === 'completed');
    
    // Simple milestone logic: update milestones based on task completion percentage
    const completionPercentage = tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0;
    
    project.milestones.forEach((milestone, index) => {
      const milestoneThreshold = ((index + 1) / project.milestones.length) * 100;
      if (completionPercentage >= milestoneThreshold && !milestone.completed) {
        milestone.completed = true;
        milestone.completedAt = new Date();
      }
    });

    await project.save();
  } catch (err) {
    console.error('Error updating milestone progress:', err);
  }
};

// Set/Update required tasks count for a project (faculty only)
export const setRequiredTasksCount = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { requiredTasksCount, facultyId } = req.body;

    const faculty = await User.findById(facultyId);
    if (!faculty || faculty.role !== 'faculty') {
      return res.status(403).json({ message: 'Only faculty can set required tasks count' });
    }

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    if (project.faculty.toString() !== facultyId) {
      return res.status(403).json({ message: 'Only project faculty can set required tasks count' });
    }

    if (requiredTasksCount < 0) {
      return res.status(400).json({ message: 'Required tasks count cannot be negative' });
    }

    project.requiredTasksCount = requiredTasksCount;
    await project.save();

    // Recalculate project progress with new requirements
    await updateProjectProgress(projectId);

    res.status(200).json({ 
      message: 'Required tasks count updated successfully', 
      project: {
        id: project._id,
        title: project.title,
        requiredTasksCount: project.requiredTasksCount,
        progressPercentage: project.progressPercentage
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get project milestones
export const getProjectMilestones = async (req, res) => {
  try {
    const { projectId } = req.params;
    
    const project = await Project.findById(projectId).select('milestones title');
    if (!project) return res.status(404).json({ message: 'Project not found' });

    res.status(200).json({ milestones: project.milestones, projectTitle: project.title });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// =========================
// PROJECT DOCUMENTS
// =========================

// Configure multer for project documents
const docStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/project-documents/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'doc-' + uniqueSuffix + path.extname(file.originalname));
  }
});

export const uploadDocumentMiddleware = multer({
  storage: docStorage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|doc|docx|ppt|pptx|xls|xlsx|txt|zip|rar/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    if (extname) return cb(null, true);
    cb(new Error('File type not allowed'));
  }
});

// Upload project document
export const uploadProjectDocument = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { title, description, userId } = req.body;
    
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Only faculty of the project can upload documents
    if (project.faculty.toString() !== userId) {
      return res.status(403).json({ message: 'Only project faculty can upload documents' });
    }

    const filePath = `/uploads/project-documents/${req.file.filename}`;
    
    project.documents.push({
      title,
      description: description || '',
      fileUrl: filePath,
      uploadedBy: userId
    });

    await project.save();

    // Notify all students in the project
    for (const studentId of project.currentStudents) {
      await createNotification({
        user: studentId,
        type: 'system',
        title: 'New Document Available',
        body: `A new document "${title}" has been uploaded to ${project.title}`,
        link: `/projects/${projectId}/documents`
      });
    }

    res.status(201).json({ message: 'Document uploaded successfully', documents: project.documents });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get project documents
export const getProjectDocuments = async (req, res) => {
  try {
    const { projectId } = req.params;
    
    const project = await Project.findById(projectId)
      .select('documents title')
      .populate('documents.uploadedBy', 'name email');
    
    if (!project) return res.status(404).json({ message: 'Project not found' });

    res.status(200).json({ documents: project.documents, projectTitle: project.title });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// =========================
// CERTIFICATE SYSTEM
// =========================

// Issue project completion certificate
export const issueCertificate = async (req, res) => {
  try {
    const { projectId, studentId, facultyId, title, note } = req.body;

    const faculty = await User.findById(facultyId);
    if (!faculty || faculty.role !== 'faculty') {
      return res.status(403).json({ message: 'Only faculty can issue certificates' });
    }

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    if (project.faculty.toString() !== facultyId) {
      return res.status(403).json({ message: 'Only project faculty can issue certificates' });
    }

    const student = await User.findById(studentId);
    if (!student || student.role !== 'student') {
      return res.status(400).json({ message: 'Certificate must be issued to a student' });
    }

    if (!project.currentStudents.includes(studentId)) {
      return res.status(400).json({ message: 'Student must be part of the project' });
    }

    // Check if certificate already exists
    const existingCert = await Certificate.findOne({ project: projectId, student: studentId });
    if (existingCert) {
      return res.status(400).json({ message: 'Certificate already issued for this student' });
    }

    const certificate = new Certificate({
      project: projectId,
      faculty: facultyId,
      student: studentId,
      title: title || 'Project Completion Certificate',
      note: note || ''
    });

    await certificate.save();

    // Notify student
    await createNotification({
      user: studentId,
      type: 'system',
      title: 'Certificate Issued',
      body: `You have received a completion certificate for ${project.title}`,
      link: `/certificates/${certificate._id}`
    });

    res.status(201).json({ message: 'Certificate issued successfully', certificate });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get certificates for a student
export const getStudentCertificates = async (req, res) => {
  try {
    const { studentId } = req.params;
    
    const certificates = await Certificate.find({ student: studentId })
      .populate('project', 'title')
      .populate('faculty', 'name email')
      .sort({ issuedAt: -1 });

    res.status(200).json({ certificates });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// =========================
// PROJECT CLOSURE
// =========================

// Close project for applications
export const closeProjectApplications = async (req, res) => {
  try {
    const { projectId, facultyId } = req.body;

    const faculty = await User.findById(facultyId);
    if (!faculty || faculty.role !== 'faculty') {
      return res.status(403).json({ message: 'Only faculty can close applications' });
    }

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    if (project.faculty.toString() !== facultyId) {
      return res.status(403).json({ message: 'Only project faculty can close applications' });
    }

    project.closedForApplications = true;
    project.applicationsOpen = false;
    project.closedAt = new Date();
    await project.save();

    res.status(200).json({ message: 'Project applications closed successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Reopen project for applications
export const reopenProjectApplications = async (req, res) => {
  try {
    const { projectId, facultyId } = req.body;

    const faculty = await User.findById(facultyId);
    if (!faculty || faculty.role !== 'faculty') {
      return res.status(403).json({ message: 'Only faculty can reopen applications' });
    }

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    if (project.faculty.toString() !== facultyId) {
      return res.status(403).json({ message: 'Only project faculty can reopen applications' });
    }

    project.closedForApplications = false;
    project.applicationsOpen = true;
    project.closedAt = null;
    await project.save();

    res.status(200).json({ message: 'Project applications reopened successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// =========================
// LAB ACCESS & TIMELINE EXTENSION
// =========================

// Request lab access
export const requestLabAccess = async (req, res) => {
  try {
    const { projectId, studentId, note } = req.body;

    const student = await User.findById(studentId);
    if (!student || student.role !== 'student') {
      return res.status(403).json({ message: 'Only students can request lab access' });
    }

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    if (!project.currentStudents.includes(studentId)) {
      return res.status(400).json({ message: 'Student must be accepted in the project' });
    }

    // Check if request already exists
    const existingRequest = await LabAccessRequest.findOne({ project: projectId, student: studentId });
    if (existingRequest) {
      return res.status(400).json({ message: 'Lab access request already exists' });
    }

    const labRequest = new LabAccessRequest({
      project: projectId,
      student: studentId,
      note: note || ''
    });

    await labRequest.save();

    // Notify faculty
    await createNotification({
      user: project.faculty,
      type: 'system',
      title: 'Lab Access Request',
      body: `${student.name} requested lab access for ${project.title}`,
      link: `/lab-requests/${labRequest._id}`
    });

    res.status(201).json({ message: 'Lab access requested successfully', request: labRequest });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Approve/Reject lab access
export const updateLabAccessStatus = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status, facultyId } = req.body;

    const faculty = await User.findById(facultyId);
    if (!faculty || faculty.role !== 'faculty') {
      return res.status(403).json({ message: 'Only faculty can update lab access status' });
    }

    const labRequest = await LabAccessRequest.findById(requestId).populate('project student');
    if (!labRequest) return res.status(404).json({ message: 'Lab access request not found' });

    if (labRequest.project.faculty.toString() !== facultyId) {
      return res.status(403).json({ message: 'Only project faculty can update this request' });
    }

    labRequest.status = status;
    await labRequest.save();

    // Notify student
    await createNotification({
      user: labRequest.student._id,
      type: 'system',
      title: `Lab Access ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      body: `Your lab access request for ${labRequest.project.title} has been ${status}`,
      link: `/lab-requests/${labRequest._id}`
    });

    res.status(200).json({ message: `Lab access ${status} successfully`, request: labRequest });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Request timeline extension
export const requestTimelineExtension = async (req, res) => {
  try {
    const { projectId, studentId, requestedNewDeadline, reason } = req.body;

    const student = await User.findById(studentId);
    if (!student || student.role !== 'student') {
      return res.status(403).json({ message: 'Only students can request timeline extension' });
    }

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    if (!project.currentStudents.includes(studentId)) {
      return res.status(400).json({ message: 'Student must be part of the project' });
    }

    // Check if student has approved lab access
    const labAccess = await LabAccessRequest.findOne({ 
      project: projectId, 
      student: studentId, 
      status: 'approved' 
    });
    if (!labAccess) {
      return res.status(400).json({ message: 'Lab access must be approved before requesting timeline extension' });
    }

    const extensionRequest = new TimelineExtensionRequest({
      project: projectId,
      student: studentId,
      currentDeadline: project.deadline,
      requestedNewDeadline: new Date(requestedNewDeadline),
      reason: reason || ''
    });

    await extensionRequest.save();

    // Notify faculty
    await createNotification({
      user: project.faculty,
      type: 'system',
      title: 'Timeline Extension Request',
      body: `${student.name} requested timeline extension for ${project.title}`,
      link: `/timeline-requests/${extensionRequest._id}`
    });

    res.status(201).json({ message: 'Timeline extension requested successfully', request: extensionRequest });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Approve/Reject timeline extension
export const updateTimelineExtensionStatus = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status, facultyId } = req.body;

    const faculty = await User.findById(facultyId);
    if (!faculty || faculty.role !== 'faculty') {
      return res.status(403).json({ message: 'Only faculty can update timeline extension status' });
    }

    const extensionRequest = await TimelineExtensionRequest.findById(requestId)
      .populate('project student');
    if (!extensionRequest) return res.status(404).json({ message: 'Timeline extension request not found' });

    if (extensionRequest.project.faculty.toString() !== facultyId) {
      return res.status(403).json({ message: 'Only project faculty can update this request' });
    }

    extensionRequest.status = status;
    await extensionRequest.save();

    // If approved, update project deadline
    if (status === 'approved') {
      await Project.findByIdAndUpdate(extensionRequest.project._id, {
        deadline: extensionRequest.requestedNewDeadline
      });
    }

    // Notify student about the decision
    await createNotification({
      user: extensionRequest.student._id,
      type: 'system',
      title: `Timeline Extension ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      body: `Your timeline extension request for "${extensionRequest.project.title}" has been ${status}`,
      link: `/projects/${extensionRequest.project._id}`
    });

    res.status(200).json({ 
      message: `Timeline extension ${status} successfully`, 
      request: extensionRequest 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// =========================
// TASK MANAGEMENT
// =========================

// Get tasks with query parameters (general endpoint)
export const getTasks = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const { userId, projectId } = req.query;
    const currentUserId = req.user.id;
    const currentUserRole = req.user.role;
    let query = {};

    // Role-based filtering
    if (currentUserRole === 'student') {
      // Students can only see tasks assigned to them
      query.assignedTo = currentUserId;
    } else if (currentUserRole === 'faculty') {
      // Faculty can see tasks in their projects
      if (projectId) {
        // Verify faculty owns this project
        const project = await Project.findById(projectId);
        if (!project || project.faculty.toString() !== currentUserId) {
          return res.status(403).json({ message: 'Access denied to this project' });
        }
        query.project = projectId;
      } else {
        // Get all tasks from faculty's projects
        const facultyProjects = await Project.find({ faculty: currentUserId }).select('_id');
        const projectIds = facultyProjects.map(p => p._id);
        query.project = { $in: projectIds };
      }
    } else if (currentUserRole === 'admin') {
      // Admin can see all tasks
      if (projectId) {
        query.project = projectId;
      } else if (userId) {
        query.assignedTo = userId;
      }
    }

    const tasks = await Task.find(query)
      .populate('assignedTo', 'name email')
      .populate('project', 'title')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json(tasks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// =========================
// PROJECT MANAGEMENT
// =========================

// Update project details (faculty only)
export const updateProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { facultyId, title, description, domain, requirements, maxStudents, deadline, requiredTasksCount } = req.body;

    const faculty = await User.findById(facultyId);
    if (!faculty || faculty.role !== 'faculty') {
      return res.status(403).json({ message: 'Only faculty can update projects' });
    }

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    if (project.faculty.toString() !== facultyId) {
      return res.status(403).json({ message: 'Only project faculty can update this project' });
    }

    // Update project fields
    if (title) project.title = title;
    if (description) project.description = description;
    if (domain) project.domain = domain;
    if (requirements) project.requirements = requirements;
    if (maxStudents) project.maxStudents = maxStudents;
    if (deadline) project.deadline = new Date(deadline);
    if (requiredTasksCount !== undefined) project.requiredTasksCount = requiredTasksCount;

    await project.save();

    // Recalculate progress if required tasks count was updated
    if (requiredTasksCount !== undefined) {
      await updateProjectProgress(projectId);
    }

    res.status(200).json({ message: 'Project updated successfully', project });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Accept/Reject application and manage students
export const updateApplicationStatus = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { status, facultyId } = req.body;

    const faculty = await User.findById(facultyId);
    if (!faculty || faculty.role !== 'faculty') {
      return res.status(403).json({ message: 'Only faculty can update application status' });
    }

    const application = await Application.findById(applicationId)
      .populate('project student');
    if (!application) return res.status(404).json({ message: 'Application not found' });

    if (application.project.faculty.toString() !== facultyId) {
      return res.status(403).json({ message: 'Only project faculty can update this application' });
    }

    const oldStatus = application.status;
    application.status = status;
    await application.save();

    // If accepted, add student to project
    if (status === 'accepted' && oldStatus !== 'accepted') {
      const project = await Project.findById(application.project._id);
      if (!project.currentStudents.includes(application.student._id)) {
        project.currentStudents.push(application.student._id);
        await project.save();
      }
    }

    // If rejected or status changed from accepted, remove student from project
    if (status === 'rejected' && oldStatus === 'accepted') {
      const project = await Project.findById(application.project._id);
      project.currentStudents = project.currentStudents.filter(
        studentId => studentId.toString() !== application.student._id.toString()
      );
      await project.save();
    }

    // Create notification for student
    await createNotification({
      user: application.student._id,
      type: 'application',
      title: `Application ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      body: `Your application for "${application.project.title}" has been ${status}`,
      link: `/applications/${application._id}`
    });

    res.status(200).json({ message: `Application ${status} successfully`, application });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get project applications for faculty
export const getProjectApplications = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { facultyId } = req.query;

    const faculty = await User.findById(facultyId);
    if (!faculty || faculty.role !== 'faculty') {
      return res.status(403).json({ message: 'Only faculty can view project applications' });
    }

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    if (project.faculty.toString() !== facultyId) {
      return res.status(403).json({ message: 'Only project faculty can view applications' });
    }

    const applications = await Application.find({ project: projectId })
      .populate('student', 'name email cgpa institution program department academicInterests publications profilePhoto role')
      .sort({ createdAt: -1 });

    res.status(200).json({ applications });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Configure multer for task work uploads
const taskWorkStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/task-work/';
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    } catch (e) {
      console.error('Failed to ensure task-work upload directory exists:', e);
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'work-' + uniqueSuffix + path.extname(file.originalname));
  }
});

export const uploadTaskWorkMiddleware = multer({
  storage: taskWorkStorage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|doc|docx|ppt|pptx|xls|xlsx|txt|zip|rar|jpg|jpeg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    if (extname) return cb(null, true);
    cb(new Error('File type not allowed'));
  }
});

// Update task with work upload (students only)
export const updateTaskWithWork = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status, comments, userId } = req.body;

    const task = await Task.findById(taskId).populate('project');
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Only assigned student can update their task
    if (user.role !== 'student' || task.assignedTo.toString() !== userId) {
      return res.status(403).json({ message: 'You can only update your own tasks' });
    }

    let workFileUrl = null;
    if (req.file) {
      workFileUrl = `/uploads/task-work/${req.file.filename}`;
    }

    // Update task
    task.status = status;
    task.updates.push({
      status,
      comments: comments || '',
      updatedBy: userId,
      workFile: workFileUrl
    });

    await task.save();

    // Create notification for faculty
    await createNotification({
      user: task.project.faculty,
      type: 'task',
      title: 'Task Work Submitted',
      body: `${user.name} submitted work for task: ${task.title}`,
      link: `/tasks/${task._id}`
    });

    // Update milestone progress if task is completed
    if (status === 'completed') {
      await updateMilestoneProgress(task.project._id);
    }

    res.status(200).json({ message: 'Task updated with work submission', task });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get project students for task assignment
export const getProjectStudents = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { facultyId } = req.query;

    const faculty = await User.findById(facultyId);
    if (!faculty || faculty.role !== 'faculty') {
      return res.status(403).json({ message: 'Only faculty can view project students' });
    }

    const project = await Project.findById(projectId)
      .populate('currentStudents', 'name email academicInterests');
    if (!project) return res.status(404).json({ message: 'Project not found' });

    if (project.faculty.toString() !== facultyId) {
      return res.status(403).json({ message: 'Only project faculty can view students' });
    }

    res.status(200).json({ students: project.currentStudents });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// =========================
// COMPUTER INVENTORY & PC REQUESTS
// =========================

// Admin: create computer
export const createComputer = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admin can add computers' });
    }

    const { name, location, specs, status, tags } = req.body;

    const comp = new Computer({
      name,
      location: location || '',
      specs: specs || '',
      status: status || 'active',
      tags: Array.isArray(tags) ? tags : [],
      createdBy: req.user.id
    });

    await comp.save();
    res.status(201).json({ message: 'Computer created', computer: comp });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Admin: update computer
export const updateComputer = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admin can update computers' });
    }

    const { id } = req.params;
    const { name, location, specs, status, tags } = req.body;

    const comp = await Computer.findById(id);
    if (!comp) return res.status(404).json({ message: 'Computer not found' });

    if (name !== undefined) comp.name = name;
    if (location !== undefined) comp.location = location;
    if (specs !== undefined) comp.specs = specs;
    if (status !== undefined) comp.status = status;
    if (tags !== undefined) comp.tags = Array.isArray(tags) ? tags : [];

    await comp.save();
    res.status(200).json({ message: 'Computer updated', computer: comp });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// List computers (open to all; frontend can filter by status)
export const listComputers = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status) filter.status = status;
    const computers = await Computer.find(filter).sort({ createdAt: -1 });
    res.status(200).json({ computers });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Student: create PC request
export const createPcRequest = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const { desiredStart, desiredEnd, purpose, preferredComputer } = req.body;
    const studentId = req.user.id;

    const student = await User.findById(studentId);
    if (!student || student.role !== 'student') {
      return res.status(403).json({ message: 'Only students can request PCs' });
    }

    const start = new Date(desiredStart);
    const end = new Date(desiredEnd);
    if (!(start instanceof Date) || isNaN(start) || !(end instanceof Date) || isNaN(end) || start >= end) {
      return res.status(400).json({ message: 'Invalid start/end time' });
    }

    const reqDoc = new PcRequest({
      student: studentId,
      desiredStart: start,
      desiredEnd: end,
      purpose: purpose || ''
    });

    // If student selected a preferred computer, validate and attach
    if (preferredComputer) {
      const pref = await Computer.findById(preferredComputer);
      if (pref) {
        reqDoc.preferredComputer = pref._id;
      }
    }
    await reqDoc.save();

    // Notify admin(s) - for simplicity, notify the default admin account
    const admin = await User.findOne({ role: 'admin' });
    if (admin) {
      await createNotification({
        user: admin._id,
        type: 'system',
        title: 'New PC Request',
        body: `${student.name} requested a PC from ${start.toLocaleString()} to ${end.toLocaleString()}`,
        link: `/pc-requests/${reqDoc._id}`
      });
    }

    res.status(201).json({ message: 'PC request submitted', request: reqDoc });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Student: list own PC requests
export const listMyPcRequests = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const studentId = req.user.id;
    const student = await User.findById(studentId);
    if (!student || student.role !== 'student') {
      return res.status(403).json({ message: 'Only students can view their requests' });
    }
    const requests = await PcRequest.find({ student: studentId })
      .populate('computer')
      .populate('preferredComputer')
      .sort({ createdAt: -1 });
    res.status(200).json({ requests });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Admin: list PC requests (optionally by status)
export const listPcRequests = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const { status } = req.query;
    const adminId = req.user.id;
    const admin = await User.findById(adminId);
    if (!admin || admin.role !== 'admin') {
      return res.status(403).json({ message: 'Only admin can view PC requests' });
    }
    const filter = {};
    if (status) filter.status = status;
    const requests = await PcRequest.find(filter)
      .populate('student', 'name email')
      .populate('computer')
      .populate('preferredComputer')
      .sort({ createdAt: -1 });
    res.status(200).json({ requests });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Helper to check overlap of allocations for a computer
const hasOverlap = async (computerId, start, end) => {
  const overlap = await PcRequest.find({
    computer: computerId,
    status: 'approved',
    slotStart: { $lt: end },
    slotEnd: { $gt: start }
  }).limit(1);
  return overlap.length > 0;
};

// Admin: approve PC request with allocation
// Admin: direct PC allocation to user
export const allocatePcToUser = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admin can allocate PCs' });
    }

    const { userId, computerId, startTime, endTime, purpose } = req.body;

    if (!userId || !computerId || !startTime || !endTime) {
      return res.status(400).json({ message: 'All allocation fields are required' });
    }

    // Validate user exists and is a student
    const student = await User.findById(userId);
    if (!student) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (student.role !== 'student') {
      return res.status(400).json({ message: 'Can only allocate PCs to students' });
    }

    // Validate computer exists and is active
    const computer = await Computer.findById(computerId);
    if (!computer || computer.status !== 'active') {
      return res.status(400).json({ message: 'Computer not available' });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);
    if (!(start instanceof Date) || isNaN(start) || !(end instanceof Date) || isNaN(end) || start >= end) {
      return res.status(400).json({ message: 'Invalid allocation time' });
    }

    // Check overlap
    const overlap = await hasOverlap(computerId, start, end);
    if (overlap) {
      return res.status(409).json({ message: 'Time slot overlaps with an existing allocation' });
    }

    // Create a new PC request and approve it immediately
    const newRequest = new PcRequest({
      student: userId,
      purpose: purpose || 'Admin direct allocation',
      desiredStart: start,
      desiredEnd: end,
      status: 'approved',
      computer: computerId,
      slotStart: start,
      slotEnd: end,
      adminNote: 'Direct admin allocation'
    });

    await newRequest.save();

    // Notify student
    await createNotification({
      user: userId,
      type: 'system',
      title: 'PC Allocated',
      body: `A PC has been allocated to you. Computer: ${computer.name}, Slot: ${start.toLocaleString()} - ${end.toLocaleString()}`,
      link: `/pc-requests`
    });

    res.json({ 
      message: 'PC allocated successfully',
      allocation: {
        student: student.name,
        computer: computer.name,
        startTime: start,
        endTime: end
      }
    });
  } catch (error) {
    console.error('Error allocating PC:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const approvePcRequest = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admin can approve PC requests' });
    }

    const { requestId } = req.params;
    const { computerId, slotStart, slotEnd, adminNote } = req.body;

    const request = await PcRequest.findById(requestId).populate('student');
    if (!request) return res.status(404).json({ message: 'PC request not found' });

    const computer = await Computer.findById(computerId);
    if (!computer || computer.status !== 'active') {
      return res.status(400).json({ message: 'Computer not available' });
    }

    const start = new Date(slotStart);
    const end = new Date(slotEnd);
    if (!(start instanceof Date) || isNaN(start) || !(end instanceof Date) || isNaN(end) || start >= end) {
      return res.status(400).json({ message: 'Invalid allocation time' });
    }

    // Check overlap
    const overlap = await hasOverlap(computerId, start, end);
    if (overlap) {
      return res.status(409).json({ message: 'Time slot overlaps with an existing allocation' });
    }

    request.status = 'approved';
    request.computer = computerId;
    request.slotStart = start;
    request.slotEnd = end;
    request.adminNote = adminNote || '';
    await request.save();

    // Notify student
    await createNotification({
      user: request.student._id,
      type: 'system',
      title: 'PC Request Approved',
      body: `Your PC request has been approved. Computer: ${computer.name}, Slot: ${start.toLocaleString()} - ${end.toLocaleString()}`,
      link: `/pc-requests`
    });

    res.status(200).json({ message: 'PC request approved', request });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Admin: reject PC request
export const rejectPcRequest = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admin can reject PC requests' });
    }

    const { requestId } = req.params;
    const { adminNote } = req.body;

    const request = await PcRequest.findById(requestId).populate('student');
    if (!request) return res.status(404).json({ message: 'PC request not found' });

    request.status = 'rejected';
    request.adminNote = adminNote || '';
    await request.save();

    // Notify student
    await createNotification({
      user: request.student._id,
      type: 'system',
      title: 'PC Request Rejected',
      body: `Your PC request has been rejected.${adminNote ? ' Note: ' + adminNote : ''}`,
      link: `/pc-requests/${request._id}`
    });

    res.status(200).json({ message: 'PC request rejected', request });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Freeze user functionality for admin
export const freezeUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ message: 'Cannot freeze admin users' });
    }

    user.frozen = true;
    await user.save();

    // Create notification for frozen user
    await createNotification({
      user: userId,
      type: 'system',
      title: 'Account Frozen',
      body: 'Your account has been frozen by an administrator. Please contact support for assistance.',
      link: '/profile'
    });

    res.json({ message: `User ${user.name} has been frozen` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while freezing user' });
  }
};

// Unfreeze user functionality for admin
export const unfreezeUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.frozen = false;
    await user.save();

    // Create notification for unfrozen user
    await createNotification({
      user: userId,
      type: 'system',
      title: 'Account Unfrozen',
      body: 'Your account has been unfrozen. You can now access all features.',
      link: '/home'
    });

    res.json({ message: `User ${user.name} has been unfrozen` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while unfreezing user' });
  }
};
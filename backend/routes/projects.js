import express from 'express';
import Project from '../models/Project.js';
import User from '../models/model.js';

const router = express.Router();

// Get all projects with faculty and students populated
router.get('/', async (req, res) => {
  try {
    const projects = await Project.find()
      .populate({ path: 'faculty', select: 'email name role profile profilePhoto' })
      .populate({ path: 'currentStudents', select: 'email name role profile profilePhoto' })
      .sort({ createdAt: -1 });
    res.json(projects);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new project (faculty/admin)
router.post('/', async (req, res) => {
  try {
    const { faculty, title, description, domain } = req.body;
    if (!faculty) {
      return res.status(400).json({ message: 'Faculty ID is required' });
    }
    if (!title || !description || !domain) {
      return res.status(400).json({ message: 'Title, description, and domain are required' });
    }

    const user = await User.findById(faculty);
    if (!user) {
      return res.status(404).json({ message: 'Faculty user not found' });
    }
    if (!['faculty', 'admin'].includes(user.role)) {
      return res.status(403).json({ message: 'Only faculty or admin can create projects' });
    }

    const payload = {
      ...req.body,
      status: req.body.status || 'available',
    };

    const project = await Project.create(payload);
    res.status(201).json(project);
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: err.message });
  }
});

export default router;

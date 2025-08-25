import express from 'express';
import Project from '../models/Project.js';
import User from '../models/model.js';
import { 
  getProjectMilestones, 
  closeProjectApplications, 
  reopenProjectApplications, 
  uploadProjectDocument, 
  getProjectDocuments,
  uploadDocumentMiddleware,
  updateProject,
  getProjectApplications,
  getProjectStudents,
  setRequiredTasksCount
} from '../controllers/controller.js';

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

// Toggle applications open/close
router.put('/:id/applications-open', async (req, res) => {
  try {
    const { id } = req.params;
    const { facultyId, open } = req.body;
    const faculty = await User.findById(facultyId);
    if (!faculty || !['faculty', 'admin'].includes(faculty.role)) return res.status(403).json({ message: 'Forbidden' });
    const project = await Project.findById(id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (faculty.role !== 'admin' && String(project.faculty) !== String(facultyId)) return res.status(403).json({ message: 'Not owner' });
    project.applicationsOpen = Boolean(open);
    await project.save();
    res.json({ message: 'Applications state updated', project });
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: err.message });
  }
});

// Add a milestone
router.post('/:id/milestones', async (req, res) => {
  try {
    const { id } = req.params;
    const { facultyId, title, description, dueDate } = req.body;
    const faculty = await User.findById(facultyId);
    if (!faculty || !['faculty', 'admin'].includes(faculty.role)) return res.status(403).json({ message: 'Forbidden' });
    const project = await Project.findById(id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (faculty.role !== 'admin' && String(project.faculty) !== String(facultyId)) return res.status(403).json({ message: 'Not owner' });
    project.milestones = project.milestones || [];
    project.milestones.push({ title, description: description || '', dueDate: dueDate ? new Date(dueDate) : null, completed: false, completedAt: null });
    await project.save();
    res.status(201).json(project.milestones);
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: err.message });
  }
});

// Update milestone completion or fields
router.put('/:id/milestones/:index', async (req, res) => {
  try {
    const { id, index } = req.params;
    const { facultyId, title, description, dueDate, completed } = req.body;
    const faculty = await User.findById(facultyId);
    if (!faculty || !['faculty', 'admin'].includes(faculty.role)) return res.status(403).json({ message: 'Forbidden' });
    const project = await Project.findById(id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (faculty.role !== 'admin' && String(project.faculty) !== String(facultyId)) return res.status(403).json({ message: 'Not owner' });
    const i = Number(index);
    if (!project.milestones || !project.milestones[i]) return res.status(404).json({ message: 'Milestone not found' });
    if (title !== undefined) project.milestones[i].title = title;
    if (description !== undefined) project.milestones[i].description = description;
    if (dueDate !== undefined) project.milestones[i].dueDate = dueDate ? new Date(dueDate) : null;
    if (completed !== undefined) {
      project.milestones[i].completed = Boolean(completed);
      project.milestones[i].completedAt = completed ? new Date() : null;
    }
    await project.save();
    res.json(project.milestones[i]);
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: err.message });
  }
});

// Get project milestones
router.get('/:projectId/milestones', getProjectMilestones);

// Close project applications
router.post('/:projectId/close', closeProjectApplications);

// Reopen project applications
router.post('/:projectId/reopen', reopenProjectApplications);

// Upload project document
router.post('/:projectId/documents', uploadDocumentMiddleware.single('document'), uploadProjectDocument);

// Get project documents
router.get('/:projectId/documents', getProjectDocuments);

// Update project details
router.put('/:projectId', updateProject);

// Get project applications
router.get('/:projectId/applications', getProjectApplications);

// Get project students
router.get('/:projectId/students', getProjectStudents);

// Set required tasks count for a project (faculty only)
router.put('/:projectId/required-tasks', setRequiredTasksCount);

// Get projects for a specific user (student or faculty)
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let projects = [];
    
    if (user.role === 'student') {
      // Get projects where user is a current student
      projects = await Project.find({ currentStudents: userId })
        .populate('faculty', 'name email')
        .populate('currentStudents', 'name email')
        .sort({ createdAt: -1 });
    } else if (user.role === 'faculty') {
      // Get projects where user is the faculty
      projects = await Project.find({ faculty: userId })
        .populate('faculty', 'name email')
        .populate('currentStudents', 'name email')
        .sort({ createdAt: -1 });
    }

    res.status(200).json({ projects });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;


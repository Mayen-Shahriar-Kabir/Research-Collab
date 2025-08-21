import express from 'express';
import Application from '../models/Application.js';
import Project from '../models/Project.js';
import User from '../models/model.js';

const router = express.Router();

// Create application
router.post('/', async (req, res) => {
  try {
    const { student, project, message, cvUrl, sampleWorkUrl } = req.body;

    const proj = await Project.findById(project);
    if (!proj) return res.status(404).json({ message: 'Project not found' });

    // Prevent applications to full projects
    if (proj.currentStudents?.length >= (proj.maxStudents || 0)) {
      return res.status(400).json({ message: 'Project is full' });
    }

    const application = await Application.create({ student, project, message, cvUrl, sampleWorkUrl });
    res.status(201).json(application);
  } catch (err) {
    console.error(err);
    if (err.code === 11000) {
      return res.status(400).json({ message: 'You already applied to this project' });
    }
    res.status(400).json({ message: err.message });
  }
});

// List applications for projects owned by a faculty
// GET /api/applications?facultyId=<id>&status=pending|accepted|rejected
router.get('/', async (req, res) => {
  try {
    const { facultyId, status } = req.query;
    if (!facultyId) return res.status(400).json({ message: 'facultyId is required' });

    const faculty = await User.findById(facultyId);
    if (!faculty) return res.status(404).json({ message: 'Faculty not found' });
    if (!['faculty', 'admin'].includes(faculty.role)) {
      return res.status(403).json({ message: 'Only faculty/admin can view applications' });
    }

    const projects = await Project.find({ faculty: facultyId }, { _id: 1 });
    const projectIds = projects.map(p => p._id);

    const filter = { project: { $in: projectIds } };
    if (status) filter.status = status;

    const apps = await Application.find(filter)
      .populate({ path: 'student', select: 'name email profile profilePhoto role' })
      .populate({ path: 'project', select: 'title domain maxStudents currentStudents status' })
      .sort({ createdAt: -1 });

    res.json(apps);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update application status (accept/reject/shortlist) by project owner
// PUT /api/applications/:id/status  body: { facultyId, action: 'accept'|'reject'|'shortlist' }
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { facultyId, action } = req.body;

    if (!facultyId || !action) {
      return res.status(400).json({ message: 'facultyId and action are required' });
    }
    if (!['accept', 'reject', 'shortlist'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action' });
    }

    const faculty = await User.findById(facultyId);
    if (!faculty) return res.status(404).json({ message: 'Faculty not found' });
    if (!['faculty', 'admin'].includes(faculty.role)) {
      return res.status(403).json({ message: 'Only faculty/admin can update applications' });
    }

    const app = await Application.findById(id).populate('project');
    if (!app) return res.status(404).json({ message: 'Application not found' });

    // Ensure ownership
    if (String(app.project.faculty) !== String(facultyId) && faculty.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized for this project' });
    }

    if (action === 'accept') {
      // Capacity check
      const project = await Project.findById(app.project._id);
      const currentCount = project.currentStudents?.length || 0;
      if (currentCount >= (project.maxStudents || 0)) {
        return res.status(400).json({ message: 'Project is full' });
      }
      // Add student if not already present
      const already = project.currentStudents.some(s => String(s) === String(app.student));
      if (!already) {
        project.currentStudents.push(app.student);
        await project.save();
      }
      app.status = 'accepted';
      await app.save();
      return res.json({ message: 'Application accepted', application: app });
    }

    if (action === 'reject') {
      app.status = 'rejected';
      await app.save();
      return res.json({ message: 'Application rejected', application: app });
    }

    if (action === 'shortlist') {
      app.status = 'shortlisted';
      await app.save();
      return res.json({ message: 'Application shortlisted', application: app });
    }
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: err.message });
  }
});

export default router;

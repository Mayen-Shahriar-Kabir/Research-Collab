import express from 'express';
import Application from '../models/Application.js';
import Project from '../models/Project.js';
import User from '../models/model.js';
import Notification from '../models/Notification.js';

const router = express.Router();

// Create new application
router.post('/', async (req, res) => {
  try {
    const { student, project, message } = req.body;

    if (!student || !project) {
      return res.status(400).json({ 
        success: false,
        message: 'Student and project are required' 
      });
    }

    // Check if project exists and is open for applications
    const projectDoc = await Project.findById(project);
    if (!projectDoc) {
      return res.status(404).json({ 
        success: false,
        message: 'Project not found' 
      });
    }

    if (!projectDoc.applicationsOpen) {
      return res.status(400).json({ 
        success: false,
        message: 'Applications are closed for this project' 
      });
    }

    // Check if student already applied
    const existingApplication = await Application.findOne({ student, project });
    if (existingApplication) {
      return res.status(400).json({ 
        success: false,
        message: 'You have already applied to this project' 
      });
    }

    // Create application
    const application = await Application.create({
      student,
      project,
      message: message || '',
      status: 'pending'
    });

    // Notify faculty
    await Notification.create({
      user: projectDoc.faculty,
      type: 'application',
      title: 'New Project Application',
      body: `A student has applied to your project: ${projectDoc.title}`,
      link: `/projects/${project}`
    });

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      data: application
    });

  } catch (error) {
    console.error('Error creating application:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

// Get applications for faculty projects
router.get('/', async (req, res) => {
  try {
    const { facultyId, projectId, status, minCgpa, maxCgpa } = req.query;

    if (!facultyId) {
      return res.status(400).json({ 
        success: false,
        message: 'facultyId is required'
      });
    }

    // Find projects for this faculty
    const projectFilter = projectId 
      ? { _id: projectId, faculty: facultyId }
      : { faculty: facultyId };
    
    const projects = await Project.find(projectFilter);
    const projectIds = projects.map(p => p._id);

    if (projectIds.length === 0) {
      return res.json({ 
        success: true, 
        data: [],
        count: 0
      });
    }

    // Build application query
    const query = { project: { $in: projectIds } };
    if (status) query.status = status;

    // Get applications with populated data
    let applications = await Application.find(query)
      .populate('student', 'name email cgpa department institution profilePhoto')
      .populate('project', 'title description domain')
      .sort({ createdAt: -1 });

    // Apply CGPA filtering if specified
    if (minCgpa || maxCgpa) {
      applications = applications.filter(app => {
        if (!app.student || !app.student.cgpa) return false;
        const cgpa = parseFloat(app.student.cgpa);
        if (minCgpa && cgpa < parseFloat(minCgpa)) return false;
        if (maxCgpa && cgpa > parseFloat(maxCgpa)) return false;
        return true;
      });
    }

    res.json({
      success: true,
      data: applications,
      applications: applications,
      count: applications.length
    });

  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

// Update application status
router.put('/:applicationId/status', async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { status, facultyId } = req.body;

    if (!status || !facultyId) {
      return res.status(400).json({ 
        success: false,
        message: 'Status and facultyId are required' 
      });
    }

    if (!['pending', 'shortlisted', 'accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid status' 
      });
    }

    const application = await Application.findById(applicationId)
      .populate('project')
      .populate('student');

    if (!application) {
      return res.status(404).json({ 
        success: false,
        message: 'Application not found' 
      });
    }

    // Check if faculty owns this project
    if (application.project.faculty.toString() !== facultyId) {
      return res.status(403).json({ 
        success: false,
        message: 'Not authorized' 
      });
    }

    const oldStatus = application.status;
    application.status = status;
    await application.save();

    // Handle project student list updates
    if (status === 'accepted' && oldStatus !== 'accepted') {
      const project = await Project.findById(application.project._id);
      if (!project.currentStudents.includes(application.student._id)) {
        project.currentStudents.push(application.student._id);
        await project.save();
      }
    } else if (status === 'rejected' && oldStatus === 'accepted') {
      const project = await Project.findById(application.project._id);
      project.currentStudents = project.currentStudents.filter(
        id => id.toString() !== application.student._id.toString()
      );
      await project.save();
    }

    res.json({
      success: true,
      message: `Application ${status}`,
      data: application
    });

  } catch (error) {
    console.error('Error updating application:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

export default router;

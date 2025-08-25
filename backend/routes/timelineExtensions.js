import express from 'express';
import { requestTimelineExtension, updateTimelineExtensionStatus } from '../controllers/controller.js';

const router = express.Router();

// Request timeline extension
router.post('/', requestTimelineExtension);

// Update timeline extension status (approve/reject)
router.put('/:requestId/status', updateTimelineExtensionStatus);

// List requests
router.get('/', async (req, res) => {
  try {
    const { facultyId, projectId, studentId, status } = req.query;
    const filter = {};
    if (projectId) filter.project = projectId;
    if (studentId) filter.student = studentId;
    if (status) filter.status = status;
    const list = await TimelineExtensionRequest.find(filter)
      .populate('project', 'title faculty deadline')
      .populate('student', 'name email');
    if (facultyId) {
      const owned = list.filter(item => String(item.project.faculty) === String(facultyId));
      return res.json(owned);
    }
    res.json(list);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;

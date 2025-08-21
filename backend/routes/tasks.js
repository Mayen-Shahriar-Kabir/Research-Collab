import express from 'express';
import Task from '../models/Task.js';

const router = express.Router();

// Get tasks filtered by optional projectId and/or userId
router.get('/', async (req, res) => {
  try {
    const { projectId, userId } = req.query;
    const filter = {};
    if (projectId) filter.project = projectId;
    if (userId) filter.assignedTo = userId;

    const tasks = await Task.find(filter)
      .populate({ path: 'project', select: 'title' })
      .populate({ path: 'assignedTo', select: 'email name role' })
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create task
router.post('/', async (req, res) => {
  try {
    const task = await Task.create(req.body);
    const populated = await task.populate([
      { path: 'project', select: 'title' },
      { path: 'assignedTo', select: 'email name role' },
    ]);
    res.status(201).json(populated);
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: err.message });
  }
});

// Update status
router.put('/:taskId/status', async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status } = req.body;
    const updated = await Task.findByIdAndUpdate(taskId, { status }, { new: true })
      .populate({ path: 'project', select: 'title' })
      .populate({ path: 'assignedTo', select: 'email name role' });
    if (!updated) return res.status(404).json({ message: 'Task not found' });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: err.message });
  }
});

export default router;

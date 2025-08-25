import express from 'express';
import { getProjectTasks, getStudentTasks, getTasks, createTask, updateTaskStatus, updateTaskWithWork, uploadTaskWorkMiddleware, approveTask } from '../controllers/controller.js';

const router = express.Router();

// Get tasks (with query parameters)
router.get('/', getTasks);

// Get tasks for a project
router.get('/project/:projectId', getProjectTasks);

// Get tasks assigned to a student
router.get('/student/:studentId', getStudentTasks);

// Create task (faculty only)
router.post('/', createTask);

// Update task status
router.put('/:taskId/status', updateTaskStatus);

// Update task with work file upload (students only)
router.put('/:taskId/work', uploadTaskWorkMiddleware.single('workFile'), updateTaskWithWork);

// Approve/reject task (faculty only)
router.put('/:taskId/approve', approveTask);

export default router;

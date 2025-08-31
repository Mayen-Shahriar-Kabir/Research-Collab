import express from 'express';
import { createComputer, updateComputer, listComputers } from '../controllers/controller.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// List computers (authenticated users)
router.get('/', authenticateToken, listComputers);

// Create computer (admin only)
router.post('/', authenticateToken, createComputer);

// Update computer (admin only)
router.put('/:id', authenticateToken, updateComputer);

export default router;

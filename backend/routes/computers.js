import express from 'express';
import { createComputer, updateComputer, listComputers } from '../controllers/controller.js';

const router = express.Router();

// List computers (anyone)
router.get('/', listComputers);

// Create computer (admin only)
router.post('/', createComputer);

// Update computer (admin only)
router.put('/:id', updateComputer);

export default router;

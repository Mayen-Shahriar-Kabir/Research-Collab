import express from 'express';
import { freezeUser, unfreezeUser, getUsers, setUserRole, allocatePcToUser } from '../controllers/controller.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Admin user management routes
router.get('/users', authenticateToken, getUsers);
router.put('/users/:userId/role', authenticateToken, setUserRole);
router.put('/users/:userId/freeze', authenticateToken, freezeUser);
router.put('/users/:userId/unfreeze', authenticateToken, unfreezeUser);

// Admin PC allocation route
router.post('/allocate-pc', authenticateToken, allocatePcToUser);

export default router;

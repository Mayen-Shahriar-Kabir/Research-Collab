import express from 'express';
import { freezeUser, unfreezeUser, getUsers, setUserRole } from '../controllers/controller.js';

const router = express.Router();

// Admin user management routes
router.get('/users', getUsers);
router.put('/users/:userId/role', setUserRole);
router.put('/users/:userId/freeze', freezeUser);
router.put('/users/:userId/unfreeze', unfreezeUser);

export default router;

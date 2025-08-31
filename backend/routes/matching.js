import express from 'express';
import { getFacultyStudentMatches, getMatchAnalysis } from '../controllers/matchingController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get faculty-student matches for a user
router.get('/suggestions/:userId', authenticateToken, getFacultyStudentMatches);

// Get detailed match analysis between two users
router.get('/analysis/:userId/:targetId', authenticateToken, getMatchAnalysis);

export default router;

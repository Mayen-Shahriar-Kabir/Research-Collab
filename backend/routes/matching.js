import express from 'express';
import { getFacultyStudentMatches, getMatchAnalysis } from '../controllers/matchingController.js';

const router = express.Router();

// Get faculty-student matches for a user
router.get('/suggestions/:userId', getFacultyStudentMatches);

// Get detailed match analysis between two users
router.get('/analysis/:userId/:targetId', getMatchAnalysis);

export default router;

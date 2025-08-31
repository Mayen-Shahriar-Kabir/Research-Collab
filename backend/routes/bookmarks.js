import express from 'express';
import { bookmarkProject, removeBookmark, getBookmarkedProjects } from '../controllers/controller.js';

const router = express.Router();

// Get user's bookmarked projects
router.get('/', getBookmarkedProjects);

// Add bookmark
router.post('/', bookmarkProject);

// Remove bookmark
router.delete('/', removeBookmark);

export default router;

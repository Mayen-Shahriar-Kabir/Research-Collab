import express from 'express';
import { getUserNotifications, markNotificationRead, markAllNotificationsRead } from '../controllers/controller.js';

const router = express.Router();

// Get notifications for a user
router.get('/', getUserNotifications);
router.get('/:userId', getUserNotifications);

// Mark notification as read
router.put('/:notificationId/read', markNotificationRead);

// Mark all notifications as read
router.put('/user/:userId/read-all', markAllNotificationsRead);

export default router;

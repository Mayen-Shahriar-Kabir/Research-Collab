import express from 'express';
import { getUserNotifications, markNotificationRead, markNotificationUnread, deleteNotification, markAllNotificationsRead } from '../controllers/controller.js';

const router = express.Router();

// Get notifications for a user
router.get('/', getUserNotifications);

// Mark notification as read
router.put('/:notificationId/read', markNotificationRead);
router.put('/:notificationId/unread', markNotificationUnread);

// Mark all notifications as read
router.put('/mark-all-read', markAllNotificationsRead);

// Delete notification
router.delete('/:notificationId', deleteNotification);

export default router;

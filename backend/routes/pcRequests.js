import express from 'express';
import { createPcRequest, listMyPcRequests, listPcRequests, approvePcRequest, rejectPcRequest, allocatePcToUser } from '../controllers/controller.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Student: create a PC request
router.post('/', authenticateToken, createPcRequest);

// Student: list own pc requests
router.get('/mine', authenticateToken, listMyPcRequests);

// Admin: list all pc requests
router.get('/', authenticateToken, listPcRequests);

// Admin: approve a request with allocation
router.put('/:requestId/approve', authenticateToken, approvePcRequest);

// Admin: reject a request
router.put('/:requestId/reject', authenticateToken, rejectPcRequest);

export default router;

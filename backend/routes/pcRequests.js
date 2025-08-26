import express from 'express';
import { createPcRequest, listMyPcRequests, listPcRequests, approvePcRequest, rejectPcRequest } from '../controllers/controller.js';

const router = express.Router();

// Student: create a PC request
router.post('/', createPcRequest);

// Student: list own pc requests (?studentId=...)
router.get('/mine', listMyPcRequests);

// Admin: list all pc requests (?adminId=...&status=pending|approved|rejected)
router.get('/', listPcRequests);

// Admin: approve a request with allocation
router.put('/:requestId/approve', approvePcRequest);

// Admin: reject a request
router.put('/:requestId/reject', rejectPcRequest);

export default router;

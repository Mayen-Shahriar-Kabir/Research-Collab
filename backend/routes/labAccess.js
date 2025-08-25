import express from 'express';
import { requestLabAccess, updateLabAccessStatus } from '../controllers/controller.js';

const router = express.Router();

// Request lab access
router.post('/', requestLabAccess);

// Update lab access status (approve/reject)
router.put('/:requestId/status', updateLabAccessStatus);

export default router;

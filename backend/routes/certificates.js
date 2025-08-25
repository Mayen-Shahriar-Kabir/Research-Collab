import express from 'express';
import { issueCertificate, getStudentCertificates } from '../controllers/controller.js';

const router = express.Router();

// Get certificates for a student
router.get('/student/:studentId', getStudentCertificates);

// Issue a certificate (faculty only)
router.post('/', issueCertificate);

export default router;

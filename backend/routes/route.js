import express from "express";
import { registerUser, loginUser, getProfile, updateProfile, uploadProfilePhoto, upload, requestRole, approveRole, listRoleRequests, getUsers, setUserRole, createPublication, uploadPublicationFile, listPublications, uploadPublicationFileMiddleware } from "../controllers/controller.js";

const router = express.Router();

// Test route
router.get("/test", (req, res) => {
  res.json({ message: "API is working!" });
});

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/profile/:userId", getProfile);
router.put("/profile/:userId", updateProfile);
router.post("/profile/:userId/photo", upload.single('profilePhoto'), uploadProfilePhoto);

// Publications
router.get('/profile/:userId/publications', listPublications);
router.post('/profile/:userId/publications', createPublication);
router.post('/profile/:userId/publications/upload', uploadPublicationFileMiddleware.single('file'), uploadPublicationFile);

// Role request/approval
router.post('/role/request', requestRole); // body: { userId, role }
router.post('/role/approve', approveRole); // body: { adminId, userId }
router.get('/role/requests', listRoleRequests); // query: ?adminId=

// Admin user management
router.get('/users', getUsers); // query: ?adminId=
router.put('/users/:userId/role', setUserRole); // body: { adminId, role }

export default router;
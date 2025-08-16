import express from "express";
import { registerUser, loginUser, getProfile, updateProfile, uploadProfilePhoto, upload } from "../controllers/controller.js";

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

export default router;
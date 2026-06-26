import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  getUserProfile,
  getCurrentUser,
  updateProfile,
  syncUser,
  followUser,
  searchUsers,
  deleteAccount,  // <-- ADICIONAR ESTA IMPORTAÇÃO
} from "../controllers/user.controller.js";

const router = express.Router();

// public routes
router.get("/profile/:username", getUserProfile);
router.get("/search", searchUsers);

// protected routes
router.post("/sync", protectRoute, syncUser);
router.get("/me", protectRoute, getCurrentUser);
router.put("/profile", protectRoute, updateProfile);
router.post("/follow/:targetUserId", protectRoute, followUser);
router.delete("/me", protectRoute, deleteAccount);  // <-- ADICIONAR ESTA ROTA

export default router;
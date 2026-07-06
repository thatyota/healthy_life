import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  getUserProfile,
  getCurrentUser,
  updateProfile,
  syncUser,
  followUser,
  searchUsers,
  deleteAccount,
  checkDeactivatedAccount,
  sendReactivationCode,
  reactivateAccount,
} from "../controllers/user.controller.js";

const router = express.Router();

// rotas publicas
router.get("/profile/:username", getUserProfile);
router.get("/search", searchUsers);

// rotas para reativacao (publicas — nao precisam de auth)
router.post("/check-deactivated", checkDeactivatedAccount);
router.post("/send-reactivation-code", sendReactivationCode);
router.post("/reactivate", reactivateAccount);

// rotas protegidas
router.get("/me", protectRoute, getCurrentUser);
router.put("/profile", protectRoute, updateProfile);
router.post("/sync", protectRoute, syncUser);
router.post("/follow/:targetUserId", protectRoute, followUser);
router.delete("/me", protectRoute, deleteAccount);

export default router;
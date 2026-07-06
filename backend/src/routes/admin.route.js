import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { requireAdmin } from "../middleware/admin.middleware.js";
import {
  checkAdmin,
  getAllUsers,
  getAllPosts,
  banUser,
  timeoutUser,
  unbanUser,
  deletePost,
  deleteComment,
  getModerationLogs,
  getStats,
} from "../controllers/admin.controller.js";

const router = express.Router();

// =============================================================================
// Rota /check — SEM requireAdmin (o mobile usa para verificar se e admin)
// O protectRoute verifica o token, mas nao bloqueia se nao for admin
// =============================================================================
router.get("/check", protectRoute, checkAdmin);

// =============================================================================
// Todas as rotas abaixo precisam de admin
// =============================================================================
router.use(requireAdmin);

// estatisticas do dashboard
router.get("/stats", getStats);

// gestao de users
router.get("/users", getAllUsers);
router.post("/users/:userId/ban", banUser);
router.post("/users/:userId/timeout", timeoutUser);
router.post("/users/:userId/unban", unbanUser);

// gestao de posts
router.get("/posts", getAllPosts);
router.delete("/posts/:postId", deletePost);
router.delete("/comments/:commentId", deleteComment);

// logs de moderacao
router.get("/logs", getModerationLogs);

export default router;
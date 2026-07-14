import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { requireAdmin } from "../middleware/admin.middleware.js";
import User from "../models/user.model.js";
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
// Rota /make-admin — SEM requireAdmin (qualquer user logado pode tornar-se admin)
// Usada quando o user faz login/registo na area de admin
// =============================================================================
router.post("/make-admin", protectRoute, async (req, res) => {
  try {
    const clerkId = req.auth.userId;

    const user = await User.findOneAndUpdate(
      { clerkId },
      { role: "admin" },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: "User nao encontrado" });
    }

    res.json({ 
      success: true, 
      message: "User promovido a admin", 
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        Username: user.Username,
      }
    });
  } catch (error) {
    console.error("Erro make-admin:", error);
    res.status(500).json({ error: "Erro interno" });
  }
});

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
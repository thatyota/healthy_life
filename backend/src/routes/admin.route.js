import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { requireAdmin } from "../middleware/admin.middlewate.js";
import User from "../models/user.model.js";
import {
  checkAdmin,
  getAllUsers,
  getAllPosts,
  getAllComments,
  banUser,
  timeoutUser,
  unbanUser,
  deletePost,
  deleteComment,
  getModerationLogs,
  getStats,
  getAllReports,
  resolveReport,
} from "../controllers/admin.controller.js";

const router = express.Router();

// =============================================================================
// Rota /check — SEM requireAdmin
// O mobile usa para verificar se o user e admin
// Se for admin, mostra o tab admin; se nao, esconde
// =============================================================================
router.get("/check", protectRoute, checkAdmin);

// =============================================================================
// Rota /make-admin — SEM requireAdmin
// Qualquer user logado pode tornar-se admin
// Usada no login/registo na area de admin
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
// Todas as rotas abaixo precisam de ser admin
// O requireAdmin bloqueia se o user nao tiver role: "admin"
// =============================================================================
router.use(requireAdmin);

// estatisticas do dashboard (users, posts, comentarios, reports)
router.get("/stats", getStats);

// gestao de users (lista, banir, timeout, desbanir)
router.get("/users", getAllUsers);
router.post("/users/:userId/ban", banUser);
router.post("/users/:userId/timeout", timeoutUser);
router.post("/users/:userId/unban", unbanUser);

// gestao de posts (lista, apagar)
router.get("/posts", getAllPosts);
router.delete("/posts/:postId", deletePost);

// gestao de comentarios (lista, apagar)
router.get("/comments", getAllComments);
router.delete("/comments/:commentId", deleteComment);

// gestao de denuncias (lista, resolver)
router.get("/reports", getAllReports);
router.post("/reports/:reportId/resolve", resolveReport);

// logs de moderacao
router.get("/logs", getModerationLogs);

export default router;
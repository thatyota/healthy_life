import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  createComment,
  getComments,
  deleteComments,
  adminDeleteComment,  // ← NOVO: admin apaga comentario
} from "../controllers/comment.controller.js";

const router = express.Router();

// =============================================================================
// ROTAS PUBLICAS
// =============================================================================

// GET /api/comments/post/:postId
// Busca todos os comentarios de um post
router.get("/post/:postId", getComments);

// =============================================================================
// ROTAS PROTEGIDAS
// =============================================================================

// POST /api/comments/post/:postId
// Cria um novo comentario num post
router.post("/post/:postId", protectRoute, createComment);

// DELETE /api/comments/:commentId
// Apaga um comentario (apenas o autor)
router.delete("/:commentId", protectRoute, deleteComments);

// DELETE /api/comments/:commentId/admin-delete
// Admin apaga qualquer comentario com motivo
// Body: { reason: string }
router.delete("/:commentId/admin-delete", protectRoute, adminDeleteComment);

export default router;
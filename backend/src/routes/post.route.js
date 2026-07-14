import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  getPosts,
  getPost,
  getUserPosts,
  createPost,
  likePost,
  deletePost,
  adminDeletePost,
} from "../controllers/post.controller.js";

const router = express.Router();

// =============================================================================
// ROTAS DE POSTS
// =============================================================================

// GET /api/posts
// Lista todos os posts do feed, ordenados por data (mais recente primeiro)
// Popula o campo User com: Username, FirstName, LastName, ProfilePicture
router.get("/", getPosts);

// GET /api/posts/:postId
// Detalhes de um post específico
router.get("/:postId", getPost);

// GET /api/posts/user/:username
// Posts de um user específico (busca por Username)
router.get("/user/:username", getUserPosts);

// POST /api/posts
// Criar novo post (requer autenticação)
// Body: { content: string } + file opcional (imagem)
router.post("/", protectRoute, createPost);

// POST /api/posts/:postId/like
// Dar ou remover like de um post (requer autenticação)
// Toggle: se já deu like, remove; se não, adiciona
router.post("/:postId/like", protectRoute, likePost);

// DELETE /api/posts/:postId
// User apaga o próprio post (requer autenticação)
// Só o dono do post pode apagar
router.delete("/:postId", protectRoute, deletePost);

// POST /api/posts/:postId/admin-delete
// Admin apaga qualquer post com motivo (requer autenticação)
// Body: { reason: string }
// O backend verifica se o user tem role "admin"
// Cria notificação tipo "delete_post" para o dono do post
// A notificação mostra "Moderador" em vez do nome do admin
router.post("/:postId/admin-delete", protectRoute, adminDeletePost);

export default router;
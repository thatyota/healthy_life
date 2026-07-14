import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import upload from "../middleware/upload.middleware.js";  // ← MIDDLEWARE PARA UPLOAD DE IMAGENS
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

// =============================================================================
// ROTAS PUBLICAS (nao precisam de autenticacao)
// =============================================================================

// GET /api/users/profile/:username
// Busca perfil de um user pelo username
router.get("/profile/:username", getUserProfile);

// GET /api/users/search?q=...
// Pesquisa users por nome/username
router.get("/search", searchUsers);

// POST /api/users/check-deactivated
// Verifica se o email tem conta desativada
router.post("/check-deactivated", checkDeactivatedAccount);

// POST /api/users/send-reactivation-code
// Envia codigo de reativacao por email
router.post("/send-reactivation-code", sendReactivationCode);

// POST /api/users/reactivate
// Reativa conta com codigo
router.post("/reactivate", reactivateAccount);

// =============================================================================
// ROTAS PROTEGIDAS (precisam de autenticacao)
// =============================================================================

// GET /api/users/me
// Busca dados do user logado
router.get("/me", protectRoute, getCurrentUser);

// PUT /api/users/profile
// Atualiza perfil do user logado (nome, bio, foto, banner)
//
// upload.any() = aceita qualquer campo de ficheiro no FormData
// Necessario porque enviamos ProfilePicture e bannerImage
router.put("/profile", protectRoute, upload.any(), updateProfile);

// POST /api/users/sync
// Sincroniza user do Clerk com MongoDB
router.post("/sync", protectRoute, syncUser);

// POST /api/users/follow/:targetUserId
// Seguir/deixar de seguir um user
router.post("/follow/:targetUserId", protectRoute, followUser);

// DELETE /api/users/me
// Desativa conta do user logado
router.delete("/me", protectRoute, deleteAccount);

export default router;
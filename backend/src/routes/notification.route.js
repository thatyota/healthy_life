import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,  // ← NOVO: função para apagar notificação
} from "../controllers/notification.controller.js";

// Cria o router do Express
const router = express.Router();

// GET /api/notifications
// Busca todas as notificações do user logado
router.get("/", protectRoute, getNotifications);

// PUT /api/notifications/:notificationId/read
// Marca UMA notificação como lida
router.put("/:notificationId/read", protectRoute, markAsRead);

// PUT /api/notifications/read-all
// Marca TODAS as notificações como lidas
router.put("/read-all", protectRoute, markAllAsRead);

// DELETE /api/notifications/:notificationId
// Apaga UMA notificação (usado no swipe para o lado)
// ← ESTA ROTA ESTAVA A FALTAR!
router.delete("/:notificationId", protectRoute, deleteNotification);

export default router;
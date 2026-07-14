import asyncHandler from "express-async-handler";
import { getAuth } from "@clerk/express";
import Notification from "../models/notification.model.js";
import User from "../models/user.model.js";

// ============================================
// GET /api/notifications
// Busca todas as notificações do user logado
// ============================================
export const getNotifications = asyncHandler(async (req, res) => {
  try {
    // userId = ID do Clerk do user logado (vem do token JWT)
    const { userId } = getAuth(req);

    // Procura o user no MongoDB pelo clerkId
    // Precisamos do _id do MongoDB para comparar com notification.to
    const user = await User.findOne({ clerkId: userId });
    if (!user) return res.status(404).json({ error: "User not found" });

    // Busca todas as notificações onde o user é o destinatário (to)
    // Ordena por createdAt descendente (mais recentes primeiro)
    const notifications = await Notification.find({ to: user._id })
      .sort({ createdAt: -1 });

    // Faz populate manual do user que enviou (quem fez a ação)
    // Usamos Promise.all para fazer todas as buscas em paralelo (mais rápido)
    const populatedNotifications = await Promise.all(
      notifications.map(async (notif) => {
        // Busca os dados do user que enviou (from)
        const fromUser = await User.findById(notif.from).select(
          "Username FirstName LastName ProfilePicture"
        );

        // Converte o documento Mongoose para objeto simples (plain object)
        const notifObj = notif.toObject();

        // Retorna a notificação com os dados do remetente populados
        return {
          ...notifObj,
          from: fromUser || {
            Username: "Unknown",
            FirstName: "",
            LastName: "",
            ProfilePicture: "",
          },
        };
      })
    );

    // Envia as notificações para o frontend
    res.status(200).json({ notifications: populatedNotifications });
  } catch (error) {
    console.error("Error in getNotifications:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// PUT /api/notifications/:notificationId/read
// Marca UMA notificação como lida
// ============================================
export const markAsRead = asyncHandler(async (req, res) => {
  try {
    const { userId } = getAuth(req);
    const { notificationId } = req.params;

    // Procura o user no MongoDB
    const user = await User.findOne({ clerkId: userId });
    if (!user) return res.status(404).json({ error: "User not found" });

    // Atualiza a notificação para read: true
    // Mas SÓ se a notificação pertencer ao user logado (to: user._id)
    // Isto evita que um user marque notificações de outro user
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, to: user._id },
      { read: true },
      { new: true }  // Retorna o documento atualizado
    );

    if (!notification) {
      return res.status(404).json({ error: "Notification not found or not yours" });
    }

    res.status(200).json({ message: "Notification marked as read" });
  } catch (error) {
    console.error("Error in markAsRead:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// PUT /api/notifications/read-all
// Marca TODAS as notificações do user como lidas
// ============================================
export const markAllAsRead = asyncHandler(async (req, res) => {
  try {
    const { userId } = getAuth(req);

    // Procura o user no MongoDB
    const user = await User.findOne({ clerkId: userId });
    if (!user) return res.status(404).json({ error: "User not found" });

    // updateMany atualiza TODAS as notificações que correspondem ao filtro
    // Filtro: to: user._id (destinatário é o user logado) E read: false (só as não lidas)
    await Notification.updateMany(
      { to: user._id, read: false },
      { read: true }
    );

    res.status(200).json({ message: "All notifications marked as read" });
  } catch (error) {
    console.error("Error in markAllAsRead:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// DELETE /api/notifications/:notificationId
// Apaga UMA notificação (usado no swipe para o lado)
// ============================================
export const deleteNotification = asyncHandler(async (req, res) => {
  try {
    const { userId } = getAuth(req);
    const { notificationId } = req.params;

    // Procura o user no MongoDB
    const user = await User.findOne({ clerkId: userId });
    if (!user) return res.status(404).json({ error: "User not found" });

    // Verifica se a notificação pertence ao user logado antes de apagar
    // Só apaga se notification.to === user._id (o user é o dono)
    const notification = await Notification.findOne({
      _id: notificationId,
      to: user._id,
    });

    if (!notification) {
      return res.status(404).json({ error: "Notification not found or not yours" });
    }

    // Apaga a notificação do MongoDB
    await Notification.findByIdAndDelete(notificationId);

    res.status(200).json({ message: "Notification deleted successfully" });
  } catch (error) {
    console.error("Error in deleteNotification:", error.message);
    res.status(500).json({ error: error.message });
  }
});
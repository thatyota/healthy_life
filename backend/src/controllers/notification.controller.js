import asyncHandler from "express-async-handler";
import { getAuth } from "@clerk/express";
import Notification from "../models/notification.model.js";
import User from "../models/user.model.js";

// busca todas as notificacoes do user logado
export const getNotifications = asyncHandler(async (req, res) => {
  try {
    const { userId } = getAuth(req);

    // procura o user no mongo pelo clerkId
    const user = await User.findOne({ clerkId: userId });
    if (!user) return res.status(404).json({ error: "User not found" });

    // busca notificacoes onde o user e o destinatario
    const notifications = await Notification.find({ to: user._id })
      .sort({ createdAt: -1 });

    // faz populate manual do user que enviou (evita crash do populate)
    const populatedNotifications = await Promise.all(
      notifications.map(async (notif) => {
        const fromUser = await User.findById(notif.from).select("Username FirstName LastName ProfilePicture");
        return {
          ...notif.toObject(),
          from: fromUser || { Username: "Unknown", FirstName: "", LastName: "", ProfilePicture: "" }
        };
      })
    );

    res.status(200).json({ notifications: populatedNotifications });
  } catch (error) {
    console.error("Error in getNotifications:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// marca uma notificacao como lida (so se for do user logado)
export const markAsRead = asyncHandler(async (req, res) => {
  try {
    const { userId } = getAuth(req);
    const { notificationId } = req.params;

    // procura o user no mongo
    const user = await User.findOne({ clerkId: userId });
    if (!user) return res.status(404).json({ error: "User not found" });

    // verifica se a notificacao pertence ao user logado
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, to: user._id }, // so atualiza se o user for o dono
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ error: "Notification not found or not yours" });
    }

    res.status(200).json({ message: "Notification marked as read" });
  } catch (error) {
    console.error("Error in markAsRead:", error.message);
    res.status(500).json({ error: error.message });  // ← CORRIGIDO: removido o import errado
  }
});

// marca todas as notificacoes do user como lidas
export const markAllAsRead = asyncHandler(async (req, res) => {
  try {
    const { userId } = getAuth(req);

    // procura o user no mongo
    const user = await User.findOne({ clerkId: userId });
    if (!user) return res.status(404).json({ error: "User not found" });

    // atualiza todas as notificacoes nao lidas do user
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

// elimina uma notificacao (so se for do user logado)
export const deleteNotification = asyncHandler(async (req, res) => {
  try {
    const { userId } = getAuth(req);
    const { notificationId } = req.params;

    // procura o user no mongo
    const user = await User.findOne({ clerkId: userId });
    if (!user) return res.status(404).json({ error: "User not found" });

    // verifica se a notificacao pertence ao user logado antes de apagar
    const notification = await Notification.findOne({
      _id: notificationId,
      to: user._id,
    });

    if (!notification) {
      return res.status(404).json({ error: "Notification not found or not yours" });
    }

    // apaga a notificacao
    await Notification.findByIdAndDelete(notificationId);
    res.status(200).json({ message: "Notification deleted successfully" });
  } catch (error) {
    console.error("Error in deleteNotification:", error.message);
    res.status(500).json({ error: error.message });
  }
});
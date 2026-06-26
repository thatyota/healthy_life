import asyncHandler from "express-async-handler";
import { getAuth } from "@clerk/express";
import Notification from "../models/notification.model.js";
import User from "../models/user.model.js";

// busca todas as notificacoes do user logado
export const getNotifications = asyncHandler(async (req, res) => {
  const { userId } = getAuth(req);

  const user = await User.findOne({ clerkId: userId });
  if (!user) return res.status(404).json({ error: "User not found" });

  const notifications = await Notification.find({ to: user._id })
    .sort({ createdAt: -1 }) // mais recentes primeiro
    .populate("from", "Username FirstName LastName ProfilePicture"); // info do user que enviou

  res.status(200).json({ notifications });
});

// marca uma notificacao como lida
export const markAsRead = asyncHandler(async (req, res) => {
  const { notificationId } = req.params;

  await Notification.findByIdAndUpdate(notificationId, { read: true });

  res.status(200).json({ message: "Notification marked as read" });
});

// marca todas as notificacoes do user como lidas
export const markAllAsRead = asyncHandler(async (req, res) => {
  const { userId } = getAuth(req);

  const user = await User.findOne({ clerkId: userId });
  if (!user) return res.status(404).json({ error: "User not found" });

  await Notification.updateMany(
    { to: user._id, read: false },
    { read: true }
  );

  res.status(200).json({ message: "All notifications marked as read" });
});

// elimina uma notificacao (so se for do user logado)
export const deleteNotification = asyncHandler(async (req, res) => {
  const { userId } = getAuth(req);
  const { notificationId } = req.params;

  const user = await User.findOne({ clerkId: userId });
  if (!user) return res.status(404).json({ error: "User not found" });

  // verifica se a notificacao pertence ao user
  const notification = await Notification.findOne({
    _id: notificationId,
    to: user._id,
  });

  if (!notification) {
    return res.status(404).json({ error: "Notification not found" });
  }

  await Notification.findByIdAndDelete(notificationId);

  res.status(200).json({ message: "Notification deleted successfully" });
});
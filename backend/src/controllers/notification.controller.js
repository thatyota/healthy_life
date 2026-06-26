import asyncHandler from "express-async-handler";
import { getAuth } from "@clerk/express";
import Notification from "../models/notification.model.js";
import User from "../models/user.model.js";

export const getNotifications = asyncHandler(async (req, res) => {
  const { userId } = getAuth(req);
  
  const user = await User.findOne({ clerkId: userId });
  if (!user) return res.status(404).json({ error: "User not found" });

  const notifications = await Notification.find({ to: user._id })
    .sort({ createdAt: -1 })
    .populate("from", "Username FirstName LastName ProfilePicture");

  res.status(200).json({ notifications });
});

export const markAsRead = asyncHandler(async (req, res) => {
  const { notificationId } = req.params;

  await Notification.findByIdAndUpdate(notificationId, { read: true });

  res.status(200).json({ message: "Notification marked as read" });
});

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
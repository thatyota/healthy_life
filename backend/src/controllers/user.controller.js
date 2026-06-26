import asyncHandler from "express-async-handler";
import User from "../models/user.model.js";
import Post from "../models/post.model.js";
import Comment from "../models/comment.model.js";
import Notification from "../models/notification.model.js";
import { getAuth } from "@clerk/express";
import { clerkClient } from "@clerk/express";

export const getUserProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;
  const user = await User.findOne({ Username: username });
  if (!user) return res.status(404).json({ error: "User not found" });

  res.status(200).json({ user });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const { userId } = getAuth(req);
  const user = await User.findOneAndUpdate({ clerkId: userId }, req.body, { new: true });
  if (!user) return res.status(404).json({ error: "User not found" });

  res.status(200).json({ user });
});

export const syncUser = asyncHandler(async (req, res) => {
  const { userId } = getAuth(req);
  const existingUser = await User.findOne({ clerkId: userId });

  if (existingUser) {
    return res.status(200).json({ user: existingUser, message: "User already exists" });
  }

  const clerkUser = await clerkClient.users.getUser(userId);

  const userData = {
    clerkId: userId,
    email: clerkUser.emailAddresses[0].emailAddress,
    FirstName: clerkUser.firstName || "",
    LastName: clerkUser.lastName || "",
    Username: clerkUser.emailAddresses[0].emailAddress.split("@")[0],
    ProfilePicture: clerkUser.imageUrl || "",
  };

  const user = await User.create(userData);

  res.status(201).json({ user, message: "User created successfully" });
});

export const getCurrentUser = asyncHandler(async (req, res) => {
  const { userId } = getAuth(req);
  const user = await User.findOne({ clerkId: userId });
  if (!user) return res.status(404).json({ error: "User not found" });

  res.status(200).json({ user });
});

export const searchUsers = asyncHandler(async (req, res) => {
  const { q } = req.query;

  if (!q || q.trim().length < 1) {
    return res.status(400).json({ error: "Query must be at least 1 character" });
  }

  const searchRegex = new RegExp(q.trim(), "i");

  const users = await User.find({
    $or: [
      { Username: { $regex: searchRegex } },
      { FirstName: { $regex: searchRegex } },
      { LastName: { $regex: searchRegex } },
    ],
  })
    .select("Username FirstName LastName ProfilePicture bio Followers Following")
    .limit(20);

  res.status(200).json({ users });
});

export const followUser = asyncHandler(async (req, res) => {
  const { userId } = getAuth(req);
  const { targetUserId } = req.params;

  if (userId === targetUserId) return res.status(400).json({ error: "You cannot follow yourself" });

  const currentUser = await User.findOne({ clerkId: userId });
  const targetUser = await User.findById(targetUserId);

  if (!currentUser || !targetUser) return res.status(404).json({ error: "User not found" });

  const isFollowing = currentUser.Following.includes(targetUserId);

  if (isFollowing) {
    await User.findByIdAndUpdate(currentUser._id, {
      $pull: { Following: targetUserId },
    });
    await User.findByIdAndUpdate(targetUserId, {
      $pull: { Followers: currentUser._id },
    });
  } else {
    await User.findByIdAndUpdate(currentUser._id, {
      $push: { Following: targetUserId },
    });
    await User.findByIdAndUpdate(targetUserId, {
      $push: { Followers: currentUser._id },
    });

    await Notification.create({
      from: currentUser._id,
      to: targetUserId,
      type: "follow",
    });
  }

  res.status(200).json({
    message: isFollowing ? "User unfollowed" : "User followed",
  });
});

export const deleteAccount = asyncHandler(async (req, res) => {
  const { userId } = getAuth(req);
  const user = await User.findOne({ clerkId: userId });

  if (!user) return res.status(404).json({ error: "User not found" });

  // deleta posts do user
  await Post.deleteMany({ User: user._id });
  // deleta comments do user
  await Comment.deleteMany({ user: user._id });
  // deleta notificações relacionadas
  await Notification.deleteMany({ $or: [{ from: user._id }, { to: user._id }] });
  // deleta o user
  await User.findByIdAndDelete(user._id);

  res.status(200).json({ message: "Account deleted successfully" });
});
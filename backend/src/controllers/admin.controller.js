import asyncHandler from "express-async-handler";
import User from "../models/user.model.js";
import Post from "../models/post.model.js";
import Comment from "../models/comment.model.js";
import { clerkClient } from "@clerk/express";

// =============================================================================
// 1. CHECK ADMIN (para o mobile verificar se e admin)
// =============================================================================
// Rota publica (sem requireAdmin) — o mobile usa esta para saber se mostra o botao
// O protectRoute ja verifica o token
// =============================================================================

export const checkAdmin = asyncHandler(async (req, res) => {
  const { userId } = req.auth || {};

  if (!userId) {
    return res.status(200).json({ isAdmin: false });
  }

  try {
    const clerkUser = await clerkClient.users.getUser(userId);
    const isAdmin = clerkUser.publicMetadata?.role === "admin";
    res.status(200).json({ isAdmin });
  } catch (err) {
    res.status(200).json({ isAdmin: false });
  }
});

// =============================================================================
// 2. ESTATISTICAS DO DASHBOARD
// =============================================================================

export const getStats = asyncHandler(async (req, res) => {
  const totalUsers = await User.countDocuments();
  const totalPosts = await Post.countDocuments();
  const totalComments = await Comment.countDocuments();
  const bannedUsers = await User.countDocuments({ status: "banned" });

  res.status(200).json({
    totalUsers,
    totalPosts,
    totalComments,
    bannedUsers,
  });
});

// =============================================================================
// 3. GESTAO DE USERS
// =============================================================================

// busca todos os users
export const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find()
    .select("Username FirstName LastName email ProfilePicture status Followers Following createdAt")
    .sort({ createdAt: -1 });

  res.status(200).json({ users });
});

// bane um user
export const banUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const user = await User.findByIdAndUpdate(
    userId,
    { status: "banned", bannedAt: new Date() },
    { new: true }
  );

  if (!user) {
    return res.status(404).json({ error: "User nao encontrado" });
  }

  res.status(200).json({ message: "User banido", user });
});

// da timeout a um user
export const timeoutUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { duration } = req.body; // duracao em horas

  const timeoutExpiresAt = new Date(Date.now() + duration * 60 * 60 * 1000);

  const user = await User.findByIdAndUpdate(
    userId,
    { status: "timeout", timeoutExpiresAt },
    { new: true }
  );

  if (!user) {
    return res.status(404).json({ error: "User nao encontrado" });
  }

  res.status(200).json({ message: "User em timeout", user });
});

// desbane um user
export const unbanUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const user = await User.findByIdAndUpdate(
    userId,
    { status: "active", bannedAt: null, timeoutExpiresAt: null },
    { new: true }
  );

  if (!user) {
    return res.status(404).json({ error: "User nao encontrado" });
  }

  res.status(200).json({ message: "User desbanido", user });
});

// =============================================================================
// 4. GESTAO DE POSTS
// =============================================================================

// busca todos os posts
export const getAllPosts = asyncHandler(async (req, res) => {
  const posts = await Post.find()
    .populate("user", "Username FirstName LastName ProfilePicture")
    .populate("likes.user", "Username")
    .sort({ createdAt: -1 });

  res.status(200).json({ posts });
});

// apaga um post
export const deletePost = asyncHandler(async (req, res) => {
  const { postId } = req.params;

  const post = await Post.findByIdAndDelete(postId);
  if (!post) {
    return res.status(404).json({ error: "Post nao encontrado" });
  }

  // apaga comments associados
  await Comment.deleteMany({ post: postId });

  res.status(200).json({ message: "Post apagado" });
});

// apaga um comment
export const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  const comment = await Comment.findByIdAndDelete(commentId);
  if (!comment) {
    return res.status(404).json({ error: "Comment nao encontrado" });
  }

  res.status(200).json({ message: "Comment apagado" });
});

// =============================================================================
// 5. LOGS DE MODERACAO
// =============================================================================

// busca logs de moderacao (mock por agora — criar model depois)
export const getModerationLogs = asyncHandler(async (req, res) => {
  // TODO: Criar model ModerationLog
  // Por agora retorna array vazio
  res.status(200).json({ logs: [] });
});
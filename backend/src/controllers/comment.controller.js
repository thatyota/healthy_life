import asyncHandler from "express-async-handler";
import { getAuth } from "@clerk/express";
import Comment from "../models/comment.model.js";
import Post from "../models/post.model.js";
import User from "../models/user.model.js";
import Notification from "../models/notification.model.js";

// =============================================================================
// GET /api/comments/post/:postId
// Busca todos os comentarios de um post
// =============================================================================
export const getComments = asyncHandler(async (req, res) => {
  const { postId } = req.params;

  const comments = await Comment.find({ post: postId })
    .sort({ createdAt: -1 })
    .populate("user", "Username FirstName LastName ProfilePicture");

  res.status(200).json({ comments });
});

// =============================================================================
// POST /api/comments/post/:postId
// Cria um novo comentario num post
// =============================================================================
export const createComment = asyncHandler(async (req, res) => {
  const { userId } = getAuth(req);
  const { postId } = req.params;
  const { content } = req.body;

  if (!content || content.trim() === "") {
    return res.status(400).json({ error: "Comment content is required" });
  }

  const user = await User.findOne({ clerkId: userId });
  const post = await Post.findById(postId);

  if (!user || !post) return res.status(404).json({ error: "User or post not found" });

  const comment = await Comment.create({
    user: user._id,
    post: postId,
    content,
  });

  // Adiciona o comentario ao post
  await Post.findByIdAndUpdate(postId, {
    $push: { comments: comment._id },
  });

  // Cria notificacao se nao for o proprio autor do post
  if (post.User.toString() !== user._id.toString()) {
    await Notification.create({
      from: user._id,
      to: post.User,
      type: "comment",
      post: postId,
      comment: comment._id,
    });
  }

  // Popula antes de retornar
  const populatedComment = await Comment.findById(comment._id)
    .populate("user", "Username FirstName LastName ProfilePicture");

  res.status(201).json({ comment: populatedComment });
});

// =============================================================================
// DELETE /api/comments/:commentId
// Apaga um comentario (apenas o autor)
// =============================================================================
export const deleteComments = asyncHandler(async (req, res) => {
  const { userId } = getAuth(req);
  const { commentId } = req.params;

  const user = await User.findOne({ clerkId: userId });
  const comment = await Comment.findById(commentId);

  if (!user || !comment) {
    return res.status(404).json({ error: "User or comment not found" });
  }

  // So o autor pode apagar o proprio comentario
  if (comment.user.toString() !== user._id.toString()) {
    return res.status(403).json({ error: "You can only delete your own comment" });
  }

  // Remove o comentario do post
  await Post.findByIdAndUpdate(comment.post, {
    $pull: { comments: commentId },
  });

  // Apaga o comentario
  await Comment.findByIdAndDelete(commentId);

  res.status(200).json({ message: "Comment deleted successfully" });
});

// =============================================================================
// DELETE /api/comments/:commentId/admin-delete
// Admin apaga qualquer comentario com motivo
// =============================================================================
export const adminDeleteComment = asyncHandler(async (req, res) => {
  const { userId } = getAuth(req);
  const { commentId } = req.params;
  const { reason } = req.body;

  // Verifica se o user e admin
  const admin = await User.findOne({ clerkId: userId });
  if (!admin || admin.role !== "admin") {
    return res.status(403).json({ error: "Acesso negado — apenas admins" });
  }

  // Busca o comentario
  const comment = await Comment.findById(commentId).populate("user", "_id");
  if (!comment) return res.status(404).json({ error: "Comentario nao encontrado" });

  // Guarda dados antes de apagar
  const commentOwnerId = comment.user._id;
  const commentContent = comment.content?.substring(0, 50) || "Sem conteudo";
  const postId = comment.post;

  // Remove o comentario do post
  await Post.findByIdAndUpdate(postId, {
    $pull: { comments: commentId },
  });

  // Apaga o comentario
  await Comment.findByIdAndDelete(commentId);

  // Cria notificacao para o dono do comentario
  await Notification.create({
    from: admin._id,
    to: commentOwnerId,
    type: "delete_post",  // Reutiliza o tipo delete_post para notificacoes de remocao
    reason: reason || "O teu comentario foi removido por violar as diretrizes da comunidade.",
    postTitle: commentContent,
  });

  res.status(200).json({
    success: true,
    message: "Comentario apagado pelo administrador",
  });
});
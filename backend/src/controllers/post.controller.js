import asyncHandler from "express-async-handler";
import Post from "../models/post.model.js";
import User from "../models/user.model.js";
import Notification from "../models/notification.model.js";
import { getAuth } from "@clerk/express";
import cloudinary from "../config/cloudinary.js";
import Comment from "../models/comment.model.js";

// =============================================================================
// GET /api/posts
// Lista todos os posts do feed
// =============================================================================
export const getPosts = asyncHandler(async (req, res) => {
  const posts = await Post.find()
    .sort({ createdAt: -1 })
    .populate("User", "Username FirstName LastName ProfilePicture");

  res.status(200).json({ posts });
});

// =============================================================================
// GET /api/posts/:postId
// Detalhes de um post específico
// =============================================================================
export const getPost = asyncHandler(async (req, res) => {
  const { postId } = req.params;

  const post = await Post.findById(postId)
    .populate("User", "Username FirstName LastName ProfilePicture");

  if (!post) return res.status(404).json({ error: "Post not found" });

  res.status(200).json({ post });
});

// =============================================================================
// GET /api/posts/user/:username
// Posts de um user específico
// =============================================================================
export const getUserPosts = asyncHandler(async (req, res) => {
  const { username } = req.params;

  const user = await User.findOne({ Username: username });
  if (!user) return res.status(404).json({ error: "User not found" });

  const posts = await Post.find({ User: user._id })
    .sort({ createdAt: -1 })
    .populate("User", "Username FirstName LastName ProfilePicture");

  res.status(200).json({ posts });
});

// =============================================================================
// POST /api/posts
// Criar novo post (protegida)
// Body: { content: string, image?: file }
// =============================================================================
export const createPost = asyncHandler(async (req, res) => {
  const { userId } = getAuth(req);
  const { content } = req.body;
  const imageFile = req.file;

  if (!content && !imageFile) {
    return res.status(400).json({ error: "Post must contain either text or image" });
  }

  const user = await User.findOne({ clerkId: userId });
  if (!user) return res.status(404).json({ error: "User not found" });

  let imageUrl = "";

  if (imageFile) {
    try {
      const base64Image = `data:${imageFile.mimetype};base64,${imageFile.buffer.toString("base64")}`;
      const uploadResponse = await cloudinary.uploader.upload(base64Image, {
        folder: "social_media_posts",
        resource_type: "image",
        transformation: [
          { width: 800, height: 600, crop: "limit" },
          { quality: "auto" },
          { format: "auto" },
        ],
      });
      imageUrl = uploadResponse.secure_url;
    } catch (uploadError) {
      console.error("Cloudinary upload error:", uploadError);
      return res.status(400).json({ error: "Failed to upload image" });
    }
  }

  const post = await Post.create({
    User: user._id,
    Content: content || "",
    Image: imageUrl,
  });

  res.status(201).json({ post });
});

// =============================================================================
// POST /api/posts/:postId/like
// Dar ou remover like de um post (protegida)
// =============================================================================
export const likePost = asyncHandler(async (req, res) => {
  const { userId } = getAuth(req);
  const { postId } = req.params;

  const user = await User.findOne({ clerkId: userId });
  const post = await Post.findById(postId);

  if (!post || !user) return res.status(404).json({ error: "User or Post not found" });

  const isLiked = post.Likes.includes(user._id);

  if (isLiked) {
    await Post.findByIdAndUpdate(postId, {
      $pull: { Likes: user._id },
    });
  } else {
    await Post.findByIdAndUpdate(postId, {
      $push: { Likes: user._id },
    });

    if (post.User.toString() !== user._id.toString()) {
      await Notification.create({
        from: user._id,
        to: post.User,
        type: "like",
        post: postId,
      });
    }
  }

  res.status(200).json({
    message: isLiked ? "Post unliked successfully" : "Post liked successfully",
  });
});

// =============================================================================
// DELETE /api/posts/:postId
// User apaga o próprio post (protegida)
// =============================================================================
export const deletePost = asyncHandler(async (req, res) => {
  const { userId } = getAuth(req);
  const { postId } = req.params;

  const user = await User.findOne({ clerkId: userId });
  const post = await Post.findById(postId);

  if (!post || !user) return res.status(404).json({ error: "User or post not found" });

  if (post.User.toString() !== user._id.toString()) {
    return res.status(403).json({ error: "You can only delete your own posts" });
  }

  await Comment.deleteMany({ post: postId });
  await Post.findByIdAndDelete(postId);

  res.status(200).json({ message: "Post deleted successfully" });
});

// =============================================================================
// POST /api/posts/:postId/admin-delete
// Admin apaga qualquer post com motivo (protegida)
// 
// Body: { reason: string }
// O admin pode apagar qualquer post. Recebe um motivo que é guardado
// e enviado ao dono do post como notificação.
// A notificação mostra "Moderador" em vez do nome do admin.
// =============================================================================
export const adminDeletePost = asyncHandler(async (req, res) => {
  const { userId } = getAuth(req);
  const { postId } = req.params;
  const { reason } = req.body;

  // Verifica se o user é admin
  const admin = await User.findOne({ clerkId: userId });
  if (!admin || admin.role !== "admin") {
    return res.status(403).json({ error: "Acesso negado — apenas admins" });
  }

  // Busca o post
  const post = await Post.findById(postId).populate("User", "_id Username");
  if (!post) return res.status(404).json({ error: "Post nao encontrado" });

  // Guarda os dados antes de apagar
  const postOwnerId = post.User._id;
  const postContent = post.Content?.substring(0, 50) || "Sem titulo";

  // Apaga os comentários do post
  await Comment.deleteMany({ post: postId });

  // Apaga o post
  await Post.findByIdAndDelete(postId);

  // Cria notificação para o dono do post
  // from: admin._id (guarda quem removeu na BD)
  // fromName: "Moderador" (mostra genérico ao user)
  await Notification.create({
    from: admin._id,
    to: postOwnerId,
    type: "delete_post",
    reason: reason || "O teu post foi removido por violar as diretrizes da comunidade.",
    postTitle: postContent,
  });

  res.status(200).json({
    success: true,
    message: "Post apagado pelo administrador",
  });
});
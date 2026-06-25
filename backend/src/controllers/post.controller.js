import asyncHandler from "express-async-handler";
import Post from "../models/post.model.js";
import User from "../models/user.model.js";
import { getAuth } from "@clerk/express";
import cloudinary from "../config/cloudinary.js";
import Notification from "../models/notification.model.js";
import Comment from "../models/comment.model.js";

export const getPosts = asyncHandler(async (req, res) => {
  const posts = await Post.find()
    .sort({ createdAt: -1 })
    .populate({
      path: "User",
      model: "User",
      select: "Username FirstName LastName ProfilePicture",
    })
    .populate({
      path: "comments",
      populate: {
        path: "User",
        model: "User",
        select: "Username FirstName LastName ProfilePicture",
      },
    });

  res.status(200).json({ posts });
});

export const getPost = asyncHandler(async (req, res) => {
  const { postId } = req.params;

  const post = await Post.findById(postId)
    .populate({
      path: "User",
      model: "User",
      select: "Username FirstName LastName ProfilePicture",
    })
    .populate({
      path: "comments",
      populate: {
        path: "User",
        model: "User",
        select: "Username FirstName LastName ProfilePicture",
      },
    });

  if (!post) return res.status(404).json({ error: "Post not found" });

  res.status(200).json({ post });
});

export const getUserPosts = asyncHandler(async (req, res) => {
  const { username } = req.params;

  const user = await User.findOne({ Username: username });
  if (!user) return res.status(404).json({ error: "User not found" });

  const posts = await Post.find({ User: user._id })
    .sort({ createdAt: -1 })
    .populate({
      path: "User",
      model: "User",
      select: "Username FirstName LastName ProfilePicture",
    })
    .populate({
      path: "comments",
      populate: {
        path: "User",
        model: "User",
        select: "Username FirstName LastName ProfilePicture",
      },
    });

  res.status(200).json({ posts });
});

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
import asyncHandler from "express-async-handler";
import { getAuth } from "@clerk/express";
import Comment from "../models/comment.model.js";
import Post from "../models/post.model.js";
import User from "../models/user.model.js";
import Notification from "../models/notification.model.js";

export const getComments = asyncHandler(async (req, res) => {
  const { postId } = req.params;

  const comments = await Comment.find({ post: postId })
    .sort({ createdAt: -1 })
    .populate("user", "Username FirstName LastName ProfilePicture");  // UserName -> Username

  res.status(200).json({ comments });
});

export const createComment = asyncHandler(async (req, res) => {
  const { userId } = getAuth(req);
  const { postId } = req.params;
  const { content } = req.body;

  if (!content || content.trim() === "") {
    return res.status(400).json({ error: "Comment content is required" });
  }

  const user = await User.findOne({ clerkId: userId });
  const post = await Post.findById(postId);  // post -> Post (modelo)

  if (!user || !post) return res.status(404).json({ error: "User or post not found" });

  const comment = await Comment.create({
    user: user._id,
    post: postId,
    content,
  });

  // link the comment to the post
  await Post.findByIdAndUpdate(postId, {
    $push: { comments: comment._id },  // comments._id -> comment._id
  });

  // create notification if not commenting on own post
  if (post.User.toString() !== user._id.toString()) {  // post.user -> post.User
    await Notification.create({
      from: user._id,
      to: post.User,
      type: "comment",  // Comment -> comment (minúsculo)
      post: postId,
      comment: comment._id,
    });
  }

  // Populate antes de retornar
  const populatedComment = await Comment.findById(comment._id)
    .populate("user", "Username FirstName LastName ProfilePicture");

  res.status(201).json({ comment: populatedComment });
});

export const deleteComments = asyncHandler(async (req, res) => {
  const { userId } = getAuth(req);
  const { commentId } = req.params;

  const user = await User.findOne({ clerkId: userId });
  const comment = await Comment.findById(commentId);

  if (!user || !comment) {
    return res.status(404).json({ error: "User or comment not found" });
  }

  if (comment.user.toString() !== user._id.toString()) {  // toSAtring -> toString
    return res.status(403).json({ error: "You can only delete your own comment" });  // post -> comment
  }

  // remove comment from post
  await Post.findByIdAndUpdate(comment.post, {
    $pull: { comments: commentId },
  });

  // delete the comment
  await Comment.findByIdAndDelete(commentId);

  res.status(200).json({ message: "Comment deleted successfully" });  // menssage -> message
});
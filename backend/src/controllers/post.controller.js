import asyncHandler from "express-async-handler";
import Post from "../models/post.model.js";
import { populate } from "dotenv";
import User from "../models/user.model.js";
import { getAuth } from "@clerk/express";
import cloudinary from "../config/cloudinary.js"
import Notification from "../models/notification.model.js";
import comment from "../models/comment.model.js";



export const getPosts = asyncHandler (async (req, res) => {
    //try to find all the posts
   const posts = await Post.find()
     .sort({ createdAt: -1})
     .populate("user", "UserName FirstName LastName ProfilePicture")
     .populate({
        path: "comments",
        populate:{
            path: "user",
            select: "UserName FirstName LastName ProfilePicture",
        },
     });
  
     res.status(200).json({ posts});
});


export const getPost = asyncHandler (async (req,res) => {
   const {postId} =req.params;

    const post = await Post.findById(postId)
    populate("user", "UserName FisrtName LastName ProfilePicture")
    populate({
        path: "comments",
        populate:{
            path: "user",
            select: "UserName FisrtName LastName ProfilePicture",
        },
    });

    if (!post) return res.status(404).json({ error: "Post not found"})

    rest.status(200).json({ post });
});


export const getUserPosts = asyncHandler(async (req, res) => {
    const { username } = req.params;

    const user = await User.findOne({ user: user._Id });
    if (!user) return res.status(404).json({ error: "User not found"});

    const post = await Post.find({ user: user._Id})
        sort({ createdAt: -1})
        populate("user", "UserName FirstName LastName ProfilePicture")
        populate({
            path:"comments",
            populate: {
                path:"user",
                select: "UserName FirstName LastName ProfilePicture",
            },
        });


});


export const createPost = asyncHandler(async (req,res) => {
    const {userId } = getAuth(req); 
    const { content } = req.body;
    const imageFile = req.file;


    if (!content && !imageFile) {
      return res.status(400).json({ error: "Post must contain either text or image"})
    }

    const user = await User.findOne({ clerkId: userId});
    
    if(!user) return res.status(404).json({error: "User not found"});


    let imageUrl = "";

    // upload image to cloudinary if provaded
    if (imageFile) {
        try {
         //convert buffer to base64 for cloudinary
         const base64Image = `data:${imageFile.mimetype};base64,${imageFile.buffer.toString(
            "base64"
         )}`;
         
         const uploadResponse = await cloudinary.uploader.upload(base64Image, {
            folder: "social_media_posts",
            resource_type: "image",
            transformation: [
                {width: 800, height: 600, crop:"limit"},
                { quality: "auto"},
                { format: "auto"},
            ],
         });
         imageUrl = uploadResponse.secure_url; 
        } catch (uploadError){
            console.error("Cloudinary upload error:", uploadError);
            return res.status(400).json({ error: "Failed to upload image"});
        }
    }

    const post = await Post.create({
         user: user._id,
         content: content || "",
         imageUrl: imageUrl,
    });
       
    res.status(201).json({ post })
});

export const likePost = asyncHandler(async (req,res) => {
        const { userId } = getAuth(req);    
        const { postId } = req.params;


        const user = await User.findOne({ clerkId: userId });
        const post = await Post.findById(postId);


        if (!post || !user) return res.status(404).json({ error: "User or Post not found"});


        const isLiked = post.likes.includes(user._id);

        if (isLiked) {
            //unlike
            await Post.findByIdAndUpdate(postId, { 
            $pull: { likes: user._id },
        });
    } else {
        //like
         await Post.findByIdAndUpdate(postId, {
            $push: { likes: user._id },
         });

         //crate notifications if not liking own post
         if (post.user.toString() !== user._id.toString()) {
            await Notification.create({
                from: user._id,
                to: post.user,
                type: "like",
                post: postId,
            });
         }
    }

    res.status(200).json({ message: isLiked ? "Post unliked sucessfully" : "Post liked sucessfully" });
});
    

export const deletePost = asyncHandler(async  (req,res) => {

    const { userId } = getAuth(req);
    const { postId } = req.params;

    const user = await User.findOne({ clerkId: userId});
    const post = await Post.findById(postId);

    if (!post || !user) return res.status(404).json({error: "User or post not found" });


      // check if im the creater of the post 
    if (post.user.toString() !== user._id.toString()) {
        return res.status(403).json({ error: "You can only delete your own posts" });
    }

    //delete all comments on this post 
    await comment.deleteMany({ post: postId});

    //delete the post
    await Post.findByIdAndDelete(postId);

    res.status(200).json({ message: "Post deleted sucessfully"});
}); 
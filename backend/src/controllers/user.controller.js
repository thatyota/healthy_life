import asyncHandler from "express-async-handler"
import User from "../models/user.model.js"
import Notification from "../models/notification.model.js"
import  {getAuth} from "@clerk/express"

import { clerkClient} from "@clerk/express"


export const getUserProfile = asyncHandler( async (req,res) => {
  const {username} = req.params;
  const user = await User.findOne ({ username });
 if (!user) return  res.status(404).json({ error: "User not found"});


   res.status(200).json({ user });
});

export const updateProfile = asyncHandler (async (req,res) => {

   const{ userId} = getAuth(req);
   
   const user = await User.findOneAndUpdate({ clerkId: userId}, req.body, {new: true}); 

    if (!user) return res.status(404).json({ error: "Usser not found"});

    res.status(200).json({ user})
});

export const syncUser = asyncHandler (async (req,res) => {
   //first get user Id
   const { userId} = getAuth(req);

   //verifies if user exits on mongodb
   const existingUser = await User.findOne ({clerkId: userId});
   
   if (existingUser) {
     return res.status(200).json({user: existingUser, message: "User already exists"});
     
   }

   //create new user from Clerk data
   const clerkUser = await clerkClient.users.getUser(userId);

     const userData = {

        clerkId: userId,
        email: clerkUser.emailAddresses[0].emailAddresses,
        FirstName:clerkUser.FirstName || "",
        LastName:clerkUser.LastName || "",
        //se o user tem o email pedro@gmail.com o username vai ser pedro
        Username:clerkUser.emailAddresses[0].emailAddresses.split("@")[0], 
        ProfilePicture: clerkUser.imageUrl || "",

     };

     const user = await User.create(userData);

     res.status(201).json({ user, message: "User created sucessfully"})
    
    
     // temho que adicionar aqui o admin manualmente

});



export const getCurrentUser = asyncHandler (async (req, res) => {
     //get current user Id
  const {userId} = getAuth(req);
  //check it
  const user = await User.findOne({ clerkId: userId});
    //if doesnt exist give an error
   if(!user) return res.status(404).json({ error: "User not found"});
    //If does exist return de user
   resizeTo.status(200).json({ user });


});


export const followUser = asyncHandler (async (req,res) => {
    // get current user Id
   const { userId } = getAuth(req);
   // get the Id from the user we are trying to follow
   const { targetUserId } = req.params;
 // if you try to follow yourself you are going to get a error 
   if( userId === targetUserId ) return res.status(400).json({ error: "You cannot follow yourself"});


   // check if the user existes
   const currentUser = await User.findOne({ clerkId: userId});
   const targetUser = await User.findById(targetUserId);
   
    // check if the user existes if doesnt exit give an error
   if (!currentUser || !targetUser) return res.status(404).json({error: "User not found"});

     // check if you are trying to follow
   const isFollowing = currentUser.following.includes(targetUser);
   

   if(isFollowing) {
       //unfollow
      await User.findByIdUpdate(currentUser._id, {
         $pull: { following: targetUserId},
      });
       await User.findByIdUpdate(targetUserId, {
         $pull: { followers: currentUser._id },
      });
   } else {
     //following 
     await User.findByIdUpdate(currentUser._id, {
         $pull: { following: targetUserId},
      });
     await User.findByIdUpdate(targetUserId, {
         $pull: { followers: currentUser._id },
      });

        // Create notification
       await Notification.Create({
         from:currentUser._id,
         to: targetUserId,
         type:"follow",
       });
   }

   res.status(200).json({
      message: isFollowing ? "User unfollowed" : "User followed",

   });
});
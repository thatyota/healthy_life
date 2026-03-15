import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    User: {
     type: mongoose.Schema.Types.ObjectId,
     ref: "User",
     required: true,
   },
    Content: {
     type: String,
     maxLenght: 280,
   },
    Image: {
      type: String,
      default: "",
    },
    Likes: [
      {
         type: mongoose.Schema.Types.ObjectId,
         ref: "User",
      },
    ],
     Comments: [
      {
         type: mongoose.Schema.Types.ObjectId,
         ref: "Comments",
      },
     ],

  },
  {timestamps: true},

);

const  Post = mongoose.model("Post",postSchema);

export default Post; 
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
      maxLength: 280,
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
    comments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment",
      },
    ],
  },
  { 
    timestamps: true,
    strictPopulate: false
  }
);

const Post = mongoose.model("Post", postSchema);

export default Post;
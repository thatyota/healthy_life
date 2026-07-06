import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        clerkId: {
            type: String,
            required: true,
            unique: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
        },
        FirstName: {
            type: String,
            default: "",
        },
        LastName: {
            type: String,
            default: "",
        },
        Username: {
            type: String,
            required: true,
            unique: true,
        },
        ProfilePicture: {
            type: String,
            default: "",
        },
        bannerImage: {
            type: String,
            default: "",
        },
        bio: {
            type: String,
            default: "",
            maxLength: 160,
        },
        location: {
            type: String,
            default: "",
        },
        role: {
            type: String,
            enum: ["user", "admin"],
            default: "user",
        },
        Followers: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        Following: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        isDeactivated: {
            type: Boolean,
            default: false,
        },
        deactivatedAt: {
            type: Date,
            default: null,
        },
        reactivationCode: {
            type: String,
            default: null,
        },
        reactivationCodeExpires: {
            type: Date,
            default: null,
        },
    },
    { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;
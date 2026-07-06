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
        // ========== CAMPOS DE DESATIVACAO/REATIVACAO ==========
        isDeactivated: {
            type: Boolean,
            default: false, // false = conta ativa, true = conta desativada
        },
        deactivatedAt: {
            type: Date,
            default: null, // data em que a conta foi desativada
        },
        reactivationCode: {
            type: String,
            default: null, // codigo de 6 digitos para reativar
        },
        reactivationCodeExpires: {
            type: Date,
            default: null, // data de expiracao do codigo (10 min)
        },
    },
    { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;
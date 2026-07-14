import mongoose from "mongoose";

/**
 * Report — modelo para guardar denuncias de users
 *
 * Um report e criado quando um user denuncia outro user,
 * um post ou um comentario.
 *
 * Campos:
 * - reporter: quem fez a denuncia (referencia ao User)
 * - reportedUser: quem foi denunciado (referencia ao User)
 * - type: tipo da denuncia (post, comment, user)
 * - targetId: ID do post/comentario denunciado (se aplicavel)
 * - reason: motivo da denuncia
 * - status: estado da denuncia (pending, resolved)
 * - createdAt: data de criacao
 */
const reportSchema = new mongoose.Schema({
    // quem fez a denuncia
    reporter: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    // quem foi denunciado
    reportedUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    // tipo da denuncia
    type: {
        type: String,
        enum: ["post", "comment", "user"],
        required: true,
    },
    // ID do post ou comentario denunciado
    targetId: {
        type: mongoose.Schema.Types.ObjectId,
        required: false,
    },
    // motivo da denuncia
    reason: {
        type: String,
        required: true,
    },
    // estado da denuncia
    status: {
        type: String,
        enum: ["pending", "resolved"],
        default: "pending",
    },
}, { timestamps: true });

const Report = mongoose.model("Report", reportSchema);

export default Report;
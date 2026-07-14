import mongoose from "mongoose";

/**
 * Modelo de Notificação
 * 
 * Tipos suportados:
 * - "follow": alguém começou a seguir
 * - "like": alguém gostou do teu post
 * - "comment": alguém comentou no teu post
 * - "delete_post": um moderador removeu o teu post
 * 
 * Para notificações "delete_post":
 * - from: MongoDB _id do admin (guardado na BD para referência)
 * - to: MongoDB _id do dono do post removido
 * - reason: motivo da remoção (escrito pelo admin)
 * - postTitle: conteúdo do post removido (truncado a 50 chars)
 * - read: se a notificação foi lida pelo user
 * 
 * NOTA: Ao mostrar ao user, o nome do admin NÃO é exibido.
 * Mostra sempre "Moderador" como remetente.
 */
const notificationSchema = new mongoose.Schema(
  {
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: ["follow", "like", "comment", "delete_post"],
    },
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      default: null,
    },
    comment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
    },
    // Motivo da remoção (apenas para delete_post)
    reason: {
      type: String,
      default: null,
    },
    // Título/conteúdo do post deletado (apenas para delete_post)
    postTitle: {
      type: String,
      default: null,
    },
    // Se a notificação foi lida
    read: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
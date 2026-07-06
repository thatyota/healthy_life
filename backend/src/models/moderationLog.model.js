import mongoose from "mongoose";

// schema para guardar logs de todas as acoes de moderacao
const moderationLogSchema = new mongoose.Schema(
  {
    // admin que fez a acao
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // tipo de acao: ban, timeout, unban, delete_post, delete_comment, warn
    action: {
      type: String,
      enum: ["ban", "timeout", "unban", "delete_post", "delete_comment", "warn"],
      required: true,
    },
    // user alvo da acao (pode ser null se for delete de post sem user especifico)
    targetUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    // post alvo (se aplicavel)
    targetPostId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      default: null,
    },
    // comment alvo (se aplicavel)
    targetCommentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
    },
    // motivo da acao (obrigatorio)
    reason: {
      type: String,
      required: true,
    },
    // duracao do timeout em horas (so para timeout)
    duration: {
      type: Number,
      default: null,
    },
    // data em que o timeout expira
    expiresAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// indice para buscar logs por admin
moderationLogSchema.index({ adminId: 1, createdAt: -1 });
// indice para buscar logs por user alvo
moderationLogSchema.index({ targetUserId: 1 });
// indice para buscar logs por acao
moderationLogSchema.index({ action: 1 });

const ModerationLog = mongoose.model("ModerationLog", moderationLogSchema);
export default ModerationLog;
import Report from "../models/report.model.js";
import Post from "../models/post.model.js";
import Comment from "../models/comment.model.js";

// =============================================================================
// createReport
// =============================================================================
// Cria uma nova denuncia.
// Qualquer user logado pode denunciar outro user, post ou comentario.
// =============================================================================
export const createReport = async (req, res) => {
    try {
        const { reportedUserId, type, targetId, reason } = req.body;

        // valida os campos obrigatorios
        if (!reportedUserId || !type || !reason) {
            return res.status(400).json({ error: "Campos obrigatorios em falta" });
        }

        // valida o tipo
        if (!["post", "comment", "user"].includes(type)) {
            return res.status(400).json({ error: "Tipo invalido" });
        }

        // cria o report
        const report = new Report({
            reporter: req.user._id,
            reportedUser: reportedUserId,
            type,
            targetId: targetId || null,
            reason,
        });

        await report.save();

        res.status(201).json({
            success: true,
            message: "Denuncia criada com sucesso",
            report,
        });
    } catch (error) {
        console.error("Erro ao criar report:", error);
        res.status(500).json({ error: "Erro ao criar denuncia" });
    }
};

// =============================================================================
// getUserReports
// =============================================================================
// Lista as denuncias que o user logado fez.
// Usado no perfil do user para ver historico de denuncias.
// =============================================================================
export const getUserReports = async (req, res) => {
    try {
        const reports = await Report.find({ reporter: req.user._id })
            .populate("reportedUser", "Username ProfilePicture")
            .sort({ createdAt: -1 });

        res.json({ reports });
    } catch (error) {
        console.error("Erro ao buscar reports:", error);
        res.status(500).json({ error: "Erro ao buscar denuncias" });
    }
};
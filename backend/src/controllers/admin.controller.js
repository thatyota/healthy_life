import User from "../models/user.model.js";
import Post from "../models/post.model.js";
import Comment from "../models/comment.model.js";
import Report from "../models/report.model.js";

// =============================================================================
// checkAdmin
// =============================================================================
// Verifica se o user logado e admin
// Usado no mobile para mostrar/esconder o tab admin
// =============================================================================
export const checkAdmin = async (req, res) => {
    try {
        const user = await User.findOne({ clerkId: req.auth.userId });

        if (!user) {
            return res.status(404).json({ error: "User nao encontrado" });
        }

        res.json({
            isAdmin: user.role === "admin",
            role: user.role,
            userId: user._id,
        });
    } catch (error) {
        console.error("Erro checkAdmin:", error);
        res.status(500).json({ error: "Erro interno" });
    }
};

// =============================================================================
// getStats
// =============================================================================
// Busca estatisticas para o dashboard do admin
// Conta: users, posts, comentarios, reports pendentes
// =============================================================================
export const getStats = async (req, res) => {
    try {
        const [users, posts, comments, reports] = await Promise.all([
            User.countDocuments(),
            Post.countDocuments(),
            Comment.countDocuments(),
            Report.countDocuments({ status: "pending" }),
        ]);

        res.json({
            users,
            posts,
            comments,
            reports,
        });
    } catch (error) {
        console.error("Erro getStats:", error);
        res.status(500).json({ error: "Erro ao buscar estatisticas" });
    }
};

// =============================================================================
// getAllUsers
// =============================================================================
// Lista todos os users da app
// Usado no ecra "Gerir Users" do admin
// =============================================================================
export const getAllUsers = async (req, res) => {
    try {
        const users = await User.find()
            .select("-password")
            .sort({ createdAt: -1 });

        res.json({ users });
    } catch (error) {
        console.error("Erro getAllUsers:", error);
        res.status(500).json({ error: "Erro ao buscar users" });
    }
};

// =============================================================================
// getAllPosts
// =============================================================================
// Lista todos os posts da app (igual ao feed mas sem filtro)
// Usado no ecra "Publicacoes" do admin para ver/apagar posts
// =============================================================================
export const getAllPosts = async (req, res) => {
    try {
        const posts = await Post.find()
            .populate("author", "Username ProfilePicture")
            .populate("comments")
            .sort({ createdAt: -1 });

        res.json({ posts });
    } catch (error) {
        console.error("Erro getAllPosts:", error);
        res.status(500).json({ error: "Erro ao buscar posts" });
    }
};

// =============================================================================
// getAllComments
// =============================================================================
// Lista todos os comentarios da app
// Usado no ecra "Publicacoes" do admin para ver/apagar comentarios
// =============================================================================
export const getAllComments = async (req, res) => {
    try {
        const comments = await Comment.find()
            .populate("user", "Username ProfilePicture")
            .populate("post", "title")
            .sort({ createdAt: -1 });

        res.json({ comments });
    } catch (error) {
        console.error("Erro getAllComments:", error);
        res.status(500).json({ error: "Erro ao buscar comentarios" });
    }
};

// =============================================================================
// banUser
// =============================================================================
// Bane um user (bloqueia a conta)
// O user nao consegue mais fazer login
// =============================================================================
export const banUser = async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await User.findByIdAndUpdate(
            userId,
            { isBanned: true, bannedAt: new Date() },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ error: "User nao encontrado" });
        }

        res.json({ message: "User banido com sucesso", user });
    } catch (error) {
        console.error("Erro banUser:", error);
        res.status(500).json({ error: "Erro ao banir user" });
    }
};

// =============================================================================
// timeoutUser
// =============================================================================
// Da timeout num user (suspensao temporaria)
// O user fica bloqueado por X dias
// =============================================================================
export const timeoutUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const { days = 7 } = req.body;

        const timeoutUntil = new Date();
        timeoutUntil.setDate(timeoutUntil.getDate() + days);

        const user = await User.findByIdAndUpdate(
            userId,
            { timeoutUntil },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ error: "User nao encontrado" });
        }

        res.json({ message: `User suspenso por ${days} dias`, user });
    } catch (error) {
        console.error("Erro timeoutUser:", error);
        res.status(500).json({ error: "Erro ao suspender user" });
    }
};

// =============================================================================
// unbanUser
// =============================================================================
// Desbane um user (remove o ban)
// O user volta a conseguir fazer login
// =============================================================================
export const unbanUser = async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await User.findByIdAndUpdate(
            userId,
            { isBanned: false, bannedAt: null, timeoutUntil: null },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ error: "User nao encontrado" });
        }

        res.json({ message: "User desbanido com sucesso", user });
    } catch (error) {
        console.error("Erro unbanUser:", error);
        res.status(500).json({ error: "Erro ao desbanir user" });
    }
};

// =============================================================================
// deletePost
// =============================================================================
// Apaga um post da app
// Usado pelo admin quando um post e inapropriado
// =============================================================================
export const deletePost = async (req, res) => {
    try {
        const { postId } = req.params;

        const post = await Post.findByIdAndDelete(postId);

        if (!post) {
            return res.status(404).json({ error: "Post nao encontrado" });
        }

        // apaga os comentarios do post tambem
        await Comment.deleteMany({ post: postId });

        res.json({ message: "Post apagado com sucesso" });
    } catch (error) {
        console.error("Erro deletePost:", error);
        res.status(500).json({ error: "Erro ao apagar post" });
    }
};

// =============================================================================
// deleteComment
// =============================================================================
// Apaga um comentario da app
// Usado pelo admin quando um comentario e ofensivo
// =============================================================================
export const deleteComment = async (req, res) => {
    try {
        const { commentId } = req.params;

        const comment = await Comment.findByIdAndDelete(commentId);

        if (!comment) {
            return res.status(404).json({ error: "Comentario nao encontrado" });
        }

        res.json({ message: "Comentario apagado com sucesso" });
    } catch (error) {
        console.error("Erro deleteComment:", error);
        res.status(500).json({ error: "Erro ao apagar comentario" });
    }
};

// =============================================================================
// getAllReports
// =============================================================================
// Lista todas as denuncias da app
// Usado no ecra "Moderacao" do admin
// =============================================================================
export const getAllReports = async (req, res) => {
    try {
        const reports = await Report.find()
            .populate("reporter", "Username ProfilePicture")
            .populate("reportedUser", "Username ProfilePicture")
            .sort({ createdAt: -1 });

        res.json({ reports });
    } catch (error) {
        console.error("Erro getAllReports:", error);
        res.status(500).json({ error: "Erro ao buscar denuncias" });
    }
};

// =============================================================================
// resolveReport
// =============================================================================
// Marca uma denuncia como resolvida
// Usado pelo admin quando trata uma denuncia
// =============================================================================
export const resolveReport = async (req, res) => {
    try {
        const { reportId } = req.params;

        const report = await Report.findByIdAndUpdate(
            reportId,
            { status: "resolved" },
            { new: true }
        );

        if (!report) {
            return res.status(404).json({ error: "Denuncia nao encontrada" });
        }

        res.json({ message: "Denuncia resolvida", report });
    } catch (error) {
        console.error("Erro resolveReport:", error);
        res.status(500).json({ error: "Erro ao resolver denuncia" });
    }
};

// =============================================================================
// getModerationLogs
// =============================================================================
// Busca logs de moderacao (acoes do admin)
// Futuro: guardar historico de bans, deletes, etc.
// =============================================================================
export const getModerationLogs = async (req, res) => {
    try {
        // por agora retorna array vazio
        // futuro: criar modelo ModerationLog
        res.json({ logs: [] });
    } catch (error) {
        console.error("Erro getModerationLogs:", error);
        res.status(500).json({ error: "Erro ao buscar logs" });
    }
};
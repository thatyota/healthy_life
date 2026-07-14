import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import User from "../models/user.model.js";

const router = express.Router();

// =============================================================================
// CÓDIGO ADMIN — lido do .env ou fallback para desenvolvimento
// =============================================================================
// Este código é usado para verificar se quem se regista na área de admin
// tem permissão para ser promovido a administrador.
// =============================================================================
const ADMIN_CODE = process.env.ADMIN_CODE || "ADMINADMIN123";

// =============================================================================
// SYNC USER — Cria ou atualiza o user no MongoDB
// =============================================================================
// Esta rota é chamada automaticamente pelo frontend quando o user faz login
// (via hook useUserSync) ou manualmente após registo.
// Recebe dados do Clerk e sincroniza com a nossa base de dados.
// =============================================================================
router.post("/sync", protectRoute, async (req, res) => {
  try {
    // --- Dados de autenticação do Clerk ---
    // req.auth vem do middleware protectRoute que valida o token JWT
    const { clerkId } = req.auth;

    // --- Dados do body enviados pelo frontend ---
    // email, firstName, lastName, username: dados do perfil
    // role: role pretendido ("user" ou "admin")
    // adminCode: código de segurança para verificar se é admin legítimo
    const { email, firstName, lastName, username, role, adminCode } = req.body;

    // --- Validação: garantir que o request tem um clerkId válido ---
    if (!clerkId) {
      return res.status(401).json({ error: "Não autenticado" });
    }

    // =============================================================================
    // PASSO 1: Procurar se o user já existe na base de dados
    // =============================================================================
    // Se o user já existe, vamos proteger o role atual (especialmente se for admin)
    // para evitar que um sync automático do frontend faça downgrade de admin → user
    // =============================================================================
    const existingUser = await User.findOne({ clerkId });

    // =============================================================================
    // PASSO 2: Determinar o role final do user
    // =============================================================================
    // Lógica de proteção do role:
    // 1. Se o user já existe e é admin → mantém admin (nunca faz downgrade)
    // 2. Se enviou adminCode válido → promove para admin
    // 3. Se é criação de conta nova → aplica o role enviado (default: "user")
    // 4. Se é user existente e não é admin → permite mudar o role
    // =============================================================================
    let userRole = existingUser?.role || "user"; // Default: mantém role atual ou "user"

    if (adminCode) {
      // --- Caso 1: Enviou código de admin ---
      // Verifica se o código corresponde ao ADMIN_CODE
      // Se sim, promove para admin (ou mantém se já for)
      if (adminCode === ADMIN_CODE) {
        userRole = "admin";
        console.log("✅ Código admin válido — user será admin");
      } else {
        // Código errado → rejeita o pedido
        console.log("❌ Código admin inválido:", adminCode);
        return res.status(400).json({ error: "Código de administrador inválido" });
      }
    } else if (role && !existingUser) {
      // --- Caso 2: Criação de conta nova (user não existe) ---
      // Aplica o role enviado pelo frontend (normalmente "user" ou "admin")
      userRole = role;
    } else if (role && existingUser && existingUser.role !== "admin") {
      // --- Caso 3: User existe, não é admin, e enviou role ---
      // Permite mudar o role (ex: "user" → "moderator" se existir)
      // Mas NUNCA faz downgrade de "admin" → outro role
      userRole = role;
    }
    // --- Caso 4 (implícito): User existe e é admin, não enviou adminCode ---
    // Mantém o role atual (admin) — proteção contra downgrade automático

    // =============================================================================
    // PASSO 3: Criar ou atualizar o user na base de dados
    // =============================================================================
    let user = existingUser;

    if (user) {
      // --- User existe → atualiza dados ---
      // Só atualiza campos que foram enviados, mantém os restantes
      user.email = email || user.email;
      user.FirstName = firstName || user.FirstName;
      user.LastName = lastName || user.LastName;
      user.Username = username || user.Username;
      user.role = userRole; // Aplica o role determinado no Passo 2
      await user.save();
      console.log("🔄 User atualizado:", user.Username, "— role:", user.role);
    } else {
      // --- User não existe → cria novo ---
      user = new User({
        clerkId,
        email: email || "",
        FirstName: firstName || "",
        LastName: lastName || "",
        Username: username || email?.split("@")[0] || "user",
        ProfilePicture: "",
        bannerImage: "",
        bio: "",
        location: "",
        role: userRole, // Role determinado no Passo 2
        Followers: [],
        Following: [],
        isDeactivated: false,
        deactivatedAt: null,
        reactivationCode: null,
        reactivationCodeExpires: null,
      });
      await user.save();
      console.log("✅ Novo user criado:", user.Username, "— role:", user.role);
    }

    // =============================================================================
    // PASSO 4: Responder ao frontend com os dados do user
    // =============================================================================
    res.status(200).json({
      message: "User sincronizado",
      user: {
        id: user._id,
        username: user.Username,
        email: user.email,
        role: user.role,
        firstName: user.FirstName,
        lastName: user.LastName,
      },
    });
  } catch (error) {
    console.error("Erro no sync:", error);
    res.status(500).json({ error: "Erro ao sincronizar user" });
  }
});

// =============================================================================
// GET ME — Retorna os dados completos do user logado
// =============================================================================
// Usado pelo frontend para:
// - Verificar o role do user (admin vs user normal)
// - Redirecionar para a screen correta (/(admin) ou /(tabs))
// - Mostrar dados do perfil
// =============================================================================
router.get("/me", protectRoute, async (req, res) => {
  try {
    const { clerkId } = req.auth;

    // Busca o user na base de dados, excluindo o campo __v (interno do MongoDB)
    const user = await User.findOne({ clerkId }).select("-__v");

    if (!user) {
      return res.status(404).json({ error: "User não encontrado" });
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error("Erro no /me:", error);
    res.status(500).json({ error: "Erro ao buscar user" });
  }
});

// =============================================================================
// VERIFY ADMIN CODE — Verifica se o código de admin é válido
// =============================================================================
// Usado pelo frontend no modal de "Entrar como Administrador"
// Antes de mostrar o formulário de login/registo admin, verifica o código
// Se válido, mostra o formulário; se inválido, mostra erro
// =============================================================================
router.post("/verify-admin", async (req, res) => {
  try {
    const { adminCode } = req.body;

    // Validação: código deve ser fornecido
    if (!adminCode) {
      return res.status(400).json({ error: "Código não fornecido" });
    }

    // Comparação com o código definido no .env
    if (adminCode === ADMIN_CODE) {
      return res.status(200).json({ valid: true });
    } else {
      return res.status(400).json({ valid: false, error: "Código inválido" });
    }
  } catch (error) {
    console.error("Erro no verify-admin:", error);
    res.status(500).json({ error: "Erro ao verificar código" });
  }
});

export default router;
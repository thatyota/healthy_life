import { getAuth } from "@clerk/express";
import User from "../models/user.model.js";
import { clerkClient } from "@clerk/express";

// middleware que verifica se o user e admin
export const requireAdmin = async (req, res, next) => {
  try {
    const { userId } = getAuth(req);

    // busca o user no clerk para verificar o role
    const clerkUser = await clerkClient.users.getUser(userId);
    const role = clerkUser.publicMetadata?.role;

    // so permite admin
    if (role !== "admin") {
      return res.status(403).json({ error: "Acesso negado. Admin apenas." });
    }

    // busca o user no mongo para ter o _id disponivel
    const user = await User.findOne({ clerkId: userId });
    if (!user) {
      return res.status(404).json({ error: "User nao encontrado" });
    }

    // adiciona o user ao request para os controllers usarem
    req.adminUser = user;
    next();
  } catch (error) {
    console.error("Erro no middleware admin:", error);
    res.status(500).json({ error: "Erro interno" });
  }
};

// middleware que verifica se o user esta banido ou em timeout
export const checkUserStatus = async (req, res, next) => {
  try {
    const { userId } = getAuth(req);
    const user = await User.findOne({ clerkId: userId });

    if (!user) return next();

    // verifica se esta banido
    if (user.status === "banned") {
      return res.status(403).json({ error: "Conta banida. Contacta o suporte." });
    }

    // verifica se esta em timeout e se ja expirou
    if (user.status === "timeout" && user.timeoutExpiresAt) {
      if (new Date() > user.timeoutExpiresAt) {
        // timeout expirou, liberta o user
        user.status = "active";
        user.timeoutExpiresAt = null;
        await user.save();
      } else {
        return res.status(403).json({
          error: "Conta suspensa temporariamente.",
          expiresAt: user.timeoutExpiresAt,
        });
      }
    }

    next();
  } catch (error) {
    console.error("Erro ao verificar status:", error);
    next();
  }
};
import express from "express";
import { getAuth, clerkClient } from "@clerk/express";
import User from "../models/user.model.js";  // ✅ CORRIGIDO: user.model.js em vez de User.js
import { ENV } from "../config/env.js";

const router = express.Router();

// POST /api/auth/verify-admin
router.post("/verify-admin", async (req, res) => {
  try {
    const { adminCode } = req.body;

    if (!adminCode) {
      return res.status(400).json({ valid: false, error: "Código de administrador obrigatório" });
    }

    const validCode = ENV.ADMIN_INVITE_CODE;

    if (!validCode) {
      return res.status(500).json({ valid: false, error: "Código admin não configurado no servidor" });
    }

    if (adminCode === validCode) {
      res.json({ valid: true });
    } else {
      res.status(400).json({ valid: false, error: "Código de administrador inválido" });
    }
  } catch (error) {
    console.error("Erro ao verificar código admin:", error);
    res.status(500).json({ valid: false, error: "Erro interno do servidor" });
  }
});

// POST /api/auth/sync
router.post("/sync", async (req, res) => {
  try {
    const { clerkId, email, firstName, lastName, username, profilePicture, role, adminCode } = req.body;

    if (!clerkId || !email) {
      return res.status(400).json({ error: "clerkId e email são obrigatórios" });
    }

    let userRole = role || "user";

    if (adminCode) {
      if (adminCode === ENV.ADMIN_INVITE_CODE) {
        userRole = "admin";
      } else {
        return res.status(400).json({ error: "Código de administrador inválido" });
      }
    }

    try {
      await clerkClient.users.updateUser(clerkId, {
        publicMetadata: { role: userRole },
      });
    } catch (clerkError) {
      console.error("Erro ao atualizar Clerk metadata:", clerkError);
    }

    let user = await User.findOne({ clerkId });

    if (user) {
      user.FirstName = firstName || user.FirstName;
      user.LastName = lastName || user.LastName;
      user.Username = username || user.Username;
      user.ProfilePicture = profilePicture || user.ProfilePicture;
      await user.save();
    } else {
      user = await User.create({
        clerkId,
        email,
        FirstName: firstName || "",
        LastName: lastName || "",
        Username: username || email.split("@")[0],
        ProfilePicture: profilePicture || "",
        role: userRole,
      });
    }

    res.json({ user, role: userRole });
  } catch (error) {
    console.error("Erro ao sincronizar user:", error);
    res.status(500).json({ error: "Erro ao sincronizar utilizador" });
  }
});

// GET /api/auth/me
router.get("/me", async (req, res) => {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return res.status(401).json({ error: "Não autenticado" });
    }

    let clerkRole = "user";
    try {
      const clerkUser = await clerkClient.users.getUser(userId);
      clerkRole = clerkUser.publicMetadata?.role || "user";
    } catch (e) {
      console.log("Erro ao buscar Clerk user:", e);
    }

    const user = await User.findOne({ clerkId: userId });

    if (!user) {
      return res.status(404).json({ error: "Utilizador não encontrado" });
    }

    if (user.role !== clerkRole) {
      user.role = clerkRole;
      await user.save();
    }

    res.json({ user });
  } catch (error) {
    console.error("Erro ao buscar user:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

export default router;
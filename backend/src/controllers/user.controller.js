import asyncHandler from "express-async-handler";
import { getAuth } from "@clerk/express";
import { clerkClient } from "@clerk/express";
import crypto from "crypto";
import User from "../models/user.model.js";
import Post from "../models/post.model.js";
import Comment from "../models/comment.model.js";
import Notification from "../models/notification.model.js";

// ========== 1. PERFIL ==========

// busca perfil de um user pelo username
export const getUserProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;
  const user = await User.findOne({ Username: username });
  if (!user) return res.status(404).json({ error: "User not found" });
  res.status(200).json({ user });
});

// busca o user logado (me)
export const getCurrentUser = asyncHandler(async (req, res) => {
  const { userId } = getAuth(req);
  const user = await User.findOne({ clerkId: userId });
  if (!user) return res.status(404).json({ error: "User not found" });
  res.status(200).json({ user });
});

// atualiza perfil do user logado
export const updateProfile = asyncHandler(async (req, res) => {
  const { userId } = getAuth(req);
  const user = await User.findOneAndUpdate({ clerkId: userId }, req.body, { new: true });
  if (!user) return res.status(404).json({ error: "User not found" });
  res.status(200).json({ user });
});

// ========== 2. SINCRONIZACAO ==========

// sincroniza user do Clerk com MongoDB (apos login social)
export const syncUser = asyncHandler(async (req, res) => {
  console.log("🔍 [user.controller syncUser] ==============================");
  console.log("🔍 [user.controller syncUser] HEADERS:", JSON.stringify(req.headers));
  console.log("🔍 [user.controller syncUser] BODY:", JSON.stringify(req.body));

  const { userId } = getAuth(req);
  console.log("🔍 [user.controller syncUser] userId do Clerk:", userId);

  const existingUser = await User.findOne({ clerkId: userId });
  console.log("🔍 [user.controller syncUser] existingUser:", existingUser ? {
    username: existingUser.Username,
    role: existingUser.role,
    email: existingUser.email
  } : "NÃO ENCONTRADO");

  // verifica se a conta esta desativada
  if (existingUser && existingUser.isDeactivated) {
    console.log("❌ [user.controller syncUser] Conta desativada!");
    return res.status(403).json({
      error: "Conta desativada",
      isDeactivated: true,
      message: "Esta conta foi desativada. Usa a funcao de reativacao.",
    });
  }

  if (existingUser) {
    console.log("✅ [user.controller syncUser] User já existe — retornando sem alterar");
    console.log("✅ [user.controller syncUser] Role atual:", existingUser.role);
    return res.status(200).json({ user: existingUser, message: "User already exists" });
  }

  // Se não existe, cria um NOVO user
  console.log("🔍 [user.controller syncUser] User não existe — a criar novo...");
  const clerkUser = await clerkClient.users.getUser(userId);
  const userData = {
    clerkId: userId,
    email: clerkUser.emailAddresses[0].emailAddress,
    FirstName: clerkUser.firstName || "",
    LastName: clerkUser.lastName || "",
    Username: clerkUser.emailAddresses[0].emailAddress.split("@")[0],
    ProfilePicture: clerkUser.imageUrl || "",
    // NOTA: Não define role — usa o default do schema (provavelmente "user")
  };

  console.log("🔍 [user.controller syncUser] Dados para criar:", JSON.stringify(userData));
  const user = await User.create(userData);
  console.log("✅ [user.controller syncUser] User criado! Role:", user.role);
  res.status(201).json({ user, message: "User created successfully" });
});

// ========== 3. PESQUISA ==========

// pesquisar users
export const searchUsers = asyncHandler(async (req, res) => {
  const { q } = req.query;
  if (!q || q.trim().length < 1) {
    return res.status(400).json({ error: "Query must be at least 1 character" });
  }

  const searchRegex = new RegExp(q.trim(), "i");
  const users = await User.find({
    $or: [
      { Username: { $regex: searchRegex } },
      { FirstName: { $regex: searchRegex } },
      { LastName: { $regex: searchRegex } },
    ],
  })
    .select("Username FirstName LastName ProfilePicture bio Followers Following")
    .limit(20);

  res.status(200).json({ users });
});

// ========== 4. FOLLOW ==========

// seguir/deixar de seguir um user
export const followUser = asyncHandler(async (req, res) => {
  const { userId } = getAuth(req);
  const { targetUserId } = req.params;

  if (userId === targetUserId) return res.status(400).json({ error: "You cannot follow yourself" });

  const currentUser = await User.findOne({ clerkId: userId });
  const targetUser = await User.findById(targetUserId);

  if (!currentUser || !targetUser) return res.status(404).json({ error: "User not found" });

  const isFollowing = currentUser.Following.includes(targetUserId);

  if (isFollowing) {
    await User.findByIdAndUpdate(currentUser._id, { $pull: { Following: targetUserId } });
    await User.findByIdAndUpdate(targetUserId, { $pull: { Followers: currentUser._id } });
  } else {
    await User.findByIdAndUpdate(currentUser._id, { $push: { Following: targetUserId } });
    await User.findByIdAndUpdate(targetUserId, { $push: { Followers: currentUser._id } });

    await Notification.create({
      from: currentUser._id,
      to: targetUserId,
      type: "follow",
    });
  }

  res.status(200).json({ message: isFollowing ? "User unfollowed" : "User followed" });
});

// ========== 5. APAGAR + DESATIVAR CONTA ==========

// apaga todos os dados do user e desativa a conta (permite reativacao depois)
export const deleteAccount = asyncHandler(async (req, res) => {
  const { userId } = getAuth(req);

  // encontra o user no MongoDB
  const user = await User.findOne({ clerkId: userId });
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  // ========== 1. APAGAR TODOS OS POSTS DO USER ==========
  // busca todos os posts do user para apagar comments e notificacoes relacionadas
  const userPosts = await Post.find({ User: user._id });
  for (const post of userPosts) {
    await Comment.deleteMany({ post: post._id }); // apaga comments dos posts
    await Notification.deleteMany({ post: post._id }); // apaga notificacoes dos posts
  }
  await Post.deleteMany({ User: user._id }); // apaga todos os posts do user

  // ========== 2. APAGAR COMMENTS DO USER EM POSTS DE OUTROS ==========
  await Comment.deleteMany({ user: user._id });

  // ========== 3. REMOVER LIKES DO USER ==========
  await Post.updateMany(
    { "likes.user": user._id },
    { $pull: { likes: { user: user._id } } }
  );

  // ========== 4. APAGAR NOTIFICACOES RELACIONADAS AO USER ==========
  await Notification.deleteMany({ $or: [{ from: user._id }, { to: user._id }] });

  // ========== 5. REMOVER USER DAS LISTAS DE FOLLOWERS/FOLLOWING ==========
  await User.updateMany({ Followers: user._id }, { $pull: { Followers: user._id } });
  await User.updateMany({ Following: user._id }, { $pull: { Following: user._id } });

  // ========== 6. LIMPAR DADOS DO USER (DEIXAR "FANTASMA" PARA REATIVACAO) ==========
  // mantem so: _id, clerkId, email, isDeactivated, deactivatedAt
  // apaga/tudo o resto para comecar de novo na reativacao
  user.FirstName = "";
  user.LastName = "";
  user.Username = `deactivated_${Date.now()}`;
  user.ProfilePicture = "";
  user.bio = "";
  user.location = "";
  user.bannerImage = "";
  user.Followers = [];
  user.Following = [];
  user.isDeactivated = true;
  user.deactivatedAt = new Date();
  user.reactivationCode = null;
  user.reactivationCodeExpires = null;
  await user.save();

  // ========== 7. DESATIVAR NO CLERK (NAO APAGAR — MANTEM EMAIL) ==========
  try {
    await clerkClient.users.updateUser(userId, {
      publicMetadata: { deactivated: true },
    });
  } catch (err) {
    console.error("Erro ao desativar no Clerk:", err);
  }

  res.status(200).json({
    message: "Conta desativada e todos os dados apagados. Podes reativar com o mesmo email.",
  });
});

// ========== 6. VERIFICAR SE CONTA ESTA DESATIVADA ==========

// verifica se o email tem conta desativada — usado no registo
export const checkDeactivatedAccount = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user) {
    return res.status(404).json({ exists: false });
  }

  if (user.isDeactivated) {
    return res.status(200).json({
      exists: true,
      isDeactivated: true,
      message: "Esta conta foi desativada. Queres reativa-la?",
    });
  }

  res.status(200).json({
    exists: true,
    isDeactivated: false,
    message: "Este email ja esta em uso.",
  });
});

// ========== 7. ENVIAR CODIGO DE REATIVACAO ==========

// gera e envia codigo de 6 digitos para o email do user
export const sendReactivationCode = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({
    email: email.toLowerCase(),
    isDeactivated: true,
  });

  if (!user) {
    return res.status(404).json({ error: "Conta desativada nao encontrada" });
  }

  // gera codigo aleatorio de 6 digitos
  const code = crypto.randomInt(100000, 999999).toString();

  // guarda codigo com expiracao de 10 minutos
  user.reactivationCode = code;
  user.reactivationCodeExpires = new Date(Date.now() + 10 * 60 * 1000);
  await user.save();

  // envia codigo por email via Clerk (usa o email do proprio Clerk)
  try {
    // NOTA: O Clerk nao tem envio direto de email customizado na API gratuita
    // Para producao, usa SendGrid, Resend, AWS SES, etc.
    // Aqui mostramos no console para teste e assumimos que o frontend mostra uma mensagem
    console.log(`========================================`);
    console.log(`CODIGO DE REATIVACAO PARA ${email}: ${code}`);
    console.log(`========================================`);

    res.status(200).json({
      message: "Codigo de reativacao enviado. Verifica o teu email (ou o console do servidor para teste).",
    });
  } catch (err) {
    console.error("Erro ao enviar codigo:", err);
    res.status(500).json({ error: "Erro ao enviar codigo" });
  }
});

// ========== 8. REATIVAR CONTA COM CODIGO ==========

// reativa a conta usando o codigo recebido por email
export const reactivateAccount = asyncHandler(async (req, res) => {
  const { email, code } = req.body;

  const user = await User.findOne({
    email: email.toLowerCase(),
    isDeactivated: true,
    reactivationCode: code,
    reactivationCodeExpires: { $gt: new Date() }, // codigo nao expirou
  });

  if (!user) {
    return res.status(400).json({
      error: "Codigo invalido ou expirado. Solicita um novo.",
    });
  }

  // reativa a conta no MongoDB (dados ficam vazios — user preenche de novo)
  user.isDeactivated = false;
  user.deactivatedAt = null;
  user.reactivationCode = null;
  user.reactivationCodeExpires = null;
  // FirstName, LastName, Username, etc. ficam vazios — user personaliza no perfil
  await user.save();

  // reativa no Clerk
  try {
    await clerkClient.users.updateUser(user.clerkId, {
      publicMetadata: { deactivated: false },
    });
  } catch (err) {
    console.error("Erro ao reativar no Clerk:", err);
  }

  res.status(200).json({
    message: "Conta reativada com sucesso! O teu perfil esta vazio — podes personaliza-lo de novo.",
    user: {
      id: user._id,
      email: user.email,
      clerkId: user.clerkId,
    },
  });
});
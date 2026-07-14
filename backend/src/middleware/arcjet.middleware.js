import { getAuth } from "@clerk/express";
import { aj } from "../config/arcjet.js";

// =============================================================================
// Arcjet Middleware — Rate limiting, bot protection, and security
// =============================================================================
// Este middleware protege rotas PUBLICAS contra bots e ataques.
// Rotas autenticadas (que ja passam pelo protectRoute) NAO sao protegidas
// pelo Arcjet para evitar rate limit em chamadas legitimas do user.
//
// Rotas protegidas pelo Arcjet:
// - /api/auth/* (login, registo, etc.)
// - /api/users (criar user)
// - Rotas publicas em geral
//
// Rotas IGNORADAS pelo Arcjet (ja protegidas por autenticacao):
// - /api/admin/*
// - /api/posts/* (quando autenticado)
// - /api/users/me
// - etc.
// =============================================================================

export const arcjetMiddleware = async (req, res, next) => {
    try {
        // =================================================================
        // PASSO 1: Verifica se o user esta autenticado
        // Se estiver autenticado, ignora o Arcjet (nao aplica rate limit)
        // =================================================================
        const auth = getAuth(req);
        const isAuthenticated = auth?.userId != null;

        if (isAuthenticated) {
            // User autenticado — passa direto sem Arcjet
            // O protectRoute ja verificou o token do Clerk
            return next();
        }

        // =================================================================
        // PASSO 2: Aplica Arcjet apenas em rotas PUBLICAS (nao autenticadas)
        // =================================================================
        const decision = await aj.protect(req, {
            requested: 1, // cada request consume 1 token
        });

        // Handle denied requests
        if (decision.isDenied()) {
            if (decision.reason.isRateLimit()) {
                return res.status(429).json({
                    error: "Too Many Requests",
                    message: "Rate limit exceeded. Please try again later.",
                });
            } else if (decision.reason.isBot()) {
                return res.status(403).json({
                    error: "Bot access denied",
                    message: "Automated requests are not allowed",
                });
            } else {
                return res.status(403).json({
                    error: "Forbidden",
                    message: "Access denied by security policy",
                });
            }
        }

        // Check for spoofed bots
        if (decision.results.some((result) => result.reason.isBot() && result.reason.isSpoofed())) {
            return res.status(403).json({
                error: "Spoofed bot detected",
                message: "Malicious bot activity detected",
            });
        }

        next();
    } catch (error) {
        console.error("Arcjet middleware error:", error);
        // Allow request to continue if Arcjet fails
        next();
    }
};
import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { createReport, getUserReports } from "../controllers/report.controller.js";

const router = express.Router();

// =============================================================================
// POST /api/reports
// Cria uma nova denuncia
// Qualquer user logado pode denunciar
// =============================================================================
router.post("/", protectRoute, createReport);

// =============================================================================
// GET /api/reports
// Lista as denuncias do user logado (as que ele fez)
// =============================================================================
router.get("/", protectRoute, getUserReports);

export default router;
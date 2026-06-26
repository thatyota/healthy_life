import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { getNotifications, markAsRead, markAllAsRead } from "../controllers/notification.controller.js";

const router = express.Router();

router.get("/", protectRoute, getNotifications);
router.put("/:notificationId/read", protectRoute, markAsRead);
router.put("/read-all", protectRoute, markAllAsRead);

export default router;
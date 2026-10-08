import { Router } from "express";
import {
  getAdminNotifications,
  getMyNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../controllers/notificationController";
import {
  adminMiddleware,
  authMiddleware,
} from "../middleware/authMiddleware";

const router = Router();

router.get("/my", authMiddleware, getMyNotifications);
router.patch("/read-all", authMiddleware, markAllNotificationsRead);
router.patch("/:id/read", authMiddleware, markNotificationRead);
router.get(
  "/",
  authMiddleware,
  adminMiddleware,
  getAdminNotifications
);

export default router;
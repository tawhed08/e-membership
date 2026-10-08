import { Router } from "express";
import {
  changeMyPassword,
  getAdminUsers,
  updateMyProfile,
  updateUserStatus,
} from "../controllers/userController";
import {
  adminMiddleware,
  authMiddleware,
} from "../middleware/authMiddleware";

const router = Router();

router.patch("/me/profile", authMiddleware, updateMyProfile);
router.patch("/me/password", authMiddleware, changeMyPassword);
router.get("/admin", authMiddleware, adminMiddleware, getAdminUsers);
router.patch(
  "/admin/:id/status",
  authMiddleware,
  adminMiddleware,
  updateUserStatus
);

export default router;
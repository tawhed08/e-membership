import { Router } from "express";
import { getDashboardStats } from "../controllers/adminController";
import {
  adminMiddleware,
  authMiddleware,
} from "../middleware/authMiddleware";

const router = Router();

router.get(
  "/dashboard",
  authMiddleware,
  adminMiddleware,
  getDashboardStats
);

export default router;
import { Router } from "express";

import {
  createMembership,
  createAdminMembership,
  getMyMembership,
  getMyMembershipHistory,
  getAllMemberships,
} from "../controllers/membershipController";

import {
  authMiddleware,
  adminMiddleware,
} from "../middleware/authMiddleware";

const router = Router();

// Logged-in user
router.post(
  "/",
  authMiddleware,
  createMembership
);

// Admin - manually add membership
router.post(
  "/admin",
  authMiddleware,
  adminMiddleware,
  createAdminMembership
);

// Logged-in user
router.get(
  "/history",
  authMiddleware,
  getMyMembershipHistory
);

router.get(
  "/my",
  authMiddleware,
  getMyMembership
);

// Admin
router.get(
  "/",
  authMiddleware,
  adminMiddleware,
  getAllMemberships
);

export default router;
import { Router } from "express";

import {
  getActivePlans,
  getAllPlans,
  createPlan,
  updatePlan,
  deactivatePlan,
} from "../controllers/membershipPlanController";

import {
  authMiddleware,
  adminMiddleware,
} from "../middleware/authMiddleware";

const router = Router();

/*
  Public:
  Anyone can view active membership plans.
*/
router.get("/active", getActivePlans);

/*
  Admin:
  View all membership plans.
*/
router.get(
  "/",
  authMiddleware,
  adminMiddleware,
  getAllPlans
);

/*
  Admin:
  Create a new membership plan.
*/
router.post(
  "/",
  authMiddleware,
  adminMiddleware,
  createPlan
);

/*
  Admin:
  Update an existing membership plan.
*/
router.put(
  "/:id",
  authMiddleware,
  adminMiddleware,
  updatePlan
);

/*
  Admin:
  Deactivate a membership plan.
*/
router.patch(
  "/:id/deactivate",
  authMiddleware,
  adminMiddleware,
  deactivatePlan
);

export default router;
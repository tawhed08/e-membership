import { Router } from "express";

import {
  createPayment,
  getPaymentSettings,
  updatePaymentSettings,
  startCardCheckout,
  handleAamarPaySuccess,
  handleAamarPayFailure,
  getMyPayments,
  getAllPayments,
  approvePayment,
  rejectPayment,
} from "../controllers/paymentController";

import {
  authMiddleware,
  adminMiddleware,
} from "../middleware/authMiddleware";

const router = Router();

router.get("/settings", getPaymentSettings);

router.put(
  "/settings",
  authMiddleware,
  adminMiddleware,
  updatePaymentSettings
);

router.post(
  "/card/checkout",
  authMiddleware,
  startCardCheckout
);

router.post("/gateway/success", handleAamarPaySuccess);
router.post("/gateway/fail", handleAamarPayFailure);
router.post("/gateway/cancel", handleAamarPayFailure);

router.post(
  "/",
  authMiddleware,
  createPayment
);

router.get(
  "/my",
  authMiddleware,
  getMyPayments
);

router.get(
  "/",
  authMiddleware,
  adminMiddleware,
  getAllPayments
);

router.patch(
  "/:id/approve",
  authMiddleware,
  adminMiddleware,
  approvePayment
);

router.patch(
  "/:id/reject",
  authMiddleware,
  adminMiddleware,
  rejectPayment
);

export default router;
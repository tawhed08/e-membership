import { Router } from "express";

import {
  issueCertificate,
  getMyCertificate,
  getAllCertificates,
  verifyCertificate,
  revokeCertificate,
  downloadCertificatePDF,
} from "../controllers/certificateController";

import {
  authMiddleware,
  adminMiddleware,
} from "../middleware/authMiddleware";

const router = Router();

// User
router.get(
  "/my",
  authMiddleware,
  getMyCertificate
);

// Public verification
router.get(
  "/verify/:certificateId",
  verifyCertificate
);

// PDF certificate
router.get(
  "/:certificateId/pdf",
  downloadCertificatePDF
);

// Admin
router.post(
  "/",
  authMiddleware,
  adminMiddleware,
  issueCertificate
);

router.get(
  "/",
  authMiddleware,
  adminMiddleware,
  getAllCertificates
);

router.patch(
  "/:certificateId/revoke",
  authMiddleware,
  adminMiddleware,
  revokeCertificate
);

export default router;
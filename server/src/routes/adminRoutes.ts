import express from "express";
import * as adminController from "../controllers/adminController";
import { authenticateUser } from "../middleware/authMiddleware";

const router = express.Router();

// GET all providers
router.get(
  "/providers",
  authenticateUser,
  adminController.adminGetAllProviders,
);

// Approve / unapprove a provider
router.patch(
  "/providers/:providerId/verify",
  authenticateUser,
  adminController.adminUpdateProviderStatus,
);

// GET all disputed bookings
router.get("/disputes", authenticateUser, adminController.getAllDisputes);

// Resolve / reject / escalate a dispute
router.patch(
  "/disputes/:bookingId/resolve",
  authenticateUser,
  adminController.resolveDispute,
);

export default router;

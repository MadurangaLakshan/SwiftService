import express from "express";
import * as locationController from "../controllers/locationController";
import { authenticateUser } from "../middleware/authMiddleware";

const router = express.Router();

/**
 * Update provider's real-time location during service
 * Provider calls this endpoint every 10-15 seconds while "on-the-way"
 */
router.post(
  "/booking/:bookingId/location",
  authenticateUser,
  locationController.updateProviderLocation,
);

/**
 * Get real-time tracking information for a booking
 * Customer calls this to track provider's location
 */
router.get(
  "/booking/:bookingId/location",
  authenticateUser,
  locationController.getProviderLocation,
);

/**
 * Geocode an address to get coordinates
 * Used when customer enters a custom address
 */
router.post(
  "/geocode",
  authenticateUser,
  locationController.geocodeAddressController,
);

/**
 * Reverse geocode coordinates to get address
 * Used to get formatted address from map pin
 */
router.post(
  "/reverse-geocode",
  authenticateUser,
  locationController.reverseGeocodeController,
);

export default router;

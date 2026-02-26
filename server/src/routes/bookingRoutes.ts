import express from "express";
import * as bookingController from "../controllers/bookingController";
import { authenticateUser } from "../middleware/authMiddleware";

const router = express.Router();

// Create a new booking
router.post("/", authenticateUser, bookingController.createBooking);

// Get booking details
router.get(
  "/customer/:customerId",
  authenticateUser,
  bookingController.getBookingDetails,
);

// Get provider's bookings
router.get(
  "/provider/:providerId",
  authenticateUser,
  bookingController.getProviderBookings,
);

// Get Single booking details
router.get("/:bookingId", authenticateUser, bookingController.getSingleBooking);

// Update booking status (e.g., accept, reject, complete)
router.put(
  "/:bookingId/status",
  authenticateUser,
  bookingController.updateBookingStatus,
);

// Approve or reject a booking request
router.put(
  "/:bookingId/approve",
  authenticateUser,
  bookingController.approveCompletedWork,
);
router.post(
  "/:bookingId/reject",
  authenticateUser,
  bookingController.rejectCompletedWork,
);

//Update Work Documentation
router.post(
  "/:bookingId/documentation",
  authenticateUser,
  bookingController.updateWorkDocumentation,
);

// Cancel a booking
router.put(
  "/:bookingId/cancel",
  authenticateUser,
  bookingController.cancelBooking,
);

export default router;

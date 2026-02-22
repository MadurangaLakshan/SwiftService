import express from "express";
import {
  getProviderReviews,
  markReviewHelpful,
  respondToReview,
  submitReview,
} from "../controllers/reviewController";
import { authenticateUser } from "../middleware/authMiddleware";

const router = express.Router();

// Submit a review
router.post("/bookings/:bookingId/review", authenticateUser, submitReview);

// Get all reviews for a provider
router.get("/providers/:providerId/reviews", getProviderReviews);

// Provider responds to a review
router.post("/reviews/:reviewId/respond", authenticateUser, respondToReview);

// Mark review as helpful
router.post("/reviews/:reviewId/helpful", markReviewHelpful);

export default router;

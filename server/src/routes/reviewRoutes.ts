import express, { Response } from "express";
import { authenticateUser, AuthRequest } from "../middleware/authMiddleware";
import Booking from "../models/Booking";
import Provider from "../models/Provider";
import Review from "../models/Review";

const router = express.Router();

// Submit a review (called after booking approval)
router.post(
  "/bookings/:bookingId/review",
  authenticateUser,
  async (req: AuthRequest, res: Response) => {
    try {
      const { bookingId } = req.params;
      const { rating, review } = req.body;
      const userId = req.user!.uid;

      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ error: "Invalid rating value" });
      }

      const booking = await Booking.findById(bookingId);
      if (!booking) {
        return res.status(404).json({ error: "Booking not found" });
      }

      if (booking.customerId !== userId) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      if (booking.status !== "completed") {
        return res
          .status(400)
          .json({ error: "Can only review completed bookings" });
      }

      if (booking.rating) {
        return res.status(400).json({ error: "Booking already reviewed" });
      }

      // Create review
      const newReview = await Review.create({
        bookingId,
        customerId: userId,
        providerId: booking.providerId,
        rating,
        review: review || "",
        serviceType: booking.serviceType,
        customerName: booking.customerDetails.name,
        customerPhoto: booking.customerDetails.image,
        isVerified: true,
      });

      // Update booking with rating
      booking.rating = rating;
      booking.review = review || "";
      booking.reviewedAt = new Date();
      await booking.save();

      // Update provider stats
      const provider = await Provider.findOne({ userId: booking.providerId });
      if (provider) {
        const reviews = await Review.find({ providerId: booking.providerId });
        const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
        provider.rating = totalRating / reviews.length;
        provider.totalReviews = reviews.length;
        await provider.save();
      }

      res.json({
        success: true,
        data: newReview,
      });
    } catch (error: any) {
      console.error("Review submission error:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

// Get all reviews for a provider
router.get(
  "/providers/:providerId/reviews",
  async (req: AuthRequest, res: Response) => {
    try {
      const { providerId } = req.params;
      const { limit = "20", skip = "0", sort = "-createdAt" } = req.query;

      const reviews = await Review.find({ providerId })
        .sort(sort as string)
        .limit(parseInt(limit as string))
        .skip(parseInt(skip as string));

      const total = await Review.countDocuments({ providerId });

      const ratingBreakdown = await Review.aggregate([
        { $match: { providerId } },
        {
          $group: {
            _id: "$rating",
            count: { $sum: 1 },
          },
        },
      ]);

      const breakdown = {
        5: 0,
        4: 0,
        3: 0,
        2: 0,
        1: 0,
      };

      ratingBreakdown.forEach((item) => {
        breakdown[item._id as keyof typeof breakdown] = item.count;
      });

      res.json({
        success: true,
        data: {
          reviews,
          total,
          breakdown,
        },
      });
    } catch (error: any) {
      console.error("Get reviews error:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

// Provider responds to a review
router.post(
  "/reviews/:reviewId/respond",
  authenticateUser,
  async (req: AuthRequest, res: Response) => {
    try {
      const { reviewId } = req.params;
      const { message } = req.body;
      const userId = req.user!.uid;

      if (!message || message.trim().length === 0) {
        return res.status(400).json({ error: "Response message is required" });
      }

      const review = await Review.findById(reviewId);
      if (!review) {
        return res.status(404).json({ error: "Review not found" });
      }

      if (review.providerId !== userId) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      review.providerResponse = {
        message: message.trim(),
        respondedAt: new Date(),
      };

      await review.save();

      res.json({
        success: true,
        data: review,
      });
    } catch (error: any) {
      console.error("Review response error:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

// Mark review as helpful
router.post(
  "/reviews/:reviewId/helpful",
  async (req: AuthRequest, res: Response) => {
    try {
      const { reviewId } = req.params;

      const review = await Review.findByIdAndUpdate(
        reviewId,
        { $inc: { helpful: 1 } },
        { new: true }
      );

      if (!review) {
        return res.status(404).json({ error: "Review not found" });
      }

      res.json({
        success: true,
        data: review,
      });
    } catch (error: any) {
      console.error("Mark helpful error:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

export default router;

import { Response } from "express";
import { AuthRequest } from "../middleware/authMiddleware";
import Booking from "../models/Booking";
import Notification from "../models/Notification";
import Provider from "../models/Provider";
import Review from "../models/Review";

// Submit a review
export async function submitReview(req: AuthRequest, res: Response) {
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

    booking.rating = rating;
    booking.review = review || "";
    booking.reviewedAt = new Date();
    await booking.save();

    const provider = await Provider.findOne({ userId: booking.providerId });
    if (provider) {
      const reviews = await Review.find({ providerId: booking.providerId });
      const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
      provider.rating = totalRating / reviews.length;
      provider.totalReviews = reviews.length;
      await provider.save();
    }

    try {
      await Notification.create({
        userId: booking.providerId,
        title: "New Review",
        message: `${booking.customerDetails.name} left you a ${rating}-star review`,
        type: "review",
        relatedId: newReview._id.toString(),
        read: false,
      });
    } catch (notifError) {
      console.error("Failed to create notification:", notifError);
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

// Get provider reviews
export async function getProviderReviews(req: AuthRequest, res: Response) {
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
      { $group: { _id: "$rating", count: { $sum: 1 } } },
    ]);

    const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    ratingBreakdown.forEach((item) => {
      breakdown[item._id as keyof typeof breakdown] = item.count;
    });

    res.json({
      success: true,
      data: { reviews, total, breakdown },
    });
  } catch (error: any) {
    console.error("Get reviews error:", error);
    res.status(500).json({ error: error.message });
  }
}

// Respond to review
export async function respondToReview(req: AuthRequest, res: Response) {
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

    try {
      const provider = await Provider.findOne({ userId });
      await Notification.create({
        userId: review.customerId,
        title: "Review Response",
        message: `${provider?.name || "Provider"} responded to your review`,
        type: "review",
        relatedId: review._id.toString(),
        read: false,
      });
    } catch (notifError) {
      console.error("Failed to create notification:", notifError);
    }

    res.json({
      success: true,
      data: review,
    });
  } catch (error: any) {
    console.error("Review response error:", error);
    res.status(500).json({ error: error.message });
  }
}

// Mark review as helpful
export async function markReviewHelpful(req: AuthRequest, res: Response) {
  try {
    const { reviewId } = req.params;

    const review = await Review.findByIdAndUpdate(
      reviewId,
      { $inc: { helpful: 1 } },
      { new: true },
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

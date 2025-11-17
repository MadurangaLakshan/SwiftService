import express from "express";
import { authenticateUser, AuthRequest } from "../middleware/authMiddleware";
import Booking from "../models/Booking";
import Customer from "../models/Customer";
import Provider from "../models/Provider";

const router = express.Router();

// Create a new booking
router.post("/", authenticateUser, async (req: AuthRequest, res) => {
  try {
    const {
      providerId,
      serviceType,
      category,
      scheduledDate,
      timeSlot,
      serviceAddress,
      additionalNotes,
      hourlyRate,
      estimatedHours,
    } = req.body;

    const customerId = req.user?.uid;

    if (!customerId) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
      });
    }

    // Validate required fields
    if (
      !providerId ||
      !serviceType ||
      !category ||
      !scheduledDate ||
      !timeSlot ||
      !serviceAddress ||
      !hourlyRate
    ) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields",
      });
    }

    // Get customer details
    const customer = await Customer.findOne({ userId: customerId });
    if (!customer) {
      return res.status(404).json({
        success: false,
        error: "Customer profile not found",
      });
    }

    // Get provider details
    const provider = await Provider.findOne({ userId: providerId });
    if (!provider) {
      return res.status(404).json({
        success: false,
        error: "Provider not found",
      });
    }

    // Calculate pricing
    const platformFee = 5;
    const totalAmount = hourlyRate * (estimatedHours || 1) + platformFee;

    const booking = new Booking({
      customerId,
      providerId,
      serviceType,
      category,
      scheduledDate: new Date(scheduledDate),
      timeSlot,
      serviceAddress,
      additionalNotes,
      status: "pending",
      pricing: {
        hourlyRate,
        estimatedHours: estimatedHours || 1,
        platformFee,
        totalAmount,
      },
      customerDetails: {
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        image: customer.profilePhoto,
      },
      providerDetails: {
        name: provider.name,
        phone: provider.phone,
        email: provider.email,
        profilePhoto: provider.profilePhoto,
      },
      timeline: {
        bookedAt: new Date(),
      },
    });

    await booking.save();
    console.log("booking saved");

    res.status(201).json({
      success: true,
      message: "Booking created successfully",
      data: booking,
    });
  } catch (error: any) {
    console.error("Booking creation error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get customer's bookings
router.get(
  "/customer/:customerId",
  authenticateUser,
  async (req: AuthRequest, res) => {
    try {
      const { customerId } = req.params;

      if (req.user?.uid !== customerId) {
        return res.status(403).json({
          success: false,
          error: "Unauthorized",
        });
      }

      const bookings = await Booking.find({ customerId }).sort({
        createdAt: -1,
      });

      res.json({
        success: true,
        data: bookings,
      });
    } catch (error: any) {
      console.error("Error fetching bookings:", error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// Get provider's bookings
router.get(
  "/provider/:providerId",
  authenticateUser,
  async (req: AuthRequest, res) => {
    try {
      const { providerId } = req.params;

      if (req.user?.uid !== providerId) {
        return res.status(403).json({
          success: false,
          error: "Unauthorized",
        });
      }

      const bookings = await Booking.find({ providerId }).sort({
        createdAt: -1,
      });

      res.json({
        success: true,
        data: bookings,
      });
    } catch (error: any) {
      console.error("Error fetching bookings:", error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// Get single booking
router.get("/:bookingId", authenticateUser, async (req: AuthRequest, res) => {
  try {
    const { bookingId } = req.params;
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: "Booking not found",
      });
    }

    // Check authorization
    if (
      booking.customerId !== req.user?.uid &&
      booking.providerId !== req.user?.uid
    ) {
      return res.status(403).json({
        success: false,
        error: "Unauthorized",
      });
    }

    res.json({
      success: true,
      data: booking,
    });
  } catch (error: any) {
    console.error("Error fetching booking:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Update booking status
router.put(
  "/:bookingId/status",
  authenticateUser,
  async (req: AuthRequest, res) => {
    try {
      const { bookingId } = req.params;
      const { status } = req.body;

      const booking = await Booking.findById(bookingId);

      if (!booking) {
        return res.status(404).json({
          success: false,
          error: "Booking not found",
        });
      }

      // Authorization check
      if (
        booking.customerId !== req.user?.uid &&
        booking.providerId !== req.user?.uid
      ) {
        return res.status(403).json({
          success: false,
          error: "Unauthorized",
        });
      }

      booking.status = status;

      if (status === "completed") {
        booking.completedAt = new Date();
      }

      await booking.save();

      res.json({
        success: true,
        message: "Booking status updated",
        data: booking,
      });
    } catch (error: any) {
      console.error("Error updating booking:", error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// Cancel booking
router.put(
  "/:bookingId/cancel",
  authenticateUser,
  async (req: AuthRequest, res) => {
    try {
      const { bookingId } = req.params;
      const { reason } = req.body;

      const booking = await Booking.findById(bookingId);

      if (!booking) {
        return res.status(404).json({
          success: false,
          error: "Booking not found",
        });
      }

      const userId = req.user?.uid;
      let cancelledBy: "customer" | "provider";

      if (booking.customerId === userId) {
        cancelledBy = "customer";
      } else if (booking.providerId === userId) {
        cancelledBy = "provider";
      } else {
        return res.status(403).json({
          success: false,
          error: "Unauthorized",
        });
      }

      booking.status = "cancelled";
      booking.cancellationReason = reason;
      booking.cancelledBy = cancelledBy;
      booking.cancelledAt = new Date();

      await booking.save();

      res.json({
        success: true,
        message: "Booking cancelled",
        data: booking,
      });
    } catch (error: any) {
      console.error("Error cancelling booking:", error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

export default router;

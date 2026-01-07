import express from "express";
import { authenticateUser, AuthRequest } from "../middleware/authMiddleware";
import Booking from "../models/Booking";
import Customer from "../models/Customer";
import Notification from "../models/Notification"; // Add this import
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
      customerAttachedPhotos,
      serviceLocation,
    } = req.body;

    const customerId = req.user?.uid;

    // Validate location
    if (
      !serviceLocation ||
      !serviceLocation.latitude ||
      !serviceLocation.longitude
    ) {
      return res.status(400).json({
        success: false,
        error: "Service location is required",
      });
    }

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

    // Validate photos if provided
    if (customerAttachedPhotos) {
      if (!Array.isArray(customerAttachedPhotos)) {
        return res.status(400).json({
          success: false,
          error: "customerAttachedPhotos must be an array",
        });
      }

      if (customerAttachedPhotos.length > 5) {
        return res.status(400).json({
          success: false,
          error: "Maximum 5 photos allowed",
        });
      }

      // Validate base64 format
      const invalidPhotos = customerAttachedPhotos.filter(
        (photo: string) =>
          typeof photo !== "string" || !photo.startsWith("data:image/")
      );

      if (invalidPhotos.length > 0) {
        return res.status(400).json({
          success: false,
          error: "All photos must be valid base64 image strings",
        });
      }
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
      serviceAddress: serviceLocation.formattedAddress,
      serviceLocation,
      additionalNotes,
      customerAttachedPhotos: customerAttachedPhotos || [], // Added: Store photos
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

    // CREATE NOTIFICATION FOR PROVIDER
    try {
      await Notification.create({
        userId: providerId,
        title: "New Booking Request",
        message: `${
          customer.name
        } has requested a ${serviceType} booking for ${new Date(
          scheduledDate
        ).toLocaleDateString()} at ${timeSlot}`,
        type: "booking",
        relatedId: booking._id.toString(),
        read: false,
      });
    } catch (notifError) {
      console.error("Failed to create notification:", notifError);
    }

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
      const { status, actualHours } = req.body;

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

      const oldStatus = booking.status;
      booking.status = status;

      // ADD: Update actual hours and calculate final amount
      if (actualHours && status === "awaiting-customer-approval") {
        booking.pricing.actualHours = actualHours;
        const serviceFee = booking.pricing.hourlyRate * actualHours;
        booking.pricing.finalAmount = serviceFee + booking.pricing.platformFee;
      }

      // Update timeline based on status
      if (status === "confirmed" && !booking.timeline.confirmedAt) {
        booking.timeline.confirmedAt = new Date();
      } else if (status === "on-the-way" && !booking.timeline.startedTravelAt) {
        booking.timeline.startedTravelAt = new Date();
      } else if (status === "arrived" && !booking.timeline.arrivedAt) {
        booking.timeline.arrivedAt = new Date();
      } else if (status === "in-progress" && !booking.timeline.workStartedAt) {
        booking.timeline.workStartedAt = new Date();
      } else if (
        status === "awaiting-customer-approval" &&
        !booking.timeline.workCompletedAt
      ) {
        booking.timeline.workCompletedAt = new Date();
      } else if (status === "completed") {
        booking.completedAt = new Date();
        if (!booking.timeline.customerApprovedAt) {
          booking.timeline.customerApprovedAt = new Date();
        }
      }

      await booking.save();

      // CREATE NOTIFICATIONS FOR STATUS CHANGES
      try {
        const isProvider = booking.providerId === req.user?.uid;
        const notifyUserId = isProvider
          ? booking.customerId
          : booking.providerId;
        const notifyUserName = isProvider
          ? booking.providerDetails.name
          : booking.customerDetails.name;

        let notificationTitle = "Booking Status Updated";
        let notificationMessage = "";

        if (status === "confirmed") {
          notificationTitle = "Booking Confirmed";
          notificationMessage = `Your booking with ${notifyUserName} has been confirmed for ${new Date(
            booking.scheduledDate
          ).toLocaleDateString()} at ${booking.timeSlot}`;
        } else if (status === "in-progress") {
          notificationTitle = "Service Started";
          notificationMessage = `${notifyUserName} has started your service`;
        } else if (status === "awaiting-customer-approval") {
          notificationTitle = "Service Awaiting Approval";
          notificationMessage = `${notifyUserName} has marked the service as complete. Please review and approve`;
        } else if (status === "completed") {
          notificationTitle = "Service Completed";
          notificationMessage = `Your booking with ${notifyUserName} has been completed`;
        } else {
          notificationMessage = `Your booking status has been updated to ${status}`;
        }

        await Notification.create({
          userId: notifyUserId,
          title: notificationTitle,
          message: notificationMessage,
          type: status === "completed" ? "service" : "booking",
          relatedId: booking._id.toString(),
          read: false,
        });
      } catch (notifError) {
        console.error("Failed to create notification:", notifError);
      }

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

      // CREATE NOTIFICATION FOR CANCELLATION
      try {
        const isCustomer = cancelledBy === "customer";
        const notifyUserId = isCustomer
          ? booking.providerId
          : booking.customerId;
        const cancellerName = isCustomer
          ? booking.customerDetails.name
          : booking.providerDetails.name;

        await Notification.create({
          userId: notifyUserId,
          title: "Booking Cancelled",
          message: `${cancellerName} has cancelled the booking${
            reason ? `: ${reason}` : ""
          }`,
          type: "booking",
          relatedId: booking._id.toString(),
          read: false,
        });
      } catch (notifError) {
        console.error("Failed to create notification:", notifError);
      }

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

// Approve booking completion (customer only)
router.put(
  "/:bookingId/approve",
  authenticateUser,
  async (req: AuthRequest, res) => {
    try {
      const { bookingId } = req.params;

      const booking = await Booking.findById(bookingId);

      if (!booking) {
        return res.status(404).json({
          success: false,
          error: "Booking not found",
        });
      }

      // Only customer can approve
      if (booking.customerId !== req.user?.uid) {
        return res.status(403).json({
          success: false,
          error: "Only customer can approve completion",
        });
      }

      // Check if booking is awaiting approval
      if (booking.status !== "awaiting-customer-approval") {
        return res.status(400).json({
          success: false,
          error: "Booking is not awaiting approval",
        });
      }

      // Update booking status to completed
      booking.status = "completed";
      if (!booking.timeline) {
        booking.timeline = {
          bookedAt: booking.createdAt || new Date(),
        };
      }
      booking.timeline.customerApprovedAt = new Date();

      await booking.save();

      // CREATE NOTIFICATION FOR PROVIDER
      try {
        await Notification.create({
          userId: booking.providerId,
          title: "Service Approved",
          message: `${booking.customerDetails.name} has approved the completion of the service`,
          type: "service",
          relatedId: booking._id.toString(),
          read: false,
        });
      } catch (notifError) {
        console.error("Failed to create notification:", notifError);
      }

      res.json({
        success: true,
        message: "Booking approved successfully",
        data: booking,
      });
    } catch (error: any) {
      console.error("Error approving booking:", error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// Dispute booking (customer only)
router.put(
  "/:bookingId/dispute",
  authenticateUser,
  async (req: AuthRequest, res) => {
    try {
      const { bookingId } = req.params;
      const { reason, description } = req.body;

      if (!reason || !description) {
        return res.status(400).json({
          success: false,
          error: "Reason and description are required",
        });
      }

      const booking = await Booking.findById(bookingId);

      if (!booking) {
        return res.status(404).json({
          success: false,
          error: "Booking not found",
        });
      }

      // Only customer can dispute
      if (booking.customerId !== req.user?.uid) {
        return res.status(403).json({
          success: false,
          error: "Only customer can dispute a booking",
        });
      }

      // Check if booking is in a disputable state
      if (
        booking.status !== "awaiting-customer-approval" &&
        booking.status !== "completed"
      ) {
        return res.status(400).json({
          success: false,
          error: "Booking cannot be disputed at this stage",
        });
      }

      // Update booking with dispute
      booking.status = "disputed";
      booking.dispute = {
        reason,
        description,
        raisedBy: "customer",
        raisedAt: new Date(),
        status: "open",
      };

      await booking.save();

      //  CREATE NOTIFICATION FOR PROVIDER ABOUT DISPUTE
      try {
        await Notification.create({
          userId: booking.providerId,
          title: "Booking Disputed",
          message: `${booking.customerDetails.name} has raised a dispute for the booking`,
          type: "booking",
          relatedId: booking._id.toString(),
          read: false,
        });
      } catch (notifError) {
        console.error("Failed to create notification:", notifError);
      }

      res.json({
        success: true,
        message: "Dispute raised successfully",
        data: booking,
      });
    } catch (error: any) {
      console.error("Error disputing booking:", error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

router.post(
  "/:bookingId/work-documentation",
  authenticateUser,
  async (req: AuthRequest, res) => {
    try {
      const { bookingId } = req.params;
      const { beforePhotos, afterPhotos, workNotes } = req.body;

      const booking = await Booking.findById(bookingId);

      if (!booking) {
        return res.status(404).json({
          success: false,
          error: "Booking not found",
        });
      }

      // Only provider can add work documentation
      if (booking.providerId !== req.user?.uid) {
        return res.status(403).json({
          success: false,
          error: "Only provider can add work documentation",
        });
      }

      // Initialize workDocumentation if it doesn't exist
      if (!booking.workDocumentation) {
        booking.workDocumentation = {
          beforePhotos: [],
          afterPhotos: [],
        };
      }

      // Update work documentation
      if (beforePhotos && Array.isArray(beforePhotos)) {
        booking.workDocumentation.beforePhotos = [
          ...booking.workDocumentation.beforePhotos,
          ...beforePhotos,
        ];
      }

      if (afterPhotos && Array.isArray(afterPhotos)) {
        booking.workDocumentation.afterPhotos = [
          ...booking.workDocumentation.afterPhotos,
          ...afterPhotos,
        ];
      }

      if (workNotes) {
        booking.workDocumentation.workNotes = workNotes;
      }

      await booking.save();

      res.json({
        success: true,
        message: "Work documentation updated",
        data: booking,
      });
    } catch (error: any) {
      console.error("Error updating work documentation:", error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

export default router;

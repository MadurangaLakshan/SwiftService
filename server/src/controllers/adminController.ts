import express from "express";
import Booking from "../models/Booking";
import Provider from "../models/Provider";

// PATCH /admin/providers/:providerId/verify
export const adminUpdateProviderStatus = async (
  req: express.Request,
  res: express.Response,
) => {
  try {
    const { providerId } = req.params;
    const { verified } = req.body;

    const provider = await Provider.findByIdAndUpdate(
      providerId,
      { verified },
      { new: true },
    );

    if (!provider) {
      return res
        .status(404)
        .json({ success: false, error: "Provider not found" });
    }

    res.json({
      success: true,
      message: `Provider ${verified ? "verified" : "unverified"} successfully`,
      data: provider,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET /admin/providers - all providers (for pending approvals etc.)
export const adminGetAllProviders = async (
  req: express.Request,
  res: express.Response,
) => {
  try {
    const providers = await Provider.find().sort({ createdAt: -1 });
    res.json({ success: true, data: providers });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ─── DISPUTE MANAGEMENT ─────────────────────────────────────────────────────

// GET /admin/disputes - all bookings with status "disputed"
export const getAllDisputes = async (
  req: express.Request,
  res: express.Response,
) => {
  try {
    const disputes = await Booking.find({ status: "disputed" }).sort({
      updatedAt: -1,
    });
    res.json({ success: true, data: disputes });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// PATCH /admin/disputes/:bookingId/resolve
export const resolveDispute = async (
  req: express.Request,
  res: express.Response,
) => {
  try {
    const { bookingId } = req.params;
    const { action, adminNote, refundCustomer, suspendProvider } = req.body;
    // action: "resolve" | "reject" | "escalate"

    const disputeStatus = action === "escalate" ? "escalated" : "resolved";

    const bookingStatus = action === "escalate" ? "disputed" : "completed";

    const booking = await Booking.findByIdAndUpdate(
      bookingId,
      {
        "dispute.status": disputeStatus,
        "dispute.adminNote": adminNote || "",
        "dispute.resolvedAt": new Date(),
        "dispute.refundIssued": refundCustomer || false,
        "dispute.providerSuspended": suspendProvider || false,
        status: bookingStatus,
      },
      { new: true },
    );

    if (!booking) {
      return res
        .status(404)
        .json({ success: false, error: "Booking not found" });
    }

    // Optionally suspend provider account
    if (suspendProvider) {
      await Provider.findOneAndUpdate(
        { userId: booking.providerId },
        { isActive: false },
      );
    }

    res.json({
      success: true,
      message: `Dispute ${disputeStatus} successfully`,
      data: booking,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

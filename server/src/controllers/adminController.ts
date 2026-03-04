import express from "express";
import Booking from "../models/Booking";
import Provider from "../models/Provider";

// GET /admin/providers - all providers
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

// PATCH /admin/providers/:providerId/verify
// body: { verified: boolean, status?: "rejected" }
export const adminUpdateProviderStatus = async (
  req: express.Request,
  res: express.Response,
) => {
  try {
    const { providerId } = req.params;
    const { verified, status } = req.body;

    const updatePayload: any = { verified };
    if (status) updatePayload.status = status; // "rejected" | "active" etc.

    const provider = await Provider.findByIdAndUpdate(
      providerId,
      updatePayload,
      { new: true },
    );

    if (!provider) {
      return res
        .status(404)
        .json({ success: false, error: "Provider not found" });
    }

    res.json({
      success: true,
      message: verified
        ? "Provider verified successfully"
        : status === "rejected"
          ? "Provider rejected"
          : "Provider unverified",
      data: provider,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET /admin/disputes
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

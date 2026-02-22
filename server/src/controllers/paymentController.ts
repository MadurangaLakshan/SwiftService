import { Response } from "express";
import Stripe from "stripe";
import { AuthRequest } from "../middleware/authMiddleware";
import Booking from "../models/Booking";

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-12-15.clover",
  typescript: true,
});

interface CreatePaymentIntentBody {
  bookingId: string;
  amount: number;
}

interface ConfirmPaymentBody {
  paymentIntentId: string;
  bookingId: string;
}

export async function createPaymentIntent(req: AuthRequest, res: Response) {
  try {
    const { bookingId, amount } = req.body as CreatePaymentIntentBody;
    const userUid = req.user?.uid;

    if (!userUid) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      });
    }

    // Validate booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: "Booking not found",
      });
    }

    // Verify customer owns this booking (using Firebase UID)
    if (booking.customerId !== userUid) {
      return res.status(403).json({
        success: false,
        error: "Unauthorized - Not your booking",
      });
    }

    // Verify booking is completed and not already paid
    if (booking.status !== "completed") {
      return res.status(400).json({
        success: false,
        error: "Booking must be completed before payment",
      });
    }

    if (booking.paymentCompleted) {
      return res.status(400).json({
        success: false,
        error: "Payment already completed for this booking",
      });
    }

    // Calculate amount (Stripe uses smallest currency unit)
    const finalAmount =
      booking.pricing.finalAmount || booking.pricing.totalAmount;
    const amountInCents = Math.round(finalAmount * 100);

    // Validate amount
    if (amountInCents < 100) {
      // Minimum 1.00 LKR/USD
      return res.status(400).json({
        success: false,
        error: "Amount too small. Minimum is 1.00",
      });
    }

    // Create Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: "lkr", // Change to "usd" if needed
      metadata: {
        bookingId: booking._id.toString(),
        customerId: booking.customerId,
        providerId: booking.providerId,
        serviceType: booking.serviceType,
        customerEmail: booking.customerDetails.email,
      },
      description: `${booking.serviceType} - ${booking.category}`,
      receipt_email: booking.customerDetails.email,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // Update booking with payment info
    booking.payment = {
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret!,
      status: "pending",
      amount: finalAmount,
      currency: "lkr",
      createdAt: new Date().toISOString(),
    };
    await booking.save();

    console.log(
      `✅ Payment intent created: ${paymentIntent.id} for booking ${bookingId}`,
    );

    return res.json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: finalAmount,
      },
    });
  } catch (error: any) {
    console.error("❌ Create payment intent error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to create payment intent",
    });
  }
}

export async function confirmPayment(req: AuthRequest, res: Response) {
  try {
    const { paymentIntentId, bookingId } = req.body as ConfirmPaymentBody;
    const userUid = req.user?.uid;

    if (!userUid) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      });
    }

    // Validate booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: "Booking not found",
      });
    }

    // Verify customer owns this booking
    if (booking.customerId !== userUid) {
      return res.status(403).json({
        success: false,
        error: "Unauthorized - Not your booking",
      });
    }

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === "succeeded") {
      // Update booking payment status
      booking.paymentCompleted = true;
      booking.payment = {
        ...booking.payment,
        paymentIntentId: paymentIntent.id,
        status: "completed",
        completedAt: new Date().toISOString(),
      };
      await booking.save();

      console.log(`✅ Payment confirmed for booking ${bookingId}`);

      // TODO: Implement these in your system
      // 1. Release payment to provider (escrow logic)
      // 2. Send notification to provider
      // 3. Update provider's earnings
      // 4. Send receipt email to customer

      // Get Socket.IO instance to send real-time notification
      const io = (req as any).app.get("io");
      if (io) {
        // Notify provider
        io.to(booking.providerId).emit("payment_received", {
          bookingId: booking._id,
          amount: booking.payment.amount,
          customerName: booking.customerDetails.name,
        });

        // Notify customer
        io.to(booking.customerId).emit("payment_confirmed", {
          bookingId: booking._id,
          amount: booking.payment.amount,
          status: "completed",
        });
      }

      return res.json({
        success: true,
        message: "Payment confirmed successfully",
        data: {
          bookingId: booking._id,
          paymentStatus: "completed",
          amount: booking.payment.amount,
        },
      });
    } else if (paymentIntent.status === "requires_payment_method") {
      return res.status(400).json({
        success: false,
        error: "Payment method required",
      });
    } else if (paymentIntent.status === "canceled") {
      if (booking.payment) {
        booking.payment.status = "failed";
        await booking.save();
      }

      return res.status(400).json({
        success: false,
        error: "Payment was canceled",
      });
    } else {
      return res.status(400).json({
        success: false,
        error: `Payment status: ${paymentIntent.status}`,
      });
    }
  } catch (error: any) {
    console.error("❌ Confirm payment error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to confirm payment",
    });
  }
}

export async function getPaymentStatus(req: AuthRequest, res: Response) {
  try {
    const { bookingId } = req.params;
    const userUid = req.user?.uid;

    if (!userUid) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: "Booking not found",
      });
    }

    // Allow both customer and provider to check status
    if (booking.customerId !== userUid && booking.providerId !== userUid) {
      return res.status(403).json({
        success: false,
        error: "Unauthorized",
      });
    }

    return res.json({
      success: true,
      data: {
        paymentCompleted: booking.paymentCompleted || false,
        payment: booking.payment || null,
      },
    });
  } catch (error: any) {
    console.error("❌ Get payment status error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to get payment status",
    });
  }
}

export async function handleStripeWebhook(req: AuthRequest, res: Response) {
  const sig = req.headers["stripe-signature"] as string;
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err: any) {
    console.error("⚠️ Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log(`📩 Webhook received: ${event.type}`);

  // Handle the event
  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const bookingId = paymentIntent.metadata.bookingId;

        if (bookingId) {
          const booking = await Booking.findById(bookingId);
          if (booking && !booking.paymentCompleted) {
            booking.paymentCompleted = true;
            booking.payment = {
              ...booking.payment,
              paymentIntentId: paymentIntent.id,
              status: "completed",
              completedAt: new Date().toISOString(),
            };
            await booking.save();

            console.log(
              `✅ Webhook: Payment succeeded for booking ${bookingId}`,
            );
          }
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const failedPayment = event.data.object as Stripe.PaymentIntent;
        const failedBookingId = failedPayment.metadata.bookingId;

        if (failedBookingId) {
          const booking = await Booking.findById(failedBookingId);
          if (booking && booking.payment) {
            booking.payment.status = "failed";
            await booking.save();

            console.log(
              `❌ Webhook: Payment failed for booking ${failedBookingId}`,
            );
          }
        }
        break;
      }

      case "payment_intent.canceled": {
        const canceledPayment = event.data.object as Stripe.PaymentIntent;
        const canceledBookingId = canceledPayment.metadata.bookingId;

        if (canceledBookingId) {
          const booking = await Booking.findById(canceledBookingId);
          if (booking && booking.payment) {
            booking.payment.status = "failed";
            await booking.save();

            console.log(
              `⚠️ Webhook: Payment canceled for booking ${canceledBookingId}`,
            );
          }
        }
        break;
      }

      default:
        console.log(`ℹ️ Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error: any) {
    console.error("❌ Webhook processing error:", error);
    res.status(500).json({ error: "Webhook processing failed" });
  }
}

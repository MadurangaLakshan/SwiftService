import { Router } from "express";
import * as paymentController from "../controllers/paymentController";
import { authenticateUser } from "../middleware/authMiddleware";

const router = Router();

//Create payment intent
router.post(
  "/create-payment-intent",
  authenticateUser,
  paymentController.createPaymentIntent,
);

//Confirm payment
router.post(
  "/confirm-payment",
  authenticateUser,
  paymentController.confirmPayment,
);

//Get Payment Status
router.get(
  "/status/:bookingId",
  authenticateUser,
  paymentController.getPaymentStatus,
);

//Handle Stripe webhooks
router.post("/webhook", paymentController.handleStripeWebhook);

export default router;

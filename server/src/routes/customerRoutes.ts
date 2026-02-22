import express from "express";
import * as customerController from "../controllers/customerController";
import { authenticateUser } from "../middleware/authMiddleware";

const router = express.Router();

// Register a new customer
router.post("/register", authenticateUser, customerController.registerCustomer);

// Authenticate customer and get profile
router.get(
  "/:userId",
  authenticateUser,
  customerController.authenticateCustomer,
);

// Update customer profile
router.put(
  "/:userId",
  authenticateUser,
  customerController.updateCustomerProfile,
);

// Delete customer profile
router.delete("/:userId", authenticateUser, customerController.deleteCustomer);

export default router;

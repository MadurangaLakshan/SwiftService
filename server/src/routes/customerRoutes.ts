import express from "express";
import { authenticateUser, AuthRequest } from "../middleware/authMiddleware";
import Customer from "../models/Customer";
import User from "../models/User";

const router = express.Router();

router.post("/register", authenticateUser, async (req: AuthRequest, res) => {
  try {
    const { userId, name, email, phone, location, propertyType } = req.body;

    if (req.user?.uid !== userId) {
      return res.status(403).json({
        success: false,
        error: "Unauthorized",
      });
    }

    const existingCustomer = await Customer.findOne({ userId });
    if (existingCustomer) {
      return res.status(400).json({
        success: false,
        error: "Customer profile already exists",
      });
    }

    if (!name || !email || !phone || !location || !propertyType) {
      return res.status(400).json({
        success: false,
        error:
          "Missing required fields: name, email, phone, location, propertyType",
      });
    }

    await User.findOneAndUpdate(
      { userId },
      { userId, email, userType: "customer" },
      { upsert: true, new: true }
    );

    const customer = new Customer({
      userId,
      name,
      email,
      phone,
      location,
      propertyType,
      profilePhoto: req.body.profilePhoto || "",
    });

    await customer.save();

    res.status(201).json({
      success: true,
      message: "Customer registered successfully",
      data: customer,
    });
  } catch (error: any) {
    console.error("Customer registration error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

router.get("/:userId", authenticateUser, async (req: AuthRequest, res) => {
  try {
    const customer = await Customer.findOne({ userId: req.params.userId });

    if (!customer) {
      console.log("Customer not found for userId:", req.params.userId);
      return res.status(404).json({
        success: false,
        error: "Customer not found",
        code: "CUSTOMER_NOT_FOUND",
      });
    }

    console.log("Customer found:", customer.userId);

    res.json(customer);
  } catch (error: any) {
    console.error(" Error fetching customer:", error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: "SERVER_ERROR",
    });
  }
});

router.put("/:userId", authenticateUser, async (req: AuthRequest, res) => {
  try {
    if (req.user?.uid !== req.params.userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const customer = await Customer.findOneAndUpdate(
      { userId: req.params.userId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }

    res.json({ message: "Customer updated successfully", customer });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/:userId", authenticateUser, async (req: AuthRequest, res) => {
  try {
    if (req.user?.uid !== req.params.userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const customer = await Customer.findOneAndUpdate(
      { userId: req.params.userId },
      { isActive: false },
      { new: true }
    );

    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }

    res.json({ message: "Customer account deactivated" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

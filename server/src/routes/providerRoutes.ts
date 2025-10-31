import express from "express";
import { authenticateUser, AuthRequest } from "../middleware/authMiddleware";
import Provider from "../models/Provider";
import User from "../models/User";

const router = express.Router();

router.post("/register", authenticateUser, async (req: AuthRequest, res) => {
  try {
    const {
      userId,
      name,
      email,
      phone,
      services,
      customServices,
      yearsExperience,
      businessName,
      licenseNumber,
      hourlyRate,
      bio,
      location,
      profilePhoto,
    } = req.body;

    if (req.user?.uid !== userId) {
      return res.status(403).json({
        success: false,
        error: "Unauthorized",
      });
    }

    const existingProvider = await Provider.findOne({ userId });
    if (existingProvider) {
      return res.status(400).json({
        success: false,
        error: "Provider profile already exists",
      });
    }

    // Validate required fields
    if (
      !name ||
      !email ||
      !phone ||
      !services ||
      !location ||
      !hourlyRate ||
      yearsExperience === undefined
    ) {
      return res.status(400).json({
        success: false,
        error:
          "Missing required fields: name, email, phone, services, location, hourlyRate, yearsExperience",
      });
    }

    // Update or create User document
    await User.findOneAndUpdate(
      { userId },
      { userId, email, userType: "provider" },
      { upsert: true, new: true }
    );

    // Create provider with all data from request
    const provider = new Provider({
      userId,
      name,
      email,
      phone,
      services,
      customServices: customServices || [],
      yearsExperience,
      businessName,
      licenseNumber,
      hourlyRate,
      bio,
      location,
      profilePhoto: profilePhoto || "",
    });

    await provider.save();

    res.status(201).json({
      success: true,
      message: "Provider registered successfully",
      data: provider,
    });
  } catch (error: any) {
    console.error("Provider registration error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

router.get("/:userId", authenticateUser, async (req: AuthRequest, res) => {
  try {
    const provider = await Provider.findOne({ userId: req.params.userId });

    if (!provider) {
      console.log("Provider not found for userId:", req.params.userId);
      return res.status(404).json({
        success: false,
        error: "Provider not found",
        code: "PROVIDER_NOT_FOUND",
      });
    }

    console.log("Provider found:", provider.userId);
    res.json(provider);
  } catch (error: any) {
    console.error("Error fetching provider:", error);
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
      return res.status(403).json({
        success: false,
        error: "Unauthorized",
      });
    }

    const provider = await Provider.findOneAndUpdate(
      { userId: req.params.userId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!provider) {
      return res.status(404).json({
        success: false,
        error: "Provider not found",
      });
    }

    res.json({
      success: true,
      message: "Provider updated successfully",
      data: provider,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

router.delete("/:userId", authenticateUser, async (req: AuthRequest, res) => {
  try {
    if (req.user?.uid !== req.params.userId) {
      return res.status(403).json({
        success: false,
        error: "Unauthorized",
      });
    }

    const provider = await Provider.findOneAndUpdate(
      { userId: req.params.userId },
      { isActive: false },
      { new: true }
    );

    if (!provider) {
      return res.status(404).json({
        success: false,
        error: "Provider not found",
      });
    }

    res.json({
      success: true,
      message: "Provider account deactivated",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

router.get("/", authenticateUser, async (req: AuthRequest, res) => {
  try {
    const { service, city } = req.query;

    let query: any = { isActive: true };

    if (service) {
      query.$or = [{ services: service }, { customServices: service }];
    }

    if (city) {
      query["location.city"] = city;
    }

    const providers = await Provider.find(query).sort({ rating: -1 });
    res.json(providers);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;

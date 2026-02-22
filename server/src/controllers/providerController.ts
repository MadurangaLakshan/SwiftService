import express from "express";
import { AuthRequest } from "../middleware/authMiddleware";
import Provider from "../models/Provider";
import Review from "../models/Review";
import User from "../models/User";

export const registerProvider = async (
  req: AuthRequest,
  res: express.Response,
) => {
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

    await User.findOneAndUpdate(
      { userId },
      { userId, email, userType: "provider" },
      { upsert: true, new: true },
    );

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
};

export async function getProviderById(
  req: express.Request,
  res: express.Response,
) {
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
}

export async function getAllProviders(
  req: express.Request,
  res: express.Response,
) {
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
}

export async function getProviderReviews(
  req: express.Request,
  res: express.Response,
) {
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
      {
        $group: {
          _id: "$rating",
          count: { $sum: 1 },
        },
      },
    ]);

    const breakdown = {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0,
    };

    ratingBreakdown.forEach((item) => {
      breakdown[item._id as keyof typeof breakdown] = item.count;
    });

    res.json({
      success: true,
      data: {
        reviews,
        total,
        breakdown,
      },
    });
  } catch (error: any) {
    console.error("Get reviews error:", error);
    res.status(500).json({ error: error.message });
  }
}

export const updateProvider = async (
  req: AuthRequest,
  res: express.Response,
) => {
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
      { new: true, runValidators: true },
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
};

export const deleteProvider = async (
  req: AuthRequest,
  res: express.Response,
) => {
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
      { new: true },
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
};

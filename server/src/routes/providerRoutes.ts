import express from "express";
import { authenticateUser, AuthRequest } from "../middleware/authMiddleware";
import Provider from "../models/Provider";

const router = express.Router();

router.post("/register", authenticateUser, async (req: AuthRequest, res) => {
  try {
    const { userId } = req.body;

    if (req.user?.uid !== userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const existingProvider = await Provider.findOne({ userId });
    if (existingProvider) {
      return res.status(400).json({ error: "Provider already exists" });
    }

    const provider = new Provider(req.body);
    await provider.save();

    res.status(201).json({
      message: "Provider registered successfully",
      provider,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/:userId", authenticateUser, async (req: AuthRequest, res) => {
  try {
    const provider = await Provider.findOne({ userId: req.params.userId });

    if (!provider) {
      return res.status(404).json({ error: "Provider not found" });
    }

    res.json(provider);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put("/:userId", authenticateUser, async (req: AuthRequest, res) => {
  try {
    if (req.user?.uid !== req.params.userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const provider = await Provider.findOneAndUpdate(
      { userId: req.params.userId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!provider) {
      return res.status(404).json({ error: "Provider not found" });
    }

    res.json({ message: "Provider updated", provider });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
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
    res.status(500).json({ error: error.message });
  }
});

export default router;

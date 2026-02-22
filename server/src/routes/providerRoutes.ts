import express from "express";
import * as providerController from "../controllers/providerController";
import { authenticateUser } from "../middleware/authMiddleware";
const router = express.Router();

//Register a new provider
router.post("/register", authenticateUser, providerController.registerProvider);

//Get all providers
router.get("/", providerController.getAllProviders);

//Get provider by userId
router.get("/:userId", providerController.getProviderById);

//Get provider reviews
router.get("/:providerId/reviews", providerController.getProviderReviews);

//Update provider profile
router.put("/:userId", authenticateUser, providerController.updateProvider);

//Delete provider profile
router.delete("/:userId", authenticateUser, providerController.deleteProvider);

export default router;

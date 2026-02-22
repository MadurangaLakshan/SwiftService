import express from "express";
import * as userController from "../controllers/userController";

const router = express.Router();

//Get user type and their profile data
router.get("/type/:userId", userController.getUserType);

export default router;

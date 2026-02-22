import express from "express";
import Customer from "../models/Customer";
import Provider from "../models/Provider";

export async function getUserType(req: express.Request, res: express.Response) {
  try {
    const { userId } = req.params;

    const provider = await Provider.findOne({ userId });
    if (provider) {
      return res.json({
        success: true,
        userType: "provider",
        userData: provider,
      });
    }

    const customer = await Customer.findOne({ userId });
    if (customer) {
      return res.json({
        success: true,
        userType: "customer",
        userData: customer,
      });
    }

    res.status(404).json({
      success: false,
      error: "User profile not found",
    });
  } catch (error: any) {
    console.error("Error fetching user type:", error);
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
}

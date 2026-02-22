import { Request, Response } from "express";
import Provider from "../models/Provider"; // adjust path if needed
import { analyzeCustomerIssue } from "../services/aiService";

export async function chatbotAnalyze(req: Request, res: Response) {
  try {
    const { message, imagesBase64, city } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    //Analyze with Gemini (use first image for analysis)
    const primaryImage =
      imagesBase64 && imagesBase64.length > 0 ? imagesBase64[0] : undefined;
    const analysis = await analyzeCustomerIssue(message, primaryImage);

    // Step 2: Build query for MongoDB
    const query: any = {
      services: analysis.serviceType,
    };

    // Add location filter if provided
    if (city) {
      query["location.city"] = { $regex: new RegExp(city, "i") };
    }

    //Query MongoDB for matching service providers
    const providers = await Provider.find(query)
      .sort({ rating: -1, totalJobs: -1 })
      .limit(5)
      .select(
        "name rating profilePhoto services hourlyRate totalReviews location.city businessName yearsExperience",
      );

    //Return results
    return res.json({
      success: true,
      analysis: {
        issue: analysis.explanation,
        serviceNeeded: analysis.serviceType,
        urgency: analysis.urgency,
      },
      recommendedProviders: providers,
    });
  } catch (error) {
    console.error("AI Chatbot Error:", error);
    return res.status(500).json({
      error: "Failed to analyze issue",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

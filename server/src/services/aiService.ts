import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

interface AIAnalysisResult {
  serviceType: string;
  explanation: string;
  urgency: "low" | "medium" | "high";
  keywords: string[];
}

export async function analyzeCustomerIssue(
  customerMessage: string,
  imageBase64?: string,
): Promise<AIAnalysisResult> {
  console.log("=== ANALYZE CUSTOMER ISSUE ===");
  console.log("Message:", customerMessage);
  console.log("Has image:", !!imageBase64);
  if (imageBase64) {
    console.log("Image base64 length:", imageBase64.length);
  }

  const systemPrompt = `You are an AI assistant for a tradesmen booking platform. 
Analyze the customer's issue and respond ONLY with valid JSON in this exact format:
{
  "serviceType": "one of: plumber, electrician, carpenter, painter, hvac, locksmith, cleaner, gardener",
  "explanation": "A friendly 1-2 sentence explanation of what the issue is",
  "urgency": "low, medium, or high",
  "keywords": ["keyword1", "keyword2"]
}

IMPORTANT: The serviceType must be EXACTLY one of these lowercase values:
- plumber (for plumbing, pipes, leaks, drains, water issues)
- electrician (for electrical, wiring, outlets, lights, power issues)
- carpenter (for woodwork, doors, floors, furniture, structural wood issues)
- painter (for painting, decorating, walls, ceilings)
- hvac (for heating, cooling, air conditioning, ventilation, boilers, radiators)
- locksmith (for locks, keys, security, doors that won't open)
- cleaner (for cleaning services)
- gardener (for garden, lawn, landscaping, outdoor maintenance)

Be concise and helpful. Don't include any text outside the JSON.`;

  const contents = imageBase64
    ? [
        { type: "text", text: systemPrompt },
        { type: "text", text: customerMessage },
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: imageBase64,
          },
        },
      ]
    : [
        { type: "text", text: systemPrompt },
        { type: "text", text: customerMessage },
      ];

  console.log("Calling Gemini API...");

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: contents,
    });

    console.log("✅ Gemini API response received");
    const responseText = response.text;
    console.log("Raw response:", responseText);

    if (!responseText) {
      console.error("❌ No response text from Gemini");
      throw new Error("No response received from AI model");
    }

    const cleanedResponse = responseText
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    console.log("Cleaned response:", cleanedResponse);

    const parsed = JSON.parse(cleanedResponse);
    console.log("✅ Parsed result:", parsed);

    return parsed;
  } catch (error) {
    console.error("❌ Error in analyzeCustomerIssue:", error);
    throw error;
  }
}

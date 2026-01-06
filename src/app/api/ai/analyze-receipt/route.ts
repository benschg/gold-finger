import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@/lib/supabase/server";
import { RATE_LIMITS } from "@/lib/rate-limit";
import { applyRateLimit } from "@/lib/api-helpers";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || "");
const IMAGE_FETCH_TIMEOUT_MS = 15000; // 15 seconds

interface ReceiptAnalysis {
  amount?: number;
  currency?: string;
  date?: string;
  description?: string;
  merchant?: string;
  category?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limiting - strict limit for expensive AI operations
    const rateLimitError = applyRateLimit(request, user.id, RATE_LIMITS.strict);
    if (rateLimitError) return rateLimitError;

    // Check if API key is configured
    if (!process.env.GOOGLE_AI_API_KEY) {
      return NextResponse.json(
        { error: "AI service not configured" },
        { status: 503 }
      );
    }

    const { imageUrl } = await request.json();

    if (!imageUrl) {
      return NextResponse.json(
        { error: "Image URL is required" },
        { status: 400 }
      );
    }

    // Fetch the image with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), IMAGE_FETCH_TIMEOUT_MS);

    let imageResponse: Response;
    try {
      imageResponse = await fetch(imageUrl, { signal: controller.signal });
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError instanceof Error && fetchError.name === "AbortError") {
        return NextResponse.json(
          { error: "Image fetch timed out" },
          { status: 408 }
        );
      }
      throw fetchError;
    }
    clearTimeout(timeoutId);

    if (!imageResponse.ok) {
      return NextResponse.json(
        { error: "Failed to fetch image" },
        { status: 400 }
      );
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString("base64");
    const mimeType = imageResponse.headers.get("content-type") || "image/jpeg";

    // Use Gemini to analyze the receipt
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Analyze this receipt image and extract the following information. Return ONLY a valid JSON object with these fields:
{
  "amount": <number - the total amount paid, as a decimal number without currency symbol>,
  "currency": "<string - the currency code like EUR, USD, GBP, CHF, etc.>",
  "date": "<string - the date in YYYY-MM-DD format>",
  "description": "<string - a brief description of what was purchased>",
  "merchant": "<string - the store or business name>",
  "category": "<string - one of: Food & Dining, Shopping, Transportation, Entertainment, Utilities, Healthcare, Travel, Education, Other>"
}

If you cannot determine a field, omit it from the JSON. Return only the JSON object, no additional text.`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType,
          data: base64Image,
        },
      },
    ]);

    const responseText = result.response.text();

    // Parse the JSON response
    let analysis: ReceiptAnalysis = {};
    try {
      // Extract JSON from response (handle potential markdown code blocks)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      }
    } catch {
      console.error("Failed to parse AI response:", responseText);
    }

    return NextResponse.json(analysis);
  } catch (error) {
    console.error("AI analysis error:", error);
    return NextResponse.json(
      { error: "Failed to analyze receipt" },
      { status: 500 }
    );
  }
}

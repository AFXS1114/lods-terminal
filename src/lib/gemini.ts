
'use client';

import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

export interface AiBookingAssistantInput {
  pickupAddress: string;
  deliveryAddress: string;
  itemDescription: string;
}

export interface AiBookingAssistantOutput {
  packageType: string;
  estimatedWeightKg: number;
  recommendedDeliveryWindow: string;
}

export async function aiBookingAssistant(input: AiBookingAssistantInput): Promise<AiBookingAssistantOutput> {
  const prompt = `You are an intelligent booking assistant for "Lean On Delivery Services" (LODS).
Your task is to analyze the provided booking details and suggest optimal values for package type, estimated weight, and a recommended delivery window.

Pickup Address: ${input.pickupAddress}
Delivery Address: ${input.deliveryAddress}
Item Description: ${input.itemDescription}

Provide the output in valid JSON format only, with these keys: packageType, estimatedWeightKg, recommendedDeliveryWindow.
- packageType: Choose "Small Parcel", "Document", "Medium Box", or "Large Crate".
- estimatedWeightKg: Provide a number.
- recommendedDeliveryWindow: Suggest a window like "Same Day", "Next Day", or "2-3 Days".`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    const cleanText = text.replace(/```json|```/g, "").trim();
    return JSON.parse(cleanText) as AiBookingAssistantOutput;
  } catch (error) {
    console.error("Gemini AI Error:", error);
    throw new Error("AI Assistant failed to generate suggestions.");
  }
}

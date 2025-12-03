
import { GoogleGenAI, Type } from "@google/genai";
import { AppData, DailyLog, DietRecommendation } from "../types";

// Initialize the Gemini AI client
// Note: API_KEY is injected by the environment
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Analyzes food text for breakfast, lunch, and dinner to estimate total calories.
 */
export const analyzeFoodCalories = async (
  breakfast: string,
  lunch: string,
  dinner: string
): Promise<number | null> => {
  if (!breakfast && !lunch && !dinner) return null;

  try {
    const prompt = `
      User's Daily Meals:
      Breakfast: ${breakfast || "Skipped"}
      Lunch: ${lunch || "Skipped"}
      Dinner: ${dinner || "Skipped"}

      Task: 
      1. Estimate the calories for each meal based on typical serving sizes if not specified.
      2. Sum them up for a daily total.
      3. Return a rough integer estimate.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            totalCalories: {
              type: Type.NUMBER,
              description: "The estimated total calories (integer).",
            },
            reasoning: {
              type: Type.STRING,
              description: "Brief explanation of the calculation.",
            },
          },
          required: ["totalCalories"],
        },
      },
    });

    const result = JSON.parse(response.text || "{}");
    return result.totalCalories || null;

  } catch (error) {
    console.error("Failed to analyze calories:", error);
    return null;
  }
};

/**
 * Generates a personalized diet tip based on user profile, recent logs, and time of day.
 */
export const getDietRecommendation = async (
  profile: AppData['profile'],
  logs: AppData['logs']
): Promise<DietRecommendation | null> => {
  try {
    // 1. Prepare Context
    const currentHour = new Date().getHours();
    const sortedDates = Object.keys(logs).sort().reverse(); // Newest first
    const lastLog = sortedDates.length > 0 ? logs[sortedDates[0]] : null;
    const todayStr = new Date().toISOString().split('T')[0];

    // Calculate current weight
    let currentWeight = profile.startWeight;
    if (lastLog && lastLog.weight) {
      currentWeight = lastLog.weight;
    }

    const prompt = `
      You are Momo, a cute, encouraging, and professional diet coach for girls.
      
      User Profile:
      - Name: ${profile.name}
      - Current Weight: ${currentWeight}kg
      - Target Weight: ${profile.targetWeight}kg
      
      Recent Context:
      - Last logged meal (Date: ${lastLog?.id || 'None'}): 
        Breakfast: ${lastLog?.breakfast || 'Empty'}, 
        Lunch: ${lastLog?.lunch || 'Empty'}, 
        Dinner: ${lastLog?.dinner || 'Empty'}
      - Current Time: ${currentHour}:00

      Task:
      Provide a specific, helpful, and cute diet tip or encouragement relevant to the *current time of day*.
      
      Guidelines:
      - If it's morning (5-10), focus on protein/metabolism.
      - If it's noon (11-14), focus on satiety/balance.
      - If it's afternoon (15-17), focus on healthy snacks/water.
      - If it's evening (18-20), focus on light dinner/digestion.
      - If it's late night (21+), advise against snacking/sleep early.
      - Tone: Cute, use emojis, friendly (like a bestie).
      - Language: Chinese (Simplified).

      Output JSON Schema:
      {
        "icon": "A single emoji representing the tip",
        "title": "Short catchy title (max 10 chars)",
        "text": "The advice body (max 50 words)"
      }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            icon: { type: Type.STRING },
            title: { type: Type.STRING },
            text: { type: Type.STRING },
          },
          required: ["icon", "title", "text"],
        },
      },
    });

    const result = JSON.parse(response.text || "{}");
    if (result.title && result.text) {
      return {
          ...result,
          date: todayStr
      } as DietRecommendation;
    }
    return null;

  } catch (error) {
    console.error("Failed to get diet recommendation:", error);
    return null;
  }
};

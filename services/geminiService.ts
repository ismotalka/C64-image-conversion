import { GoogleGenAI } from "@google/genai";

// We use a lazy initialization to ensure process.env is ready if needed
let ai: GoogleGenAI | null = null;

const getAI = () => {
  if (!ai) {
    if (!process.env.API_KEY) {
      console.warn("API_KEY is missing from environment variables.");
      throw new Error("API Key is missing. Please configure it.");
    }
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
  return ai;
};

export const analyzeRetroImage = async (base64Image: string, systemName: string): Promise<string> => {
  try {
    const client = getAI();
    // Remove data:image/png;base64, prefix if present for the API call
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");

    const prompt = `I have converted an image to the style of the ${systemName}. 
    Please analyze this image content and describe how a user from that era (e.g., 1980s or early 1990s) might describe this "game graphic" or "digital art". 
    Be creative, roleplay a bit as a magazine reviewer from that time. Keep it under 100 words.`;

    const response = await client.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
            {
                inlineData: {
                    mimeType: "image/png",
                    data: base64Data
                }
            },
            {
                text: prompt
            }
        ]
      }
    });

    return response.text || "No analysis available.";
  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    return "Could not retrieve analysis from the mainframe. Communication link severed.";
  }
};

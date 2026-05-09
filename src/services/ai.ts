import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function getEmbedding(text: string) {
  try {
    const result = await ai.models.embedContent({
      model: "gemini-embedding-2-preview",
      contents: [ text ],
    });
    return result.embeddings?.[0]?.values;
  } catch (error) {
    console.error("Embedding error:", error);
    return null;
  }
}

export async function getCostRecommendation(moduleTitle: string, historicalData: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are a professional software architect. Based on the historical data of modules:
${historicalData}

Recommend a cost range (min, avg, max) for a new module titled: "${moduleTitle}".
Return the result in JSON format with keys: min, avg, max, and explanation.`,
      config: {
        responseMimeType: "application/json",
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("AI Recommendation error:", error);
    return null;
  }
}

export async function analyzeSimilarity(query: string, modules: any[]) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `User is searching for: "${query}".
Here is a list of existing modules:
${JSON.stringify(modules.map(m => ({ id: m.id, title: m.title })), null, 2)}

Identify the top 3 most relevant modules based on semantic meaning and synonyms.
Return a JSON array of IDs.`,
      config: {
        responseMimeType: "application/json",
      }
    });

    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("AI Similarity analysis error:", error);
    return [];
  }
}

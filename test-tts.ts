import { GoogleGenAI, Modality } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function test() {
  try {
    const promptPayload = [
        "Transforme o conteúdo fornecido em um podcast curto",
        "Texto adicional: Hello world",
    ];
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: promptPayload as any,
    });
    console.log("Success:", response.text);
  } catch (e) {
    console.error("Error:", e);
  }
}
test();

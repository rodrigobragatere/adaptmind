import { GoogleGenAI, Schema, Modality, Chat } from "@google/genai";

// Ensure API Key is available safely (handles browser environments where process is undefined)
const apiKey =
  typeof process !== "undefined" && process.env
    ? process.env.GEMINI_API_KEY || process.env.API_KEY || ""
    : "";

if (!apiKey) {
  console.warn("API Key is missing. Ensure process.env.GEMINI_API_KEY is set.");
} else {
  console.log("API Key found (length:", apiKey.length, ")");
}

export const ai = new GoogleGenAI({ apiKey });

// Modelo atualizado para melhor performance
const MODEL_NAME = "gemini-3-flash-preview";

export const ensurePaidApiKey = async (): Promise<boolean> => {
  if (typeof window !== "undefined" && (window as any).aistudio) {
    const hasKey = await (window as any).aistudio.hasSelectedApiKey();
    if (!hasKey) {
      try {
        await (window as any).aistudio.openSelectKey();
        return true; // Assume success/race condition handling
      } catch (e) {
        console.error("Failed to select API key", e);
        return false;
      }
    }
    return true;
  }
  return true; // Fallback for environments without aistudio injection
};

/**
 * Cria uma sessão de Chat persistente.
 * Isso permite que a IA lembre do contexto das mensagens anteriores.
 */
export const createChatSession = (systemInstruction: string): Chat => {
  return ai.chats.create({
    model: MODEL_NAME,
    config: {
      systemInstruction: systemInstruction,
    },
  });
};

/**
 * Gera uma instrução de sistema altamente adaptada ao perfil cognitivo do usuário.
 * Isso garante que todas as respostas da IA respeitem as necessidades neurológicas específicas.
 */
export const generateAdaptiveSystemInstruction = (
  baseRole: string,
  cognitiveProfile?: string,
): string => {
  const baseInstruction = `Você é o AdaptMind, ${baseRole}. Seu objetivo é ensinar de forma inclusiva e eficaz. Responda sempre em Português do Brasil.`;

  if (!cognitiveProfile) {
    return `${baseInstruction} Use uma linguagem clara, direta e estruturada.`;
  }

  return `${baseInstruction}
  
  CONTEXTO VITAL - PERFIL NEUROCOGNITIVO DO ALUNO:
  "${cognitiveProfile}"

  DIRETRIZES DE ADAPTAÇÃO ESTRITA:
  1. Se o perfil indicar TDAH: Use frases curtas, listas (bullet points), negrito em palavras-chave e evite parágrafos longos. Quebre tarefas em micro-passos.
  2. Se o perfil indicar Dislexia: Evite palavras complexas desnecessárias, use formatação espaçada e estrutura muito lógica.
  3. Se o perfil indicar Ansiedade: Seja extremamente encorajador, evite pressão de tempo e divida grandes desafios em partes pequenas e seguras.
  4. Se o perfil indicar Autismo/TEA: Seja literal, evite metáforas ambíguas (a menos que seja o exercício de analogias), use estrutura previsível e lógica.
  
  Adapte TODO o seu output (tom, formatação, extensão) para este perfil específico.`;
};

export const callGeminiText = async (
  prompt: string,
  systemInstruction: string = "",
): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
      },
    });
    return response.text || "Sem resposta da IA.";
  } catch (error) {
    console.error("Gemini Text Error:", error);
    return "Desculpe, ocorreu um erro ao processar seu pedido. Tente novamente.";
  }
};

export const callGeminiJSON = async <T>(
  prompt: string | any[],
  systemInstruction: string = "",
  schema?: Schema,
): Promise<T | null> => {
  try {
    const formattedContents = Array.isArray(prompt)
      ? { parts: prompt.map((p) => (typeof p === "string" ? { text: p } : p)) }
      : prompt;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: formattedContents,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });

    let text = response.text || "";

    // EXTRATOR JSON ROBUSTO:
    // Procura o primeiro '[' ou '{' e o último ']' ou '}'
    // Isso ignora textos introdutórios como "Aqui está o JSON:"
    const firstOpenBracket = text.indexOf("[");
    const firstOpenBrace = text.indexOf("{");
    const lastCloseBracket = text.lastIndexOf("]");
    const lastCloseBrace = text.lastIndexOf("}");

    let start = -1;
    let end = -1;

    // Determina se é array ou objeto baseado no que aparece primeiro
    if (
      firstOpenBracket !== -1 &&
      (firstOpenBrace === -1 || firstOpenBracket < firstOpenBrace)
    ) {
      start = firstOpenBracket;
      end = lastCloseBracket;
    } else if (firstOpenBrace !== -1) {
      start = firstOpenBrace;
      end = lastCloseBrace;
    }

    if (start !== -1 && end !== -1) {
      text = text.substring(start, end + 1);
    }

    // Tenta parsear
    try {
      return JSON.parse(text) as T;
    } catch (e) {
      console.warn(
        "Falha no parse JSON direto, tentando limpar markdown...",
        e,
      );
      // Fallback: limpeza básica se o substring falhar por algum motivo
      text = text
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();
      return JSON.parse(text) as T;
    }
  } catch (error) {
    console.error("Gemini JSON Error:", error);
    return null;
  }
};

/**
 * Gera áudio neural realista (estilo NotebookLM) usando gemini-2.5-flash-preview-tts
 */
export const generateNeuralAudio = async (
  script: { speaker: string; text: string }[],
) => {
  try {
    // Formata o script para o prompt. IMPORTANTE: Enviar APENAS o diálogo para o modelo de TTS.
    let dialogue =
      "TTS the following conversation between Alex and Bia:\n" +
      script.map((line) => `${line.speaker}: ${line.text}`).join("\n");

    // Limite preventivo de caracteres (aproximadamente 3000-4000 é o seguro para o modelo de preview)
    if (dialogue.length > 3500) {
      console.warn("Dialogue too long, trimming to 3500 chars");
      dialogue = dialogue.substring(0, 3500) + "...";
    }

    if (!dialogue.trim()) {
      console.error("Dialogue is empty after formatting script:", script);
      return null;
    }

    let response;
    try {
      response = await ai.models.generateContent({
        model: "gemini-3.1-flash-tts-preview",
        contents: [{ parts: [{ text: dialogue }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            multiSpeakerVoiceConfig: {
              speakerVoiceConfigs: [
                {
                  speaker: "Alex",
                  voiceConfig: { prebuiltVoiceConfig: { voiceName: "Fenrir" } },
                },
                {
                  speaker: "Bia",
                  voiceConfig: { prebuiltVoiceConfig: { voiceName: "Kore" } },
                },
              ],
            },
          },
        },
      });
    } catch (multiSpeakerError) {
      console.warn(
        "Multi-speaker failed, falling back to single speaker:",
        multiSpeakerError,
      );
      response = await ai.models.generateContent({
        model: "gemini-3.1-flash-tts-preview",
        contents: [{ parts: [{ text: dialogue }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
          },
        },
      });
    }

    // Retorna o base64 do áudio e o mimeType
    const inlineData =
      response.candidates?.[0]?.content?.parts?.[0]?.inlineData;
    if (!inlineData || !inlineData.data) {
      console.error(
        "API Response structure invalid or no audio data. Parts check:",
        response.candidates?.[0]?.content?.parts?.map((p: any) => Object.keys(p)),
      );
      return null;
    }

    console.log("Audio data received, length:", inlineData.data.length, "mimeType:", inlineData.mimeType);
    return { data: inlineData.data, mimeType: inlineData.mimeType || "audio/pcm;rate=24000" };
  } catch (error) {
    console.error("Neural Audio Error:", error);
    throw error;
  }
};

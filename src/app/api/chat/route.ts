import { NextResponse } from "next/server";
import { getAIPersonalityPrompt } from "@/lib/ai/aiPersonality";
import { GEMINI_MODEL_LITE, GEMINI_API_BASE_URL } from "@/lib/config/constants";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function POST(req: Request) {
  try {
    const { messages, documentName, documentText, model } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not configured in the environment variables." },
        { status: 500 }
      );
    }

    const contents = messages.map((m: ChatMessage) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const selectedModel = model || GEMINI_MODEL_LITE;

    const response = await fetch(
      `${GEMINI_API_BASE_URL}/${selectedModel}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents,
          systemInstruction: {
            parts: [
              {
                text: getAIPersonalityPrompt(documentName, documentText),
              },
            ],
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Gemini API error:", errorData);
      return NextResponse.json(
        { error: errorData.error?.message || "Failed to communicate with Gemini API." },
        { status: response.status }
      );
    }

    const data = await response.json();
    const assistantText = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response received.";

    return NextResponse.json({ text: assistantText });
  } catch (error: unknown) {
    console.error("Chat API handler error:", error);
    const errMessage = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: errMessage }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { GEMINI_MODEL_LITE, GEMINI_API_BASE_URL } from "@/lib/config/constants";

export async function POST(req: Request) {
  try {
    const { documentName, documentText } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not configured in the environment variables." },
        { status: 500 }
      );
    }

    const previewText = documentText ? documentText.slice(0, 12000) : "";

    const response = await fetch(
      `${GEMINI_API_BASE_URL}/${GEMINI_MODEL_LITE}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `Analyze this document named "${documentName}" and extract a 2-3 sentence executive summary and 3 to 5 key tags/topics. 
                  
                  Document text:
                  \"\"\"
                  ${previewText}
                  \"\"\"`
                }
              ]
            }
          ],
          systemInstruction: {
            parts: [
              {
                text: "You are a professional document analysis assistant. You must output a JSON object containing two keys: 'summary' (a 2-3 sentence executive summary) and 'tags' (an array of 3 to 5 strings representing categories or topics)."
              }
            ]
          },
          generationConfig: {
            responseMimeType: "application/json"
          }
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Gemini API error in summarization:", errorData);
      return NextResponse.json(
        { error: errorData.error?.message || "Failed to communicate with Gemini API." },
        { status: response.status }
      );
    }

    const data = await response.json();
    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!resultText) {
      return NextResponse.json({ summary: "No summary generated.", tags: ["Document"] });
    }

    const parsed = JSON.parse(resultText);
    return NextResponse.json({
      summary: parsed.summary || "No executive summary available.",
      tags: parsed.tags || ["General"]
    });

  } catch (error: unknown) {
    console.error("Summarization API error:", error);
    return NextResponse.json(
      { summary: "Failed to generate summary.", tags: ["Document"] },
      { status: 200 }
    );
  }
}

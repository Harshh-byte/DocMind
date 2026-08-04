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

    const previewText = documentText ? documentText.slice(0, 150000) : "";

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
                  text: `Create an engaging, lively 2-host audio overview podcast script discussing the document named "${documentName}". 
                  
                  Hosts:
                  - Adam: Male host. Calm, structured, steady, and informative.
                  - Sarah: Female co-host. Breezy, curious, engaging, and conversational.
                  
                  Guidelines:
                  - The conversation must be natural and sound like two people casually explaining and discussing the core concepts of the document.
                  - Keep the dialogue snappy, with quick back-and-forth turns.
                  - Generate a comprehensive, deep, and detailed discussion that covers the entire document fully. Do NOT restrict the length or turns (it can be as long as needed to thoroughly explain all aspects of the document).
                  - Ground the entire discussion strictly in the document content.
                  
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
                text: "You are a professional podcast scriptwriter. You must output a JSON array where each element is an object with two keys: 'speaker' (must be exactly 'Adam' or 'Sarah') and 'text' (the spoken dialogue line)."
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
      console.error("Gemini API error in podcast generation:", errorData);
      return NextResponse.json(
        { error: errorData.error?.message || "Failed to communicate with Gemini API." },
        { status: response.status }
      );
    }

    const data = await response.json();
    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!resultText) {
      return NextResponse.json({ error: "No script generated." }, { status: 500 });
    }

    const parsed = JSON.parse(resultText);
    return NextResponse.json({ script: parsed });

  } catch (error: any) {
    console.error("Podcast generation API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate podcast script." },
      { status: 500 }
    );
  }
}

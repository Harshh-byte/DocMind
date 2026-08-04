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

    const previewText = documentText ? documentText.slice(0, 25000) : "";

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
                  text: `Analyze the document named "${documentName}" and generate a hierarchical, conceptual mind map representation of its contents.
                  
                  Guidelines:
                  - The mind map should have a single root node representing the central topic of the document.
                  - Root node should have 3 to 5 primary branches (children).
                  - Each branch should have 2 to 4 detailed leaves (sub-children).
                  - Keep node names short, concise, and clear (1 to 4 words max).
                  
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
                text: "You are a professional concept mapper. You must output a JSON object representing a tree. The object must have a 'name' key (string) and a 'children' key (an optional array of objects matching the same node structure recursively)."
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
      console.error("Gemini API error in mindmap generation:", errorData);
      return NextResponse.json(
        { error: errorData.error?.message || "Failed to communicate with Gemini API." },
        { status: response.status }
      );
    }

    const data = await response.json();
    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!resultText) {
      return NextResponse.json({ error: "No mind map generated." }, { status: 500 });
    }

    const parsed = JSON.parse(resultText);
    return NextResponse.json({ mindMap: parsed });

  } catch (error: any) {
    console.error("Mind map generation API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate mind map." },
      { status: 500 }
    );
  }
}

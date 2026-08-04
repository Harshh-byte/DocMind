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
                  text: `Analyze the document named "${documentName}" and generate interactive study aids.
                  
                  Requirements:
                  1. Generate exactly 5 study flashcards (Question/Answer pairs).
                  2. Generate exactly 5 multiple choice quiz questions (Question, list of 4 options, 0-indexed correct option index, and a brief explanation).
                  
                  Guidelines:
                  - Focus on key facts, definitions, themes, and takeaways in the document.
                  - Ensure the questions are clear and options are distinct.
                  
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
                text: "You are a professional academic curriculum designer. You must output a JSON object containing two keys: 'flashcards' (an array of objects, each with 'question' and 'answer' strings) and 'quiz' (an array of objects, each with 'question' string, 'options' array of 4 strings, 'correctOption' integer 0-3, and 'explanation' string)."
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
      console.error("Gemini API error in quizzes generation:", errorData);
      return NextResponse.json(
        { error: errorData.error?.message || "Failed to communicate with Gemini API." },
        { status: response.status }
      );
    }

    const data = await response.json();
    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!resultText) {
      return NextResponse.json({ error: "No quizzes generated." }, { status: 500 });
    }

    const parsed = JSON.parse(resultText);
    return NextResponse.json({ studyData: parsed });

  } catch (error: any) {
    console.error("Quizzes generation API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate quizzes." },
      { status: 500 }
    );
  }
}

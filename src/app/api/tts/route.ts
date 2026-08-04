import { NextResponse } from "next/server";
import { GEMINI_MODEL_TTS, GEMINI_API_BASE_URL } from "@/lib/config/constants";

function cleanTextForTTS(text: string): string {
  if (!text) return "";
  
  return text
    .replace(/\[Page \d+(?:,\s*Line \d+)?\]/gi, "")
    .replace(/\*\*|__|\*|_/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function getWavHeader(dataLength: number, sampleRate: number = 24000): Buffer {
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(dataLength + 36, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); 
  header.writeUInt16LE(1, 22); 
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28); 
  header.writeUInt16LE(2, 32); 
  header.writeUInt16LE(16, 34); 
  header.write("data", 36);
  header.writeUInt32LE(dataLength, 40);
  return header;
}

export async function POST(req: Request) {
  try {
    const { text, voiceId } = await req.json();

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not configured in the environment variables." },
        { status: 500 }
      );
    }

    const cleanedText = cleanTextForTTS(text);
    if (!cleanedText) {
      return NextResponse.json({ error: "Cleaned text is empty" }, { status: 400 });
    }

    let selectedVoice = "Aoede";
    if (voiceId) {
      const validVoices = ["Aoede", "Charon", "Fenrir", "Kore"];
      if (validVoices.includes(voiceId)) {
        selectedVoice = voiceId;
      }
    }

    const response = await fetch(
      `${GEMINI_API_BASE_URL}/${GEMINI_MODEL_TTS}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: cleanedText }]
            }
          ],
          generationConfig: {
            responseModalities: ["audio"],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: selectedVoice
                }
              }
            }
          }
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Gemini TTS API error:", errorData);
      return NextResponse.json(
        { error: errorData.error?.message || "Failed to communicate with Gemini API." },
        { status: response.status }
      );
    }

    const data = await response.json();
    const part = data.candidates?.[0]?.content?.parts?.[0];
    const base64Audio = part?.inlineData?.data;
    
    if (!base64Audio) {
      return NextResponse.json({ error: "No audio data received from Gemini API." }, { status: 500 });
    }

    const rawAudioBuffer = Buffer.from(base64Audio, "base64");
    
    
    let sampleRate = 24000;
    const mimeType = part?.inlineData?.mimeType || "";
    const rateMatch = mimeType.match(/rate=(\d+)/);
    if (rateMatch && rateMatch[1]) {
      sampleRate = parseInt(rateMatch[1], 10);
    }

    const wavHeader = getWavHeader(rawAudioBuffer.length, sampleRate);
    const wavBuffer = Buffer.concat([wavHeader, rawAudioBuffer]);

    return new NextResponse(wavBuffer, {
      headers: {
        "Content-Type": "audio/wav",
        "Content-Length": wavBuffer.byteLength.toString(),
      },
    });
  } catch (error: unknown) {
    console.error("Gemini TTS API handler error:", error);
    const errMessage = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: errMessage }, { status: 500 });
  }
}

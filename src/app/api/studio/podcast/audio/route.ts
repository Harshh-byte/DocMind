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

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = 5,
  delay = 2000,
): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    const response = await fetch(url, options);
    if (response.status === 429) {
      let retryAfter = delay * Math.pow(2, i);
      try {
        const clonedRes = response.clone();
        const data = await clonedRes.json();
        const seconds = parseFloat(
          data?.error?.message?.match(/retry in ([\d.]+)s/i)?.[1],
        );
        if (!isNaN(seconds)) {
          retryAfter = (seconds + 0.5) * 1000;
        }
      } catch (_) {}
      await new Promise((resolve) => setTimeout(resolve, retryAfter));
      continue;
    }
    return response;
  }
  return fetch(url, options);
}

export async function POST(req: Request) {
  try {
    const { script } = await req.json();

    if (!script || !Array.isArray(script)) {
      return NextResponse.json(
        { error: "Script array is required" },
        { status: 400 },
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not configured." },
        { status: 500 },
      );
    }

    const limit = 4;
    const results: Buffer[] = new Array(script.length);
    const tasks = script.map((line, idx) => async () => {
      const voiceId = line.speaker === "Adam" ? "Charon" : "Aoede";
      const cleaned = cleanTextForTTS(line.text);
      if (!cleaned) {
        results[idx] = Buffer.alloc(0);
        return;
      }

      const response = await fetchWithRetry(
        `${GEMINI_API_BASE_URL}/${GEMINI_MODEL_TTS}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: cleaned }] }],
            generationConfig: {
              responseModalities: ["audio"],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: voiceId },
                },
              },
            },
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Gemini TTS API error in podcast compilation:", errorData);
        if (response.status === 429 || errorData?.error?.code === 429) {
          throw new Error("The AI voice discussion is temporarily unavailable. Please try again later.");
        }
        results[idx] = Buffer.alloc(0);
        return;
      }

      const data = await response.json();
      const base64Audio = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      results[idx] = base64Audio ? Buffer.from(base64Audio, "base64") : Buffer.alloc(0);
    });

    const executing = new Set<Promise<void>>();
    for (const task of tasks) {
      const p = task().then(() => {
        executing.delete(p);
      });
      executing.add(p);
      if (executing.size >= limit) {
        await Promise.race(executing);
      }
    }
    await Promise.all(executing);

    const combinedPcm = Buffer.concat(results);

    const wavHeader = getWavHeader(combinedPcm.length);
    const finalWav = Buffer.concat([wavHeader, combinedPcm]);

    return new Response(finalWav, {
      headers: {
        "Content-Type": "audio/wav",
        "Content-Disposition": 'attachment; filename="audio-overview.wav"',
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to compile podcast audio." },
      { status: 500 },
    );
  }
}

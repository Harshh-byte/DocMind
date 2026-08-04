import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not configured on the server." },
        { status: 500 }
      );
    }

    return NextResponse.json({ key: apiKey });
  } catch (error: any) {
    console.error("Error in gemini-token API route:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { z } from "zod";

const requestSchema = z.object({
  prompt: z.string().min(1),
});

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export async function POST(request: Request) {
  if (!OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not configured on the server." },
      { status: 500 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Request must include a non-empty prompt." },
      { status: 400 },
    );
  }

  const prompt = parsed.data.prompt;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content:
              "You are a ScoutX assistant. Help the user write clear mission requests, summarize local scouting needs, and provide practical guidance for requesting information from on-the-ground scouts.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 500,
        temperature: 0.75,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: "OpenAI request failed.", details: errorText },
        { status: response.status },
      );
    }

    const data = await response.json();
    const message = data?.choices?.[0]?.message?.content ?? "No response received from OpenAI.";

    return NextResponse.json({ message });
  } catch (error) {
    return NextResponse.json(
      { error: "Unable to reach OpenAI.", details: String(error) },
      { status: 500 },
    );
  }
}

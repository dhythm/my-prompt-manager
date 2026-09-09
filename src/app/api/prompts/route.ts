import { NextResponse } from "next/server";
import { getDb } from "@/server/db/client";
import {
  isValidationError,
  parseCreatePromptInput,
} from "@/server/prompts/input";
import { createPrompt, listPrompts } from "@/server/prompts/repository";
import { serializePrompt } from "@/server/prompts/serialize";

export async function GET() {
  try {
    const db = await getDb();
    const prompts = await listPrompts(db);
    return NextResponse.json({ prompts: prompts.map(serializePrompt) });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to load prompts" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const json: unknown = await request.json();
    const input = parseCreatePromptInput(json);
    const db = await getDb();
    const prompt = await createPrompt(db, input);

    return NextResponse.json(
      { prompt: serializePrompt(prompt) },
      { status: 201 },
    );
  } catch (error) {
    if (isValidationError(error)) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Request body must be valid JSON" },
        { status: 400 },
      );
    }

    console.error(error);
    return NextResponse.json(
      { error: "Failed to create prompt" },
      { status: 500 },
    );
  }
}

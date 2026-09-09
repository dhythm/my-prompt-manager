import { NextResponse } from "next/server";
import {
  isConflictError,
  isForbiddenError,
  isNotFoundError,
} from "@/server/errors";
import { isValidationError } from "@/server/prompts/input";
import { isTeamInputError } from "@/server/teams/input";

export function errorResponse(error: unknown, fallback: string) {
  if (isValidationError(error) || isTeamInputError(error)) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  if (isForbiddenError(error)) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }
  if (isNotFoundError(error)) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }
  if (isConflictError(error)) {
    return NextResponse.json({ error: error.message }, { status: 409 });
  }
  if (error instanceof SyntaxError) {
    return NextResponse.json(
      { error: "Request body must be valid JSON" },
      { status: 400 },
    );
  }
  console.error(error);
  return NextResponse.json({ error: fallback }, { status: 500 });
}

export function unauthorized() {
  return NextResponse.json(
    { error: "Authentication required" },
    { status: 401 },
  );
}

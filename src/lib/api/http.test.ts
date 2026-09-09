import { afterEach, describe, expect, it, vi } from "vitest";
import { getJson, isHttpError } from "./http";

describe("getJson", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns parsed JSON for a successful response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(JSON.stringify({ prompts: [] }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }),
      ),
    );

    await expect(
      getJson<{ prompts: unknown[] }>("/api/prompts"),
    ).resolves.toEqual({
      prompts: [],
    });
  });

  it("uses the JSON error field from a failed response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(JSON.stringify({ error: "タイトルは必須です" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }),
      ),
    );

    try {
      await getJson("/api/prompts");
      throw new Error("expected getJson to throw");
    } catch (error) {
      expect(isHttpError(error)).toBe(true);
      if (isHttpError(error)) {
        expect(error.status).toBe(400);
        expect(error.message).toBe("タイトルは必須です");
      }
    }
  });

  it("throws an HttpError for a non-2xx response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("database unavailable", { status: 500 })),
    );

    try {
      await getJson("/api/prompts");
      throw new Error("expected getJson to throw");
    } catch (error) {
      expect(isHttpError(error)).toBe(true);
      if (isHttpError(error)) {
        expect(error.status).toBe(500);
        expect(error.message).toBe("database unavailable");
      }
    }
  });
});

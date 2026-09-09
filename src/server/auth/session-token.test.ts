import { describe, expect, it } from "vitest";
import { createSessionToken, verifySessionToken } from "./session-token";

const secret = "test-secret";
const userId = "00000000-0000-4000-8000-000000000001";

describe("session token", () => {
  it("round-trips a user id", () => {
    const token = createSessionToken(userId, secret, 1_000);
    expect(verifySessionToken(token, secret, 1_000)).toBe(userId);
  });

  it("rejects a tampered token", () => {
    const token = createSessionToken(userId, secret, 1_000);
    expect(verifySessionToken(`${token}x`, secret, 1_000)).toBeUndefined();
  });

  it("rejects a token signed with a different secret", () => {
    const token = createSessionToken(userId, secret, 1_000);
    expect(verifySessionToken(token, "other-secret", 1_000)).toBeUndefined();
  });

  it("rejects an expired token", () => {
    const token = createSessionToken(userId, secret, 1_000);
    expect(
      verifySessionToken(token, secret, 1_000 + 1000 * 60 * 60 * 24 * 15),
    ).toBeUndefined();
  });
});

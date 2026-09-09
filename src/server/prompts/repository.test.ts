import { afterEach, describe, expect, it } from "vitest";
import { createPgliteDatabase } from "@/server/db/pglite";
import { prompts } from "@/server/db/schema";
import { createPrompt, listPrompts } from "./repository";

describe("prompts repository", () => {
  const databases: Array<{ close: () => Promise<void> }> = [];

  afterEach(async () => {
    await Promise.all(databases.splice(0).map((database) => database.close()));
  });

  it("returns an empty list when no prompts exist", async () => {
    const db = await openDatabase();
    await expect(listPrompts(db)).resolves.toEqual([]);
  });

  it("inserts a prompt and returns it with an id", async () => {
    const db = await openDatabase();

    const created = await createPrompt(db, {
      title: "Greeting",
      body: "Hello",
    });

    expect(created.id).toBeTruthy();
    expect(created.title).toBe("Greeting");
    await expect(listPrompts(db)).resolves.toEqual([created]);
  });

  it("lists prompts newest first", async () => {
    const db = await openDatabase();
    const older = new Date("2026-01-01T00:00:00.000Z");
    const newer = new Date("2026-01-02T00:00:00.000Z");

    await db.insert(prompts).values([
      { title: "Old", body: "Older body", createdAt: older, updatedAt: older },
      { title: "New", body: "Newer body", createdAt: newer, updatedAt: newer },
    ]);

    const listed = await listPrompts(db);
    expect(listed.map((prompt) => prompt.title)).toEqual(["New", "Old"]);
  });

  async function openDatabase() {
    const db = await createPgliteDatabase();
    databases.push({ close: () => db.$client.close() });
    return db;
  }
});

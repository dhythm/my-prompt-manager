import { afterEach, describe, expect, it } from "vitest";
import {
  DUMMY_DEFAULT_USER_ID,
  ensureDummyUsers,
} from "@/server/auth/dummy/users";
import { createPgliteDatabase } from "@/server/db/pglite";
import { createPrompt, listPrompts } from "@/server/prompts/repository";
import { samplePromptCatalog } from "@/server/prompts/samples";
import { runDbSeed } from "./seed-cli";

describe("runDbSeed", () => {
  const databases: Array<{ close: () => Promise<void> }> = [];

  afterEach(async () => {
    await Promise.all(databases.splice(0).map((database) => database.close()));
  });

  it("refuses Clerk instead of writing", async () => {
    await expect(
      runDbSeed({
        env: {
          AUTH_PROVIDER: "clerk",
          NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_x",
          CLERK_SECRET_KEY: "sk_test_x",
          DATABASE_DRIVER: "pglite",
          PGLITE_DATA_DIR: ":memory:",
        },
        reset: false,
      }),
    ).rejects.toThrow(/dummy auth/i);
  });

  it("skips when the catalog is not empty", async () => {
    const db = await createPgliteDatabase();
    databases.push({ close: () => db.$client.close() });
    await ensureDummyUsers(db);
    const created = await createPrompt(db, DUMMY_DEFAULT_USER_ID, {
      title: "Keep me",
      body: "existing",
    });
    const result = await runDbSeed({
      env: { DATABASE_DRIVER: "pglite" },
      reset: false,
      db,
    });
    expect(result).toEqual({ status: "skipped" });
    const listed = await listPrompts(db, DUMMY_DEFAULT_USER_ID);
    expect(listed.map((prompt) => prompt.id)).toEqual([created.id]);
  });

  it("reset replaces existing prompts with sample ids", async () => {
    const db = await createPgliteDatabase();
    databases.push({ close: () => db.$client.close() });
    await ensureDummyUsers(db);
    await createPrompt(db, DUMMY_DEFAULT_USER_ID, {
      title: "Keep me",
      body: "existing",
    });
    const result = await runDbSeed({
      env: { DATABASE_DRIVER: "pglite" },
      reset: true,
      db,
    });
    expect(result).toEqual({ status: "reset" });
    const listed = await listPrompts(db, DUMMY_DEFAULT_USER_ID);
    expect(listed.map((prompt) => prompt.id)).toEqual(
      samplePromptCatalog.map((sample) => sample.id),
    );
  });
});

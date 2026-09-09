import { afterEach, describe, expect, it } from "vitest";
import { createPgliteDatabase } from "@/server/db/pglite";
import { getCurrentUserFromToken } from "../current-user";
import { createSessionToken } from "../session-token";
import {
  DUMMY_DEFAULT_USER_ID,
  dummyUsers,
  ensureDummyUsers,
  findDummyUserByEmail,
  listDummyUsers,
} from "./users";

describe("dummy users", () => {
  const databases: Array<{ close: () => Promise<void> }> = [];

  afterEach(async () => {
    await Promise.all(databases.splice(0).map((database) => database.close()));
  });

  it("seeds stable dummy accounts", async () => {
    const db = await openDatabase();
    await ensureDummyUsers(db);

    const users = await listDummyUsers(db);
    expect(users.map((user) => user.email)).toEqual([
      "agent@local.test",
      "dev@local.test",
    ]);
    expect(users[0]?.id).toBe(DUMMY_DEFAULT_USER_ID);
  });

  it("is idempotent", async () => {
    const db = await openDatabase();
    await ensureDummyUsers(db);
    await ensureDummyUsers(db);
    await expect(listDummyUsers(db)).resolves.toHaveLength(dummyUsers.length);
  });

  it("finds a dummy user by email", async () => {
    const db = await openDatabase();
    await ensureDummyUsers(db);
    await expect(
      findDummyUserByEmail(db, "dev@local.test"),
    ).resolves.toMatchObject({
      name: "Developer",
    });
  });

  it("resolves the current user from a dummy session token", async () => {
    const db = await openDatabase();
    await ensureDummyUsers(db);
    const token = createSessionToken(
      DUMMY_DEFAULT_USER_ID,
      "test-secret",
      1_000,
    );

    await expect(
      getCurrentUserFromToken(
        token,
        db,
        {
          provider: "dummy",
          secret: "test-secret",
          autoSignIn: true,
        },
        1_000,
      ),
    ).resolves.toEqual({
      id: DUMMY_DEFAULT_USER_ID,
      email: "agent@local.test",
      name: "Agent",
    });
  });

  async function openDatabase() {
    const db = await createPgliteDatabase();
    databases.push({ close: () => db.$client.close() });
    return db;
  }
});

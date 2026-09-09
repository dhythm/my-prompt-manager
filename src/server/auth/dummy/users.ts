import { eq } from "drizzle-orm";
import type { SessionUser } from "@/lib/auth/types";
import { users } from "@/server/db/schema";
import type { AppDatabase } from "@/server/db/types";

export const dummyUsers = [
  {
    id: "00000000-0000-4000-8000-000000000001",
    email: "agent@local.test",
    name: "Agent",
  },
  {
    id: "00000000-0000-4000-8000-000000000002",
    email: "dev@local.test",
    name: "Developer",
  },
] as const;

export const DUMMY_DEFAULT_USER_ID = dummyUsers[0].id;

export async function ensureDummyUsers(db: AppDatabase) {
  await db
    .insert(users)
    .values(
      dummyUsers.map((user) => ({
        ...user,
        provider: "dummy",
      })),
    )
    .onConflictDoNothing();
}

export async function listDummyUsers(db: AppDatabase): Promise<SessionUser[]> {
  const records = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
    })
    .from(users)
    .where(eq(users.provider, "dummy"))
    .orderBy(users.email);

  return records;
}

export async function findDummyUserById(
  db: AppDatabase,
  userId: string,
): Promise<SessionUser | undefined> {
  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return user;
}

export async function findDummyUserByEmail(
  db: AppDatabase,
  email: string,
): Promise<SessionUser | undefined> {
  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
    })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  return user;
}

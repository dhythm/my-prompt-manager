import { cookies } from "next/headers";
import type { SessionUser } from "@/lib/auth/types";
import { getDb } from "@/server/db/client";
import type { AppDatabase } from "@/server/db/types";
import { DUMMY_DEFAULT_USER_ID, findDummyUserById } from "./dummy/users";
import { type AuthConfig, resolveAuthConfig } from "./env";
import {
  SESSION_COOKIE_NAME,
  SIGNED_OUT_COOKIE_NAME,
  verifySessionToken,
} from "./session-token";

export async function getCurrentUser(): Promise<SessionUser | undefined> {
  const config = resolveAuthConfig(process.env);
  const cookieStore = await cookies();
  if (cookieStore.get(SIGNED_OUT_COOKIE_NAME)?.value) {
    return undefined;
  }

  const db = await getDb();
  const user = await getCurrentUserFromToken(
    cookieStore.get(SESSION_COOKIE_NAME)?.value,
    db,
    config,
  );
  if (user) {
    return user;
  }

  if (config.provider === "dummy" && config.autoSignIn) {
    return findDummyUserById(db, DUMMY_DEFAULT_USER_ID);
  }

  return undefined;
}

export async function getCurrentUserFromToken(
  token: string | undefined,
  db: AppDatabase,
  config: AuthConfig,
  now = Date.now(),
): Promise<SessionUser | undefined> {
  if (config.provider === "clerk") {
    throw new Error(
      "Clerk is not wired yet. Keep AUTH_PROVIDER=dummy for local and agent environments.",
    );
  }

  if (!token) {
    return undefined;
  }

  const userId = verifySessionToken(token, config.secret, now);
  if (!userId) {
    return undefined;
  }

  return findDummyUserById(db, userId);
}

import { describe, expect, it } from "vitest";
import { resolveDatabaseConfig } from "./env";

describe("resolveDatabaseConfig", () => {
  it("defaults to file-based PGlite when no database env is set", () => {
    expect(resolveDatabaseConfig({})).toEqual({
      driver: "pglite",
      dataDir: ".data/pglite",
    });
  });

  it("uses an in-memory PGlite when PGLITE_DATA_DIR is :memory:", () => {
    expect(
      resolveDatabaseConfig({
        PGLITE_DATA_DIR: ":memory:",
      }),
    ).toEqual({
      driver: "pglite",
      dataDir: undefined,
    });
  });

  it("uses PGlite when DATABASE_DRIVER is pglite, even if DATABASE_URL is set", () => {
    expect(
      resolveDatabaseConfig({
        DATABASE_DRIVER: "pglite",
        DATABASE_URL: "postgresql://user:pass@localhost:5432/app",
        PGLITE_DATA_DIR: ".data/pglite",
      }),
    ).toEqual({
      driver: "pglite",
      dataDir: ".data/pglite",
    });
  });

  it("uses postgres when DATABASE_DRIVER is postgres and DATABASE_URL is set", () => {
    expect(
      resolveDatabaseConfig({
        DATABASE_DRIVER: "postgres",
        DATABASE_URL: "postgresql://user:pass@localhost:5432/app",
      }),
    ).toEqual({
      driver: "postgres",
      url: "postgresql://user:pass@localhost:5432/app",
    });
  });

  it("infers postgres from a postgresql URL when DATABASE_DRIVER is omitted", () => {
    expect(
      resolveDatabaseConfig({
        DATABASE_URL: "postgresql://user:pass@localhost:5432/app",
      }),
    ).toEqual({
      driver: "postgres",
      url: "postgresql://user:pass@localhost:5432/app",
    });
  });

  it("infers postgres from a postgres URL when DATABASE_DRIVER is omitted", () => {
    expect(
      resolveDatabaseConfig({
        DATABASE_URL: "postgres://user:pass@localhost:5432/app",
      }),
    ).toEqual({
      driver: "postgres",
      url: "postgres://user:pass@localhost:5432/app",
    });
  });

  it("rejects an unsupported DATABASE_DRIVER", () => {
    expect(() =>
      resolveDatabaseConfig({ DATABASE_DRIVER: "mysql" }),
    ).toThrowError(/Unsupported DATABASE_DRIVER: mysql/);
  });

  it("requires DATABASE_URL for the postgres driver", () => {
    expect(() =>
      resolveDatabaseConfig({ DATABASE_DRIVER: "postgres" }),
    ).toThrowError(/DATABASE_URL is required when using the postgres driver/);
  });
});

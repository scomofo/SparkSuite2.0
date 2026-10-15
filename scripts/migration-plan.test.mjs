import assert from "node:assert/strict";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { PGlite } from "@electric-sql/pglite";
import { isMigrationFile, migrationName, pendingMigrations } from "./migration-plan.mjs";
import { projectRoot } from "./with-app-env.mjs";

const AUTH_MIGRATION = "0001_auth.sql";

/**
 * The root Better Auth migration and its maintained source copy, or null when
 * either file is missing.
 */
function authSchemaCopy(root) {
  const copy = join(root, "migrations", AUTH_MIGRATION);
  const source = join(root, "migrations/auth", AUTH_MIGRATION);
  if (!existsSync(copy) || !existsSync(source)) return null;
  return { copy: readFileSync(copy, "utf8"), source: readFileSync(source, "utf8") };
}


test("auth and per-user profile migrations apply in embedded Postgres", async () => {
  const db = new PGlite();
  try {
    await db.exec(readFileSync(join(projectRoot(), "migrations/0001_auth.sql"), "utf8"));
    await db.exec(readFileSync(join(projectRoot(), "migrations/0002_spark_profile_sync.sql"), "utf8"));
    const columns = await db.query(
      "select column_name from information_schema.columns where table_name = 'spark_profile_sync' order by ordinal_position",
    );
    assert.deepEqual(columns.rows.map((row) => row.column_name), [
      "user_id",
      "payload",
      "revision",
      "updated_at",
    ]);
    const foreignKeys = await db.query(
      "select constraint_name from information_schema.table_constraints where table_name = 'spark_profile_sync' and constraint_type = 'FOREIGN KEY'",
    );
    assert.equal(foreignKeys.rows.length, 1, "Cloud progress is tied to the account and cascades on deletion");
  } finally {
    await db.close();
  }
});

test("_migrations keys on basename, not path", () => {
  assert.equal(migrationName("/migrations/0002_todos.sql"), "0002_todos.sql");
  assert.equal(migrationName("migrations/auth/0001_auth.sql"), "0001_auth.sql");
  assert.equal(migrationName("0001_auth.sql"), "0001_auth.sql");
});

test("a file already applied from another directory does not re-apply", () => {
  // The auth-on path copies migrations/auth/0001_auth.sql into the globbed
  // directory; a database that already has it must not run it twice.
  assert.deepEqual(pendingMigrations(["/migrations/0001_auth.sql"], ["0001_auth.sql"]), []);
});

test("pending migrations are returned in name order", () => {
  assert.deepEqual(
    pendingMigrations(
      ["/migrations/0003_c.sql", "/migrations/0001_a.sql", "/migrations/0002_b.sql"],
      ["0001_a.sql"],
    ),
    [
      { name: "0002_b.sql", path: "/migrations/0002_b.sql" },
      { name: "0003_c.sql", path: "/migrations/0003_c.sql" },
    ],
  );
});

test("non-.sql entries are dropped (readdir also yields the auth/ directory)", () => {
  assert.equal(isMigrationFile("auth"), false);
  assert.deepEqual(pendingMigrations(["auth", "README.md"], []), []);
});

test("the root auth and profile migrations are included in the migration plan", () => {
  const migrationsDir = join(projectRoot(), "migrations");
  assert.deepEqual(pendingMigrations(readdirSync(migrationsDir), []), [
    { name: "0001_auth.sql", path: "0001_auth.sql" },
    { name: "0002_spark_profile_sync.sql", path: "0002_spark_profile_sync.sql" },
  ]);
  assert.ok(readdirSync(join(migrationsDir, "auth")).includes("0001_auth.sql"));
});

test("this workspace's auth schema copy is byte-identical to its source", () => {
  // An edited copy diverges silently: basename keying skips it on a database
  // that already ran the original, and applies it on a fresh PGLite preview.
  const pair = authSchemaCopy(projectRoot());
  if (pair === null) return; // sign-in off — nothing has been copied up
  assert.equal(
    pair.copy,
    pair.source,
    "migrations/0001_auth.sql has been edited — it must stay a verbatim copy of migrations/auth/0001_auth.sql",
  );
});

test("the copy check reads both files and catches an edit", () => {
  const root = mkdtempSync(join(tmpdir(), "auth-schema-"));
  mkdirSync(join(root, "migrations/auth"), { recursive: true });
  writeFileSync(join(root, "migrations/auth", AUTH_MIGRATION), "create table t ();\n");
  assert.equal(authSchemaCopy(root), null);

  writeFileSync(join(root, "migrations", AUTH_MIGRATION), "create table t ();\n");
  const same = authSchemaCopy(root);
  assert.equal(same.copy, same.source);

  writeFileSync(join(root, "migrations", AUTH_MIGRATION), "create table t (x int);\n");
  const drifted = authSchemaCopy(root);
  assert.notEqual(drifted.copy, drifted.source);
});

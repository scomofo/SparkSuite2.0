import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import type { ProfileSnapshot } from "./profile-snapshot";

const instrumentId = z.enum([
  "guitar",
  "piano",
  "ukulele",
  "bass",
  "drums",
  "vocals",
  "mandolin",
  "banjo",
  "violin",
  "lapsteel",
]);
const sharedPhraseKey = z.enum([
  "guitar",
  "piano",
  "ukulele",
  "bass",
  "drums",
  "vocals",
  "mandolin",
  "banjo",
  "violin",
  "lapsteel",
  "theory",
]);

const payloadSchema = z.object({
  version: z.literal(1),
  suite: z.record(z.string(), z.unknown()),
  learning: z.record(z.string(), z.unknown()),
  checkpoints: z.partialRecord(instrumentId, z.string().max(100_000)),
  sharedPhrases: z.partialRecord(sharedPhraseKey, z.object({
    stage: z.number().int().min(0).max(2),
    note: z.string().max(240),
  }).strict()).default({}),
}).strict().transform((payload) => payload as unknown as ProfileSnapshot);

const saveSchema = z.object({
  payload: payloadSchema,
  expectedRevision: z.number().int().min(0),
}).strict();

type CloudRow = {
  payload: ProfileSnapshot;
  revision: number;
  updated_at: string | Date;
};

function rowToSnapshot(row: CloudRow | undefined) {
  if (!row) return { exists: false as const, revision: 0, payload: null, updatedAt: null };
  return {
    exists: true as const,
    revision: Number(row.revision),
    payload: row.payload,
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

/** Read only the authenticated learner's saved profile. */
export const getCloudProfile = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const rows = await sql.query<CloudRow>(
      "select payload, revision, updated_at from spark_profile_sync where user_id = $1",
      [context.userId],
    );
    return rowToSnapshot(rows[0]);
  });

/**
 * Compare-and-swap save. A stale computer cannot silently overwrite a newer
 * cloud revision; the caller receives the current snapshot and merges/retries.
 */
export const saveCloudProfile = createServerFn({ method: "POST" })
  .validator((input: unknown) => saveSchema.parse(input))
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const encoded = JSON.stringify(data.payload);
    if (encoded.length > 600_000) {
      throw new Error("This profile backup is too large to sync (maximum 600 KB).");
    }
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const rows = data.expectedRevision === 0
      ? await sql.query<CloudRow>(
          "insert into spark_profile_sync (user_id, payload, revision, updated_at) values ($1, $2::jsonb, 1, now()) on conflict (user_id) do nothing returning payload, revision, updated_at",
          [context.userId, encoded],
        )
      : await sql.query<CloudRow>(
          "update spark_profile_sync set payload = $2::jsonb, revision = revision + 1, updated_at = now() where user_id = $1 and revision = $3 returning payload, revision, updated_at",
          [context.userId, encoded, data.expectedRevision],
        );

    if (rows[0]) {
      return { ok: true as const, ...rowToSnapshot(rows[0]) };
    }
    const current = await sql.query<CloudRow>(
      "select payload, revision, updated_at from spark_profile_sync where user_id = $1",
      [context.userId],
    );
    return { ok: false as const, conflict: true as const, current: rowToSnapshot(current[0]) };
  });

/**
 * Target checks shared by the Playwright capture scripts.
 *
 * Both run Chromium with `--no-sandbox` as root and take their URL and output
 * path from argv, so unchecked they will render `file:///root/.grok/auth.json`
 * into a PNG the agent can read, and write it anywhere.
 */
import { existsSync, realpathSync } from "node:fs";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";

const LOOPBACK_HOSTNAMES = new Set(["127.0.0.1", "localhost", "::1", "[::1]"]);

/** http/https loopback only, else exit 1. `BROWSER_ALLOW_EXTERNAL_HOST=1` opts out. */
export function checkedUrl(url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    fail(`not a valid URL: ${url}`);
  }
  // Rules out file:, data:, chrome:, view-source:.
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    fail(`only http/https URLs are allowed, got ${parsed.protocol} in ${url}`);
  }
  if (!LOOPBACK_HOSTNAMES.has(parsed.hostname) && process.env.BROWSER_ALLOW_EXTERNAL_HOST !== "1") {
    fail(
      `${parsed.hostname} is not a loopback host; these scripts screenshot the ` +
        `local dev server. Set BROWSER_ALLOW_EXTERNAL_HOST=1 to override.`,
    );
  }
  return url;
}

function contained(target, directory) {
  const rel = relative(directory, target);
  return rel !== "" && rel !== ".." && !rel.startsWith(`..${sep}`) && !isAbsolute(rel);
}

/** Resolve existing ancestors too, so a screenshot symlink cannot escape its allowed directory. */
function canonicalPath(path) {
  if (existsSync(path)) return realpathSync(path);
  const parent = dirname(path);
  if (parent === path) return path;
  return resolve(canonicalPath(parent), relative(parent, path));
}

/** Absolute `target` if it is strictly inside `allowedDirs`, otherwise throw. */
export function checkedOutputPath(target, allowedDirs, label = "screenshot") {
  // Resolve first so `..` cannot slip past the prefix check.
  const abs = resolve(target);
  const allowed = allowedDirs.some((dir) => contained(abs, resolve(dir)) && contained(canonicalPath(abs), canonicalPath(resolve(dir))));
  if (!allowed) {
    fail(`${label} path must be under ${allowedDirs.join(" or ")}, got ${abs}`);
  }
  return abs;
}

function fail(message) {
  throw new Error(message);
}

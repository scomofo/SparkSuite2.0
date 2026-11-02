import { existsSync, realpathSync } from "node:fs";
import { delimiter, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));

/** Resolve Node tools to their JS entrypoint instead of executing a Windows shell shim. */
export function resolveLaunch(command, args = [], { env = process.env, root = ROOT } = {}) {
  if (command === "vite") {
    return { command: process.execPath, args: [join(root, "node_modules/vite/bin/vite.js"), ...args] };
  }
  if (command === "npm") {
    const candidates = [
      env.npm_execpath,
      join(dirname(process.execPath), "node_modules/npm/bin/npm-cli.js"),
      join(dirname(process.execPath), "../lib/node_modules/npm/bin/npm-cli.js"),
    ];
    for (const dir of (env.PATH ?? env.Path ?? "").split(delimiter)) {
      for (const name of ["npm", "npm.cmd"]) {
        const shim = join(dir, name);
        if (!existsSync(shim)) continue;
        candidates.push(realpathSync(shim), join(dir, "node_modules/npm/bin/npm-cli.js"));
      }
    }
    const entry = candidates.find((candidate) => candidate && /npm-cli\.js$/i.test(candidate) && existsSync(candidate));
    if (!entry) throw new Error("Could not locate npm's JavaScript entrypoint.");
    return { command: process.execPath, args: [entry, ...args] };
  }
  if (/\.(?:cmd|bat)$/i.test(command)) {
    throw new Error("Pass the tool's executable or JavaScript entrypoint instead of a shell script.");
  }
  // Executables (including absolute paths with spaces) and every argument stay
  // separate. Shell metacharacters in -e scripts and paths are never evaluated.
  return { command, args };
}

import { join } from "node:path";
import { projectRoot } from "./with-app-env.mjs";

// /workspace/screenshots in the hosted sandbox; checkout/screenshots elsewhere.
export function evidenceDirectory(root = projectRoot()) {
  return join(root, "screenshots");
}

export function evidencePath(name) {
  return join(evidenceDirectory(), name);
}

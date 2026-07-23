#!/usr/bin/env node
/**
 * Render every quiz batch composition to /out.
 *
 * Usage:
 *   npm run render:all
 *   npm run render:all -- QuizShort-02
 */

import { readFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const BATCHES_PATH = resolve(ROOT, "src/data/batches.json");
const OUT_DIR = resolve(ROOT, "out");

function main() {
  mkdirSync(OUT_DIR, { recursive: true });

  const onlyId = process.argv[2];
  /** @type {string[]} */
  let ids = [];

  if (existsSync(BATCHES_PATH)) {
    const manifest = JSON.parse(readFileSync(BATCHES_PATH, "utf8"));
    ids = manifest.batches.map((b) => b.id);
  } else {
    ids = ["QuizShort"];
  }

  if (onlyId) {
    ids = ids.filter((id) => id === onlyId);
    if (ids.length === 0) {
      console.error(`No composition named ${onlyId}`);
      process.exit(1);
    }
  }

  console.log(`Rendering ${ids.length} video(s)...`);

  for (const id of ids) {
    const outFile = resolve(OUT_DIR, `${id}.mp4`);
    console.log(`\n→ ${id} → ${outFile}`);
    const result = spawnSync(
      "npx",
      ["remotion", "render", id, outFile],
      { cwd: ROOT, stdio: "inherit", shell: true },
    );
    if (result.status !== 0) {
      console.error(`Render failed for ${id}`);
      process.exit(result.status ?? 1);
    }
  }

  console.log(`\nDone. Files in ${OUT_DIR}`);
}

main();

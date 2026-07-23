#!/usr/bin/env node
/**
 * Render quiz batch composition(s) to /out.
 * After a successful export, marks linked bank questions as "used".
 *
 * Usage:
 *   npm run render:all
 *   npm run render:all -- QuizShort-02
 *   npm run render:all -- --pending   # only batches not yet rendered
 */

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import {
  loadBank,
  loadBatches,
  saveBank,
  saveBatches,
} from "./lib/bank.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const OUT_DIR = resolve(ROOT, "out");

function main() {
  mkdirSync(OUT_DIR, { recursive: true });

  const args = process.argv.slice(2);
  const pendingOnly = args.includes("--pending");
  const onlyId = args.find((a) => !a.startsWith("--"));

  const manifest = loadBatches();
  let batches = manifest.batches ?? [];

  if (pendingOnly) {
    batches = batches.filter((b) => !b.rendered);
  }
  if (onlyId) {
    batches = batches.filter((b) => b.id === onlyId);
    if (batches.length === 0) {
      console.error(`No composition named ${onlyId}`);
      process.exit(1);
    }
  }

  if (batches.length === 0) {
    console.error("Nothing to render. Run: npm run next");
    process.exit(1);
  }

  console.log(`Rendering ${batches.length} video(s)...`);
  const bank = loadBank();
  const byId = new Map(bank.map((q) => [q.id, q]));

  for (const batch of batches) {
    const outFile = resolve(OUT_DIR, `${batch.id}.mp4`);
    console.log(`\n→ ${batch.id} → ${outFile}`);
    const result = spawnSync(
      "npx",
      ["remotion", "render", batch.id, outFile],
      { cwd: ROOT, stdio: "inherit", shell: true },
    );
    if (result.status !== 0) {
      console.error(`Render failed for ${batch.id}`);
      process.exit(result.status ?? 1);
    }

    batch.rendered = true;
    batch.output = `out/${batch.id}.mp4`;

    const ids = batch.questionIds ?? batch.questions?.map((q) => q.bankId).filter(Boolean) ?? [];
    for (const id of ids) {
      const row = byId.get(id);
      if (row) {
        row.status = "used";
        console.log(`  bank ${id} → used`);
      }
    }
  }

  saveBank(bank);
  saveBatches(manifest);

  // Also stamp a small sidecar for humans browsing /out
  for (const batch of batches) {
    const side = resolve(OUT_DIR, `${batch.id}.json`);
    writeFileSync(
      side,
      `${JSON.stringify(
        {
          id: batch.id,
          rendered: true,
          questionIds: batch.questionIds ?? [],
          questions: (batch.questions ?? []).map((q) => ({
            bankId: q.bankId,
            answer: q.answer,
            difficultyLabel: q.difficultyLabel,
          })),
        },
        null,
        2,
      )}\n`,
    );
  }

  console.log(`\nDone. Marked exported questions as used in input/question-bank.csv`);
  console.log(`Videos in ${OUT_DIR}`);
  console.log("Clean up used rows anytime, or: npm run bank -- --list-used");
}

main();

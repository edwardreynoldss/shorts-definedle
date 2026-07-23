#!/usr/bin/env node
/**
 * Show question-bank availability by difficulty + status.
 *
 * Usage:
 *   npm run bank
 *   npm run bank -- --list-unused
 *   npm run bank -- --list-used
 */

import {
  DIFFICULTIES,
  bankSummary,
  loadBank,
} from "./lib/bank.mjs";

const listUnused = process.argv.includes("--list-unused");
const listUsed = process.argv.includes("--list-used");
const listQueued = process.argv.includes("--list-queued");

function main() {
  const bank = loadBank();
  const summary = bankSummary(bank);

  console.log("Question bank (input/question-bank.csv)\n");
  console.log("diff   unused  queued  used  total");
  console.log("-----  ------  ------  ----  -----");
  for (const d of DIFFICULTIES) {
    const s = summary[d];
    console.log(
      `${d.padEnd(5)}  ${String(s.unused).padStart(6)}  ${String(s.queued).padStart(6)}  ${String(s.used).padStart(4)}  ${String(s.total).padStart(5)}`,
    );
  }

  const show = (status, flag) => {
    if (!flag) return;
    const rows = bank.filter((q) => q.status === status);
    console.log(`\n${status.toUpperCase()} (${rows.length})`);
    for (const q of rows) {
      console.log(`  [${q.id}] ${q.difficulty}%  ${q.answer} — ${q.definition}`);
    }
  };

  show("unused", listUnused);
  show("queued", listQueued);
  show("used", listUsed);

  if (!listUnused && !listUsed && !listQueued) {
    console.log("\nTips:");
    console.log("  npm run bank -- --list-unused");
    console.log("  npm run bank -- --list-queued");
    console.log("  npm run bank -- --list-used");
    console.log("  npm run next          # build next video from unused pools");
  }
}

main();

#!/usr/bin/env node
/**
 * Build the next Short from the question bank:
 * one unused question from each of 70% / 40% / 10% / 1%.
 *
 * Marks those bank rows as "queued" until you export the video
 * (npm run render / render:all), which then sets them to "used".
 *
 * Usage:
 *   npm run next
 *   npm run next -- --count=3
 */

import {
  DIFFICULTIES,
  DIFFICULTY_LABELS,
  META,
  bankSummary,
  loadBank,
  loadBatches,
  pad,
  questionToQuizItem,
  saveBank,
  saveBatches,
} from "./lib/bank.mjs";

const countArg = process.argv.find((a) => a.startsWith("--count="));
const count = Math.max(1, Number(countArg?.slice("--count=".length) ?? 1) || 1);

function pickUnused(bank, difficulty, takenIds) {
  return bank.find(
    (q) =>
      q.difficulty === difficulty &&
      q.status === "unused" &&
      !takenIds.has(q.id),
  );
}

function main() {
  const bank = loadBank();
  if (bank.length === 0) {
    console.error("Question bank is empty. Add rows to input/question-bank.csv");
    console.error("Columns: id,difficulty,definition,answer,status,phrases");
    process.exit(1);
  }

  const manifest = loadBatches();
  const created = [];

  for (let n = 0; n < count; n++) {
    const taken = new Set();
    const picked = [];

    for (const difficulty of DIFFICULTIES) {
      const q = pickUnused(bank, difficulty, taken);
      if (!q) {
        const summary = bankSummary(bank);
        console.error(
          `Not enough unused ${difficulty}% questions to build another video.`,
        );
        console.error(
          `Pool ${difficulty}% → unused=${summary[difficulty].unused}, queued=${summary[difficulty].queued}, used=${summary[difficulty].used}`,
        );
        if (created.length === 0) process.exit(1);
        console.warn(`Stopped after creating ${created.length} video(s).`);
        n = count; // break outer
        break;
      }
      taken.add(q.id);
      picked.push(q);
    }

    if (picked.length !== 4) break;

    const batchIndex = manifest.batches.length;
    const id = `QuizShort-${pad(batchIndex + 1)}`;
    const questions = picked.map((q, slot) =>
      questionToQuizItem(q, batchIndex, slot),
    );

    for (const q of picked) {
      q.status = "queued";
    }

    const batch = {
      id,
      title: META.title,
      scorePrompt: META.scorePrompt,
      scoreSubtext: META.scoreSubtext,
      questionIds: picked.map((q) => q.id),
      rendered: false,
      questions,
    };

    manifest.batches.push(batch);
    created.push(batch);

    console.log(`\nCreated ${id}`);
    for (const q of picked) {
      console.log(
        `  ${DIFFICULTY_LABELS[q.difficulty]}  [${q.id}]  ${q.answer} — ${q.definition}`,
      );
    }
  }

  if (created.length === 0) {
    process.exit(1);
  }

  manifest.source = "input/question-bank.csv";
  saveBank(bank);
  saveBatches(manifest);

  console.log(`\nUpdated input/question-bank.csv (status → queued)`);
  console.log("Next:");
  console.log("  npm run voices");
  console.log("  npm run dev");
  console.log("  npm run render:all    # marks those questions as used");
}

main();

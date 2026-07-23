#!/usr/bin/env node
/**
 * Import questions from a simple CSV (no timings required) and split into
 * videos of 4 questions each.
 *
 * CSV columns (header required):
 *   definition,answer
 *   optional: difficultyLabel,phrases
 *
 * phrases is optional pipe-separated text shown on screen, e.g.
 *   A person|who travels|without a permanent home.
 * If omitted, phrases are auto-split from the definition.
 * Timings are filled later by: npm run voices
 *
 * Usage:
 *   npm run import
 *   npm run import -- input/my-questions.csv
 */

import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  existsSync,
} from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const DEFAULT_CSV = resolve(ROOT, "input/questions.csv");
const OUT_PATH = resolve(ROOT, "src/data/batches.json");

const QUESTIONS_PER_VIDEO = 4;
const DEFAULT_DIFFICULTY = [
  "70% Question",
  "40% Question",
  "10% Question",
  "1% Question",
];

const META = {
  title: "Guess the word from the definition",
  scorePrompt: "Comment your score below 👇",
  scoreSubtext: "How many did you get right? 4/4? 3/4? Be honest!",
};

function pad(n) {
  return String(n).padStart(2, "0");
}

function autoPhrases(definition) {
  const cleaned = definition.trim();
  const byPunct = cleaned
    .split(/(?<=[,;:])\s+/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (byPunct.length >= 2) return byPunct;

  const words = cleaned.split(/\s+/);
  if (words.length <= 5) return [cleaned];

  const chunkSize = Math.ceil(words.length / 3);
  const phrases = [];
  for (let i = 0; i < words.length; i += chunkSize) {
    phrases.push(words.slice(i, i + chunkSize).join(" "));
  }
  return phrases;
}

/** Minimal CSV parser with quoted fields. */
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        field += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n" || (ch === "\r" && next === "\n")) {
      row.push(field);
      field = "";
      if (row.some((c) => c.trim() !== "")) rows.push(row);
      row = [];
      if (ch === "\r") i++;
    } else if (ch === "\r") {
      row.push(field);
      field = "";
      if (row.some((c) => c.trim() !== "")) rows.push(row);
      row = [];
    } else {
      field += ch;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    if (row.some((c) => c.trim() !== "")) rows.push(row);
  }

  return rows;
}

function main() {
  const csvPath = resolve(process.argv[2] ?? DEFAULT_CSV);
  if (!existsSync(csvPath)) {
    console.error(`CSV not found: ${csvPath}`);
    console.error("Create input/questions.csv or pass a path:");
    console.error("  npm run import -- path/to/questions.csv");
    process.exit(1);
  }

  const rows = parseCsv(readFileSync(csvPath, "utf8"));
  if (rows.length < 2) {
    console.error("CSV needs a header row and at least one question.");
    process.exit(1);
  }

  const header = rows[0].map((h) => h.trim().toLowerCase());
  const defIdx = header.indexOf("definition");
  const ansIdx = header.indexOf("answer");
  const diffIdx = header.indexOf("difficultylabel");
  const phrasesIdx = header.indexOf("phrases");

  if (defIdx === -1 || ansIdx === -1) {
    console.error('CSV header must include "definition" and "answer" columns.');
    process.exit(1);
  }

  /** @type {object[]} */
  const questions = [];
  for (let r = 1; r < rows.length; r++) {
    const cols = rows[r];
    const definition = (cols[defIdx] ?? "").trim();
    const answer = (cols[ansIdx] ?? "").trim();
    if (!definition || !answer) {
      console.warn(`Skipping row ${r + 1}: missing definition or answer`);
      continue;
    }

    const difficultyLabel = (cols[diffIdx] ?? "").trim();
    const phrasesRaw = (cols[phrasesIdx] ?? "").trim();
    const phraseTexts = phrasesRaw
      ? phrasesRaw.split("|").map((p) => p.trim()).filter(Boolean)
      : autoPhrases(definition);

    // Placeholder times — replaced by `npm run voices` from ElevenLabs alignment.
    const segments = phraseTexts.map((text, i) => ({
      text,
      time: Number((0.3 + i * 1.0).toFixed(2)),
    }));

    questions.push({
      definition,
      answer,
      difficultyLabel,
      segments,
    });
  }

  if (questions.length === 0) {
    console.error("No valid questions found in CSV.");
    process.exit(1);
  }

  if (questions.length % QUESTIONS_PER_VIDEO !== 0) {
    console.warn(
      `Warning: ${questions.length} questions is not a multiple of ${QUESTIONS_PER_VIDEO}.`,
    );
    console.warn(
      `The last video will have ${questions.length % QUESTIONS_PER_VIDEO} question(s).`,
    );
  }

  const batches = [];
  for (let i = 0; i < questions.length; i += QUESTIONS_PER_VIDEO) {
    const slice = questions.slice(i, i + QUESTIONS_PER_VIDEO);
    const batchIndex = batches.length;
    batches.push({
      id: `QuizShort-${pad(batchIndex + 1)}`,
      title: META.title,
      scorePrompt: META.scorePrompt,
      scoreSubtext: META.scoreSubtext,
      questions: slice.map((q, qi) => ({
        definition: q.definition,
        answer: q.answer,
        voice: `v${pad(batchIndex + 1)}-q${qi + 1}.mp3`,
        difficultyLabel:
          q.difficultyLabel ||
          DEFAULT_DIFFICULTY[qi] ||
          `${Math.max(1, 70 - qi * 20)}% Question`,
        segments: q.segments,
      })),
    });
  }

  mkdirSync(dirname(OUT_PATH), { recursive: true });
  const manifest = {
    title: META.title,
    scorePrompt: META.scorePrompt,
    scoreSubtext: META.scoreSubtext,
    questionsPerVideo: QUESTIONS_PER_VIDEO,
    source: csvPath.replace(ROOT + "\\", "").replace(ROOT + "/", ""),
    batches,
  };

  writeFileSync(OUT_PATH, `${JSON.stringify(manifest, null, 2)}\n`);

  // Keep legacy single-video file in sync with the first batch.
  const legacyPath = resolve(ROOT, "src/data/questions.json");
  if (batches[0]) {
    writeFileSync(
      legacyPath,
      `${JSON.stringify(
        {
          title: batches[0].title,
          scorePrompt: batches[0].scorePrompt,
          scoreSubtext: batches[0].scoreSubtext,
          questions: batches[0].questions,
        },
        null,
        2,
      )}\n`,
    );
  }

  console.log(`Imported ${questions.length} questions from ${csvPath}`);
  console.log(`Created ${batches.length} video(s) → ${OUT_PATH}`);
  for (const b of batches) {
    console.log(`  ${b.id}: ${b.questions.length} questions`);
  }
  console.log("\nNext:");
  console.log("  npm run voices       # auto voice + timings (no manual times)");
  console.log("  npm run dev          # preview all videos in Studio");
  console.log("  npm run render:all   # export every video to /out");
}

main();

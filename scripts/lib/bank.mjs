/**
 * Shared helpers for the difficulty-pooled question bank.
 */

import {
  readFileSync,
  writeFileSync,
  existsSync,
  mkdirSync,
} from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
export const ROOT = resolve(__dirname, "../..");
export const BANK_PATH = resolve(ROOT, "input/question-bank.csv");
export const BATCHES_PATH = resolve(ROOT, "src/data/batches.json");
export const QUESTIONS_PATH = resolve(ROOT, "src/data/questions.json");

export const DIFFICULTIES = ["70", "40", "10", "1"];
export const DIFFICULTY_LABELS = {
  70: "70% Question",
  40: "40% Question",
  10: "10% Question",
  1: "1% Question",
};

export const META = {
  title: "Guess the word from the definition",
  scorePrompt: "Comment your score below 👇",
  scoreSubtext: "How many did you get right? 4/4? 3/4? Be honest!",
};

export function pad(n) {
  return String(n).padStart(2, "0");
}

export function padId(n) {
  return `q${String(n).padStart(3, "0")}`;
}

/** Minimal CSV parser with quoted fields. */
export function parseCsv(text) {
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
      if (row.some((c) => String(c).trim() !== "")) rows.push(row);
      row = [];
      if (ch === "\r") i++;
    } else if (ch === "\r") {
      row.push(field);
      field = "";
      if (row.some((c) => String(c).trim() !== "")) rows.push(row);
      row = [];
    } else {
      field += ch;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    if (row.some((c) => String(c).trim() !== "")) rows.push(row);
  }

  return rows;
}

export function csvEscape(value) {
  const s = String(value ?? "");
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function normalizeDifficulty(raw) {
  const cleaned = String(raw ?? "")
    .trim()
    .toLowerCase()
    .replace("%", "")
    .replace("question", "")
    .trim();
  if (DIFFICULTIES.includes(cleaned)) return cleaned;
  const match = cleaned.match(/^(70|40|10|1)\b/);
  return match ? match[1] : null;
}

export function normalizeStatus(raw) {
  const s = String(raw ?? "unused")
    .trim()
    .toLowerCase();
  if (s === "used" || s === "done" || s === "rendered") return "used";
  if (s === "queued" || s === "pending" || s === "in_video") return "queued";
  return "unused";
}

export function autoPhrases(definition) {
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

export function loadBank(path = BANK_PATH) {
  if (!existsSync(path)) {
    return [];
  }

  const rows = parseCsv(readFileSync(path, "utf8"));
  if (rows.length < 2) return [];

  const header = rows[0].map((h) => h.trim().toLowerCase());
  const idIdx = header.indexOf("id");
  const diffIdx = header.indexOf("difficulty");
  const defIdx = header.indexOf("definition");
  const ansIdx = header.indexOf("answer");
  const statusIdx = header.indexOf("status");
  const phrasesIdx = header.indexOf("phrases");

  if (diffIdx === -1 || defIdx === -1 || ansIdx === -1) {
    throw new Error(
      'question-bank.csv needs columns: difficulty, definition, answer (plus id, status)',
    );
  }

  const questions = [];
  for (let r = 1; r < rows.length; r++) {
    const cols = rows[r];
    const definition = (cols[defIdx] ?? "").trim();
    const answer = (cols[ansIdx] ?? "").trim();
    const difficulty = normalizeDifficulty(cols[diffIdx]);
    if (!definition || !answer || !difficulty) {
      console.warn(`Skipping bank row ${r + 1}: invalid difficulty/definition/answer`);
      continue;
    }

    const phrasesRaw = phrasesIdx >= 0 ? (cols[phrasesIdx] ?? "").trim() : "";
    questions.push({
      id: (idIdx >= 0 ? cols[idIdx] : "").trim() || padId(r),
      difficulty,
      definition,
      answer,
      status: normalizeStatus(statusIdx >= 0 ? cols[statusIdx] : "unused"),
      phrases: phrasesRaw
        ? phrasesRaw.split("|").map((p) => p.trim()).filter(Boolean)
        : null,
    });
  }

  return questions;
}

export function saveBank(questions, path = BANK_PATH) {
  mkdirSync(dirname(path), { recursive: true });
  const lines = ["id,difficulty,definition,answer,status,phrases"];
  for (const q of questions) {
    lines.push(
      [
        csvEscape(q.id),
        csvEscape(q.difficulty),
        csvEscape(q.definition),
        csvEscape(q.answer),
        csvEscape(q.status),
        csvEscape((q.phrases ?? []).join("|")),
      ].join(","),
    );
  }
  writeFileSync(path, `${lines.join("\n")}\n`);
}

export function nextQuestionId(questions) {
  let max = 0;
  for (const q of questions) {
    const m = String(q.id).match(/^q(\d+)$/i);
    if (m) max = Math.max(max, Number(m[1]));
  }
  return padId(max + 1);
}

export function bankSummary(questions) {
  const summary = {};
  for (const d of DIFFICULTIES) {
    summary[d] = { unused: 0, queued: 0, used: 0, total: 0 };
  }
  for (const q of questions) {
    const bucket = summary[q.difficulty];
    if (!bucket) continue;
    bucket.total += 1;
    bucket[q.status] = (bucket[q.status] ?? 0) + 1;
  }
  return summary;
}

export function loadBatches() {
  if (!existsSync(BATCHES_PATH)) {
    return {
      title: META.title,
      scorePrompt: META.scorePrompt,
      scoreSubtext: META.scoreSubtext,
      questionsPerVideo: 4,
      source: "input/question-bank.csv",
      batches: [],
    };
  }
  return JSON.parse(readFileSync(BATCHES_PATH, "utf8"));
}

export function saveBatches(manifest) {
  mkdirSync(dirname(BATCHES_PATH), { recursive: true });
  writeFileSync(BATCHES_PATH, `${JSON.stringify(manifest, null, 2)}\n`);

  const first = manifest.batches[0];
  if (first) {
    writeFileSync(
      QUESTIONS_PATH,
      `${JSON.stringify(
        {
          title: first.title,
          scorePrompt: first.scorePrompt,
          scoreSubtext: first.scoreSubtext,
          questions: first.questions,
        },
        null,
        2,
      )}\n`,
    );
  }
}

export function questionToQuizItem(q, batchIndex, slotIndex) {
  const phrases = q.phrases?.length ? q.phrases : autoPhrases(q.definition);
  return {
    bankId: q.id,
    definition: q.definition,
    answer: q.answer,
    voice: `v${pad(batchIndex + 1)}-q${slotIndex + 1}.mp3`,
    difficultyLabel: DIFFICULTY_LABELS[q.difficulty],
    segments: phrases.map((text, i) => ({
      text,
      time: Number((0.3 + i * 1.0).toFixed(2)),
    })),
  };
}

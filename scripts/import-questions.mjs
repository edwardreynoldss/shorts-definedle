#!/usr/bin/env node
/**
 * Append questions into the difficulty-pooled bank.
 *
 * Accepts either:
 *   1) CSV with columns: difficulty,definition,answer
 *   2) Sectioned text file:
 *
 *      # 70%
 *      Nomad | A person who travels without a permanent home.
 *
 *      # 40%
 *      Fiasco | A sudden and complete failure or collapse.
 *
 * New rows are added as status=unused. Existing ids are left alone.
 *
 * Usage:
 *   npm run import
 *   npm run import -- input/new-questions.txt
 *   npm run import -- input/extra.csv
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import {
  BANK_PATH,
  ROOT,
  autoPhrases,
  loadBank,
  nextQuestionId,
  normalizeDifficulty,
  parseCsv,
  saveBank,
} from "./lib/bank.mjs";

const DEFAULT_INPUT = resolve(ROOT, "input/new-questions.txt");

function parseSectionedText(text) {
  /** @type {{ difficulty: string, definition: string, answer: string, phrases: string[] | null }[]} */
  const items = [];
  let currentDiff = null;

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("//")) continue;

    const header = line.match(/^#\s*(70|40|10|1)\s*%?\s*$/i);
    if (header) {
      currentDiff = header[1];
      continue;
    }

    if (!currentDiff) {
      console.warn(`Skipping line (no difficulty section yet): ${line}`);
      continue;
    }

    // answer | definition   OR   definition || answer
    let answer = "";
    let definition = "";
    if (line.includes("|")) {
      const parts = line.split("|").map((p) => p.trim());
      if (parts.length >= 2) {
        // Prefer shorter side as answer when ambiguous
        if (parts[0].split(/\s+/).length <= 4) {
          answer = parts[0];
          definition = parts.slice(1).join(" | ").trim();
        } else {
          definition = parts[0];
          answer = parts[parts.length - 1];
        }
      }
    } else {
      console.warn(`Skipping line (expected "Answer | Definition"): ${line}`);
      continue;
    }

    if (!answer || !definition) continue;
    items.push({
      difficulty: currentDiff,
      definition,
      answer,
      phrases: null,
    });
  }

  return items;
}

function parseInputCsv(text) {
  const rows = parseCsv(text);
  if (rows.length < 2) return [];
  const header = rows[0].map((h) => h.trim().toLowerCase());
  const diffIdx = header.indexOf("difficulty");
  const defIdx = header.indexOf("definition");
  const ansIdx = header.indexOf("answer");
  const phrasesIdx = header.indexOf("phrases");

  if (diffIdx === -1 || defIdx === -1 || ansIdx === -1) {
    throw new Error("CSV needs difficulty, definition, answer columns");
  }

  const items = [];
  for (let i = 1; i < rows.length; i++) {
    const cols = rows[i];
    const difficulty = normalizeDifficulty(cols[diffIdx]);
    const definition = (cols[defIdx] ?? "").trim();
    const answer = (cols[ansIdx] ?? "").trim();
    if (!difficulty || !definition || !answer) continue;
    const phrasesRaw = phrasesIdx >= 0 ? (cols[phrasesIdx] ?? "").trim() : "";
    items.push({
      difficulty,
      definition,
      answer,
      phrases: phrasesRaw
        ? phrasesRaw.split("|").map((p) => p.trim()).filter(Boolean)
        : null,
    });
  }
  return items;
}

function main() {
  const inputPath = resolve(process.argv[2] ?? DEFAULT_INPUT);
  if (!existsSync(inputPath)) {
    console.error(`Input not found: ${inputPath}`);
    console.error("Create input/new-questions.txt like:\n");
    console.error("# 70%");
    console.error("Nomad | A person who travels without a permanent home.");
    console.error("\n# 40%");
    console.error("Fiasco | A sudden and complete failure or collapse.");
    process.exit(1);
  }

  const text = readFileSync(inputPath, "utf8");
  const items = inputPath.toLowerCase().endsWith(".csv")
    ? parseInputCsv(text)
    : parseSectionedText(text);

  if (items.length === 0) {
    console.error("No questions found to import.");
    process.exit(1);
  }

  const bank = loadBank();
  const existingKeys = new Set(
    bank.map((q) => `${q.difficulty}::${q.answer.toLowerCase()}::${q.definition.toLowerCase()}`),
  );

  let added = 0;
  for (const item of items) {
    const key = `${item.difficulty}::${item.answer.toLowerCase()}::${item.definition.toLowerCase()}`;
    if (existingKeys.has(key)) {
      console.log(`Skip duplicate: [${item.difficulty}%] ${item.answer}`);
      continue;
    }
    const id = nextQuestionId(bank);
    bank.push({
      id,
      difficulty: item.difficulty,
      definition: item.definition,
      answer: item.answer,
      status: "unused",
      phrases: item.phrases ?? autoPhrases(item.definition),
    });
    existingKeys.add(key);
    added += 1;
    console.log(`+ [${id}] ${item.difficulty}%  ${item.answer}`);
  }

  saveBank(bank);
  console.log(`\nAdded ${added} question(s) → ${BANK_PATH}`);
  console.log("Run: npm run bank");
  console.log("Then: npm run next");
}

main();

#!/usr/bin/env node
/**
 * Generate ElevenLabs voiceovers for quiz definitions, save MP3s into /public,
 * and rewrite segment timings so on-screen phrases match the spoken audio.
 *
 * Usage:
 *   1. Copy .env.example → .env and set ELEVENLABS_API_KEY (+ optional VOICE_ID)
 *   2. npm run voices
 *   3. git add public src/data/questions.json && git commit
 *
 * Options:
 *   --dry-run     Print planned work without calling the API
 *   --only=1,3    Only regenerate question indexes (1-based)
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const QUESTIONS_PATH = resolve(ROOT, "src/data/questions.json");
const PUBLIC_DIR = resolve(ROOT, "public");

const API_BASE = process.env.ELEVENLABS_API_BASE ?? "https://api.elevenlabs.io";
const DEFAULT_VOICE_ID = "JBFqnCBsd6RMkjVDRZzb"; // George — clear narrator
const DEFAULT_MODEL_ID = "eleven_multilingual_v2";
const OUTPUT_FORMAT = process.env.ELEVENLABS_OUTPUT_FORMAT ?? "mp3_44100_128";

const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");
const onlyArg = [...args].find((a) => a.startsWith("--only="));
const onlyIndexes = onlyArg
  ? onlyArg
      .slice("--only=".length)
      .split(",")
      .map((n) => Number(n) - 1)
      .filter((n) => Number.isInteger(n) && n >= 0)
  : null;

function loadEnvFile() {
  const envPath = resolve(ROOT, ".env");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvFile();

const API_KEY = process.env.ELEVENLABS_API_KEY;
const VOICE_ID = process.env.ELEVENLABS_VOICE_ID ?? DEFAULT_VOICE_ID;
const MODEL_ID = process.env.ELEVENLABS_MODEL_ID ?? DEFAULT_MODEL_ID;

/** Split a definition into phrase chunks when segments are missing. */
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

function normalize(text) {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

/**
 * Build a lookup from normalized-string index → alignment character index.
 */
function buildNormIndexMap(characters) {
  let norm = "";
  /** @type {number[]} */
  const map = [];
  let lastWasSpace = true;

  for (let i = 0; i < characters.length; i++) {
    const ch = characters[i];
    const isSpace = /\s/.test(ch);
    if (isSpace) {
      if (!lastWasSpace && norm.length > 0) {
        norm += " ";
        map.push(i);
      }
      lastWasSpace = true;
      continue;
    }
    norm += ch.toLowerCase();
    map.push(i);
    lastWasSpace = false;
  }

  return { norm: norm.trimEnd(), map };
}

/**
 * Map phrase segments onto ElevenLabs character alignment timestamps.
 */
function segmentsFromAlignment(phrases, alignment) {
  if (!alignment?.characters?.length) {
    return phrases.map((text, i) => ({
      text,
      time: Number((0.25 + i * 1.1).toFixed(2)),
    }));
  }

  const { characters, character_start_times_seconds: starts } = alignment;
  const { norm, map } = buildNormIndexMap(characters);
  let searchFrom = 0;
  /** @type {{ text: string; time: number }[]} */
  const segments = [];

  for (const phrase of phrases) {
    const needle = normalize(phrase);
    const at = norm.indexOf(needle, searchFrom);

    if (at === -1) {
      const prev = segments[segments.length - 1];
      segments.push({
        text: phrase,
        time: Number(((prev?.time ?? 0) + 1.0).toFixed(2)),
      });
      continue;
    }

    const charIndex = map[at] ?? 0;
    const time = Number((starts[charIndex] ?? 0).toFixed(2));
    segments.push({ text: phrase, time });
    searchFrom = at + needle.length;
  }

  for (let i = 1; i < segments.length; i++) {
    if (segments[i].time <= segments[i - 1].time) {
      segments[i].time = Number((segments[i - 1].time + 0.35).toFixed(2));
    }
  }

  return segments;
}

async function synthesizeWithTimestamps(text) {
  const url = `${API_BASE}/v1/text-to-speech/${VOICE_ID}/with-timestamps?output_format=${OUTPUT_FORMAT}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "xi-api-key": API_KEY,
      Accept: "application/json",
    },
    body: JSON.stringify({
      text,
      model_id: MODEL_ID,
      voice_settings: {
        stability: 0.45,
        similarity_boost: 0.75,
        style: 0.2,
        use_speaker_boost: true,
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`ElevenLabs ${res.status}: ${body}`);
  }

  return res.json();
}

async function main() {
  if (!dryRun && !API_KEY) {
    console.error(
      "Missing ELEVENLABS_API_KEY. Copy .env.example → .env and set your key.",
    );
    process.exit(1);
  }

  mkdirSync(PUBLIC_DIR, { recursive: true });
  const data = JSON.parse(readFileSync(QUESTIONS_PATH, "utf8"));

  console.log(
    dryRun
      ? "Dry run — no API calls."
      : `Generating voices with voice_id=${VOICE_ID}, model=${MODEL_ID}`,
  );

  for (let i = 0; i < data.questions.length; i++) {
    if (onlyIndexes && !onlyIndexes.includes(i)) continue;

    const question = data.questions[i];
    const voiceFile = question.voice || `voice${i + 1}.mp3`;
    const phrases =
      question.segments?.map((s) => s.text).filter(Boolean) ??
      autoPhrases(question.definition);

    console.log(`\n[${i + 1}/${data.questions.length}] ${voiceFile}`);
    console.log(`  text: ${question.definition}`);
    console.log(`  phrases: ${phrases.map((p) => `"${p}"`).join(" | ")}`);

    if (dryRun) continue;

    const result = await synthesizeWithTimestamps(question.definition);
    const audioBuffer = Buffer.from(result.audio_base64, "base64");
    const outPath = resolve(PUBLIC_DIR, voiceFile);
    writeFileSync(outPath, audioBuffer);
    console.log(`  wrote ${outPath} (${audioBuffer.length} bytes)`);

    const alignment = result.alignment ?? result.normalized_alignment;
    const segments = segmentsFromAlignment(phrases, alignment);
    question.voice = voiceFile;
    question.segments = segments;
    console.log(
      "  segments:",
      segments.map((s) => `${s.time}s "${s.text}"`).join(", "),
    );
  }

  if (!dryRun) {
    writeFileSync(QUESTIONS_PATH, `${JSON.stringify(data, null, 2)}\n`);
    console.log(`\nUpdated ${QUESTIONS_PATH}`);
    console.log("Next:");
    console.log("  npm run dev          # preview sync in Remotion Studio");
    console.log(
      '  git add public src/data/questions.json && git commit -m "Update ElevenLabs voiceovers"',
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

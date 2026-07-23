#!/usr/bin/env node
/**
 * Generate ElevenLabs voiceovers for quiz definitions, save MP3s into /public,
 * and rewrite segment timings so on-screen phrases match the spoken audio.
 *
 * Reads src/data/batches.json when present, otherwise src/data/questions.json.
 *
 * Usage:
 *   npm run voices              # only missing question voices
 *   npm run voices:intro        # intro voice only (skipped if intro.mp3 exists)
 *   npm run voices -- --force   # regenerate everything selected
 *
 * Options:
 *   --dry-run              Print planned work without calling the API
 *   --intro-only           Generate intro voice only
 *   --force                Recreate audio even if the mp3 already exists
 *   --only=1,3             Only these global question indexes (1-based)
 *   --batch=QuizShort-01   Only one composition / batch id
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const BATCHES_PATH = resolve(ROOT, "src/data/batches.json");
const QUESTIONS_PATH = resolve(ROOT, "src/data/questions.json");
const PUBLIC_DIR = resolve(ROOT, "public");

const API_BASE = process.env.ELEVENLABS_API_BASE ?? "https://api.elevenlabs.io";
const DEFAULT_VOICE_ID = "JBFqnCBsd6RMkjVDRZzb";
const DEFAULT_MODEL_ID = "eleven_multilingual_v2";
const OUTPUT_FORMAT = process.env.ELEVENLABS_OUTPUT_FORMAT ?? "mp3_44100_128";
const MIN_VOICE_BYTES = 1500;

const INTRO = {
  brand: "Definedle",
  line1: "Can you guess the word from the definition alone?",
  line2: "Only 1% get the last question correct",
  voiceFile: "intro.mp3",
  durationSec: 5.5,
  line2AtSec: 2.4,
};

const args = process.argv.slice(2);
const argSet = new Set(args);
const dryRun = argSet.has("--dry-run");
const introOnly = argSet.has("--intro-only");
const force = argSet.has("--force");
const onlyArg = args.find((a) => a.startsWith("--only="));
const batchArg = args.find((a) => a.startsWith("--batch="));
const onlyIndexes = onlyArg
  ? onlyArg
      .slice("--only=".length)
      .split(",")
      .map((n) => Number(n) - 1)
      .filter((n) => Number.isInteger(n) && n >= 0)
  : null;
const onlyBatchId = batchArg ? batchArg.slice("--batch=".length) : null;

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
  return text
    .toLowerCase()
    .replace(/["""''.,!?;:()[\]{}]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function buildNormIndexMap(characters) {
  let norm = "";
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

    // Skip punctuation in the normalized stream so phrase matching is stable.
    if (/["""''.,!?;:()[\]{}]/.test(ch)) {
      continue;
    }

    norm += ch.toLowerCase();
    map.push(i);
    lastWasSpace = false;
  }

  return { norm: norm.trimEnd(), map };
}

function segmentsFromAlignment(phrases, alignment) {
  if (!alignment?.characters?.length) {
    return phrases.map((text, i) => ({
      text,
      time: Number((0.2 + i * 1.0).toFixed(3)),
    }));
  }

  const { characters, character_start_times_seconds: starts } = alignment;
  const { norm, map } = buildNormIndexMap(characters);
  let searchFrom = 0;
  const segments = [];

  for (const phrase of phrases) {
    const needle = normalize(phrase);
    let at = norm.indexOf(needle, searchFrom);

    // Fallback: try without requiring exact trailing words if punctuation differed.
    if (at === -1) {
      const words = needle.split(" ").filter(Boolean);
      if (words.length > 1) {
        at = norm.indexOf(words.join(" "), searchFrom);
      }
    }

    if (at === -1) {
      const prev = segments[segments.length - 1];
      segments.push({
        text: phrase,
        time: Number(((prev?.time ?? 0) + 0.85).toFixed(3)),
      });
      continue;
    }

    const charIndex = map[at] ?? 0;
    const time = Number((starts[charIndex] ?? 0).toFixed(3));
    segments.push({ text: phrase, time });
    searchFrom = at + Math.max(1, needle.length);
  }

  for (let i = 1; i < segments.length; i++) {
    if (segments[i].time <= segments[i - 1].time) {
      segments[i].time = Number((segments[i - 1].time + 0.25).toFixed(3));
    }
  }

  return segments;
}

function wordsFromCharAlignment(alignment) {
  if (!alignment?.characters?.length) return [];

  const chars = alignment.characters;
  const starts = alignment.character_start_times_seconds;
  /** @type {{ text: string, time: number }[]} */
  const words = [];
  let current = "";
  let wordStart = null;

  const flush = () => {
    const text = current.trim();
    if (!text) {
      current = "";
      wordStart = null;
      return;
    }
    words.push({
      text,
      time: Number((wordStart ?? 0).toFixed(3)),
    });
    current = "";
    wordStart = null;
  };

  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    if (/\s/.test(ch)) {
      flush();
      continue;
    }
    if (wordStart === null) wordStart = starts[i] ?? 0;
    current += ch;
  }
  flush();

  for (let i = 1; i < words.length; i++) {
    if (words[i].time <= words[i - 1].time) {
      words[i].time = Number((words[i - 1].time + 0.05).toFixed(3));
    }
  }

  return words;
}

function wordsFromForcedAlignment(result) {
  if (!result?.words?.length) return [];
  return result.words
    .map((w) => ({
      text: String(w.text ?? "").trim(),
      time: Number((w.start ?? 0).toFixed(3)),
    }))
    .filter((w) => w.text.length > 0);
}

function isWordLevelSegments(segments) {
  if (!Array.isArray(segments) || segments.length === 0) return false;
  return segments.every(
    (s) => String(s.text ?? "").trim().split(/\s+/).filter(Boolean).length === 1,
  );
}

async function forceAlignAudio(filePath, text) {
  const bytes = readFileSync(filePath);
  const form = new FormData();
  form.append(
    "file",
    new Blob([bytes], { type: "audio/mpeg" }),
    filePath.split("/").pop() || "voice.mp3",
  );
  form.append("text", text);

  const res = await fetch(`${API_BASE}/v1/forced-alignment`, {
    method: "POST",
    headers: {
      "xi-api-key": API_KEY,
    },
    body: form,
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Forced alignment ${res.status}: ${body}`);
  }

  return res.json();
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

function loadJobs() {
  if (existsSync(BATCHES_PATH)) {
    const manifest = JSON.parse(readFileSync(BATCHES_PATH, "utf8"));
    /** @type {{ batchId: string; question: any; globalIndex: number; save: () => void }[]} */
    const jobs = [];
    let globalIndex = 0;
    for (const batch of manifest.batches) {
      if (onlyBatchId && batch.id !== onlyBatchId) {
        globalIndex += batch.questions.length;
        continue;
      }
      for (const question of batch.questions) {
        const gi = globalIndex++;
        jobs.push({
          batchId: batch.id,
          question,
          globalIndex: gi,
        });
      }
    }
    return {
      mode: "batches",
      manifest,
      jobs,
      save() {
        writeFileSync(BATCHES_PATH, `${JSON.stringify(manifest, null, 2)}\n`);
        // Keep legacy single-file in sync with first batch for convenience.
        if (manifest.batches[0]) {
          const first = manifest.batches[0];
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
      },
    };
  }

  const data = JSON.parse(readFileSync(QUESTIONS_PATH, "utf8"));
  const jobs = data.questions.map((question, globalIndex) => ({
    batchId: "QuizShort",
    question,
    globalIndex,
  }));
  return {
    mode: "questions",
    jobs,
    save() {
      writeFileSync(QUESTIONS_PATH, `${JSON.stringify(data, null, 2)}\n`);
    },
  };
}

function estimateAudioDurationSec(alignment) {
  if (!alignment?.character_end_times_seconds?.length) return null;
  const ends = alignment.character_end_times_seconds;
  return ends[ends.length - 1];
}

function findPhraseStartSec(phrase, alignment) {
  if (!alignment?.characters?.length) return null;
  const { characters, character_start_times_seconds: starts } = alignment;
  const { norm, map } = buildNormIndexMap(characters);
  const at = norm.indexOf(normalize(phrase));
  if (at === -1) return null;
  return starts[map[at] ?? 0] ?? null;
}

function voiceFileExists(filename) {
  const outPath = resolve(PUBLIC_DIR, filename);
  if (!existsSync(outPath)) return false;
  try {
    return statSync(outPath).size >= MIN_VOICE_BYTES;
  } catch {
    return false;
  }
}

function existingIntroMeta(manifest) {
  const fromManifest = {
    introVoice:
      manifest?.introVoice ??
      manifest?.batches?.[0]?.introVoice ??
      INTRO.voiceFile,
    introDurationSec:
      manifest?.introDurationSec ??
      manifest?.batches?.[0]?.introDurationSec ??
      INTRO.durationSec,
    introLine2AtSec:
      manifest?.introLine2AtSec ??
      manifest?.batches?.[0]?.introLine2AtSec ??
      INTRO.line2AtSec,
  };
  return fromManifest;
}

function applyIntroMeta(manifest, meta) {
  if (!manifest) return;
  manifest.title = INTRO.brand;
  manifest.introVoice = meta.introVoice;
  manifest.introDurationSec = meta.introDurationSec;
  manifest.introLine2AtSec = meta.introLine2AtSec;
  for (const batch of manifest.batches ?? []) {
    batch.title = INTRO.brand;
    batch.introVoice = meta.introVoice;
    batch.introDurationSec = meta.introDurationSec;
    batch.introLine2AtSec = meta.introLine2AtSec;
  }
}

function saveIntroSideFiles(loaded, introMeta) {
  if (loaded.mode === "batches") {
    applyIntroMeta(loaded.manifest, introMeta);
    loaded.save();
    if (loaded.manifest.batches[0]) {
      const first = loaded.manifest.batches[0];
      writeFileSync(
        QUESTIONS_PATH,
        `${JSON.stringify(
          {
            title: INTRO.brand,
            scorePrompt: first.scorePrompt,
            scoreSubtext: first.scoreSubtext,
            introVoice: introMeta.introVoice,
            introDurationSec: introMeta.introDurationSec,
            introLine2AtSec: introMeta.introLine2AtSec,
            questions: first.questions,
          },
          null,
          2,
        )}\n`,
      );
    }
    return;
  }

  const data = JSON.parse(readFileSync(QUESTIONS_PATH, "utf8"));
  data.title = INTRO.brand;
  Object.assign(data, introMeta);
  writeFileSync(QUESTIONS_PATH, `${JSON.stringify(data, null, 2)}\n`);
}

async function generateIntroVoice(manifest, { skipIfExists }) {
  const voiceFile = INTRO.voiceFile;
  console.log(`\n[intro] ${voiceFile}`);
  console.log(`  text: ${INTRO.line1} ${INTRO.line2}`);

  if (skipIfExists && voiceFileExists(voiceFile)) {
    const meta = existingIntroMeta(manifest);
    console.log(
      `  skip (already exists)  duration=${meta.introDurationSec}s line2At=${meta.introLine2AtSec}s`,
    );
    return { ...meta, skipped: true };
  }

  if (dryRun) {
    console.log("  would generate");
    return {
      introVoice: voiceFile,
      introDurationSec: INTRO.durationSec,
      introLine2AtSec: INTRO.line2AtSec,
      skipped: false,
    };
  }

  const introText = `${INTRO.line1} ${INTRO.line2}`;
  const result = await synthesizeWithTimestamps(introText);
  const audioBuffer = Buffer.from(result.audio_base64, "base64");
  const outPath = resolve(PUBLIC_DIR, voiceFile);
  writeFileSync(outPath, audioBuffer);
  console.log(`  wrote ${outPath} (${audioBuffer.length} bytes)`);

  const alignment = result.normalized_alignment ?? result.alignment;
  const spoken = estimateAudioDurationSec(alignment);
  const line2At =
    findPhraseStartSec(INTRO.line2, alignment) ?? INTRO.line2AtSec;
  const introDurationSec = Number(
    Math.max((spoken ?? INTRO.durationSec) + 0.45, 4.5).toFixed(2),
  );

  console.log(
    `  duration=${introDurationSec}s  line2At=${Number(line2At).toFixed(2)}s`,
  );

  const meta = {
    introVoice: voiceFile,
    introDurationSec,
    introLine2AtSec: Number(Number(line2At).toFixed(2)),
    skipped: false,
  };

  applyIntroMeta(manifest, meta);
  return meta;
}

async function main() {
  if (!dryRun && !API_KEY) {
    console.error(
      "Missing ELEVENLABS_API_KEY. Run npm run setup:env and set your key.",
    );
    process.exit(1);
  }

  mkdirSync(PUBLIC_DIR, { recursive: true });
  const loaded = loadJobs();

  console.log(
    dryRun
      ? "Dry run — no API calls."
      : `Generating voices with voice_id=${VOICE_ID}, model=${MODEL_ID}`,
  );
  console.log(`Source: ${loaded.mode}`);
  console.log(
    force
      ? "Mode: force regenerate"
      : "Mode: skip existing mp3 files (use --force to recreate)",
  );

  // Intro is opt-in only — never burns credits on normal `npm run voices`.
  if (introOnly) {
    const introMeta = await generateIntroVoice(
      loaded.mode === "batches" ? loaded.manifest : null,
      { skipIfExists: !force },
    );
    if (!dryRun && !introMeta.skipped) {
      saveIntroSideFiles(loaded, introMeta);
      console.log("\nIntro voice saved.");
    } else if (!dryRun && introMeta.skipped) {
      console.log("\nIntro already present — nothing to do.");
    }
    return;
  }

  const selected = loaded.jobs.filter((job) =>
    onlyIndexes ? onlyIndexes.includes(job.globalIndex) : true,
  );

  if (selected.length === 0) {
    console.error("No questions matched your filters.");
    process.exit(1);
  }

  let created = 0;
  let skipped = 0;
  let aligned = 0;

  for (const job of selected) {
    const { question, globalIndex, batchId } = job;
    const voiceFile = question.voice || `voice${globalIndex + 1}.mp3`;
    const outPath = resolve(PUBLIC_DIR, voiceFile);
    const hasAudio = !force && voiceFileExists(voiceFile);
    const hasWordTiming = isWordLevelSegments(question.segments);

    console.log(`\n[${globalIndex + 1}] ${batchId} → ${voiceFile}`);
    console.log(`  text: ${question.definition}`);

    // Keep existing audio; refresh word timings when they are missing / phrase-level.
    if (hasAudio && hasWordTiming) {
      console.log(
        `  skip (audio + ${question.segments.length} word timings already present)`,
      );
      skipped += 1;
      continue;
    }

    if (dryRun) {
      console.log(
        hasAudio
          ? "  would force-align existing audio → word timings"
          : "  would generate TTS + word timings",
      );
      created += 1;
      continue;
    }

    let segments = [];

    if (hasAudio) {
      console.log("  audio exists — force-aligning for word-by-word sync");
      try {
        const fa = await forceAlignAudio(outPath, question.definition);
        segments = wordsFromForcedAlignment(fa);
        if (segments.length === 0) {
          throw new Error("forced alignment returned no words");
        }
        aligned += 1;
      } catch (err) {
        console.warn(`  forced alignment failed: ${err.message}`);
        console.warn("  regenerating TTS with timestamps instead…");
        const result = await synthesizeWithTimestamps(question.definition);
        const audioBuffer = Buffer.from(result.audio_base64, "base64");
        writeFileSync(outPath, audioBuffer);
        console.log(`  wrote ${outPath} (${audioBuffer.length} bytes)`);
        const alignment = result.normalized_alignment ?? result.alignment;
        segments = wordsFromCharAlignment(alignment);
        created += 1;
      }
    } else {
      const result = await synthesizeWithTimestamps(question.definition);
      const audioBuffer = Buffer.from(result.audio_base64, "base64");
      writeFileSync(outPath, audioBuffer);
      console.log(`  wrote ${outPath} (${audioBuffer.length} bytes)`);

      const alignment = result.normalized_alignment ?? result.alignment;
      segments = wordsFromCharAlignment(alignment);

      // Prefer forced-alignment word starts when available (more accurate).
      if (segments.length === 0) {
        try {
          const fa = await forceAlignAudio(outPath, question.definition);
          segments = wordsFromForcedAlignment(fa);
        } catch {
          const phrases = autoPhrases(question.definition);
          segments = segmentsFromAlignment(phrases, alignment);
        }
      }
      created += 1;
    }

    if (segments.length === 0) {
      console.warn("  warning: no segments produced — using even fallback");
      const words = question.definition.trim().split(/\s+/).filter(Boolean);
      segments = words.map((text, i) => ({
        text,
        time: Number((0.08 + i * 0.28).toFixed(3)),
      }));
    }

    question.voice = voiceFile;
    question.segments = segments;
    console.log(
      "  words:",
      segments.map((s) => `${s.time}s "${s.text}"`).join(", "),
    );
  }

  if (!dryRun) {
    // Preserve any existing intro metadata; do not regenerate intro here.
    loaded.save();
    if (loaded.mode === "batches" && loaded.manifest.batches[0]) {
      const first = loaded.manifest.batches[0];
      const introMeta = existingIntroMeta(loaded.manifest);
      writeFileSync(
        QUESTIONS_PATH,
        `${JSON.stringify(
          {
            title: first.title ?? INTRO.brand,
            scorePrompt: first.scorePrompt,
            scoreSubtext: first.scoreSubtext,
            ...introMeta,
            questions: first.questions,
          },
          null,
          2,
        )}\n`,
      );
    }
  }

  console.log(
    `\nDone. generated=${created} aligned=${aligned} skipped=${skipped}${force ? " (forced)" : ""}`,
  );
  console.log("Intro is separate: npm run voices:intro");
  console.log("Next: npm run dev   or   npm run render:all");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

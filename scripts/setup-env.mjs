#!/usr/bin/env node
/**
 * Cross-platform helper: create .env from .env.example without needing `cp`.
 */
import { copyFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const example = resolve(root, ".env.example");
const envPath = resolve(root, ".env");

if (!existsSync(example)) {
  console.error("Missing .env.example");
  process.exit(1);
}

if (existsSync(envPath)) {
  console.log(".env already exists — leaving it unchanged.");
  console.log(`Edit it here: ${envPath}`);
  process.exit(0);
}

copyFileSync(example, envPath);
console.log(`Created ${envPath}`);
console.log("Open it and set ELEVENLABS_API_KEY=your_key_here");

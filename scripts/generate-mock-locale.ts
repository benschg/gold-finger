#!/usr/bin/env bun
// Generate mock Kannada locale from English
//
// Usage:
//   bun run scripts/generate-mock-locale.ts
//
// This creates kn.json with pseudo-Kannada text (Latin to Kannada-like chars).
// When viewing the app in Kannada, any text WITHOUT Kannada characters
// is a hardcoded string that hasn't been migrated to use translations.

import * as fs from "fs";
import * as path from "path";

const MESSAGES_DIR = path.join(process.cwd(), "messages");
const SOURCE_FILE = path.join(MESSAGES_DIR, "en.json");
const TARGET_FILE = path.join(MESSAGES_DIR, "kn.json");

// Map Latin chars to Kannada script (pseudo-localization)
// All letters and numbers are replaced - no English visible
const charMap: Record<string, string> = {
  // Lowercase letters
  a: "ಆ",
  b: "ಬ",
  c: "ಚ",
  d: "ದ",
  e: "ಎ",
  f: "ಫ",
  g: "ಗ",
  h: "ಹ",
  i: "ಇ",
  j: "ಜ",
  k: "ಕ",
  l: "ಲ",
  m: "ಮ",
  n: "ನ",
  o: "ಒ",
  p: "ಪ",
  q: "ಕ",
  r: "ರ",
  s: "ಸ",
  t: "ತ",
  u: "ಉ",
  v: "ವ",
  w: "ವ",
  x: "ಕ್ಸ",
  y: "ಯ",
  z: "ಜ",
  // Uppercase letters
  A: "ಆ",
  B: "ಬ",
  C: "ಚ",
  D: "ದ",
  E: "ಎ",
  F: "ಫ",
  G: "ಗ",
  H: "ಹ",
  I: "ಇ",
  J: "ಜ",
  K: "ಕ",
  L: "ಲ",
  M: "ಮ",
  N: "ನ",
  O: "ಒ",
  P: "ಪ",
  Q: "ಕ",
  R: "ರ",
  S: "ಸ",
  T: "ತ",
  U: "ಉ",
  V: "ವ",
  W: "ವ",
  X: "ಕ್ಸ",
  Y: "ಯ",
  Z: "ಜ",
  // Numbers (Kannada numerals)
  "0": "೦",
  "1": "೧",
  "2": "೨",
  "3": "೩",
  "4": "೪",
  "5": "೫",
  "6": "೬",
  "7": "೭",
  "8": "೮",
  "9": "೯",
};

function pseudoLocalize(text: string): string {
  let result = "";
  let i = 0;

  while (i < text.length) {
    // Preserve placeholders like {name}, {count}, etc.
    if (text[i] === "{") {
      const end = text.indexOf("}", i);
      if (end !== -1) {
        result += text.slice(i, end + 1);
        i = end + 1;
        continue;
      }
    }

    // Preserve HTML-like tags
    if (text[i] === "<") {
      const end = text.indexOf(">", i);
      if (end !== -1) {
        result += text.slice(i, end + 1);
        i = end + 1;
        continue;
      }
    }

    // Convert character or keep as-is
    const char = text[i];
    result += charMap[char] ?? char;
    i++;
  }

  return result;
}

function transformStrings(obj: unknown): unknown {
  if (typeof obj === "string") {
    return pseudoLocalize(obj);
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => transformStrings(item));
  }
  if (obj !== null && typeof obj === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = transformStrings(value);
    }
    return result;
  }
  return obj;
}

function main() {
  console.log("Generating mock Kannada locale...\n");

  if (!fs.existsSync(SOURCE_FILE)) {
    console.error(`Source file not found: ${SOURCE_FILE}`);
    process.exit(1);
  }

  const english = JSON.parse(fs.readFileSync(SOURCE_FILE, "utf-8"));
  const kannada = transformStrings(english);

  fs.writeFileSync(TARGET_FILE, JSON.stringify(kannada, null, 2) + "\n");

  console.log(`Generated: messages/kn.json`);
  console.log(`\nSwitch to Kannada in the app to see untranslated strings`);
  console.log(`(any text in Latin/English chars is hardcoded)\n`);
}

main();

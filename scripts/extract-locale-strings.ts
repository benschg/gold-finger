#!/usr/bin/env bun
// Locale string extraction helper for i18n
//
// Usage:
//   bun run scripts/extract-locale-strings.ts [options]
//
// Options:
//   --all              Scan all src files (default: src/components only)
//   --component <name> Scan files matching pattern
//   --output <file>    Generate JSON skeleton file
//   --check            CI mode: exit with code 1 if untranslated strings found
//
// Examples:
//   bun run scripts/extract-locale-strings.ts              # Scan src/components
//   bun run scripts/extract-locale-strings.ts --all        # Scan all src files
//   bun run scripts/extract-locale-strings.ts --check      # CI/pre-commit check

import { Glob } from "bun";
import * as fs from "fs";
import * as path from "path";

interface ExtractedString {
  file: string;
  line: number;
  text: string;
  context: string;
  suggestedKey: string;
  type: "jsx-text" | "attribute" | "ternary" | "template";
}

// Patterns to match user-facing strings
const patterns = [
  // JSX text content: >Some text< (excluding single words and technical strings)
  {
    regex: />([A-Z][^<>{}\n]{2,}?)</g,
    type: "jsx-text" as const,
  },
  // String literals in JSX attributes
  {
    regex:
      /(?:title|placeholder|label|alt|aria-label|description)=["']([^"']{3,})["']/g,
    type: "attribute" as const,
  },
  // Ternary text: ? "text" or : "text"
  {
    regex: /[?:]\s*["']([A-Za-z][^"']{2,})["']/g,
    type: "ternary" as const,
  },
];

// Patterns to exclude (technical strings, CSS, etc.)
const excludePatterns = [
  /^[a-z-]+$/, // CSS classes, IDs
  /^\/[a-z]/, // Paths
  /^#[0-9a-f]/i, // Colors
  /^\d+(\.\d+)?$/, // Numbers
  /^[A-Z_]+$/, // Constants
  /^(true|false|null|undefined)$/, // Keywords
  /^\s*$/, // Whitespace only
  /^[a-z]+:\/\//, // URLs
  /^\{/, // Template expressions
  /^className/, // React props
  /^on[A-Z]/, // Event handlers
];

function shouldExclude(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length < 3) return true;
  return excludePatterns.some((pattern) => pattern.test(trimmed));
}

function generateSuggestedKey(text: string, filename: string): string {
  // Extract component/feature name from filename
  const baseName = path.basename(filename, ".tsx");
  const feature = baseName
    .replace(/-/g, "_")
    .replace(/([A-Z])/g, "_$1")
    .toLowerCase()
    .replace(/^_/, "")
    .replace(/__+/g, "_");

  // Generate key from text (first few words)
  const key = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
    .split(/\s+/)
    .slice(0, 4)
    .join("_");

  return `${feature}.${key || "text"}`;
}

async function extractStringsFromFile(
  filePath: string,
): Promise<ExtractedString[]> {
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n");
  const results: ExtractedString[] = [];
  const seen = new Set<string>();

  // Check if file already uses translations
  if (
    content.includes("useTranslations") ||
    content.includes("getTranslations")
  ) {
    // Skip files that are already translated
    return [];
  }

  lines.forEach((line, index) => {
    // Skip import lines and comments
    if (line.trim().startsWith("import") || line.trim().startsWith("//")) {
      return;
    }

    patterns.forEach(({ regex, type }) => {
      let match;
      const re = new RegExp(regex.source, regex.flags);
      while ((match = re.exec(line)) !== null) {
        const text = match[1]?.trim();
        if (text && !shouldExclude(text) && !seen.has(text)) {
          seen.add(text);
          results.push({
            file: filePath,
            line: index + 1,
            text,
            context: line.trim().substring(0, 100),
            suggestedKey: generateSuggestedKey(text, filePath),
            type,
          });
        }
      }
    });
  });

  return results;
}

async function main() {
  const args = process.argv.slice(2);
  let globPattern = "src/components/**/*.tsx";
  let outputFile: string | null = null;
  let checkMode = false;

  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--all") {
      globPattern = "src/**/*.tsx";
    } else if (args[i] === "--component" && args[i + 1]) {
      globPattern = `src/**/*${args[++i]}*.tsx`;
    } else if (args[i] === "--output" && args[i + 1]) {
      outputFile = args[++i];
    } else if (args[i] === "--check") {
      checkMode = true;
    }
  }

  if (!checkMode) {
    console.log(`\n📝 Scanning for hardcoded strings...`);
    console.log(`   Pattern: ${globPattern}\n`);
  }

  const glob = new Glob(globPattern);
  const files: string[] = [];

  for await (const file of glob.scan({
    cwd: process.cwd(),
    absolute: true,
  })) {
    // Skip ui components (shadcn) - handle both / and \ separators
    if (file.includes("/ui/") || file.includes("\\ui\\")) continue;
    files.push(file);
  }

  if (!checkMode) {
    console.log(`   Found ${files.length} files to scan\n`);
  }

  const allStrings: ExtractedString[] = [];

  for (const file of files) {
    const strings = await extractStringsFromFile(file);
    allStrings.push(...strings);
  }

  // Group by file
  const byFile = allStrings.reduce(
    (acc, item) => {
      const relativePath = path.relative(process.cwd(), item.file);
      if (!acc[relativePath]) acc[relativePath] = [];
      acc[relativePath].push(item);
      return acc;
    },
    {} as Record<string, ExtractedString[]>,
  );

  const totalCount = allStrings.length;
  const fileCount = Object.keys(byFile).length;

  // Check mode: concise output for CI
  if (checkMode) {
    if (totalCount === 0) {
      console.log("✓ No untranslated strings found");
      process.exit(0);
    } else {
      console.error(
        `✗ Found ${totalCount} untranslated strings in ${fileCount} files:`,
      );
      for (const [file, strings] of Object.entries(byFile)) {
        for (const s of strings) {
          console.error(
            `  ${file}:${s.line}: "${s.text.substring(0, 40)}${s.text.length > 40 ? "..." : ""}"`,
          );
        }
      }
      console.error(`\nRun 'bun run i18n:extract' for details`);
      process.exit(1);
    }
  }

  // Normal mode: detailed report
  for (const [file, strings] of Object.entries(byFile)) {
    console.log(`\n📄 ${file}`);
    console.log("─".repeat(60));
    strings.forEach((s) => {
      console.log(
        `  Line ${s.line}: "${s.text.substring(0, 50)}${s.text.length > 50 ? "..." : ""}"`,
      );
      console.log(`    → Key: ${s.suggestedKey}`);
    });
  }

  if (totalCount === 0) {
    console.log(
      "✅ No hardcoded strings found (or all files already use translations)",
    );
  } else {
    console.log(`\n${"─".repeat(60)}`);
    console.log(`✅ Found ${totalCount} potential strings to translate`);
    console.log(`   across ${fileCount} files\n`);
  }

  // Generate JSON skeleton if output file specified
  if (outputFile) {
    const skeleton: Record<string, Record<string, string>> = {};
    allStrings.forEach((s) => {
      const [namespace, ...keyParts] = s.suggestedKey.split(".");
      const key = keyParts.join("_") || "text";
      if (!skeleton[namespace]) skeleton[namespace] = {};
      skeleton[namespace][key] = s.text;
    });

    fs.writeFileSync(outputFile, JSON.stringify(skeleton, null, 2));
    console.log(`📦 Generated ${outputFile}\n`);
  }
}

main().catch(console.error);

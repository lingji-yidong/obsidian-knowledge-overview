import assert from "node:assert/strict";
import test from "node:test";
import {
  parseFailedChapterDepth,
  parseFailedChapters,
  trimTrailingWhitespace,
} from "../src/utils";

void test("parses every supported knowledge depth from failure report metadata", () => {
  for (const depth of ["scan", "onboarding", "learn", "review"] as const) {
    const report = `---\nknowledgeDepth: ${depth}\n---\n`;

    assert.equal(parseFailedChapterDepth(report), depth);
  }
});

void test("returns null for missing or invalid knowledge depth metadata", () => {
  assert.equal(parseFailedChapterDepth("# Failed Chapters"), null);
  assert.equal(
    parseFailedChapterDepth("---\nknowledgeDepth: unsupported\n---"),
    null,
  );
});

void test("parses failed chapters when report includes depth frontmatter", () => {
  const report = [
    "---",
    "knowledgeDepth: review",
    "---",
    "",
    "# Subject Failed Chapters",
    "",
    "- 1. First chapter",
    "  - Error: Request failed",
    "- 12. Final chapter",
    "  - Error: Request failed",
  ].join("\n");

  assert.deepEqual(parseFailedChapters(report), [
    ["1", "First chapter"],
    ["12", "Final chapter"],
  ]);
});

void test("removes trailing whitespace without changing leading content", () => {
  assert.equal(trimTrailingWhitespace("  chapter body \n\t"), "  chapter body");
  assert.equal(trimTrailingWhitespace("chapter body"), "chapter body");
});

import assert from "node:assert/strict";
import test from "node:test";
import {
  countLearningChars,
  evaluateChapterQuality,
  getChapterQualityWarnings,
} from "../src/chapterQuality";
import type { DensitySpec } from "../src/instructionalTypes";

const TEST_DENSITY: DensitySpec = {
  label: "test",
  targetChars: { min: 100, ideal: 200, max: 300 },
  coreUnits: { min: 2, max: 3 },
  workedExamples: 0,
  concreteExamples: 1,
  retrievalQuestions: 1,
  failureModes: 1,
};

void test("counts code content as learning content", () => {
  const codeHeavy = "```ts\nconst meaningfulExample = 42;\n```";
  assert.ok(countLearningChars(codeHeavy) >= "constmeaningfulExample=42;".length);
});

void test("flags overly long chapters and heading depth jumps", () => {
  const text = [
    "## Main idea",
    "x".repeat(320),
    "#### Skipped level",
  ].join("\n\n");
  const report = evaluateChapterQuality(text, TEST_DENSITY);

  assert.equal(report.likelyTooLong, true);
  assert.equal(report.headingDepthJump, true);
  assert.ok(getChapterQualityWarnings(report).includes("above the chapter length target"));
});

void test("flags H4 even when heading depth does not jump", () => {
  const text = [
    "## Main idea",
    "x".repeat(150),
    "### Worked example",
    "#### Step one",
  ].join("\n\n");
  const report = evaluateChapterQuality(text, TEST_DENSITY);

  assert.equal(report.headingDepthJump, false);
  assert.equal(report.hasOverdeepHeading, true);
  assert.ok(getChapterQualityWarnings(report).includes("uses H4 or deeper headings"));
});

void test("ignores heading-like code comments inside fenced blocks", () => {
  const text = [
    "## Real section",
    "x".repeat(150),
    "```python",
    "# Example A",
    "## Not a Markdown section",
    "```",
    "## Second section",
  ].join("\n");
  const report = evaluateChapterQuality(text, TEST_DENSITY);

  assert.equal(report.unexpectedH1, false);
  assert.equal(report.h2Count, 2);
  assert.equal(report.headingCount, 2);
});

void test("validates invisible QA source anchors against real headings", () => {
  const text = [
    "## Sampling limits",
    "x".repeat(150),
    "## Review questions",
    "Why does aliasing occur? <!-- source: Sampling limits -->",
    "What is an unrelated term? <!-- source: Missing section -->",
  ].join("\n\n");
  const report = evaluateChapterQuality(text, TEST_DENSITY);

  assert.equal(report.questionCount, 2);
  assert.equal(report.qaAnchorCount, 2);
  assert.equal(report.invalidQaAnchorCount, 1);
});

void test("QA source anchors must name an H2 rather than a nested heading", () => {
  const text = [
    "## Sampling limits",
    "x".repeat(150),
    "### Aliasing example",
    "Why does aliasing occur? <!-- source: Aliasing example -->",
  ].join("\n\n");
  const report = evaluateChapterQuality(text, TEST_DENSITY);

  assert.equal(report.qaAnchorCount, 1);
  assert.equal(report.invalidQaAnchorCount, 1);
});

void test("counts numbered review items with multiline anchors and multiple questions", () => {
  const text = [
    "## Mechanism",
    "x".repeat(150),
    "## Review questions",
    "1. What happens? Why does it happen?",
    "   <!-- source: Mechanism -->",
    "",
    "2. Explain the mechanism without using a formula.",
    "   <!-- source: Mechanism -->",
  ].join("\n");
  const report = evaluateChapterQuality(text, TEST_DENSITY);

  assert.equal(report.questionCount, 2);
  assert.equal(report.qaAnchorCount, 2);
});

void test("counts an unanchored item in an otherwise grounded review list", () => {
  const text = [
    "## Mechanism",
    "x".repeat(150),
    "## Review questions",
    "1. What happens?",
    "   <!-- source: Mechanism -->",
    "",
    "2. Explain the mechanism.",
  ].join("\n");
  const report = evaluateChapterQuality(text, TEST_DENSITY);

  assert.equal(report.questionCount, 2);
  assert.equal(report.qaAnchorCount, 1);
  assert.ok(
    getChapterQualityWarnings(report).includes(
      "review questions must each cite exactly one source section",
    ),
  );
});

void test("uses the marked QA boundary instead of earlier numbered body lists", () => {
  const text = [
    "## Mechanism",
    "x".repeat(150),
    "1. First body misconception.",
    "2. Second body misconception.",
    "3. Third body misconception.",
    "## Review and interview questions <!-- qa-section -->",
    "1. What happens? <!-- source: Mechanism -->",
    "2. Why does it happen? <!-- source: Mechanism -->",
  ].join("\n\n");
  const report = evaluateChapterQuality(text, TEST_DENSITY);

  assert.equal(report.questionCount, 2);
  assert.equal(report.qaAnchorCount, 2);
  assert.equal(report.hasQaSectionBoundary, true);
});

void test("legacy QA parsing does not merge numbered lists across body prose", () => {
  const text = [
    "## Mechanism",
    "x".repeat(150),
    "1. First body misconception.",
    "2. Second body misconception.",
    "3. Third body misconception.",
    "**Review and interview questions**",
    "1. What happens? <!-- source: Mechanism -->",
    "2. Why does it happen? <!-- source: Mechanism -->",
  ].join("\n\n");
  const report = evaluateChapterQuality(text, TEST_DENSITY);

  assert.equal(report.questionCount, 2);
  assert.equal(report.qaAnchorCount, 2);
  assert.equal(report.hasQaSectionBoundary, false);
  assert.ok(
    getChapterQualityWarnings(report).includes(
      "missing deterministic QA section boundary",
    ),
  );
});

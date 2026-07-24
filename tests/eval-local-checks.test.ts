import assert from "node:assert/strict";
import test from "node:test";
import {
  STRUCTURAL_LENGTH_FLOOR_RATIO,
  evaluateLocalChapter,
  findRepeatedHeadingSkeletons,
} from "./eval/localChecks";
import type { EvaluationCase } from "./eval/types";

const CASE: EvaluationCase = {
  id: "test-case",
  discipline: "stem",
  description: "test",
  language: "zh_tw",
  depth: "scan",
  chapterNumber: "1",
  blueprint: {
    schemaVersion: 1,
    courseName: "Test",
    courseGoal: "Test the evaluator.",
    prerequisites: [],
    canonicalTerms: [],
    chapters: [
      {
        chapterNumber: "1",
        title: "Aliasing",
        focus: "Aliasing",
        subtopics: ["Nyquist"],
        learningObjectives: ["Explain aliasing"],
        prerequisites: [],
        outOfScope: [],
        knowledgeType: "mathematical",
        secondaryKnowledgeTypes: [],
        canonicalTerms: ["Nyquist"],
      },
    ],
  },
  lexicalExpectations: {
    mustCover: ["Nyquist"],
    outOfScope: ["compressed sensing"],
  },
};

const TERMINOLOGY_TABLE = [
  "## 關鍵術語對照 <!-- terminology-section -->",
  "| 繁體中文 | English |",
  "| --- | --- |",
  "| 取樣頻率 | sampling frequency |",
  "| 混疊 | aliasing |",
  "| 抗混疊濾波器 | anti-aliasing filter |",
  "| 頻譜 | spectrum |",
  "| 奈奎斯特頻率 | Nyquist frequency |",
].join("\n");

void test("local evaluator separates structural gates from lexical warnings", () => {
  const sections = [
    "## Sampling creates spectral copies",
    `取樣頻率 (sampling frequency)、混疊 (aliasing)、抗混疊濾波器 (anti-aliasing filter)、頻譜 (spectrum) 與奈奎斯特頻率 (Nyquist frequency)。 Nyquist ${"x".repeat(1800)}`,
    "## Overlap destroys identity",
    "x".repeat(1800),
    "## A numerical diagnosis",
    "x".repeat(1800),
    "## Prevention starts before the ADC",
    "x".repeat(1800),
    "## Questions that retrieve the mechanism <!-- qa-section -->",
    ...Array.from(
      { length: 4 },
      (_, index) =>
        `Why ${index}? <!-- source: Sampling creates spectral copies -->`,
    ),
    TERMINOLOGY_TABLE,
  ];
  const metrics = evaluateLocalChapter(CASE, sections.join("\n\n"));

  assert.equal(metrics.structuralPass, true);
  assert.equal(metrics.qa.anchorCoverage, 1);
  assert.equal(metrics.terminology.inlineBilingualTermCount, 5);
  assert.equal(metrics.terminology.rowCount, 5);
  assert.equal(metrics.terminology.hasExpectedColumns, true);
  assert.equal(metrics.terminology.englishTermRowCount, 5);
  assert.deepEqual(metrics.lexicalScope.coveredMustCoverTerms, ["Nyquist"]);
});

void test("local evaluator rejects a monolingual terminology table", () => {
  const content = [
    "## Sampling creates spectral copies",
    `取樣頻率 (sampling frequency)、混疊 (aliasing)、抗混疊濾波器 (anti-aliasing filter)、頻譜 (spectrum) 與奈奎斯特頻率 (Nyquist frequency)。 Nyquist ${"x".repeat(7200)}`,
    "## Questions that retrieve the mechanism <!-- qa-section -->",
    "1. Why? <!-- source: Sampling creates spectral copies -->",
    [
      "## 關鍵術語對照 <!-- terminology-section -->",
      "| 繁體中文 | English |",
      "| --- | --- |",
      "| 取樣頻率 | 取樣頻率 |",
      "| 混疊 | 混疊 |",
      "| 濾波器 | 濾波器 |",
      "| 頻譜 | 頻譜 |",
      "| 奈奎斯特頻率 | 奈奎斯特頻率 |",
    ].join("\n"),
  ].join("\n\n");
  const metrics = evaluateLocalChapter(CASE, content);

  assert.equal(metrics.terminology.hasExpectedColumns, true);
  assert.equal(metrics.terminology.englishTermRowCount, 0);
  assert.equal(metrics.structuralPass, false);
  assert.ok(
    metrics.warnings.includes(
      "final terminology table contains too few English terms",
    ),
  );
});

void test("a chapter near the target is warned without failing structurally", () => {
  const sections = [
    "## Sampling creates spectral copies",
    `取樣頻率 (sampling frequency)、混疊 (aliasing)、抗混疊濾波器 (anti-aliasing filter)、頻譜 (spectrum) 與奈奎斯特頻率 (Nyquist frequency)。 Nyquist ${"x".repeat(1450)}`,
    "## Overlap destroys identity",
    "x".repeat(1450),
    "## A numerical diagnosis",
    "x".repeat(1450),
    "## Prevention starts before the ADC",
    "x".repeat(1450),
    "## Questions that retrieve the mechanism <!-- qa-section -->",
    ...Array.from(
      { length: 4 },
      (_, index) =>
        `Why ${index}? <!-- source: Sampling creates spectral copies -->`,
    ),
    TERMINOLOGY_TABLE,
  ];
  const metrics = evaluateLocalChapter(CASE, sections.join("\n\n"));

  assert.equal(STRUCTURAL_LENGTH_FLOOR_RATIO, 0.8);
  assert.equal(metrics.quality.likelyTooShort, true);
  assert.equal(metrics.lengthGate.meetsTarget, false);
  assert.equal(metrics.lengthGate.meetsStructuralFloor, true);
  assert.equal(metrics.structuralPass, true);
  assert.ok(metrics.warnings.includes("below the chapter length target"));
});

void test("a chapter far below the target still fails structurally", () => {
  const sections = [
    "## Sampling creates spectral copies",
    `Nyquist ${"x".repeat(1200)}`,
    "## Overlap destroys identity",
    "x".repeat(1200),
    "## A numerical diagnosis",
    "x".repeat(1200),
    "## Prevention starts before the ADC",
    "x".repeat(1200),
    "## Questions that retrieve the mechanism <!-- qa-section -->",
    ...Array.from(
      { length: 4 },
      (_, index) =>
        `Why ${index}? <!-- source: Sampling creates spectral copies -->`,
    ),
  ];
  const metrics = evaluateLocalChapter(CASE, sections.join("\n\n"));

  assert.equal(metrics.lengthGate.meetsStructuralFloor, false);
  assert.equal(metrics.structuralPass, false);
  assert.ok(metrics.warnings.includes("far below the structural length floor"));
});

void test("local evaluator flags formulaic generic H2 headings", () => {
  const content = [
    "## Introduction",
    "## Core Concepts",
    "## Examples",
    "## Applications",
    "## Review Questions",
  ].join("\n\n");
  const metrics = evaluateLocalChapter(CASE, content);

  assert.equal(metrics.headings.genericH2Ratio, 1);
  assert.equal(metrics.structuralPass, false);
  assert.ok(metrics.warnings.includes("too many generic H2 headings"));
});

void test("local evaluator rejects math delimiters Obsidian cannot render", () => {
  const content = [
    "## Sampling creates spectral copies",
    `Nyquist \\(f_s > 2f_{max}\\) ${"x".repeat(1800)}`,
    "## Overlap destroys identity",
    "x".repeat(1800),
    "## A numerical diagnosis",
    "x".repeat(1800),
    "## Prevention starts before the ADC",
    "x".repeat(1800),
    "## Questions that retrieve the mechanism <!-- qa-section -->",
    ...Array.from(
      { length: 4 },
      (_, index) =>
        `Why ${index}? <!-- source: Sampling creates spectral copies -->`,
    ),
  ].join("\n\n");
  const metrics = evaluateLocalChapter(CASE, content);

  assert.equal(metrics.format.usesUnsupportedMathDelimiters, true);
  assert.equal(metrics.structuralPass, false);
  assert.ok(
    metrics.warnings.includes(
      "uses math delimiters that Obsidian does not render",
    ),
  );
});

void test("local evaluator rejects H4 fragmentation", () => {
  const content = [
    "## Sampling creates spectral copies",
    `Nyquist ${"x".repeat(1800)}`,
    "### Worked example",
    "#### Step one",
    "## Overlap destroys identity",
    "x".repeat(1800),
    "## A numerical diagnosis",
    "x".repeat(1800),
    "## Prevention starts before the ADC",
    "x".repeat(1800),
    "## Questions that retrieve the mechanism <!-- qa-section -->",
    ...Array.from(
      { length: 4 },
      (_, index) =>
        `Why ${index}? <!-- source: Sampling creates spectral copies -->`,
    ),
  ].join("\n\n");
  const metrics = evaluateLocalChapter(CASE, content);

  assert.equal(metrics.quality.hasOverdeepHeading, true);
  assert.equal(metrics.structuralPass, false);
  assert.ok(metrics.warnings.includes("uses H4 or deeper headings"));
});

void test("section numbers cannot hide formulaic generic H2 headings", () => {
  const content = [
    "## 3.1 Introduction",
    "## 3.2 Core Concepts",
    "## 3.3 Examples",
    "## 3.4 Applications",
    "## 3.5 Review Questions <!-- qa-section -->",
  ].join("\n\n");
  const metrics = evaluateLocalChapter(CASE, content);

  assert.equal(metrics.headings.genericH2Ratio, 1);
  assert.equal(metrics.structuralPass, false);
  assert.ok(metrics.warnings.includes("too many generic H2 headings"));
});

void test("lexical checks ignore harmless spaces and slashes", () => {
  const evaluationCase: EvaluationCase = {
    ...CASE,
    lexicalExpectations: {
      mustCover: ["A/A test"],
      outOfScope: [],
    },
  };
  const content = [
    "## Experiment calibration",
    `AA test ${"x".repeat(1800)}`,
    "## Assignment diagnostics",
    "x".repeat(1800),
    "## Repeated checks",
    "x".repeat(1800),
    "## Failure interpretation",
    "x".repeat(1800),
    "## Retrieval",
    "1. Explain calibration.",
    "   <!-- source: Experiment calibration -->",
  ].join("\n\n");
  const metrics = evaluateLocalChapter(evaluationCase, content);

  assert.deepEqual(metrics.lexicalScope.missingMustCoverTerms, []);
});

void test("repeated heading checks ignore marked QA and terminology headings", () => {
  const first = evaluateLocalChapter(
    CASE,
    [
      "## First mechanism",
      "Nyquist",
      "## Review questions <!-- qa-section -->",
      "1. Explain it. <!-- source: First mechanism -->",
      TERMINOLOGY_TABLE,
    ].join("\n\n"),
  );
  const second = evaluateLocalChapter(
    { ...CASE, id: "second-case" },
    [
      "## Second mechanism",
      "Nyquist",
      "## Review questions <!-- qa-section -->",
      "1. Explain it. <!-- source: Second mechanism -->",
      TERMINOLOGY_TABLE,
    ].join("\n\n"),
  );

  assert.deepEqual(findRepeatedHeadingSkeletons([first, second]), []);
});

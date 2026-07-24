import assert from "node:assert/strict";
import test from "node:test";
import {
  numberChapterHeadings,
  stripChapterSectionNumber,
} from "../src/chapter-numbering";

void test("numbers H2 and nested headings from the chapter number", () => {
  const content = [
    "## Page faults start in address translation",
    "Body",
    "### Recoverable faults",
    "Body",
    "### Illegal access",
    "Body",
    "## Working sets change over time",
    "Body",
    "#### This depth jump stays visible",
  ].join("\n");

  assert.equal(
    numberChapterHeadings(content, "3"),
    [
      "## 3.1 Page faults start in address translation",
      "Body",
      "### 3.1.1 Recoverable faults",
      "Body",
      "### 3.1.2 Illegal access",
      "Body",
      "## 3.2 Working sets change over time",
      "Body",
      "#### This depth jump stays visible",
    ].join("\n"),
  );
});

void test("keeps invisible QA anchors aligned with numbered H2 titles", () => {
  const content = [
    "## 機制如何運作",
    "正文",
    "## 複習與面試問題 <!-- qa-section -->",
    "1. 為什麼？ <!-- source: 機制如何運作 -->",
  ].join("\n");
  const numbered = numberChapterHeadings(content, "2");

  assert.match(numbered, /^## 2\.1 機制如何運作/m);
  assert.match(numbered, /^## 2\.2 複習與面試問題 <!-- qa-section -->/m);
  assert.match(numbered, /<!-- source: 2\.1 機制如何運作 -->/);
});

void test("preserves the final terminology marker while numbering its heading", () => {
  const content = [
    "## 機制如何運作",
    "正文",
    "## 複習與面試問題 <!-- qa-section -->",
    "1. 為什麼？ <!-- source: 機制如何運作 -->",
    "## 關鍵術語對照 <!-- terminology-section -->",
    "| 繁體中文 | English |",
    "| --- | --- |",
    "| 機制 | mechanism |",
  ].join("\n");
  const numbered = numberChapterHeadings(content, "2");

  assert.match(numbered, /^## 2\.3 關鍵術語對照 <!-- terminology-section -->/m);
  assert.match(numbered, /\| 機制 \| mechanism \|\s*$/);
});

void test("numbering is idempotent and ignores fenced examples", () => {
  const content = [
    "## 4.1 Actual section",
    "```markdown",
    "## Example heading",
    "<!-- source: Example heading -->",
    "```",
    "## 4.2 Questions <!-- qa-section -->",
    "1. Explain it. <!-- source: 4.1 Actual section -->",
  ].join("\n");
  const once = numberChapterHeadings(content, "4");

  assert.equal(numberChapterHeadings(once, "4"), once);
  assert.match(once, /```markdown\n## Example heading/);
  assert.match(once, /<!-- source: Example heading -->\n```/);
});

void test("strips only textbook-style numeric prefixes", () => {
  assert.equal(stripChapterSectionNumber("3.1.2 Nested idea"), "Nested idea");
  assert.equal(stripChapterSectionNumber("1789 年的危機"), "1789 年的危機");
});

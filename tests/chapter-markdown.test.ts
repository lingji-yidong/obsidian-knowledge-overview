import assert from "node:assert/strict";
import test from "node:test";
import { normalizeObsidianMathDelimiters } from "../src/chapter-markdown";

void test("normalizes common LaTeX delimiters for Obsidian", () => {
  const content = [
    "The state is \\(\\psi\\) and \\(E = mc^2\\).",
    "\\[",
    "E = h\\nu",
    "\\]",
    "Correct math stays $x^2$.",
  ].join("\n");

  assert.equal(
    normalizeObsidianMathDelimiters(content),
    [
      "The state is $\\psi$ and $E = mc^2$.",
      "$$",
      "E = h\\nu",
      "$$",
      "Correct math stays $x^2$.",
    ].join("\n"),
  );
});

void test("does not rewrite math delimiters shown as code", () => {
  const content = [
    "Keep `\\(example\\)` literal.",
    "```latex",
    "\\(",
    "x + y",
    "\\)",
    "```",
  ].join("\n");

  assert.equal(normalizeObsidianMathDelimiters(content), content);
});

void test("preserves indentation around display math delimiters", () => {
  const content = "\t  \\[\n  x + y\n\t  \\]";

  assert.equal(
    normalizeObsidianMathDelimiters(content),
    "\t  $$\n  x + y\n\t  $$",
  );
});

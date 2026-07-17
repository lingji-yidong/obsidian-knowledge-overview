import assert from "node:assert/strict";
import test from "node:test";
import {
  parseGenerationProvenance,
  renderGenerationProvenance,
  stripGenerationProvenance,
} from "../src/generationProvenance";

void test("renders and parses chapter generation provenance", () => {
  const footer = renderGenerationProvenance({
    model: "deepseek-v4-flash",
    promptTokens: 1200,
    completionTokens: 8800,
    totalTokens: 10000,
    reasoningTokens: undefined,
  });

  assert.match(footer, /Model: `deepseek-v4-flash`/);
  assert.match(footer, /10,000 total \(prompt 1,200 \/ completion 8,800\)/);
  assert.deepEqual(parseGenerationProvenance(footer), {
    model: "deepseek-v4-flash",
    promptTokens: 1200,
    completionTokens: 8800,
    totalTokens: 10000,
    reasoningTokens: undefined,
  });
  assert.equal(
    stripGenerationProvenance(`chapter body\n\n${footer}`),
    "chapter body",
  );
});

void test("does not invent missing provider token usage", () => {
  const footer = renderGenerationProvenance({ model: "provider-model" });

  assert.match(footer, /Tokens: unavailable/);
  assert.deepEqual(parseGenerationProvenance(footer), {
    model: "provider-model",
    promptTokens: undefined,
    completionTokens: undefined,
    totalTokens: undefined,
    reasoningTokens: undefined,
  });
});

void test("derives total only when both token components exist", () => {
  const footer = renderGenerationProvenance({
    model: "model`\n<!-- bad -->",
    promptTokens: 10,
    completionTokens: 20,
  });
  const parsed = parseGenerationProvenance(footer);

  assert.equal(parsed?.totalTokens, 30);
  assert.doesNotMatch(footer, /model`\n/);
});

void test("shows reasoning tokens as part of completion usage", () => {
  const footer = renderGenerationProvenance({
    model: "thinking-model",
    promptTokens: 100,
    completionTokens: 500,
    totalTokens: 600,
    reasoningTokens: 350,
  });

  assert.match(footer, /reasoning 350 within completion/);
  assert.equal(parseGenerationProvenance(footer)?.reasoningTokens, 350);
});

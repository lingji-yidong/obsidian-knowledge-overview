import assert from "node:assert/strict";
import test from "node:test";
import {
  buildEvaluationPlan,
  loadEvaluationCorpus,
  selectEvaluationCases,
  validateLivePlan,
} from "./eval/config";
import {
  countPreparedPromptBytes,
  fingerprintPreparedPrompts,
  prepareEvaluationCases,
} from "./eval/runner";
import type { EvaluationConfig } from "./eval/types";

const CONFIG: EvaluationConfig = {
  apiBaseUrl: "https://example.test/v1",
  apiKey: "not-a-real-key",
  model: "generator-under-test",
  profile: "smoke",
  maxLogicalRequests: 4,
  maxPhysicalRequests: 6,
  maxCompletionTokens: 14000,
  maxTotalTokens: 80000,
  concurrency: 1,
  requestTimeoutMs: 300000,
  temperature: 0.3,
  reasoningEffort: null,
  verbosity: null,
  thinkingMode: "auto",
};

void test("smoke corpus prepares four fixed one-call chapter prompts", () => {
  const corpus = loadEvaluationCorpus();
  const selection = selectEvaluationCases(corpus, "smoke");
  const prepared = prepareEvaluationCases(selection);
  const plan = buildEvaluationPlan(
    selection,
    CONFIG,
    countPreparedPromptBytes(prepared),
    fingerprintPreparedPrompts(prepared),
  );

  assert.equal(prepared.length, 4);
  assert.equal(plan.logicalRequests, 4);
  assert.equal(plan.maxOutputTokens, 56000);
  assert.ok(plan.promptBytes > 0);
  assert.doesNotThrow(() => validateLivePlan(plan, CONFIG));
});

void test("live preflight rejects a profile above its explicit request cap", () => {
  const corpus = loadEvaluationCorpus();
  const selection = selectEvaluationCases(corpus, "full");
  const prepared = prepareEvaluationCases(selection);
  const plan = buildEvaluationPlan(
    selection,
    CONFIG,
    countPreparedPromptBytes(prepared),
    fingerprintPreparedPrompts(prepared),
  );

  assert.equal(prepared.length, 12);
  assert.equal(plan.logicalRequests, 12);
  assert.equal(plan.maxOutputTokens, 168000);
  assert.throws(
    () => validateLivePlan(plan, CONFIG),
    /EVAL_MAX_LOGICAL_REQUESTS/,
  );
});

void test("theory profile isolates four theoretical science cases", () => {
  const corpus = loadEvaluationCorpus();
  const selection = selectEvaluationCases(corpus, "theory");

  assert.deepEqual(
    selection.cases.map((item) => item.id),
    [
      "stem-chemical-equilibrium",
      "stem-population-genetics",
      "stem-lagrangian-mechanics",
      "stem-option-pricing-no-arbitrage",
    ],
  );
  assert.ok(
    selection.cases.every((item) => {
      const chapter = item.blueprint.chapters.find(
        (candidate) => candidate.chapterNumber === item.chapterNumber,
      );
      return chapter?.knowledgeType === "mathematical";
    }),
  );
});

void test("one explicit case creates a one-request canary plan", () => {
  const corpus = loadEvaluationCorpus();
  const selection = selectEvaluationCases(
    corpus,
    "smoke",
    "humanities-unreliable-narrator",
  );
  const plan = buildEvaluationPlan(
    selection,
    { ...CONFIG, profile: selection.profile },
    countPreparedPromptBytes(prepareEvaluationCases(selection)),
    fingerprintPreparedPrompts(prepareEvaluationCases(selection)),
  );

  assert.equal(plan.logicalRequests, 1);
  assert.deepEqual(plan.caseIds, ["humanities-unreliable-narrator"]);
});

void test("model comparison profile keeps paid upgrades to two hard cases", () => {
  const corpus = loadEvaluationCorpus();
  const selection = selectEvaluationCases(corpus, "model-comparison");

  assert.deepEqual(
    selection.cases.map((item) => item.id),
    ["stem-ab-test-leakage", "humanities-french-revolution"],
  );
});

void test("plan confirmation changes when exact prompt content changes", () => {
  const corpus = loadEvaluationCorpus();
  const selection = selectEvaluationCases(corpus, "smoke");
  const prepared = prepareEvaluationCases(selection);
  const fingerprint = fingerprintPreparedPrompts(prepared);
  const original = buildEvaluationPlan(
    selection,
    CONFIG,
    countPreparedPromptBytes(prepared),
    fingerprint,
  );
  const changed = buildEvaluationPlan(
    selection,
    CONFIG,
    countPreparedPromptBytes(prepared),
    `${fingerprint}-changed`,
  );

  assert.notEqual(original.planId, changed.planId);
});

void test("plan confirmation binds reasoning and verbosity settings", () => {
  const corpus = loadEvaluationCorpus();
  const selection = selectEvaluationCases(corpus, "model-comparison");
  const prepared = prepareEvaluationCases(selection);
  const promptBytes = countPreparedPromptBytes(prepared);
  const promptFingerprint = fingerprintPreparedPrompts(prepared);
  const baseline = buildEvaluationPlan(
    selection,
    CONFIG,
    promptBytes,
    promptFingerprint,
  );
  const tuned = buildEvaluationPlan(
    selection,
    { ...CONFIG, reasoningEffort: "high", verbosity: "high" },
    promptBytes,
    promptFingerprint,
  );

  assert.notEqual(baseline.planId, tuned.planId);
});

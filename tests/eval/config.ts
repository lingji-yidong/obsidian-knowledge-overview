import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import type {
  EvaluationCase,
  EvaluationConfig,
  EvaluationCorpus,
} from "./types";
import type {
  ReasoningEffort,
  ThinkingMode,
  Verbosity,
} from "../../src/chatCompletion";

export interface EvaluationSelection {
  corpus: EvaluationCorpus;
  cases: EvaluationCase[];
  profile: string;
}

export interface EvaluationPlan {
  planId: string;
  caseIds: string[];
  logicalRequests: number;
  maxOutputTokens: number;
  promptBytes: number;
  promptFingerprint: string;
  worstCaseUsd?: number;
}

function parseEnvLine(line: string): [string, string] | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) return null;

  const withoutExport = trimmed.startsWith("export ")
    ? trimmed.slice("export ".length)
    : trimmed;
  const separator = withoutExport.indexOf("=");
  if (separator <= 0) return null;

  const key = withoutExport.slice(0, separator).trim();
  let value = withoutExport.slice(separator + 1).trim();
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }

  return /^[A-Z][A-Z0-9_]*$/.test(key) ? [key, value] : null;
}

/** Load the local evaluation env without overwriting shell-provided values. */
export function loadLocalEvaluationEnv(
  filePath = resolve(".env.eval.local"),
): void {
  if (!existsSync(filePath)) return;

  for (const line of readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const parsed = parseEnvLine(line);
    if (!parsed) continue;
    const [key, value] = parsed;
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

function readPositiveNumber(
  name: string,
  fallback: number,
): number {
  const raw = process.env[name]?.trim();
  if (!raw) return fallback;

  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${name} must be a positive number`);
  }
  return Math.floor(value);
}

function readNonNegativeNumber(name: string, fallback: number): number {
  const raw = process.env[name]?.trim();
  if (!raw) return fallback;

  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${name} must be a non-negative number`);
  }
  return value;
}

function readOptionalNonNegativeNumber(name: string): number | undefined {
  const raw = process.env[name]?.trim();
  if (!raw) return undefined;

  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${name} must be a non-negative number when set`);
  }
  return value;
}

function readThinkingMode(): ThinkingMode {
  const value = process.env.EVAL_THINKING_MODE?.trim() || "auto";
  if (value !== "auto" && value !== "enabled" && value !== "disabled") {
    throw new Error("EVAL_THINKING_MODE must be auto, enabled, or disabled");
  }
  return value;
}

function readReasoningEffort(): ReasoningEffort | null {
  const value = process.env.EVAL_REASONING_EFFORT?.trim();
  if (!value) return null;

  const supported: ReasoningEffort[] = [
    "none",
    "minimal",
    "low",
    "medium",
    "high",
    "xhigh",
    "max",
  ];
  if (!supported.includes(value as ReasoningEffort)) {
    throw new Error(
      `EVAL_REASONING_EFFORT must be one of: ${supported.join(", ")}`,
    );
  }
  return value as ReasoningEffort;
}

function readVerbosity(): Verbosity | null {
  const value = process.env.EVAL_VERBOSITY?.trim();
  if (!value) return null;
  if (value !== "low" && value !== "medium" && value !== "high") {
    throw new Error("EVAL_VERBOSITY must be low, medium, or high");
  }
  return value;
}

/** Build a sanitized runtime configuration from the generator-only env. */
export function readEvaluationConfig(profile: string): EvaluationConfig {
  const config: EvaluationConfig = {
    apiBaseUrl: process.env.EVAL_API_BASE_URL?.trim() ?? "",
    apiKey: process.env.EVAL_API_KEY?.trim() ?? "",
    model: process.env.EVAL_MODEL?.trim() ?? "",
    profile,
    maxLogicalRequests: readPositiveNumber(
      "EVAL_MAX_LOGICAL_REQUESTS",
      4,
    ),
    maxPhysicalRequests: readPositiveNumber(
      "EVAL_MAX_PHYSICAL_REQUESTS",
      6,
    ),
    maxCompletionTokens: readPositiveNumber(
      "EVAL_MAX_COMPLETION_TOKENS",
      14000,
    ),
    maxTotalTokens: readPositiveNumber("EVAL_MAX_TOTAL_TOKENS", 80000),
    concurrency: readPositiveNumber("EVAL_CONCURRENCY", 1),
    requestTimeoutMs: readPositiveNumber(
      "EVAL_REQUEST_TIMEOUT_MS",
      300000,
    ),
    temperature:
      process.env.EVAL_TEMPERATURE?.trim()
        ? readNonNegativeNumber("EVAL_TEMPERATURE", 0)
        : null,
    reasoningEffort: readReasoningEffort(),
    verbosity: readVerbosity(),
    thinkingMode: readThinkingMode(),
    inputUsdPerMillion: readOptionalNonNegativeNumber(
      "EVAL_INPUT_USD_PER_MILLION",
    ),
    outputUsdPerMillion: readOptionalNonNegativeNumber(
      "EVAL_OUTPUT_USD_PER_MILLION",
    ),
    maxUsd: readOptionalNonNegativeNumber("EVAL_MAX_USD"),
  };

  if (config.concurrency > config.maxPhysicalRequests) {
    throw new Error(
      "EVAL_CONCURRENCY cannot exceed EVAL_MAX_PHYSICAL_REQUESTS",
    );
  }
  return config;
}

function assertCorpus(value: unknown): asserts value is EvaluationCorpus {
  if (!value || typeof value !== "object") {
    throw new Error("Evaluation corpus must be a JSON object");
  }

  const corpus = value as Partial<EvaluationCorpus>;
  if (
    corpus.schemaVersion !== 1 ||
    typeof corpus.suiteVersion !== "string" ||
    !corpus.profiles ||
    !Array.isArray(corpus.cases)
  ) {
    throw new Error("Evaluation corpus has an unsupported schema");
  }
}

/** Load the committed, reviewable evaluation corpus. */
export function loadEvaluationCorpus(
  filePath = resolve("tests/eval/corpus/v1/manifest.json"),
): EvaluationCorpus {
  const parsed: unknown = JSON.parse(readFileSync(filePath, "utf8"));
  assertCorpus(parsed);
  return parsed;
}

/** Select either a named profile or one explicit one-call canary case. */
export function selectEvaluationCases(
  corpus: EvaluationCorpus,
  profile: string,
  caseId?: string,
): EvaluationSelection {
  const selectedIds = caseId ? [caseId] : corpus.profiles[profile];
  if (!selectedIds) {
    throw new Error(`Unknown evaluation profile: ${profile}`);
  }

  const caseById = new Map(corpus.cases.map((item) => [item.id, item]));
  const cases = selectedIds.map((id) => {
    const selected = caseById.get(id);
    if (!selected) throw new Error(`Evaluation case not found: ${id}`);
    return selected;
  });

  return {
    corpus,
    cases,
    profile: caseId ? `case:${caseId}` : profile,
  };
}

/** Create a stable confirmation ID and worst-case preflight estimate. */
export function buildEvaluationPlan(
  selection: EvaluationSelection,
  config: EvaluationConfig,
  promptBytes: number,
  promptFingerprint: string,
): EvaluationPlan {
  const logicalRequests = selection.cases.length;
  const maxOutputTokens = logicalRequests * config.maxCompletionTokens;
  const hasPricing =
    config.inputUsdPerMillion !== undefined &&
    config.outputUsdPerMillion !== undefined;
  const worstCaseUsd = hasPricing
    ? (promptBytes * config.inputUsdPerMillion!) / 1_000_000 +
      (maxOutputTokens * config.outputUsdPerMillion!) / 1_000_000
    : undefined;
  const fingerprint = JSON.stringify({
    suiteVersion: selection.corpus.suiteVersion,
    profile: selection.profile,
    caseIds: selection.cases.map((item) => item.id),
    model: config.model,
    maxCompletionTokens: config.maxCompletionTokens,
    maxLogicalRequests: config.maxLogicalRequests,
    maxPhysicalRequests: config.maxPhysicalRequests,
    maxTotalTokens: config.maxTotalTokens,
    concurrency: config.concurrency,
    requestTimeoutMs: config.requestTimeoutMs,
    temperature: config.temperature,
    reasoningEffort: config.reasoningEffort,
    verbosity: config.verbosity,
    thinkingMode: config.thinkingMode,
    apiBaseUrl: config.apiBaseUrl,
    inputUsdPerMillion: config.inputUsdPerMillion,
    outputUsdPerMillion: config.outputUsdPerMillion,
    maxUsd: config.maxUsd,
    promptFingerprint,
  });
  const planId = createHash("sha256").update(fingerprint).digest("hex").slice(0, 12);

  return {
    planId,
    caseIds: selection.cases.map((item) => item.id),
    logicalRequests,
    maxOutputTokens,
    promptBytes,
    promptFingerprint,
    worstCaseUsd,
  };
}

/** Reject a live run whose explicit caps cannot cover the selected plan. */
export function validateLivePlan(
  plan: EvaluationPlan,
  config: EvaluationConfig,
): void {
  if (!config.apiBaseUrl || !config.apiKey || !config.model) {
    throw new Error(
      "EVAL_API_BASE_URL, EVAL_API_KEY, and EVAL_MODEL are required for live generation",
    );
  }
  if (plan.logicalRequests > config.maxLogicalRequests) {
    throw new Error(
      `Plan needs ${plan.logicalRequests} logical requests but EVAL_MAX_LOGICAL_REQUESTS is ${config.maxLogicalRequests}`,
    );
  }
  if (plan.logicalRequests > config.maxPhysicalRequests) {
    throw new Error(
      `Plan needs at least ${plan.logicalRequests} physical requests but EVAL_MAX_PHYSICAL_REQUESTS is ${config.maxPhysicalRequests}`,
    );
  }
  if (plan.maxOutputTokens > config.maxTotalTokens) {
    throw new Error(
      `Worst-case output tokens ${plan.maxOutputTokens} exceed EVAL_MAX_TOTAL_TOKENS ${config.maxTotalTokens}`,
    );
  }
  if (
    config.maxUsd !== undefined &&
    plan.worstCaseUsd !== undefined &&
    plan.worstCaseUsd > config.maxUsd
  ) {
    throw new Error(
      `Worst-case cost $${plan.worstCaseUsd.toFixed(4)} exceeds EVAL_MAX_USD $${config.maxUsd.toFixed(4)}`,
    );
  }
}

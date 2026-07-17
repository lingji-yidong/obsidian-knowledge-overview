import { createHash } from "node:crypto";
import {
  mkdir,
  open,
  readFile,
  rename,
  unlink,
  writeFile,
} from "node:fs/promises";
import { relative, resolve, sep } from "node:path";
import {
  GenerationCancelledError,
  executeChatCompletion,
  type ChatHttpResponse,
  type ChatRequestEvent,
} from "../../src/chatCompletion";
import { DENSITY_PRESETS } from "../../src/densityPresets";
import {
  normalizeGenerationProvenance,
  renderGenerationProvenance,
  stripGenerationProvenance,
  type GenerationProvenance,
} from "../../src/generationProvenance";
import { numberChapterHeadings } from "../../src/chapter-numbering";
import {
  buildBlueprintPlan,
  selectAdapter,
} from "../../src/instructionalPlanner";
import type { ChapterContext, ChapterSpec } from "../../src/instructionalTypes";
import {
  buildChapterPrompt,
  buildInstructionalSystemPrompt,
} from "../../src/prompts";
import { buildChatCompletionsUrl } from "../../src/requestUrl";
import { errorToMessage } from "../../src/utils";
import type { EvaluationPlan, EvaluationSelection } from "./config";
import {
  evaluateLocalChapter,
  findRepeatedHeadingSkeletons,
} from "./localChecks";
import { buildAgentReviewPacket } from "./reviewPacket";
import type {
  EvaluationCase,
  EvaluationConfig,
  EvaluationRunManifest,
  LocalChapterMetrics,
} from "./types";

interface PreparedEvaluationCase {
  evaluationCase: EvaluationCase;
  chapter: ChapterSpec;
  prompt: string;
  systemPrompt: string;
}

interface EvaluationCompletion {
  content: string;
  provenance: GenerationProvenance;
  physicalAttempts: number;
  compatibilityFallbacks: string[];
}

interface RuntimeCounters {
  logicalRequests: number;
  physicalRequests: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  usageUnavailable: boolean;
  successfulResponses: number;
  cancelled: boolean;
  stopReason?: string;
}

class EvaluationRequestError extends Error {
  physicalAttempts: number;
  stopAll: boolean;

  constructor(message: string, physicalAttempts: number, stopAll = false) {
    super(message);
    this.name = "EvaluationRequestError";
    this.physicalAttempts = physicalAttempts;
    this.stopAll = stopAll;
  }
}

function hashText(text: string): string {
  return `sha256:${createHash("sha256").update(text).digest("hex")}`;
}

function buildContext(
  evaluationCase: EvaluationCase,
  chapter: ChapterSpec,
): ChapterContext {
  const index = evaluationCase.blueprint.chapters.findIndex(
    (candidate) => candidate.chapterNumber === chapter.chapterNumber,
  );

  return {
    blueprint: evaluationCase.blueprint,
    chapter,
    previousChapter:
      index > 0 ? evaluationCase.blueprint.chapters[index - 1] : undefined,
    nextChapter:
      index >= 0 && index < evaluationCase.blueprint.chapters.length - 1
        ? evaluationCase.blueprint.chapters[index + 1]
        : undefined,
  };
}

/** Build exact production chapter prompts from fixed, non-random contexts. */
export function prepareEvaluationCases(
  selection: EvaluationSelection,
): PreparedEvaluationCase[] {
  return selection.cases.map((evaluationCase) => {
    if (!/^[a-z0-9-]+$/.test(evaluationCase.id)) {
      throw new Error(`Unsafe evaluation case id: ${evaluationCase.id}`);
    }

    const chapter = evaluationCase.blueprint.chapters.find(
      (candidate) =>
        candidate.chapterNumber === evaluationCase.chapterNumber,
    );
    if (!chapter) {
      throw new Error(
        `Case ${evaluationCase.id} does not contain chapter ${evaluationCase.chapterNumber}`,
      );
    }

    const plan = buildBlueprintPlan(
      chapter.knowledgeType,
      chapter.secondaryKnowledgeTypes,
      evaluationCase.depth,
    );
    const prompt = buildChapterPrompt({
      context: buildContext(evaluationCase, chapter),
      language: evaluationCase.language,
      depth: evaluationCase.depth,
      plan,
      adapter: selectAdapter(plan),
      density: DENSITY_PRESETS[evaluationCase.depth],
    });

    return {
      evaluationCase,
      chapter,
      prompt,
      systemPrompt: buildInstructionalSystemPrompt(),
    };
  });
}

/** Return the exact UTF-8 prompt volume used by preflight cost estimates. */
export function countPreparedPromptBytes(
  preparedCases: PreparedEvaluationCase[],
): number {
  return preparedCases.reduce(
    (total, item) =>
      total + Buffer.byteLength(item.prompt) + Buffer.byteLength(item.systemPrompt),
    0,
  );
}

/** Bind live confirmation to the exact system and user prompts. */
export function fingerprintPreparedPrompts(
  preparedCases: PreparedEvaluationCase[],
): string {
  const hash = createHash("sha256");
  for (const item of preparedCases) {
    hash.update(item.evaluationCase.id);
    hash.update("\0");
    hash.update(item.systemPrompt);
    hash.update("\0");
    hash.update(item.prompt);
    hash.update("\0");
  }
  return `sha256:${hash.digest("hex")}`;
}

function updateCountersFromSuccess(
  counters: RuntimeCounters,
  event: ChatRequestEvent,
): GenerationProvenance {
  const provenance = normalizeGenerationProvenance({
    model: event.model ?? "unknown",
    promptTokens: event.promptTokens,
    completionTokens: event.completionTokens,
    totalTokens: event.totalTokens,
    reasoningTokens: event.reasoningTokens,
  });
  counters.successfulResponses += 1;

  if (
    provenance.promptTokens === undefined ||
    provenance.completionTokens === undefined ||
    provenance.totalTokens === undefined
  ) {
    counters.usageUnavailable = true;
  }
  counters.promptTokens += provenance.promptTokens ?? 0;
  counters.completionTokens += provenance.completionTokens ?? 0;
  counters.totalTokens += provenance.totalTokens ?? 0;
  return provenance;
}

function actualUsd(
  counters: RuntimeCounters,
  config: EvaluationConfig,
): number | undefined {
  if (
    config.inputUsdPerMillion === undefined ||
    config.outputUsdPerMillion === undefined ||
    counters.usageUnavailable
  ) {
    return undefined;
  }

  return (
    (counters.promptTokens * config.inputUsdPerMillion +
      counters.completionTokens * config.outputUsdPerMillion) /
    1_000_000
  );
}

async function fetchChatResponse(
  url: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<ChatHttpResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    const text = await response.text();
    let json: unknown = null;
    try {
      json = JSON.parse(text) as unknown;
    } catch {
      // The chat engine will turn non-JSON success responses into a typed error.
    }
    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });

    return { status: response.status, headers, text, json };
  } finally {
    clearTimeout(timeout);
  }
}

async function requestGenerator(
  prepared: PreparedEvaluationCase,
  config: EvaluationConfig,
  counters: RuntimeCounters,
): Promise<EvaluationCompletion> {
  if (counters.cancelled) {
    throw new EvaluationRequestError(
      counters.stopReason ?? "Evaluation cancelled before request",
      0,
      true,
    );
  }
  if (counters.logicalRequests >= config.maxLogicalRequests) {
    throw new EvaluationRequestError(
      "Logical request budget exhausted",
      0,
      true,
    );
  }
  if (
    counters.successfulResponses > 0 &&
    !counters.usageUnavailable &&
    counters.totalTokens + config.maxCompletionTokens > config.maxTotalTokens
  ) {
    throw new EvaluationRequestError(
      "Reported token budget cannot safely cover another completion",
      0,
      true,
    );
  }

  counters.logicalRequests += 1;
  let physicalAttempts = 0;
  let provenance: GenerationProvenance = { model: config.model };
  let localStopReason: string | undefined;
  const compatibilityFallbacks: string[] = [];

  try {
    const content = await executeChatCompletion(
      {
        apiKey: config.apiKey,
        apiBaseUrl: config.apiBaseUrl,
        model: config.model,
        userPrompt: prepared.prompt,
        systemPrompt: prepared.systemPrompt,
        maxCompletionTokens: config.maxCompletionTokens,
        temperature: config.temperature,
        reasoningEffort: config.reasoningEffort,
        verbosity: config.verbosity,
        thinkingMode: config.thinkingMode,
      },
      {
        maxTransientAttempts: 1,
        shouldCancel: () => counters.cancelled,
        transport: async (request) => {
          if (counters.physicalRequests >= config.maxPhysicalRequests) {
            localStopReason = "Physical request budget exhausted";
            counters.stopReason = localStopReason;
            counters.cancelled = true;
            throw new GenerationCancelledError();
          }

          counters.physicalRequests += 1;
          physicalAttempts += 1;
          return fetchChatResponse(
            request.url,
            {
              method: request.method,
              headers: request.headers,
              body: request.body,
            },
            config.requestTimeoutMs,
          );
        },
        onEvent: (event) => {
          if (event.kind === "success") {
            provenance = updateCountersFromSuccess(counters, event);
          } else if (event.kind === "compatibility") {
            compatibilityFallbacks.push(
              ...(event.compatibilityFields ?? ["unknown"]),
            );
          }
        },
      },
    );

    if (counters.totalTokens > config.maxTotalTokens) {
      counters.cancelled = true;
      counters.stopReason = "Reported token budget exceeded; queued cases stopped";
    }
    const cost = actualUsd(counters, config);
    if (
      cost !== undefined &&
      config.maxUsd !== undefined &&
      cost > config.maxUsd
    ) {
      counters.cancelled = true;
      counters.stopReason = "Reported USD budget exceeded; queued cases stopped";
    }

    return {
      content,
      provenance,
      physicalAttempts,
      compatibilityFallbacks,
    };
  } catch (error) {
    throw new EvaluationRequestError(
      localStopReason ?? errorToMessage(error),
      physicalAttempts,
      localStopReason !== undefined || counters.cancelled,
    );
  }
}

async function writeJson(filePath: string, value: unknown): Promise<void> {
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function updateManifestUsage(
  manifest: EvaluationRunManifest,
  counters: RuntimeCounters,
  config: EvaluationConfig,
): void {
  manifest.usage = {
    logicalRequests: counters.logicalRequests,
    physicalRequests: counters.physicalRequests,
    promptTokens:
      counters.successfulResponses > 0 && !counters.usageUnavailable
        ? counters.promptTokens
        : undefined,
    completionTokens:
      counters.successfulResponses > 0 && !counters.usageUnavailable
        ? counters.completionTokens
        : undefined,
    totalTokens:
      counters.successfulResponses > 0 && !counters.usageUnavailable
        ? counters.totalTokens
        : undefined,
    estimatedUsd: actualUsd(counters, config),
    usageUnavailable: counters.usageUnavailable,
  };
}

async function refreshReviewArtifacts(
  runDirectory: string,
  manifest: EvaluationRunManifest,
  selection: EvaluationSelection,
): Promise<void> {
  const casesById = new Map(selection.cases.map((item) => [item.id, item]));
  const metrics: LocalChapterMetrics[] = [];

  for (const result of manifest.cases) {
    if (result.status !== "success" || !result.outputFile) continue;
    const evaluationCase = casesById.get(result.id);
    if (!evaluationCase) continue;

    const absoluteOutputPath = resolve(runDirectory, result.outputFile);
    if (!absoluteOutputPath.startsWith(`${resolve(runDirectory)}${sep}`)) {
      throw new Error(`Unsafe output path in run manifest: ${result.outputFile}`);
    }
    const content = stripGenerationProvenance(
      await readFile(absoluteOutputPath, "utf8"),
    );
    const localMetrics = evaluateLocalChapter(evaluationCase, content);
    const metricsFile = `cases/${result.id}.metrics.json`;
    result.metricsFile = metricsFile;
    metrics.push(localMetrics);
    await writeJson(resolve(runDirectory, metricsFile), localMetrics);
  }

  const repeatedHeadings = findRepeatedHeadingSkeletons(metrics);
  await writeJson(resolve(runDirectory, "local-summary.json"), {
    schemaVersion: 1,
    runId: manifest.runId,
    structuralPasses: metrics.filter((item) => item.structuralPass).length,
    checkedCases: metrics.length,
    repeatedHeadings,
  });
  await writeFile(
    resolve(runDirectory, "agent-review-packet.md"),
    buildAgentReviewPacket(manifest, { metrics, repeatedHeadings }),
    "utf8",
  );
}

/** Run the confirmed live generator suite with checkpointing and hard caps. */
export async function runLiveEvaluation(
  selection: EvaluationSelection,
  preparedCases: PreparedEvaluationCase[],
  config: EvaluationConfig,
  plan: EvaluationPlan,
): Promise<string> {
  const endpointHost = new URL(
    buildChatCompletionsUrl(config.apiBaseUrl),
  ).host;
  const runsRoot = resolve("eval/runs");
  await mkdir(runsRoot, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const safeModel = config.model.replace(/[^a-zA-Z0-9._-]+/g, "-").slice(0, 48);
  const runId = `${timestamp}_${safeModel}_${plan.planId}`;
  const runDirectory = resolve(runsRoot, runId);
  await mkdir(resolve(runDirectory, "cases"), { recursive: true });
  const lockPath = resolve(runsRoot, ".active.lock");
  let lock;
  try {
    lock = await open(lockPath, "wx");
  } catch {
    throw new Error(
      `Another evaluation may be active. Inspect and remove the stale lock only if safe: ${lockPath}`,
    );
  }

  try {
    await lock.writeFile(`${JSON.stringify({ runId, pid: process.pid })}\n`);
  } catch (error) {
    await lock.close();
    await unlink(lockPath).catch(() => undefined);
    throw error;
  }
  const counters: RuntimeCounters = {
    logicalRequests: 0,
    physicalRequests: 0,
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0,
    usageUnavailable: false,
    successfulResponses: 0,
    cancelled: false,
  };
  const manifest: EvaluationRunManifest = {
    schemaVersion: 1,
    runId,
    planId: plan.planId,
    suiteVersion: selection.corpus.suiteVersion,
    startedAt: new Date().toISOString(),
    provider: {
      host: endpointHost,
      requestedModel: config.model,
    },
    config: {
      profile: selection.profile,
      maxCompletionTokens: config.maxCompletionTokens,
      maxLogicalRequests: config.maxLogicalRequests,
      maxPhysicalRequests: config.maxPhysicalRequests,
      maxTotalTokens: config.maxTotalTokens,
      concurrency: config.concurrency,
      temperature: config.temperature,
      reasoningEffort: config.reasoningEffort,
      verbosity: config.verbosity,
      thinkingMode: config.thinkingMode,
    },
    usage: {
      logicalRequests: 0,
      physicalRequests: 0,
      usageUnavailable: false,
    },
    cases: preparedCases.map((prepared) => ({
      id: prepared.evaluationCase.id,
      discipline: prepared.evaluationCase.discipline,
      description: prepared.evaluationCase.description,
      status: "skipped",
      chapter: prepared.chapter,
      physicalAttempts: 0,
    })),
  };
  const manifestPath = resolve(runDirectory, "run.json");
  let checkpointQueue = Promise.resolve();
  const checkpoint = (): Promise<void> => {
    updateManifestUsage(manifest, counters, config);
    checkpointQueue = checkpointQueue.then(async () => {
      const temporaryPath = `${manifestPath}.tmp`;
      await writeJson(temporaryPath, manifest);
      await rename(temporaryPath, manifestPath);
    });
    return checkpointQueue;
  };

  const handleSignal = (): void => {
    counters.cancelled = true;
    counters.stopReason = "Interrupted; queued cases stopped";
    process.stderr.write(
      "\nInterrupt received. Active requests will settle; queued cases are stopping.\n",
    );
  };
  process.once("SIGINT", handleSignal);

  try {
    await checkpoint();
    let nextIndex = 0;
    const worker = async (): Promise<void> => {
      while (true) {
        const index = nextIndex;
        nextIndex += 1;
        if (index >= preparedCases.length) return;

        const prepared = preparedCases[index];
        if (counters.cancelled) {
          manifest.cases[index].error =
            counters.stopReason ?? "Skipped after cancellation";
          await checkpoint();
          continue;
        }

        const startedAt = Date.now();
        try {
          const completion = await requestGenerator(prepared, config, counters);
          const outputFile = `cases/${prepared.evaluationCase.id}.md`;
          const metricsFile = `cases/${prepared.evaluationCase.id}.metrics.json`;
          const numberedContent = numberChapterHeadings(
            completion.content,
            prepared.evaluationCase.chapterNumber,
          );
          const renderedContent = [
            numberedContent.trimEnd(),
            renderGenerationProvenance(completion.provenance),
            "",
          ].join("\n\n");
          const metrics = evaluateLocalChapter(
            prepared.evaluationCase,
            numberedContent,
          );
          await writeFile(resolve(runDirectory, outputFile), renderedContent, "utf8");
          await writeJson(resolve(runDirectory, metricsFile), metrics);
          manifest.cases[index] = {
            ...manifest.cases[index],
            status: "success",
            outputFile,
            metricsFile,
            promptHash: hashText(
              `${prepared.systemPrompt}\n\n${prepared.prompt}`,
            ),
            responseHash: hashText(numberedContent),
            durationMs: Date.now() - startedAt,
            physicalAttempts: completion.physicalAttempts,
            compatibilityFallbacks: completion.compatibilityFallbacks,
            provenance: completion.provenance,
          };
        } catch (error) {
          const requestError =
            error instanceof EvaluationRequestError ? error : undefined;
          manifest.cases[index] = {
            ...manifest.cases[index],
            status: "failed",
            durationMs: Date.now() - startedAt,
            physicalAttempts: requestError?.physicalAttempts ?? 0,
            error: errorToMessage(error),
          };
          if (requestError?.stopAll) {
            counters.cancelled = true;
            counters.stopReason = requestError.message;
          }
        }
        await checkpoint();
      }
    };

    const workerCount = Math.min(config.concurrency, preparedCases.length);
    await Promise.all(Array.from({ length: workerCount }, () => worker()));
    manifest.completedAt = new Date().toISOString();
    await refreshReviewArtifacts(runDirectory, manifest, selection);
    await checkpoint();
    return runDirectory;
  } finally {
    process.off("SIGINT", handleSignal);
    await checkpointQueue;
    await lock.close();
    await unlink(lockPath).catch(() => undefined);
  }
}

/** Recompute deterministic metrics and the agent packet without any API call. */
export async function recheckEvaluationRun(
  runPath: string,
  selection: EvaluationSelection,
): Promise<string> {
  const runDirectory = resolve(runPath);
  const manifestPath = resolve(runDirectory, "run.json");
  const parsed = JSON.parse(
    await readFile(manifestPath, "utf8"),
  ) as EvaluationRunManifest;
  if (parsed.schemaVersion !== 1 || !Array.isArray(parsed.cases)) {
    throw new Error(`Unsupported run manifest: ${manifestPath}`);
  }

  await refreshReviewArtifacts(runDirectory, parsed, selection);
  await writeJson(manifestPath, parsed);
  return relative(resolve(), runDirectory) || ".";
}

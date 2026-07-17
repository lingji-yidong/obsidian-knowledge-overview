import { resolve } from "node:path";
import {
  buildEvaluationPlan,
  loadEvaluationCorpus,
  loadLocalEvaluationEnv,
  readEvaluationConfig,
  selectEvaluationCases,
  validateLivePlan,
} from "./config";
import {
  countPreparedPromptBytes,
  fingerprintPreparedPrompts,
  prepareEvaluationCases,
  recheckEvaluationRun,
  runLiveEvaluation,
} from "./runner";
import type {
  ReasoningEffort,
  ThinkingMode,
  Verbosity,
} from "../../src/chatCompletion";

type EvaluationCommand = "plan" | "generate" | "check";

interface CliOptions {
  command: EvaluationCommand;
  profile: string;
  caseId?: string;
  confirm?: string;
  runPath?: string;
}

function readOption(args: string[], ...names: string[]): string | undefined {
  for (const name of names) {
    const index = args.indexOf(name);
    if (index >= 0) return args[index + 1];
  }
  return undefined;
}

function parseCliOptions(argv: string[]): CliOptions {
  const rawCommand = argv[0] ?? "plan";
  if (!(["plan", "generate", "check"] as string[]).includes(rawCommand)) {
    throw new Error(`Unknown evaluation command: ${rawCommand}`);
  }

  return {
    command: rawCommand as EvaluationCommand,
    profile: readOption(argv, "--profile", "--suite") ?? "smoke",
    caseId: readOption(argv, "--case"),
    confirm: readOption(argv, "--confirm"),
    runPath: readOption(argv, "--run"),
  };
}

function printPlan(
  planId: string,
  profile: string,
  model: string,
  caseIds: string[],
  logicalRequests: number,
  maxPhysicalRequests: number,
  maxCompletionTokens: number,
  maxOutputTokens: number,
  maxTotalTokens: number,
  concurrency: number,
  temperature: number | null,
  reasoningEffort: ReasoningEffort | null,
  verbosity: Verbosity | null,
  thinkingMode: ThinkingMode,
  promptBytes: number,
  promptFingerprint: string,
  worstCaseUsd: number | undefined,
  caseId?: string,
): void {
  const priceLine =
    worstCaseUsd === undefined
      ? "Worst-case USD: unavailable (pricing fields are not set)"
      : `Worst-case USD: $${worstCaseUsd.toFixed(4)}`;
  const selectionArgument = caseId
    ? `--case ${caseId}`
    : `--profile ${profile}`;
  process.stdout.write(
    [
      "Evaluation plan (no requests sent)",
      `Plan ID: ${planId}`,
      `Profile: ${profile}`,
      `Generator: ${model || "not configured"}`,
      `Cases: ${caseIds.join(", ")}`,
      `Logical requests: ${logicalRequests}`,
      `Physical request hard cap: ${maxPhysicalRequests}`,
      `Per-call output cap: ${maxCompletionTokens.toLocaleString("en-US")}`,
      `Worst-case output tokens: ${maxOutputTokens.toLocaleString("en-US")}`,
      `Total token guard: ${maxTotalTokens.toLocaleString("en-US")}`,
      `Generator concurrency: ${concurrency}`,
      `Temperature: ${temperature ?? "unset"}`,
      `Reasoning effort: ${reasoningEffort ?? "unset"}`,
      `Verbosity: ${verbosity ?? "unset"}`,
      `Thinking mode: ${thinkingMode}`,
      `Prompt bytes: ${promptBytes.toLocaleString("en-US")}`,
      `Prompt fingerprint: ${promptFingerprint}`,
      priceLine,
      "",
      `Execute only after reviewing this plan: npm run eval:generate -- ${selectionArgument} --confirm ${planId}`,
      "Use --case <id> first for a one-request canary.",
      "",
    ].join("\n"),
  );
}

/** Route dry-run, confirmed live generation, and zero-API rechecks. */
async function main(): Promise<void> {
  loadLocalEvaluationEnv();
  const options = parseCliOptions(process.argv.slice(2));
  const corpus = loadEvaluationCorpus();

  if (options.command === "check") {
    if (!options.runPath) {
      throw new Error("eval:check requires --run <eval/runs/run-id>");
    }
    const selection = {
      corpus,
      cases: corpus.cases,
      profile: "all",
    };
    const checkedPath = await recheckEvaluationRun(
      resolve(options.runPath),
      selection,
    );
    process.stdout.write(`Local checks refreshed without API calls: ${checkedPath}\n`);
    return;
  }

  const selection = selectEvaluationCases(
    corpus,
    options.profile,
    options.caseId,
  );
  const config = readEvaluationConfig(selection.profile);
  const preparedCases = prepareEvaluationCases(selection);
  const plan = buildEvaluationPlan(
    selection,
    config,
    countPreparedPromptBytes(preparedCases),
    fingerprintPreparedPrompts(preparedCases),
  );
  printPlan(
    plan.planId,
    selection.profile,
    config.model,
    plan.caseIds,
    plan.logicalRequests,
    config.maxPhysicalRequests,
    config.maxCompletionTokens,
    plan.maxOutputTokens,
    config.maxTotalTokens,
    config.concurrency,
    config.temperature,
    config.reasoningEffort,
    config.verbosity,
    config.thinkingMode,
    plan.promptBytes,
    plan.promptFingerprint,
    plan.worstCaseUsd,
    options.caseId,
  );

  if (options.command === "plan") return;
  if (options.confirm !== plan.planId) {
    throw new Error(
      `Live generation refused. Pass the current plan ID with --confirm ${plan.planId}`,
    );
  }

  validateLivePlan(plan, config);
  const runDirectory = await runLiveEvaluation(
    selection,
    preparedCases,
    config,
    plan,
  );
  process.stdout.write(
    `Evaluation generation finished: ${runDirectory}\nOpen agent-review-packet.md before starting the Codex review.\n`,
  );
}

await main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`Evaluation error: ${message}\n`);
  process.exitCode = 1;
});

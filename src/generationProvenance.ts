import { trimTrailingWhitespace } from "./utils";

export interface GenerationProvenance {
  model: string;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  reasoningTokens?: number;
}

const GENERATION_COMMENT_PATTERN =
  /<!-- knowledge-overview-generation\s+({[\s\S]*?})\s*-->/;

function sanitizeModel(model: string): string {
  const sanitized = model
    .replace(/[\r\n`]/g, " ")
    .replace(/-->/g, "—>")
    .trim();
  return sanitized || "unknown";
}

function normalizeTokenCount(value: number | undefined): number | undefined {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? Math.round(value)
    : undefined;
}

/**
 * Normalize provider usage without inventing token estimates. Some compatible
 * APIs omit total_tokens while still returning prompt and completion counts.
 */
export function normalizeGenerationProvenance(
  provenance: GenerationProvenance,
): GenerationProvenance {
  const promptTokens = normalizeTokenCount(provenance.promptTokens);
  const completionTokens = normalizeTokenCount(provenance.completionTokens);
  const reportedTotal = normalizeTokenCount(provenance.totalTokens);
  const reasoningTokens = normalizeTokenCount(provenance.reasoningTokens);
  const totalTokens =
    reportedTotal ??
    (promptTokens !== undefined && completionTokens !== undefined
      ? promptTokens + completionTokens
      : undefined);

  return {
    model: sanitizeModel(provenance.model),
    promptTokens,
    completionTokens,
    totalTokens,
    reasoningTokens,
  };
}

function formatTokenSummary(provenance: GenerationProvenance): string {
  if (provenance.totalTokens === undefined) {
    return "unavailable (provider did not return usage)";
  }

  const total = provenance.totalTokens.toLocaleString("en-US");
  if (
    provenance.promptTokens === undefined ||
    provenance.completionTokens === undefined
  ) {
    return `${total} total`;
  }

  const reasoning =
    provenance.reasoningTokens === undefined
      ? ""
      : `, reasoning ${provenance.reasoningTokens.toLocaleString("en-US")} within completion`;
  return `${total} total (prompt ${provenance.promptTokens.toLocaleString("en-US")} / completion ${provenance.completionTokens.toLocaleString("en-US")}${reasoning})`;
}

/** Render visible provenance plus a stable machine-readable metadata comment. */
export function renderGenerationProvenance(
  input: GenerationProvenance,
): string {
  const provenance = normalizeGenerationProvenance(input);
  const serialized = JSON.stringify(provenance).replace(/-->/g, "—>");

  return [
    "---",
    "",
    `*Model: \`${provenance.model}\` · Tokens: ${formatTokenSummary(provenance)}*`,
    "",
    `<!-- knowledge-overview-generation ${serialized} -->`,
  ].join("\n");
}

/** Parse provenance written by renderGenerationProvenance. */
export function parseGenerationProvenance(
  text: string,
): GenerationProvenance | null {
  const match = text.match(GENERATION_COMMENT_PATTERN);
  if (!match) return null;

  try {
    const parsed = JSON.parse(match[1]) as Partial<GenerationProvenance>;
    if (typeof parsed.model !== "string") return null;
    return normalizeGenerationProvenance({
      model: parsed.model,
      promptTokens: parsed.promptTokens,
      completionTokens: parsed.completionTokens,
      totalTokens: parsed.totalTokens,
      reasoningTokens: parsed.reasoningTokens,
    });
  } catch {
    return null;
  }
}

/** Remove a footer emitted by renderGenerationProvenance when rechecking text. */
export function stripGenerationProvenance(text: string): string {
  const commentMatch = text.match(GENERATION_COMMENT_PATTERN);
  if (!commentMatch || commentMatch.index === undefined) return text;

  const separatorIndex = text.lastIndexOf("\n\n---\n\n*Model:", commentMatch.index);
  return separatorIndex >= 0
    ? trimTrailingWhitespace(text.slice(0, separatorIndex))
    : text;
}

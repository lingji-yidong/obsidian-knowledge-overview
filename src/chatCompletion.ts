import { buildChatCompletionsUrl } from "./requestUrl";

interface ChatCompletionResponse {
  model?: unknown;
  choices: Array<{
    message?: {
      content?: unknown;
      reasoning_content?: unknown;
    };
    text?: unknown;
    finish_reason?: unknown;
  }>;
  usage?: {
    prompt_tokens?: unknown;
    completion_tokens?: unknown;
    total_tokens?: unknown;
    completion_tokens_details?: {
      reasoning_tokens?: unknown;
    };
  };
}

export type ThinkingMode = "auto" | "enabled" | "disabled";
export type ReasoningEffort =
  | "none"
  | "minimal"
  | "low"
  | "medium"
  | "high"
  | "xhigh"
  | "max";
export type Verbosity = "low" | "medium" | "high";

export interface ChatCompletionOptions {
  apiKey: string;
  apiBaseUrl: string;
  model: string;
  userPrompt: string;
  systemPrompt?: string;
  maxCompletionTokens: number | null;
  temperature: number | null;
  reasoningEffort: ReasoningEffort | null;
  verbosity: Verbosity | null;
  thinkingMode?: ThinkingMode | null;
}

export interface ChatHttpRequest {
  url: string;
  method: "POST";
  headers: Record<string, string>;
  body: string;
}

export interface ChatHttpResponse {
  status: number;
  headers: Record<string, string>;
  text: string;
  json: unknown;
}

export interface ChatRequestEvent {
  kind: "request" | "success" | "retry" | "compatibility" | "failure";
  compatibilityFields?: Array<
    | "maxCompletionTokens"
    | "temperature"
    | "reasoningEffort"
    | "verbosity"
    | "thinking"
    | "systemMessage"
  >;
  model?: string;
  status?: number;
  durationMs?: number;
  delayMs?: number;
  promptChars?: number;
  outputChars?: number;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  reasoningTokens?: number;
}

export interface ChatCompletionRuntime {
  transport: (request: ChatHttpRequest) => Promise<ChatHttpResponse>;
  delay?: (milliseconds: number) => Promise<void>;
  random?: () => number;
  now?: () => number;
  shouldCancel?: () => boolean;
  onEvent?: (event: ChatRequestEvent) => void;
  maxTransientAttempts?: number;
}

interface CapabilityProfile {
  useSystemMessage: boolean;
  optionalFields: {
    temperature: boolean;
    reasoningEffort: boolean;
    verbosity: boolean;
    thinking: boolean;
  };
  tokenField: "max_completion_tokens" | "max_tokens";
}

interface CapabilityFallback {
  profile: CapabilityProfile;
  fields: NonNullable<ChatRequestEvent["compatibilityFields"]>;
}

const capabilityCache = new Map<string, CapabilityProfile>();
const DEFAULT_MAX_TRANSIENT_ATTEMPTS = 3;
const RETRY_BASE_DELAY_MS = 1000;

export class ApiError extends Error {
  status: number;
  retryAfterMs?: number;
  providerMessage: string;

  constructor(
    status: number,
    providerMessage: string,
    retryAfterMs?: number,
  ) {
    super(`API error ${status}: ${providerMessage}`);
    this.name = "ApiError";
    this.status = status;
    this.retryAfterMs = retryAfterMs;
    this.providerMessage = providerMessage;
  }
}

export class CompletionTruncatedError extends Error {
  constructor() {
    super(
      "API response reached its output token limit. Increase the limit or narrow the requested chapter scope before retrying.",
    );
    this.name = "CompletionTruncatedError";
  }
}

export class ChatResponseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ChatResponseError";
  }
}

export class ChatTransportError extends Error {
  constructor() {
    super("Network request failed before the provider returned an HTTP response");
    this.name = "ChatTransportError";
  }
}

export class GenerationCancelledError extends Error {
  constructor() {
    super("Generation cancelled");
    this.name = "GenerationCancelledError";
  }
}

export function isRetryableStatus(status: number): boolean {
  return (
    status === 408 ||
    status === 409 ||
    status === 425 ||
    status === 429 ||
    status >= 500
  );
}

function defaultDelay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

function buildPromptWithSystem(
  userPrompt: string,
  systemPrompt?: string,
): string {
  if (!systemPrompt) {
    return userPrompt;
  }

  return `${systemPrompt}\n\n${userPrompt}`;
}

function buildRequestBody(
  options: ChatCompletionOptions,
  profile: CapabilityProfile,
): Record<string, unknown> {
  const messages: Array<{ role: "system" | "user"; content: string }> =
    profile.useSystemMessage && options.systemPrompt
      ? [
          { role: "system", content: options.systemPrompt },
          { role: "user", content: options.userPrompt },
        ]
      : [
          {
            role: "user",
            content: buildPromptWithSystem(
              options.userPrompt,
              options.systemPrompt,
            ),
          },
        ];
  const body: Record<string, unknown> = {
    model: options.model,
    messages,
  };

  if (options.maxCompletionTokens !== null) {
    body[profile.tokenField] = options.maxCompletionTokens;
  }

  if (profile.optionalFields.temperature && options.temperature !== null) {
    body.temperature = options.temperature;
  }
  if (
    profile.optionalFields.reasoningEffort &&
    options.reasoningEffort !== null
  ) {
    body.reasoning_effort = options.reasoningEffort;
  }
  if (profile.optionalFields.verbosity && options.verbosity !== null) {
    body.verbosity = options.verbosity;
  }
  if (
    profile.optionalFields.thinking &&
    (options.thinkingMode === "enabled" ||
      options.thinkingMode === "disabled")
  ) {
    body.thinking = { type: options.thinkingMode };
  }

  return body;
}

function isChatCompletionResponse(
  value: unknown,
): value is ChatCompletionResponse {
  if (!value || typeof value !== "object") {
    return false;
  }

  const choices = (value as { choices?: unknown }).choices;
  return (
    Array.isArray(choices) &&
    choices.length > 0 &&
    typeof choices[0] === "object" &&
    choices[0] !== null
  );
}

function extractTextContent(content: unknown): string | null {
  if (typeof content === "string") {
    return content;
  }

  if (!Array.isArray(content)) {
    return null;
  }

  const parts = content
    .map((part) => {
      if (typeof part === "string") return part;
      if (!part || typeof part !== "object") return "";

      const maybeText = part as { text?: unknown; content?: unknown };
      if (typeof maybeText.text === "string") return maybeText.text;
      if (typeof maybeText.content === "string") return maybeText.content;
      return "";
    })
    .join("");

  return parts || null;
}

function extractChatCompletionContent(
  data: ChatCompletionResponse,
): string | null {
  const firstChoice = data.choices[0];
  return (
    extractTextContent(firstChoice.message?.content) ??
    extractTextContent(firstChoice.text)
  );
}

function readNumericUsage(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}

function findHeader(
  headers: Record<string, string>,
  name: string,
): string | undefined {
  const target = name.toLocaleLowerCase();
  return Object.entries(headers).find(
    ([key]) => key.toLocaleLowerCase() === target,
  )?.[1];
}

function parseRetryAfterMs(headers: Record<string, string>, now: number): number | undefined {
  const value = findHeader(headers, "retry-after")?.trim();
  if (!value) return undefined;

  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) {
    return Math.round(seconds * 1000);
  }

  const date = Date.parse(value);
  return Number.isFinite(date) ? Math.max(0, date - now) : undefined;
}

function extractProviderMessage(response: ChatHttpResponse): string {
  const json = response.json;
  if (json && typeof json === "object") {
    const error = (json as { error?: unknown }).error;
    if (error && typeof error === "object") {
      const message = (error as { message?: unknown }).message;
      if (typeof message === "string" && message.trim()) {
        return message.trim().slice(0, 600);
      }
    }
  }

  return response.text.trim().slice(0, 600) || "Provider rejected the request";
}

function detectCapabilityFallback(
  error: ApiError,
  profile: CapabilityProfile,
): CapabilityFallback | null {
  if (error.status !== 400 && error.status !== 422) {
    return null;
  }

  const message = error.providerMessage.toLocaleLowerCase();
  const incompatibility =
    /unsupported|not supported|unknown|unrecognized|not allowed|invalid parameter|extra field/.test(
      message,
    );
  if (!incompatibility) {
    return null;
  }

  const systemRoleMentioned = /system(?: message| role)?/.test(message);
  const completionTokenFieldMentioned = /max[_ ]completion[_ ]tokens/.test(
    message,
  );

  if (
    completionTokenFieldMentioned &&
    profile.tokenField === "max_completion_tokens"
  ) {
    return {
      profile: { ...profile, tokenField: "max_tokens" },
      fields: ["maxCompletionTokens"],
    };
  }

  const optionalFieldPatterns: Array<[
    keyof CapabilityProfile["optionalFields"],
    RegExp,
  ]> = [
    ["temperature", /temperature/],
    ["reasoningEffort", /reasoning[_ ]effort/],
    ["verbosity", /verbosity/],
    ["thinking", /thinking/],
  ];
  const optionalFields = { ...profile.optionalFields };
  let optionalFieldChanged = false;
  const changedFields: CapabilityFallback["fields"] = [];
  for (const [field, pattern] of optionalFieldPatterns) {
    if (pattern.test(message) && optionalFields[field]) {
      optionalFields[field] = false;
      optionalFieldChanged = true;
      changedFields.push(field);
    }
  }
  if (optionalFieldChanged) {
    return {
      profile: { ...profile, optionalFields },
      fields: changedFields,
    };
  }

  if (systemRoleMentioned && profile.useSystemMessage) {
    return {
      profile: {
        ...profile,
        useSystemMessage: false,
      },
      fields: ["systemMessage"],
    };
  }

  return null;
}

function getRetryDelayMs(
  error: ApiError | ChatTransportError,
  retryIndex: number,
  random: () => number,
): number {
  if (error instanceof ApiError && error.retryAfterMs !== undefined) {
    return error.retryAfterMs;
  }

  const exponential = RETRY_BASE_DELAY_MS * 2 ** retryIndex;
  const jitter = 0.75 + random() * 0.5;
  return Math.round(exponential * jitter);
}

async function makeRequest(
  options: ChatCompletionOptions,
  profile: CapabilityProfile,
  runtime: ChatCompletionRuntime,
): Promise<string> {
  const now = runtime.now ?? Date.now;
  const startedAt = now();

  let response: ChatHttpResponse;
  try {
    response = await runtime.transport({
      url: buildChatCompletionsUrl(options.apiBaseUrl),
      method: "POST",
      headers: {
        Authorization: `Bearer ${options.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(buildRequestBody(options, profile)),
    });
  } catch (error) {
    if (error instanceof GenerationCancelledError) {
      throw error;
    }
    runtime.onEvent?.({
      kind: "request",
      promptChars:
        options.userPrompt.length + (options.systemPrompt?.length ?? 0),
    });
    throw new ChatTransportError();
  }
  runtime.onEvent?.({
    kind: "request",
    promptChars: options.userPrompt.length + (options.systemPrompt?.length ?? 0),
  });

  if (response.status < 200 || response.status >= 300) {
    throw new ApiError(
      response.status,
      extractProviderMessage(response),
      parseRetryAfterMs(response.headers, now()),
    );
  }

  if (!isChatCompletionResponse(response.json)) {
    throw new ChatResponseError(
      "API response did not include a usable message choice",
    );
  }

  if (response.json.choices[0].finish_reason === "length") {
    throw new CompletionTruncatedError();
  }

  const content = extractChatCompletionContent(response.json);
  if (content === null || content.trim().length === 0) {
    const finishReason = response.json.choices[0].finish_reason;
    const finishReasonLabel =
      typeof finishReason === "string" ? finishReason : "unknown";
    const reasoningContent = response.json.choices[0].message;
    const hasReasoningContent =
      typeof reasoningContent?.reasoning_content === "string" &&
      reasoningContent.reasoning_content.trim().length > 0;
    throw new ChatResponseError(
      `API response did not include non-empty final content (finish_reason=${finishReasonLabel}, reasoning_content=${hasReasoningContent ? "present" : "absent"})`,
    );
  }

  runtime.onEvent?.({
    kind: "success",
    model:
      typeof response.json.model === "string" && response.json.model.trim()
        ? response.json.model.trim()
        : options.model,
    status: response.status,
    durationMs: now() - startedAt,
    outputChars: content.length,
    promptTokens: readNumericUsage(response.json.usage?.prompt_tokens),
    completionTokens: readNumericUsage(
      response.json.usage?.completion_tokens,
    ),
    totalTokens: readNumericUsage(response.json.usage?.total_tokens),
    reasoningTokens: readNumericUsage(
      response.json.usage?.completion_tokens_details?.reasoning_tokens,
    ),
  });
  return content;
}

/**
 * Execute one logical chat completion with targeted capability negotiation and
 * a single transient retry policy. Normal successful calls issue one request.
 */
export async function executeChatCompletion(
  options: ChatCompletionOptions,
  runtime: ChatCompletionRuntime,
): Promise<string> {
  const delay = runtime.delay ?? defaultDelay;
  const random = runtime.random ?? Math.random;
  const maxTransientAttempts = Math.max(
    1,
    runtime.maxTransientAttempts ?? DEFAULT_MAX_TRANSIENT_ATTEMPTS,
  );
  const capabilityKey = `${buildChatCompletionsUrl(options.apiBaseUrl)}\n${options.model}`;
  const cachedProfile = capabilityCache.get(capabilityKey);
  let profile: CapabilityProfile;
  if (cachedProfile) {
    profile = cachedProfile;
  } else {
    let isDeepSeekEndpoint = false;
    try {
      const hostname = new URL(
        buildChatCompletionsUrl(options.apiBaseUrl),
      ).hostname.toLocaleLowerCase();
      isDeepSeekEndpoint =
        hostname === "deepseek.com" || hostname.endsWith(".deepseek.com");
    } catch {
      // Invalid URLs will be reported by the transport layer.
    }
    profile = {
      useSystemMessage: true,
      optionalFields: {
        temperature: true,
        reasoningEffort: true,
        verbosity: true,
        thinking: true,
      },
      tokenField: isDeepSeekEndpoint ? "max_tokens" : "max_completion_tokens",
    };
  }
  let transientAttempt = 0;

  while (true) {
    if (runtime.shouldCancel?.()) {
      throw new GenerationCancelledError();
    }

    try {
      return await makeRequest(options, profile, runtime);
    } catch (error) {
      const errorStatus = error instanceof ApiError ? error.status : undefined;
      const capabilityFallback =
        error instanceof ApiError
          ? detectCapabilityFallback(error, profile)
          : null;
      if (capabilityFallback) {
        profile = capabilityFallback.profile;
        capabilityCache.set(capabilityKey, profile);
        runtime.onEvent?.({
          kind: "compatibility",
          status: errorStatus,
          compatibilityFields: capabilityFallback.fields,
        });
        continue;
      }

      const retryable =
        error instanceof ChatTransportError ||
        (error instanceof ApiError && isRetryableStatus(error.status));
      if (retryable && transientAttempt < maxTransientAttempts - 1) {
        const delayMs = getRetryDelayMs(error, transientAttempt, random);
        transientAttempt += 1;
        runtime.onEvent?.({
          kind: "retry",
          status: error instanceof ApiError ? error.status : undefined,
          delayMs,
        });
        await delay(delayMs);
        continue;
      }

      runtime.onEvent?.({
        kind: "failure",
        status: error instanceof ApiError ? error.status : undefined,
      });
      throw error;
    }
  }
}

export function clearCapabilityCache(): void {
  capabilityCache.clear();
}

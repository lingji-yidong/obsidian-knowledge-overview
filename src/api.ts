import { requestUrl } from "obsidian";
import { DEFAULT_SETTINGS } from "./settings";

interface ChatCompletionResponse {
  choices: Array<{
    message?: {
      content?: unknown;
    };
    text?: unknown;
    finish_reason?: unknown;
  }>;
}

export interface ChatCompletionOptions {
  apiKey: string;
  apiBaseUrl: string;
  model: string;
  userPrompt: string;
  systemPrompt?: string;
  maxCompletionTokens: number | null;
  temperature: number | null;
  reasoningEffort: "minimal" | "low" | "medium" | "high" | null;
  verbosity: "low" | "medium" | "high" | null;
}

export class ApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export class CompletionTruncatedError extends Error {
  constructor() {
    super(
      "API response was truncated because the model reached its output token limit. Increase Max completion tokens or choose a model/provider with a larger output limit.",
    );
    this.name = "CompletionTruncatedError";
  }
}

export function isRetryableStatus(status: number): boolean {
  return status === 408 || status === 409 || status === 425 || status === 429 || status >= 500;
}

export function buildChatCompletionsUrl(apiBaseUrl: string): string {
  const trimmed = apiBaseUrl.trim();
  const fallback = DEFAULT_SETTINGS.apiBaseUrl;
  const withoutTrailingSlash = (trimmed || fallback).replace(/\/+$/, "");
  const withoutEndpoint = withoutTrailingSlash.replace(
    /(?:\/chat)?\/completions$/i,
    "",
  );
  const normalizedSlashes = withoutEndpoint
    .replace(/([^:]\/)\/+/g, "$1")
    .replace(/\/+$/, "");
  const hasPath = /^https?:\/\/[^/]+\/.+/i.test(normalizedSlashes);
  const baseUrl = hasPath ? normalizedSlashes : `${normalizedSlashes}/v1`;

  return `${baseUrl}/chat/completions`;
}

function buildPromptWithSystem(userPrompt: string, systemPrompt?: string): string {
  if (!systemPrompt) {
    return userPrompt;
  }

  return `${systemPrompt}\n\n${userPrompt}`;
}

function isChatCompletionResponse(value: unknown): value is ChatCompletionResponse {
  if (!value || typeof value !== "object") {
    return false;
  }

  const choices = (value as { choices?: unknown }).choices;
  if (!Array.isArray(choices) || choices.length === 0) {
    return false;
  }

  return typeof choices[0] === "object" && choices[0] !== null;
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
      if (typeof part === "string") {
        return part;
      }

      if (!part || typeof part !== "object") {
        return "";
      }

      const maybeText = part as { text?: unknown; content?: unknown };
      if (typeof maybeText.text === "string") {
        return maybeText.text;
      }

      if (typeof maybeText.content === "string") {
        return maybeText.content;
      }

      return "";
    })
    .join("");

  return parts || null;
}

function extractChatCompletionContent(data: ChatCompletionResponse): string | null {
  const firstChoice = data.choices[0];
  const messageContent = extractTextContent(firstChoice.message?.content);
  if (messageContent !== null) {
    return messageContent;
  }

  return extractTextContent(firstChoice.text);
}

async function requestChatCompletion(
  options: ChatCompletionOptions,
  useSystemMessage: boolean,
  includeOptionalFields: boolean,
): Promise<string> {
  const {
    apiKey,
    apiBaseUrl,
    model,
    userPrompt,
    systemPrompt,
    maxCompletionTokens,
    temperature,
    reasoningEffort,
    verbosity,
  } = options;
  const messages: Array<{ role: "system" | "user"; content: string }> =
    useSystemMessage && systemPrompt
      ? [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ]
      : [{ role: "user", content: buildPromptWithSystem(userPrompt, systemPrompt) }];
  const body: {
    model: string;
    messages: Array<{ role: "system" | "user"; content: string }>;
    max_completion_tokens?: number;
    temperature?: number;
    reasoning_effort?: "minimal" | "low" | "medium" | "high";
    verbosity?: "low" | "medium" | "high";
  } = {
    model,
    messages,
  };

  if (maxCompletionTokens !== null) {
    body.max_completion_tokens = maxCompletionTokens;
  }

  if (includeOptionalFields) {
    if (temperature !== null) {
      body.temperature = temperature;
    }

    if (reasoningEffort !== null) {
      body.reasoning_effort = reasoningEffort;
    }

    if (verbosity !== null) {
      body.verbosity = verbosity;
    }
  }

  const res = await requestUrl({
    url: buildChatCompletionsUrl(apiBaseUrl),
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (res.status < 200 || res.status >= 300) {
    throw new ApiError(`API Error: ${res.status} - ${res.text}`, res.status);
  }

  const data: unknown = res.json;
  if (!isChatCompletionResponse(data)) {
    throw new Error("API response did not include a message content");
  }

  const content = extractChatCompletionContent(data);
  if (content === null) {
    throw new Error("API response did not include a message content");
  }

  if (data.choices[0].finish_reason === "length") {
    throw new CompletionTruncatedError();
  }

  return content;
}

export async function callChatCompletion(
  options: ChatCompletionOptions,
): Promise<string> {
  const attempts: Array<{
    useSystemMessage: boolean;
    includeOptionalFields: boolean;
  }> = [
    { useSystemMessage: true, includeOptionalFields: true },
    { useSystemMessage: true, includeOptionalFields: false },
    { useSystemMessage: false, includeOptionalFields: false },
  ];
  let lastError: unknown;

  for (const attempt of attempts) {
    try {
      return await requestChatCompletion(
        options,
        attempt.useSystemMessage,
        attempt.includeOptionalFields,
      );
    } catch (error) {
      lastError = error;
      const status = error instanceof ApiError ? error.status : undefined;
      if (status === undefined || status >= 500) {
        throw error;
      }
    }
  }

  throw lastError;
}

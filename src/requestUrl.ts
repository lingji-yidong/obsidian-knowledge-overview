import { DEFAULT_SETTINGS } from "./settings";

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

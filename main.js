/* THIS IS A GENERATED FILE. DO NOT EDIT DIRECTLY. */
"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// main.ts
var main_exports = {};
__export(main_exports, {
  default: () => main_default
});
module.exports = __toCommonJS(main_exports);

// src/plugin.ts
var import_obsidian4 = require("obsidian");

// src/api.ts
var import_obsidian = require("obsidian");

// src/settings.ts
var DEFAULT_SETTINGS = {
  apiKey: "",
  language: "en",
  apiBaseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
  modelOutline: "gemini-3.5-flash",
  modelChapter: "gemini-3.5-flash",
  maxCompletionTokens: 16e3,
  chapterConcurrency: 1,
  knowledgeDepth: "onboarding",
  autoDetectKnowledgeType: true,
  knowledgeTypeOverride: "auto",
  minChapterChars: 8500,
  temperature: null,
  reasoningEffort: null,
  verbosity: null,
  thinkingMode: "auto"
};
var MIN_CONCURRENCY = 1;
var MAX_CHAPTER_CONCURRENCY = 20;

// src/requestUrl.ts
function buildChatCompletionsUrl(apiBaseUrl) {
  const trimmed = apiBaseUrl.trim();
  const fallback = DEFAULT_SETTINGS.apiBaseUrl;
  const withoutTrailingSlash = (trimmed || fallback).replace(/\/+$/, "");
  const withoutEndpoint = withoutTrailingSlash.replace(
    /(?:\/chat)?\/completions$/i,
    ""
  );
  const normalizedSlashes = withoutEndpoint.replace(/([^:]\/)\/+/g, "$1").replace(/\/+$/, "");
  const hasPath = /^https?:\/\/[^/]+\/.+/i.test(normalizedSlashes);
  const baseUrl = hasPath ? normalizedSlashes : `${normalizedSlashes}/v1`;
  return `${baseUrl}/chat/completions`;
}

// src/chatCompletion.ts
var capabilityCache = /* @__PURE__ */ new Map();
var DEFAULT_MAX_TRANSIENT_ATTEMPTS = 3;
var RETRY_BASE_DELAY_MS = 1e3;
var ApiError = class extends Error {
  constructor(status, providerMessage, retryAfterMs) {
    super(`API error ${status}: ${providerMessage}`);
    this.name = "ApiError";
    this.status = status;
    this.retryAfterMs = retryAfterMs;
    this.providerMessage = providerMessage;
  }
};
var CompletionTruncatedError = class extends Error {
  constructor() {
    super(
      "API response reached its output token limit. Increase the limit or narrow the requested chapter scope before retrying."
    );
    this.name = "CompletionTruncatedError";
  }
};
var ChatResponseError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "ChatResponseError";
  }
};
var ChatTransportError = class extends Error {
  constructor() {
    super("Network request failed before the provider returned an HTTP response");
    this.name = "ChatTransportError";
  }
};
var GenerationCancelledError = class extends Error {
  constructor() {
    super("Generation cancelled");
    this.name = "GenerationCancelledError";
  }
};
function isRetryableStatus(status) {
  return status === 408 || status === 409 || status === 425 || status === 429 || status >= 500;
}
function defaultDelay(milliseconds) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}
function buildPromptWithSystem(userPrompt, systemPrompt) {
  if (!systemPrompt) {
    return userPrompt;
  }
  return `${systemPrompt}

${userPrompt}`;
}
function buildRequestBody(options, profile) {
  const messages = profile.useSystemMessage && options.systemPrompt ? [
    { role: "system", content: options.systemPrompt },
    { role: "user", content: options.userPrompt }
  ] : [
    {
      role: "user",
      content: buildPromptWithSystem(
        options.userPrompt,
        options.systemPrompt
      )
    }
  ];
  const body = {
    model: options.model,
    messages
  };
  if (options.maxCompletionTokens !== null) {
    body[profile.tokenField] = options.maxCompletionTokens;
  }
  if (profile.optionalFields.temperature && options.temperature !== null) {
    body.temperature = options.temperature;
  }
  if (profile.optionalFields.reasoningEffort && options.reasoningEffort !== null) {
    body.reasoning_effort = options.reasoningEffort;
  }
  if (profile.optionalFields.verbosity && options.verbosity !== null) {
    body.verbosity = options.verbosity;
  }
  if (profile.optionalFields.thinking && (options.thinkingMode === "enabled" || options.thinkingMode === "disabled")) {
    body.thinking = { type: options.thinkingMode };
  }
  return body;
}
function isChatCompletionResponse(value) {
  if (!value || typeof value !== "object") {
    return false;
  }
  const choices = value.choices;
  return Array.isArray(choices) && choices.length > 0 && typeof choices[0] === "object" && choices[0] !== null;
}
function extractTextContent(content) {
  if (typeof content === "string") {
    return content;
  }
  if (!Array.isArray(content)) {
    return null;
  }
  const parts = content.map((part) => {
    if (typeof part === "string") return part;
    if (!part || typeof part !== "object") return "";
    const maybeText = part;
    if (typeof maybeText.text === "string") return maybeText.text;
    if (typeof maybeText.content === "string") return maybeText.content;
    return "";
  }).join("");
  return parts || null;
}
function extractChatCompletionContent(data) {
  var _a, _b;
  const firstChoice = data.choices[0];
  return (_b = extractTextContent((_a = firstChoice.message) == null ? void 0 : _a.content)) != null ? _b : extractTextContent(firstChoice.text);
}
function readNumericUsage(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : void 0;
}
function findHeader(headers, name) {
  var _a;
  const target = name.toLocaleLowerCase();
  return (_a = Object.entries(headers).find(
    ([key]) => key.toLocaleLowerCase() === target
  )) == null ? void 0 : _a[1];
}
function parseRetryAfterMs(headers, now) {
  var _a;
  const value = (_a = findHeader(headers, "retry-after")) == null ? void 0 : _a.trim();
  if (!value) return void 0;
  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) {
    return Math.round(seconds * 1e3);
  }
  const date = Date.parse(value);
  return Number.isFinite(date) ? Math.max(0, date - now) : void 0;
}
function extractProviderMessage(response) {
  const json = response.json;
  if (json && typeof json === "object") {
    const error = json.error;
    if (error && typeof error === "object") {
      const message = error.message;
      if (typeof message === "string" && message.trim()) {
        return message.trim().slice(0, 600);
      }
    }
  }
  return response.text.trim().slice(0, 600) || "Provider rejected the request";
}
function detectCapabilityFallback(error, profile) {
  if (error.status !== 400 && error.status !== 422) {
    return null;
  }
  const message = error.providerMessage.toLocaleLowerCase();
  const incompatibility = /unsupported|not supported|unknown|unrecognized|not allowed|invalid parameter|extra field/.test(
    message
  );
  if (!incompatibility) {
    return null;
  }
  const systemRoleMentioned = /system(?: message| role)?/.test(message);
  const completionTokenFieldMentioned = /max[_ ]completion[_ ]tokens/.test(
    message
  );
  if (completionTokenFieldMentioned && profile.tokenField === "max_completion_tokens") {
    return {
      profile: { ...profile, tokenField: "max_tokens" },
      fields: ["maxCompletionTokens"]
    };
  }
  const optionalFieldPatterns = [
    ["temperature", /temperature/],
    ["reasoningEffort", /reasoning[_ ]effort/],
    ["verbosity", /verbosity/],
    ["thinking", /thinking/]
  ];
  const optionalFields = { ...profile.optionalFields };
  let optionalFieldChanged = false;
  const changedFields = [];
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
      fields: changedFields
    };
  }
  if (systemRoleMentioned && profile.useSystemMessage) {
    return {
      profile: {
        ...profile,
        useSystemMessage: false
      },
      fields: ["systemMessage"]
    };
  }
  return null;
}
function getRetryDelayMs(error, retryIndex, random) {
  if (error instanceof ApiError && error.retryAfterMs !== void 0) {
    return error.retryAfterMs;
  }
  const exponential = RETRY_BASE_DELAY_MS * 2 ** retryIndex;
  const jitter = 0.75 + random() * 0.5;
  return Math.round(exponential * jitter);
}
async function makeRequest(options, profile, runtime) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m;
  const now = (_a = runtime.now) != null ? _a : Date.now;
  const startedAt = now();
  let response;
  try {
    response = await runtime.transport({
      url: buildChatCompletionsUrl(options.apiBaseUrl),
      method: "POST",
      headers: {
        Authorization: `Bearer ${options.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(buildRequestBody(options, profile))
    });
  } catch (error) {
    if (error instanceof GenerationCancelledError) {
      throw error;
    }
    (_d = runtime.onEvent) == null ? void 0 : _d.call(runtime, {
      kind: "request",
      promptChars: options.userPrompt.length + ((_c = (_b = options.systemPrompt) == null ? void 0 : _b.length) != null ? _c : 0)
    });
    throw new ChatTransportError();
  }
  (_g = runtime.onEvent) == null ? void 0 : _g.call(runtime, {
    kind: "request",
    promptChars: options.userPrompt.length + ((_f = (_e = options.systemPrompt) == null ? void 0 : _e.length) != null ? _f : 0)
  });
  if (response.status < 200 || response.status >= 300) {
    throw new ApiError(
      response.status,
      extractProviderMessage(response),
      parseRetryAfterMs(response.headers, now())
    );
  }
  if (!isChatCompletionResponse(response.json)) {
    throw new ChatResponseError(
      "API response did not include a usable message choice"
    );
  }
  if (response.json.choices[0].finish_reason === "length") {
    throw new CompletionTruncatedError();
  }
  const content = extractChatCompletionContent(response.json);
  if (content === null || content.trim().length === 0) {
    const finishReason = response.json.choices[0].finish_reason;
    const finishReasonLabel = typeof finishReason === "string" ? finishReason : "unknown";
    const reasoningContent = response.json.choices[0].message;
    const hasReasoningContent = typeof (reasoningContent == null ? void 0 : reasoningContent.reasoning_content) === "string" && reasoningContent.reasoning_content.trim().length > 0;
    throw new ChatResponseError(
      `API response did not include non-empty final content (finish_reason=${finishReasonLabel}, reasoning_content=${hasReasoningContent ? "present" : "absent"})`
    );
  }
  (_m = runtime.onEvent) == null ? void 0 : _m.call(runtime, {
    kind: "success",
    model: typeof response.json.model === "string" && response.json.model.trim() ? response.json.model.trim() : options.model,
    status: response.status,
    durationMs: now() - startedAt,
    outputChars: content.length,
    promptTokens: readNumericUsage((_h = response.json.usage) == null ? void 0 : _h.prompt_tokens),
    completionTokens: readNumericUsage(
      (_i = response.json.usage) == null ? void 0 : _i.completion_tokens
    ),
    totalTokens: readNumericUsage((_j = response.json.usage) == null ? void 0 : _j.total_tokens),
    reasoningTokens: readNumericUsage(
      (_l = (_k = response.json.usage) == null ? void 0 : _k.completion_tokens_details) == null ? void 0 : _l.reasoning_tokens
    )
  });
  return content;
}
async function executeChatCompletion(options, runtime) {
  var _a, _b, _c, _d, _e, _f, _g;
  const delay = (_a = runtime.delay) != null ? _a : defaultDelay;
  const random = (_b = runtime.random) != null ? _b : Math.random;
  const maxTransientAttempts = Math.max(
    1,
    (_c = runtime.maxTransientAttempts) != null ? _c : DEFAULT_MAX_TRANSIENT_ATTEMPTS
  );
  const capabilityKey = `${buildChatCompletionsUrl(options.apiBaseUrl)}
${options.model}`;
  const cachedProfile = capabilityCache.get(capabilityKey);
  let profile;
  if (cachedProfile) {
    profile = cachedProfile;
  } else {
    let isDeepSeekEndpoint = false;
    try {
      const hostname = new URL(
        buildChatCompletionsUrl(options.apiBaseUrl)
      ).hostname.toLocaleLowerCase();
      isDeepSeekEndpoint = hostname === "deepseek.com" || hostname.endsWith(".deepseek.com");
    } catch (e) {
    }
    profile = {
      useSystemMessage: true,
      optionalFields: {
        temperature: true,
        reasoningEffort: true,
        verbosity: true,
        thinking: true
      },
      tokenField: isDeepSeekEndpoint ? "max_tokens" : "max_completion_tokens"
    };
  }
  let transientAttempt = 0;
  while (true) {
    if ((_d = runtime.shouldCancel) == null ? void 0 : _d.call(runtime)) {
      throw new GenerationCancelledError();
    }
    try {
      return await makeRequest(options, profile, runtime);
    } catch (error) {
      const errorStatus = error instanceof ApiError ? error.status : void 0;
      const capabilityFallback = error instanceof ApiError ? detectCapabilityFallback(error, profile) : null;
      if (capabilityFallback) {
        profile = capabilityFallback.profile;
        capabilityCache.set(capabilityKey, profile);
        (_e = runtime.onEvent) == null ? void 0 : _e.call(runtime, {
          kind: "compatibility",
          status: errorStatus,
          compatibilityFields: capabilityFallback.fields
        });
        continue;
      }
      const retryable = error instanceof ChatTransportError || error instanceof ApiError && isRetryableStatus(error.status);
      if (retryable && transientAttempt < maxTransientAttempts - 1) {
        const delayMs = getRetryDelayMs(error, transientAttempt, random);
        transientAttempt += 1;
        (_f = runtime.onEvent) == null ? void 0 : _f.call(runtime, {
          kind: "retry",
          status: error instanceof ApiError ? error.status : void 0,
          delayMs
        });
        await delay(delayMs);
        continue;
      }
      (_g = runtime.onEvent) == null ? void 0 : _g.call(runtime, {
        kind: "failure",
        status: error instanceof ApiError ? error.status : void 0
      });
      throw error;
    }
  }
}

// src/api.ts
async function callChatCompletion(options, controls = {}) {
  var _a;
  const scheduleRequest = (_a = controls.scheduleRequest) != null ? _a : (request) => request();
  return executeChatCompletion(options, {
    shouldCancel: controls.shouldCancel,
    onEvent: controls.onEvent,
    transport: async (request) => {
      const response = await scheduleRequest(
        () => (0, import_obsidian.requestUrl)({
          url: request.url,
          method: request.method,
          headers: request.headers,
          body: request.body,
          throw: false
        })
      );
      return {
        status: response.status,
        headers: response.headers,
        text: response.text,
        json: response.json
      };
    }
  });
}

// src/chapterQuality.ts
var QA_SOURCE_PATTERN = /<!--\s*source:\s*([^>]+?)\s*-->/gi;
var QA_SOURCE_VALUE_PATTERN = /^<!--\s*source:\s*([^>]+?)\s*-->$/i;
var QA_SOURCE_TEST_PATTERN = /<!--\s*source:\s*[^>]+?\s*-->/i;
var QA_SECTION_BOUNDARY_PATTERN = /^##\s+.+?<!--\s*qa-section\s*-->\s*$/i;
var ORDERED_ITEM_PATTERN = /^ {0,3}\d+[.)、]\s+/;
function findQaSection(text) {
  const lines = text.split("\n");
  const boundaryIndex = lines.findIndex(
    (line) => QA_SECTION_BOUNDARY_PATTERN.test(line)
  );
  return boundaryIndex >= 0 ? {
    content: lines.slice(boundaryIndex + 1).join("\n"),
    hasBoundary: true
  } : { content: text, hasBoundary: false };
}
function countReviewQuestions(text) {
  var _a;
  const { content } = findQaSection(text);
  const lines = content.split("\n");
  const candidateLists = [];
  let itemCount = 0;
  let listStart = -1;
  const finishList = (end) => {
    if (itemCount === 0 || listStart < 0) return;
    candidateLists.push({
      count: itemCount,
      hasSourceAnchor: QA_SOURCE_TEST_PATTERN.test(
        lines.slice(listStart, end).join("\n")
      )
    });
    itemCount = 0;
    listStart = -1;
  };
  lines.forEach((line, index) => {
    if (ORDERED_ITEM_PATTERN.test(line)) {
      if (listStart < 0) listStart = index;
      itemCount += 1;
      return;
    }
    if (listStart >= 0 && line.trim().length > 0 && !/^\s+/.test(line) && !QA_SOURCE_TEST_PATTERN.test(line)) {
      finishList(index);
    }
  });
  finishList(lines.length);
  for (let index = candidateLists.length - 1; index >= 0; index -= 1) {
    const candidate = candidateLists[index];
    if (candidate.hasSourceAnchor) return candidate.count;
  }
  return ((_a = content.match(/[？?]\s*(?:<!--[^>]+-->)?\s*$/gm)) != null ? _a : []).length;
}
function countLearningChars(text) {
  return text.replace(/```[^\n]*\n?/g, "").replace(/<!--[^>]*-->/g, "").replace(/\s/g, "").length;
}
function stripFencedCodeBlocks(text) {
  return text.replace(/```[\s\S]*?```/g, "");
}
function hasHeadingDepthJump(text) {
  var _a;
  const levels = ((_a = text.match(/^#{2,4}\s+/gm)) != null ? _a : []).map(
    (heading) => heading.search(/\s/u)
  );
  return levels.some(
    (level, index) => index > 0 && level > levels[index - 1] + 1
  );
}
function collectHeadingTitles(text) {
  var _a;
  return new Set(
    ((_a = text.match(/^##\s+.+?\s*$/gm)) != null ? _a : []).map((heading) => heading.replace(/^##\s+/u, "")).filter((title) => !/<!--\s*qa-section\s*-->/i.test(title)).map(
      (title) => title.replace(/<!--[^>]*-->/g, "").trim().toLocaleLowerCase()
    )
  );
}
function collectQaAnchors(text) {
  var _a, _b;
  const { content } = findQaSection(text);
  const anchors = [];
  for (const sourceMarker of (_a = content.match(QA_SOURCE_PATTERN)) != null ? _a : []) {
    const value = (_b = sourceMarker.match(QA_SOURCE_VALUE_PATTERN)) == null ? void 0 : _b[1];
    if (value !== void 0) {
      anchors.push(value.trim().toLocaleLowerCase());
    }
  }
  return anchors;
}
function evaluateChapterQuality(text, density) {
  var _a, _b, _c, _d, _e, _f;
  const charCount = countLearningChars(text);
  const structureText = stripFencedCodeBlocks(text);
  const headings = (_a = structureText.match(/^#{2,4}\s+/gm)) != null ? _a : [];
  const headingCount = headings.length;
  const h2Count = ((_b = structureText.match(/^##\s+/gm)) != null ? _b : []).length;
  const exampleCount = ((_c = text.match(/例子|示例|案例|example|worked example/gi)) != null ? _c : []).length;
  const failureModeCount = ((_d = text.match(
    /誤解|误解|混淆|錯誤|错误|失敗|失败|修正|misconception|mistake|failure|pitfall|troubleshooting/gi
  )) != null ? _d : []).length;
  const questionCount = countReviewQuestions(text);
  const qaAnchors = collectQaAnchors(text);
  const hasQaSectionBoundary = findQaSection(text).hasBoundary;
  const headingTitles = collectHeadingTitles(structureText);
  const invalidQaAnchorCount = qaAnchors.filter(
    (anchor) => !headingTitles.has(anchor)
  ).length;
  const formulaCount = ((_e = text.match(/\$\$[\s\S]*?\$\$|\$[^$\n]+\$/g)) != null ? _e : []).length;
  const bulletLines = ((_f = text.match(/^\s*[-*]\s+/gm)) != null ? _f : []).length;
  const paragraphBlocks = text.split(/\n\s*\n/).filter((block) => block.trim().length > 120).length;
  const maxHeadingCount = Math.max(18, Math.ceil(charCount / 700));
  return {
    charCount,
    headingCount,
    h2Count,
    exampleCount,
    failureModeCount,
    questionCount,
    qaAnchorCount: qaAnchors.length,
    invalidQaAnchorCount,
    hasQaSectionBoundary,
    formulaCount,
    bulletLines,
    paragraphBlocks,
    glossaryInflationRisk: bulletLines > paragraphBlocks * 2,
    likelyTooShort: charCount < density.targetChars.min,
    likelyTooLong: charCount > density.targetChars.max,
    likelyTooGlossaryLike: bulletLines > 40 && paragraphBlocks < 20,
    insufficientQuestionCount: questionCount < density.retrievalQuestions,
    insufficientH2Count: h2Count < 5,
    excessiveHeadingCount: headingCount > maxHeadingCount || h2Count > 9,
    headingDepthJump: hasHeadingDepthJump(structureText),
    hasOverdeepHeading: /^#{4,}\s+/m.test(structureText),
    unexpectedH1: /^#\s+/m.test(structureText)
  };
}
function getChapterQualityWarnings(report) {
  const warnings = [];
  if (report.likelyTooShort) warnings.push("below the chapter length target");
  if (report.likelyTooLong) warnings.push("above the chapter length target");
  if (report.likelyTooGlossaryLike) warnings.push("too glossary-like");
  if (report.insufficientQuestionCount) {
    warnings.push("too few grounded review questions");
  }
  if (report.insufficientH2Count) warnings.push("too few H2 sections");
  if (report.excessiveHeadingCount) warnings.push("too many headings");
  if (report.headingDepthJump) warnings.push("heading levels skip a level");
  if (report.hasOverdeepHeading) warnings.push("uses H4 or deeper headings");
  if (report.unexpectedH1) warnings.push("chapter body contains an extra H1 title");
  if (report.questionCount !== report.qaAnchorCount) {
    warnings.push("review questions must each cite exactly one source section");
  }
  if (report.invalidQaAnchorCount > 0) {
    warnings.push("some review-question source sections do not exist");
  }
  if (!report.hasQaSectionBoundary) {
    warnings.push("missing deterministic QA section boundary");
  }
  return warnings;
}

// src/markdown-fences.ts
var MARKDOWN_FENCE_PATTERN = /^\s*(`{3,}|~{3,})/;
function getMarkdownFenceMarker(line) {
  var _a, _b, _c;
  return (_c = (_b = (_a = line.match(MARKDOWN_FENCE_PATTERN)) == null ? void 0 : _a[1]) == null ? void 0 : _b[0]) != null ? _c : null;
}
function updateMarkdownFence(line, activeFence) {
  const marker = getMarkdownFenceMarker(line);
  if (!marker) return activeFence;
  if (activeFence === null) return marker;
  return marker === activeFence ? null : activeFence;
}

// src/chapter-numbering.ts
var MARKDOWN_HEADING_PATTERN = /^(#{2,4})\s+(.+?)\s*$/;
var QA_SECTION_MARKER_PATTERN = /\s*(<!--\s*qa-section\s*-->)\s*$/i;
var QA_SOURCE_PATTERN2 = /<!--\s*source:\s*([^>]+?)\s*-->/gi;
var SECTION_NUMBER_PATTERN = /^\d+(?:\.\d+)+\s+/;
function stripChapterSectionNumber(title) {
  return title.trim().replace(SECTION_NUMBER_PATTERN, "");
}
function numberChapterHeadings(content, chapterNumber) {
  const safeChapterNumber = /^\d+(?:\.\d+)*$/.test(chapterNumber.trim()) ? chapterNumber.trim() : "1";
  const lines = content.split("\n");
  const h2TitleMap = /* @__PURE__ */ new Map();
  let activeFence = null;
  let h2Index = 0;
  let h3Index = 0;
  let h4Index = 0;
  const numberedLines = lines.map((line) => {
    const previousFence = activeFence;
    activeFence = updateMarkdownFence(line, activeFence);
    if (previousFence !== null || getMarkdownFenceMarker(line)) return line;
    const heading = line.match(MARKDOWN_HEADING_PATTERN);
    if (!heading) return line;
    const hashes = heading[1];
    const markerMatch = heading[2].match(QA_SECTION_MARKER_PATTERN);
    const marker = markerMatch == null ? void 0 : markerMatch[1];
    const rawTitle = heading[2].replace(QA_SECTION_MARKER_PATTERN, "").trim();
    const baseTitle = stripChapterSectionNumber(rawTitle);
    let sectionNumber;
    if (hashes.length === 2) {
      h2Index += 1;
      h3Index = 0;
      h4Index = 0;
      sectionNumber = `${safeChapterNumber}.${h2Index}`;
      const numberedTitle = `${sectionNumber} ${baseTitle}`;
      const key = baseTitle.toLocaleLowerCase();
      if (!h2TitleMap.has(key)) h2TitleMap.set(key, numberedTitle);
    } else if (hashes.length === 3 && h2Index > 0) {
      h3Index += 1;
      h4Index = 0;
      sectionNumber = `${safeChapterNumber}.${h2Index}.${h3Index}`;
    } else if (hashes.length === 4 && h2Index > 0 && h3Index > 0) {
      h4Index += 1;
      sectionNumber = `${safeChapterNumber}.${h2Index}.${h3Index}.${h4Index}`;
    } else {
      return line;
    }
    return `${hashes} ${sectionNumber} ${baseTitle}${marker ? ` ${marker}` : ""}`;
  });
  activeFence = null;
  return numberedLines.map((line) => {
    const previousFence = activeFence;
    activeFence = updateMarkdownFence(line, activeFence);
    if (previousFence !== null || getMarkdownFenceMarker(line)) return line;
    return line.replace(QA_SOURCE_PATTERN2, (match, source) => {
      const baseSource = stripChapterSectionNumber(source);
      const numberedTitle = h2TitleMap.get(baseSource.toLocaleLowerCase());
      return numberedTitle ? `<!-- source: ${numberedTitle} -->` : match;
    });
  }).join("\n");
}

// src/chapter-markdown.ts
function normalizeInlineMath(line) {
  let inlineCodeFence = null;
  return line.split(/(`+)/).map((segment) => {
    if (/^`+$/.test(segment)) {
      if (inlineCodeFence === null) {
        inlineCodeFence = segment;
      } else if (segment === inlineCodeFence) {
        inlineCodeFence = null;
      }
      return segment;
    }
    if (inlineCodeFence !== null) return segment;
    return segment.replace(
      /\\\((.+?)\\\)/g,
      (_match, formula) => `$${formula}$`
    );
  }).join("");
}
function normalizeObsidianMathDelimiters(content) {
  let activeFence = null;
  return content.split("\n").map((line) => {
    const previousFence = activeFence;
    activeFence = updateMarkdownFence(line, activeFence);
    if (previousFence !== null || getMarkdownFenceMarker(line)) return line;
    const trimmed = line.trim();
    if (trimmed === "\\[" || trimmed === "\\]") {
      const indentationEnd = line.search(/\S|$/u);
      const indentation = line.slice(0, indentationEnd);
      return `${indentation}$$`;
    }
    return normalizeInlineMath(line);
  }).join("\n");
}

// src/domainAdapters.ts
var CONCEPTUAL_ADAPTER = {
  knowledgeType: "conceptual",
  coreUnitType: "concept",
  requiredSections: [
    "a concise prerequisite bridge",
    "the core concepts and how they relate",
    "concrete examples and tradeoffs",
    "important misconceptions",
    "grounded review questions"
  ],
  unitFields: [
    "definition and intuition",
    "why it exists",
    "problem it solves",
    "prerequisites",
    "concrete example",
    "relationship to neighboring concepts",
    "common misconception"
  ],
  exampleRequirements: [
    "include concrete examples for abstract concepts",
    "include at least one comparison between easily confused concepts"
  ],
  reliabilityRules: [
    "distinguish definitions, examples, mechanisms, and consequences instead of treating them as interchangeable",
    "state whether a relationship is necessary, sufficient, typical, or merely associated when that distinction matters"
  ],
  failureModeName: "misconceptions and conceptual traps"
};
var MATHEMATICAL_ADAPTER = {
  knowledgeType: "mathematical",
  coreUnitType: "formula_or_model",
  requiredSections: [
    "the problem and required quantities",
    "symbols, units, assumptions, and formula intuition",
    "worked numerical reasoning",
    "applicability and limiting cases",
    "common modeling mistakes",
    "grounded review questions"
  ],
  unitFields: [
    "definition",
    "intuition",
    "symbols and units",
    "assumptions",
    "when the model applies",
    "simple numerical example",
    "what breaks when assumptions fail"
  ],
  exampleRequirements: [
    "define every symbol in important formulas",
    "explain units and dimensions",
    "include at least one numerical example",
    "include one limiting-case or edge-case explanation"
  ],
  reliabilityRules: [
    "keep ideal mathematical guarantees separate from quantization, noise, jitter, numerical error, and other implementation limits",
    "state the assumptions, units, and specifications that justify any numerical design recommendation",
    "for every named law, approximation, equilibrium, stationary condition, or transformed measure, state its precise claim, validity domain, observability limits, and any extra assumptions required for stronger or across-step conclusions",
    "do not treat a stationary point as necessarily a minimum, a one-step equilibrium identity as across-step invariance, or a transformed pricing probability as a physical belief or an investor preference unless the chapter explicitly proves that interpretation"
  ],
  failureModeName: "wrong assumptions, unit mistakes, and formula misuse"
};
var PROCEDURAL_ADAPTER = {
  knowledgeType: "procedural",
  coreUnitType: "procedure",
  requiredSections: [
    "the goal, setup, and expected result",
    "a minimal complete workflow",
    "verification after major steps",
    "realistic mistakes and troubleshooting",
    "practice tasks grounded in the workflow"
  ],
  unitFields: [
    "goal",
    "when to use it",
    "steps",
    "menu path or shortcut if applicable",
    "expected result",
    "common mistakes",
    "how to verify the output"
  ],
  exampleRequirements: [
    "include at least one complete beginner workflow",
    "include realistic mistakes and fixes",
    "include verification steps after each major workflow"
  ],
  reliabilityRules: [
    "do not invent a menu path, command, version-specific behavior, or successful result when the chapter context does not establish it",
    "separate required steps from optional alternatives and pair consequential actions with a concrete verification result"
  ],
  failureModeName: "common mistakes and troubleshooting"
};
var EMPIRICAL_ADAPTER = {
  knowledgeType: "empirical",
  coreUnitType: "evaluation_method",
  requiredSections: [
    "the hypothesis, data, and assumptions",
    "the evaluation pipeline and metrics",
    "baseline comparison",
    "bias, leakage, and invalid inference",
    "robustness and evidence limits",
    "grounded practice questions"
  ],
  unitFields: [
    "what it measures",
    "why it matters",
    "assumptions",
    "how to compute or test it",
    "how it fails",
    "example",
    "diagnostic check"
  ],
  exampleRequirements: [
    "include a toy empirical or backtest example",
    "include at least one biased example and explain the flaw",
    "include what evidence would change the conclusion"
  ],
  reliabilityRules: [
    "keep assignment failure, noncompliance, observed behavioral outcomes, missing outcomes or attrition, interference, post-treatment selection or adjustment, and prediction or target leakage conceptually distinct",
    "intention-to-treat preserves comparison by original assignment; it does not recover missing outcomes. Do not call an observed outcome such as churn or non-login missing unless its measurement is actually unavailable",
    "do not claim that post-hoc aggregation or exclusion restores the original randomization. When interference changes the required randomization unit, treat cluster assignment and its estimand as design-time choices",
    "separate legitimate treatment-responsive prediction features from future-information or target leakage and invalid causal adjustment. No single diagnostic result or invented threshold proves validity",
    "when randomized online experiments or A/A tests are in scope, name sample ratio mismatch (SRM) and separate its allocation-count check from outcome-metric calibration. Compare observed variant counts with the configured allocation using a prespecified conservative gate; assess false-positive behavior across repeated A/A runs or simulated null assignments rather than diagnosing the system from one p-value"
  ],
  failureModeName: "biases, leakage, false edge, and invalid inference"
};
var CRAFT_ADAPTER = {
  knowledgeType: "craft",
  coreUnitType: "technique",
  requiredSections: [
    "materials, tools, and quality standards",
    "the core process and techniques",
    "representative finished-output examples",
    "failure diagnosis and correction",
    "grounded practice tasks"
  ],
  unitFields: [
    "purpose",
    "materials or conditions",
    "steps",
    "sensory or quality standard",
    "common failure",
    "fix"
  ],
  exampleRequirements: [
    "include concrete finished-output standards",
    "include failure correction examples",
    "explain what good output looks, sounds, tastes, or feels like"
  ],
  reliabilityRules: [
    "label subjective quality judgments and distinguish them from safety requirements or measurable tolerances",
    "state when material, tool, or environmental differences make a technique non-transferable"
  ],
  failureModeName: "bad outputs and fixes"
};
var HISTORICAL_ADAPTER = {
  knowledgeType: "historical",
  coreUnitType: "historical_transition",
  requiredSections: [
    "a selective chronology serving the explanation",
    "actors, institutions, and causal forces",
    "major transitions and competing interpretations",
    "representative cases and evidence limits",
    "legacy without presentist oversimplification",
    "grounded review questions"
  ],
  unitFields: [
    "period or transition",
    "what changed",
    "why it changed",
    "key actors or examples",
    "broader context",
    "modern relevance",
    "common misconception"
  ],
  exampleRequirements: [
    "avoid pure timeline listing",
    "explain causal forces behind transitions",
    "include representative cases"
  ],
  reliabilityRules: [
    "when an exact date, quantity, officeholder, policy exception, or event sequence matters, include it only when confident; otherwise use a bounded qualifier rather than manufactured precision",
    "track actors, offices or institutions, policies, events, and chronology as separate facts; do not compress a succession or concession when the order changes the explanation",
    "separate documented policy and institutions from public perception or outcomes, and distinguish causal contribution from necessity or sufficiency",
    "present historiographical labels as contested analytical lenses rather than tidy camps or a forced final synthesis"
  ],
  failureModeName: "oversimplified timelines and historical myths"
};
var INTERPRETIVE_ADAPTER = {
  knowledgeType: "interpretive",
  coreUnitType: "textual_evidence",
  requiredSections: [
    "text and context",
    "central interpretive questions",
    "close reading and evidence",
    "competing interpretations",
    "limits of the reading",
    "retrieval questions"
  ],
  unitFields: [
    "claim",
    "textual evidence",
    "context",
    "interpretation",
    "alternative reading",
    "limits"
  ],
  exampleRequirements: [
    "connect every major interpretation to concrete textual evidence",
    "compare at least two plausible readings where the material supports them",
    "distinguish what the text states from what the reader infers"
  ],
  reliabilityRules: [
    "apply the same interpretive criterion to competing readings and state what evidence would weaken the preferred reading",
    "do not call evidence independent when it reaches the reader through the same contested narrator, witness, editor, or source"
  ],
  failureModeName: "unsupported readings, anachronism, and context loss"
};
var ARGUMENTATIVE_ADAPTER = {
  knowledgeType: "argumentative",
  coreUnitType: "argument",
  requiredSections: [
    "question and stakes",
    "key positions",
    "argument chains",
    "objections and replies",
    "evaluation standards",
    "retrieval questions"
  ],
  unitFields: [
    "claim",
    "premises",
    "inference",
    "support",
    "objection",
    "reply",
    "remaining uncertainty"
  ],
  exampleRequirements: [
    "reconstruct at least one argument premise by premise",
    "include a serious objection rather than a weak straw man",
    "separate descriptive claims from normative judgments"
  ],
  reliabilityRules: [
    "do not promote a premise, analogy, or value judgment into a demonstrated conclusion without naming the inference",
    "evaluate objections against the strongest defensible version of the position and preserve unresolved tradeoffs"
  ],
  failureModeName: "hidden premises, weak objections, and invalid inference"
};
var CASE_BASED_ADAPTER = {
  knowledgeType: "case_based",
  coreUnitType: "case_analysis",
  requiredSections: [
    "analytical frame",
    "institutions and actors",
    "representative cases",
    "causal claims and alternatives",
    "evidence limits",
    "retrieval questions"
  ],
  unitFields: [
    "case context",
    "actors and institutions",
    "mechanism or claim",
    "evidence",
    "alternative explanation",
    "transfer limits"
  ],
  exampleRequirements: [
    "use cases to test concepts rather than decorate the chapter",
    "compare at least one alternative explanation",
    "state what cannot be generalized from the case"
  ],
  reliabilityRules: [
    "separate evidence within a case from the mechanism inferred from it and from claims transferred to other settings",
    "do not treat a selected success or failure case as representative without explaining the selection and comparison limits"
  ],
  failureModeName: "single-cause stories, selection bias, and overgeneralization"
};
var ADAPTERS = {
  conceptual: CONCEPTUAL_ADAPTER,
  mathematical: MATHEMATICAL_ADAPTER,
  procedural: PROCEDURAL_ADAPTER,
  empirical: EMPIRICAL_ADAPTER,
  craft: CRAFT_ADAPTER,
  historical: HISTORICAL_ADAPTER,
  interpretive: INTERPRETIVE_ADAPTER,
  argumentative: ARGUMENTATIVE_ADAPTER,
  case_based: CASE_BASED_ADAPTER
};
function dedupe(values) {
  return Array.from(new Set(values));
}
function collectSecondaryFields(secondary, selector) {
  return secondary.reduce((values, adapter) => {
    values.push(...selector(adapter));
    return values;
  }, []);
}
function getAdapterForKnowledgeType(knowledgeType) {
  if (knowledgeType === "hybrid") {
    return CONCEPTUAL_ADAPTER;
  }
  return ADAPTERS[knowledgeType];
}
function mergeAdapters(primary, secondary) {
  return {
    knowledgeType: "hybrid",
    coreUnitType: primary.coreUnitType,
    requiredSections: dedupe([
      ...primary.requiredSections,
      ...collectSecondaryFields(
        secondary,
        (adapter) => adapter.requiredSections.slice(0, 3)
      )
    ]),
    unitFields: dedupe([
      ...primary.unitFields,
      ...collectSecondaryFields(
        secondary,
        (adapter) => adapter.unitFields.slice(0, 3)
      )
    ]),
    exampleRequirements: dedupe([
      ...primary.exampleRequirements,
      ...collectSecondaryFields(
        secondary,
        (adapter) => adapter.exampleRequirements
      )
    ]),
    reliabilityRules: dedupe([
      ...primary.reliabilityRules,
      ...collectSecondaryFields(
        secondary,
        (adapter) => adapter.reliabilityRules.slice(0, 2)
      )
    ]),
    failureModeName: primary.failureModeName
  };
}

// src/instructionalPlanner.ts
function selectFallbackAdapter(topic) {
  if (/(musescore|git|obsidian|excel|blender|workflow|tool|操作|工作流)/i.test(
    topic
  )) {
    return getAdapterForKnowledgeType("procedural");
  }
  if (/(formula|equation|model|signal|control|aero|physics|greek|option|統計|公式|模型|空氣動力|电路|電路)/i.test(
    topic
  )) {
    return getAdapterForKnowledgeType("mathematical");
  }
  if (/(backtest|quant|experiment|metric|evaluation|ab testing|data|回測|量化|實驗|评估|評估)/i.test(
    topic
  )) {
    return getAdapterForKnowledgeType("empirical");
  }
  if (/(cooking|cuisine|coffee|photography|notation|orchestration|technique|本幫菜|烹飪|制譜|技法)/i.test(
    topic
  )) {
    return getAdapterForKnowledgeType("craft");
  }
  if (/(literature|poetry|novel|narrative|textual|close reading|文學|文学|詩|诗|小說|小说|敘事|叙事|文本)/i.test(
    topic
  )) {
    return getAdapterForKnowledgeType("interpretive");
  }
  if (/(philosophy|ethics|normative|argument|debate|哲學|哲学|倫理|伦理|論證|论证|規範|规范)/i.test(
    topic
  )) {
    return getAdapterForKnowledgeType("argumentative");
  }
  if (/(institution|policy|case study|sociology|political science|制度|政策|案例研究|社會學|社会学|政治學|政治学)/i.test(
    topic
  )) {
    return getAdapterForKnowledgeType("case_based");
  }
  if (/(history|historical|culture|evolution|origin|史|歷史|历史|文化|演化)/i.test(
    topic
  )) {
    return getAdapterForKnowledgeType("historical");
  }
  return CONCEPTUAL_ADAPTER;
}
function fallbackPlan(courseName, chapterName, depth = "onboarding") {
  const adapter = selectFallbackAdapter(
    `${courseName} ${chapterName}`.toLocaleLowerCase()
  );
  return {
    primaryKnowledgeType: adapter.knowledgeType,
    secondaryKnowledgeTypes: [],
    coreUnitType: adapter.coreUnitType,
    elementInteractivity: "medium",
    recommendedDepth: depth,
    requiredSections: adapter.requiredSections,
    unitFields: adapter.unitFields,
    mustIncludeExamples: adapter.exampleRequirements,
    commonFailureModes: [adapter.failureModeName],
    densityRisks: []
  };
}
function buildManualPlan(knowledgeType, depth) {
  const adapter = getAdapterForKnowledgeType(knowledgeType);
  return {
    primaryKnowledgeType: knowledgeType,
    secondaryKnowledgeTypes: [],
    coreUnitType: adapter.coreUnitType,
    elementInteractivity: "medium",
    recommendedDepth: depth,
    requiredSections: adapter.requiredSections,
    unitFields: adapter.unitFields,
    mustIncludeExamples: adapter.exampleRequirements,
    commonFailureModes: [adapter.failureModeName],
    densityRisks: []
  };
}
function buildBlueprintPlan(primaryKnowledgeType, secondaryKnowledgeTypes, depth) {
  const primary = primaryKnowledgeType;
  const adapter = getAdapterForKnowledgeType(primary);
  return {
    primaryKnowledgeType: primary,
    secondaryKnowledgeTypes: secondaryKnowledgeTypes.filter(
      (type) => type !== primary && type !== "hybrid"
    ),
    coreUnitType: adapter.coreUnitType,
    elementInteractivity: "medium",
    recommendedDepth: depth,
    requiredSections: adapter.requiredSections,
    unitFields: adapter.unitFields,
    mustIncludeExamples: adapter.exampleRequirements,
    commonFailureModes: [adapter.failureModeName],
    densityRisks: []
  };
}
function selectAdapter(plan) {
  const primary = plan.primaryKnowledgeType === "hybrid" ? getAdapterForKnowledgeType("conceptual") : getAdapterForKnowledgeType(plan.primaryKnowledgeType);
  const secondary = plan.secondaryKnowledgeTypes.filter((type) => type !== "hybrid" && type !== primary.knowledgeType).map((type) => getAdapterForKnowledgeType(type));
  return plan.primaryKnowledgeType === "hybrid" || secondary.length > 0 ? mergeAdapters(primary, secondary) : primary;
}

// src/densityPresets.ts
var MAX_COURSE_CHAPTERS = 20;
var COURSE_CHAPTER_RANGES = {
  scan: { minimum: 8, preferredMin: 8, preferredMax: 12 },
  onboarding: { minimum: 10, preferredMin: 10, preferredMax: 14 },
  learn: { minimum: 11, preferredMin: 11, preferredMax: 16 },
  review: { minimum: 10, preferredMin: 10, preferredMax: 14 }
};
var KNOWLEDGE_DEPTH_LABELS = {
  scan: "Map only",
  onboarding: "Usable overview",
  learn: "Teach me properly",
  review: "Review mode"
};
var DENSITY_PRESETS = {
  scan: {
    label: "Map only",
    targetChars: { min: 7e3, ideal: 8500, max: 1e4 },
    coreUnits: { min: 4, max: 7 },
    workedExamples: 0,
    concreteExamples: 2,
    retrievalQuestions: 4,
    failureModes: 2
  },
  onboarding: {
    label: "Usable overview",
    targetChars: { min: 8500, ideal: 1e4, max: 12e3 },
    coreUnits: { min: 5, max: 8 },
    workedExamples: 1,
    concreteExamples: 3,
    retrievalQuestions: 6,
    failureModes: 3
  },
  learn: {
    label: "Teach me properly",
    targetChars: { min: 1e4, ideal: 12e3, max: 15e3 },
    coreUnits: { min: 6, max: 9 },
    workedExamples: 2,
    concreteExamples: 4,
    retrievalQuestions: 8,
    failureModes: 4
  },
  review: {
    label: "Review mode",
    targetChars: { min: 7e3, ideal: 9e3, max: 11e3 },
    coreUnits: { min: 5, max: 9 },
    workedExamples: 0,
    concreteExamples: 3,
    retrievalQuestions: 8,
    failureModes: 3
  }
};
function applyMinimumChapterChars(density, minChapterChars) {
  const min = Math.min(
    Math.max(density.targetChars.min, minChapterChars),
    density.targetChars.max
  );
  const ideal = Math.max(density.targetChars.ideal, min);
  return {
    ...density,
    targetChars: { min, ideal, max: density.targetChars.max }
  };
}

// src/utils.ts
var KNOWLEDGE_DEPTHS = [
  "scan",
  "onboarding",
  "learn",
  "review"
];
function clampInteger(value, min, max) {
  if (!Number.isFinite(value)) {
    return min;
  }
  return Math.min(Math.max(Math.floor(value), min), max);
}
function parseOptionalPositiveInteger(value) {
  if (value === null || value === void 0 || value === "") {
    return null;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return null;
  }
  return Math.floor(parsed);
}
function errorToMessage(error) {
  return error instanceof Error ? error.message : String(error);
}
function trimTrailingWhitespace(value) {
  return value.replace(/\s+$/u, "");
}
function slugifyTitle(title) {
  const safe = title.replace(/[^\p{L}\p{N}\s-]/gu, "").trim();
  return safe.replace(/\s+/g, "_") || "chapter";
}
function parseChapterTitles(outline) {
  const lines = outline.split("\n");
  const chapters = [];
  const chapterPattern = /^\s*(\d+)\.\s*(.+?)(?:\s*$)/;
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const match = trimmed.match(chapterPattern);
    if (match) {
      const chapterNum = match[1];
      const title = match[2].trim().replace(/[：:]+$/, "").trim();
      if (title) {
        chapters.push([chapterNum, title]);
      }
    }
  }
  return chapters;
}
function parseFailedChapters(report) {
  const chapters = [];
  const chapterPattern = /^\s*-\s*(\d+)\.\s*(.+?)\s*$/;
  for (const line of report.split("\n")) {
    const match = line.match(chapterPattern);
    if (!match) {
      continue;
    }
    chapters.push([match[1], match[2].trim()]);
  }
  return chapters;
}
function parseFailedChapterDepth(report) {
  var _a;
  const match = report.match(/^knowledgeDepth:\s*(\S+)\s*$/m);
  const value = match == null ? void 0 : match[1];
  return (_a = KNOWLEDGE_DEPTHS.find((depth) => depth === value)) != null ? _a : null;
}
var Semaphore = class {
  constructor(permits) {
    this.queue = [];
    this.permits = permits;
  }
  async acquire() {
    if (this.permits > 0) {
      this.permits--;
    } else {
      await new Promise((resolve) => {
        this.queue.push(resolve);
      });
    }
  }
  release() {
    if (this.queue.length > 0) {
      const resolve = this.queue.shift();
      resolve == null ? void 0 : resolve();
    } else {
      this.permits++;
    }
  }
  async run(fn) {
    await this.acquire();
    try {
      return await fn();
    } finally {
      this.release();
    }
  }
};

// src/courseBlueprint.ts
var MAX_BLUEPRINT_CHAPTERS = MAX_COURSE_CHAPTERS;
var MAX_BLUEPRINT_COMPLETION_TOKENS = 16e3;
function resolveBlueprintMaxCompletionTokens(configuredMaxCompletionTokens) {
  return Math.min(
    configuredMaxCompletionTokens != null ? configuredMaxCompletionTokens : MAX_BLUEPRINT_COMPLETION_TOKENS,
    MAX_BLUEPRINT_COMPLETION_TOKENS
  );
}
var BLUEPRINT_COMMENT_START = "<!-- knowledge-overview-blueprint";
var BLUEPRINT_COMMENT_PATTERN = /<!-- knowledge-overview-blueprint\s*([\s\S]*?)\s*-->/;
var KNOWLEDGE_TYPES = [
  "conceptual",
  "mathematical",
  "procedural",
  "empirical",
  "craft",
  "historical",
  "interpretive",
  "argumentative",
  "case_based",
  "hybrid"
];
function cleanString(value) {
  return typeof value === "string" ? value.replace(/-->/g, "\u2014>").trim() : "";
}
function readStringArray(value, limit = 20) {
  if (!Array.isArray(value)) {
    return [];
  }
  return Array.from(
    new Set(
      value.map((item) => cleanString(item)).filter((item) => item.length > 0)
    )
  ).slice(0, limit);
}
function isKnowledgeType(value) {
  return typeof value === "string" && KNOWLEDGE_TYPES.includes(value);
}
function extractJsonObject(text) {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch (e) {
    const firstBrace = trimmed.indexOf("{");
    const lastBrace = trimmed.lastIndexOf("}");
    if (firstBrace < 0 || lastBrace <= firstBrace) {
      throw new Error("Course blueprint did not contain a JSON object");
    }
    return JSON.parse(trimmed.slice(firstBrace, lastBrace + 1));
  }
}
function fallbackChapterSpec(courseName, chapterNumber, title, depth) {
  const plan = fallbackPlan(courseName, title, depth);
  return {
    chapterNumber,
    title,
    focus: title,
    subtopics: [],
    learningObjectives: [],
    prerequisites: [],
    outOfScope: [],
    knowledgeType: plan.primaryKnowledgeType,
    secondaryKnowledgeTypes: plan.secondaryKnowledgeTypes,
    canonicalTerms: []
  };
}
function parseChapterSpec(value, index, courseName, depth) {
  if (!value || typeof value !== "object") {
    return null;
  }
  const raw = value;
  const title = cleanString(raw.title);
  if (!title) {
    return null;
  }
  const fallback = fallbackChapterSpec(
    courseName,
    String(index + 1),
    title,
    depth
  );
  const chapterNumber = cleanString(raw.chapterNumber) || String(index + 1);
  const knowledgeType = isKnowledgeType(raw.knowledgeType) ? raw.knowledgeType : fallback.knowledgeType;
  const secondaryKnowledgeTypes = readStringArray(
    raw.secondaryKnowledgeTypes,
    3
  ).filter(
    (item) => isKnowledgeType(item) && item !== knowledgeType && item !== "hybrid"
  );
  return {
    chapterNumber,
    title,
    focus: cleanString(raw.focus) || title,
    subtopics: readStringArray(raw.subtopics, 10),
    learningObjectives: readStringArray(raw.learningObjectives, 8),
    prerequisites: readStringArray(raw.prerequisites, 8),
    outOfScope: readStringArray(raw.outOfScope, 8),
    knowledgeType,
    secondaryKnowledgeTypes,
    canonicalTerms: readStringArray(raw.canonicalTerms, 12)
  };
}
function normalizeBlueprint(value, courseName, depth) {
  if (!value || typeof value !== "object") {
    throw new Error("Course blueprint must be a JSON object");
  }
  const raw = value;
  const rawChapters = Array.isArray(raw.chapters) ? raw.chapters : [];
  const seenTitles = /* @__PURE__ */ new Set();
  const chapters = [];
  for (const [index, rawChapter] of rawChapters.entries()) {
    const chapter = parseChapterSpec(rawChapter, index, courseName, depth);
    if (!chapter) {
      continue;
    }
    const normalizedTitle = chapter.title.toLocaleLowerCase();
    if (seenTitles.has(normalizedTitle)) {
      continue;
    }
    seenTitles.add(normalizedTitle);
    chapters.push({
      ...chapter,
      chapterNumber: String(chapters.length + 1)
    });
    if (chapters.length === MAX_BLUEPRINT_CHAPTERS) {
      break;
    }
  }
  if (chapters.length === 0) {
    throw new Error("Course blueprint did not contain any usable chapters");
  }
  return {
    schemaVersion: 1,
    courseName: cleanString(raw.courseName) || courseName,
    courseGoal: cleanString(raw.courseGoal) || `Build a practical overview of ${courseName}.`,
    prerequisites: readStringArray(raw.prerequisites, 12),
    canonicalTerms: readStringArray(raw.canonicalTerms, 30),
    chapters
  };
}
function buildLegacyBlueprint(text, courseName, depth) {
  const chapters = parseChapterTitles(text).slice(0, MAX_BLUEPRINT_CHAPTERS).map(
    ([chapterNumber, title]) => fallbackChapterSpec(courseName, chapterNumber, title, depth)
  );
  if (chapters.length === 0) {
    throw new Error(
      "The outline response was neither valid blueprint JSON nor a numbered outline"
    );
  }
  return {
    schemaVersion: 1,
    courseName,
    courseGoal: `Build a practical overview of ${courseName}.`,
    prerequisites: [],
    canonicalTerms: [],
    chapters
  };
}
function parseCourseBlueprint(text, courseName, depth, options = {}) {
  let blueprint;
  try {
    blueprint = normalizeBlueprint(extractJsonObject(text), courseName, depth);
  } catch (e) {
    blueprint = buildLegacyBlueprint(text, courseName, depth);
  }
  if (options.enforceMinimumChapters && blueprint.chapters.length < COURSE_CHAPTER_RANGES[depth].minimum) {
    throw new Error(
      `Course blueprint returned ${blueprint.chapters.length} usable chapters; ${depth} requires at least ${COURSE_CHAPTER_RANGES[depth].minimum}. No chapter requests were started.`
    );
  }
  return blueprint;
}
function renderCourseOutline(blueprint) {
  return blueprint.chapters.map((chapter, index) => {
    const lines = [`${index + 1}. ${chapter.title}`];
    if (chapter.focus) {
      lines.push(`   - ${chapter.focus}`);
    }
    chapter.subtopics.forEach((subtopic) => {
      lines.push(`   - ${subtopic}`);
    });
    return lines.join("\n");
  }).join("\n\n");
}
function serializeBlueprintComment(blueprint) {
  return `${BLUEPRINT_COMMENT_START}
${JSON.stringify(blueprint)}
-->`;
}
function parseBlueprintComment(text) {
  const match = text.match(BLUEPRINT_COMMENT_PATTERN);
  if (!match) {
    return null;
  }
  try {
    return normalizeBlueprint(
      JSON.parse(match[1]),
      "Recovered course",
      "onboarding"
    );
  } catch (e) {
    return null;
  }
}
function buildFallbackChapterSpec(courseName, chapterNumber, title, depth) {
  return fallbackChapterSpec(courseName, chapterNumber, title, depth);
}

// src/generationControl.ts
var LogicalRequestBudget = class {
  constructor(maxRequests) {
    this.maxRequests = maxRequests;
    this.usedRequests = 0;
  }
  consume() {
    if (this.usedRequests >= this.maxRequests) {
      throw new Error(
        `Logical request budget exceeded (${this.maxRequests} requests)`
      );
    }
    this.usedRequests += 1;
    return this.usedRequests;
  }
  get used() {
    return this.usedRequests;
  }
  get max() {
    return this.maxRequests;
  }
};
var GenerationCancellation = class {
  constructor() {
    this.cancelled = false;
  }
  cancel() {
    this.cancelled = true;
  }
  get isCancelled() {
    return this.cancelled;
  }
  throwIfCancelled() {
    if (this.cancelled) {
      throw new GenerationCancelledError();
    }
  }
};

// src/generationProvenance.ts
function sanitizeModel(model) {
  const sanitized = model.replace(/[\r\n`]/g, " ").replace(/-->/g, "\u2014>").trim();
  return sanitized || "unknown";
}
function normalizeTokenCount(value) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? Math.round(value) : void 0;
}
function normalizeGenerationProvenance(provenance) {
  const promptTokens = normalizeTokenCount(provenance.promptTokens);
  const completionTokens = normalizeTokenCount(provenance.completionTokens);
  const reportedTotal = normalizeTokenCount(provenance.totalTokens);
  const reasoningTokens = normalizeTokenCount(provenance.reasoningTokens);
  const totalTokens = reportedTotal != null ? reportedTotal : promptTokens !== void 0 && completionTokens !== void 0 ? promptTokens + completionTokens : void 0;
  return {
    model: sanitizeModel(provenance.model),
    promptTokens,
    completionTokens,
    totalTokens,
    reasoningTokens
  };
}
function formatTokenSummary(provenance) {
  if (provenance.totalTokens === void 0) {
    return "unavailable (provider did not return usage)";
  }
  const total = provenance.totalTokens.toLocaleString("en-US");
  if (provenance.promptTokens === void 0 || provenance.completionTokens === void 0) {
    return `${total} total`;
  }
  const reasoning = provenance.reasoningTokens === void 0 ? "" : `, reasoning ${provenance.reasoningTokens.toLocaleString("en-US")} within completion`;
  return `${total} total (prompt ${provenance.promptTokens.toLocaleString("en-US")} / completion ${provenance.completionTokens.toLocaleString("en-US")}${reasoning})`;
}
function renderGenerationProvenance(input) {
  const provenance = normalizeGenerationProvenance(input);
  const serialized = JSON.stringify(provenance).replace(/-->/g, "\u2014>");
  return [
    "---",
    "",
    `*Model: \`${provenance.model}\` \xB7 Tokens: ${formatTokenSummary(provenance)}*`,
    "",
    `<!-- knowledge-overview-generation ${serialized} -->`
  ].join("\n");
}

// src/i18n.ts
var LANGUAGE_OPTIONS = {
  en: "English",
  zh: "\u7B80\u4F53\u4E2D\u6587",
  zh_tw: "\u7E41\u9AD4\u4E2D\u6587",
  ja: "\u65E5\u672C\u8A9E",
  ko: "\uD55C\uAD6D\uC5B4",
  vi: "Ti\u1EBFng Vi\u1EC7t",
  th: "\u0E44\u0E17\u0E22",
  id: "Bahasa Indonesia",
  ms: "Bahasa Melayu",
  hi: "\u0939\u093F\u0928\u094D\u0926\u0940",
  ar: "\u0627\u0644\u0639\u0631\u0628\u064A\u0629",
  de: "Deutsch",
  fr: "Fran\xE7ais",
  es: "Espa\xF1ol",
  it: "Italiano",
  pt: "Portugu\xEAs",
  nl: "Nederlands",
  sv: "Svenska",
  fi: "Suomi",
  pl: "Polski",
  tr: "T\xFCrk\xE7e",
  ru: "\u0420\u0443\u0441\u0441\u043A\u0438\u0439"
};
var REVIEW_QUESTION_HEADING_TEXT = {
  en: "Review and interview questions",
  zh: "\u590D\u4E60\u4E0E\u9762\u8BD5\u95EE\u9898",
  zh_tw: "\u8907\u7FD2\u8207\u9762\u8A66\u554F\u984C",
  ja: "\u5FA9\u7FD2\u3068\u9762\u63A5\u306E\u8CEA\u554F",
  ko: "\uBCF5\uC2B5 \uBC0F \uBA74\uC811 \uC9C8\uBB38",
  vi: "C\xE2u h\u1ECFi \xF4n t\u1EADp v\xE0 ph\u1ECFng v\u1EA5n",
  th: "\u0E04\u0E33\u0E16\u0E32\u0E21\u0E17\u0E1A\u0E17\u0E27\u0E19\u0E41\u0E25\u0E30\u0E2A\u0E31\u0E21\u0E20\u0E32\u0E29\u0E13\u0E4C",
  id: "Pertanyaan tinjauan dan wawancara",
  ms: "Soalan ulang kaji dan temu duga",
  hi: "\u092A\u0941\u0928\u0930\u093E\u0935\u0932\u094B\u0915\u0928 \u0914\u0930 \u0938\u093E\u0915\u094D\u0937\u093E\u0924\u094D\u0915\u093E\u0930 \u092A\u094D\u0930\u0936\u094D\u0928",
  ar: "\u0623\u0633\u0626\u0644\u0629 \u0627\u0644\u0645\u0631\u0627\u062C\u0639\u0629 \u0648\u0627\u0644\u0645\u0642\u0627\u0628\u0644\u0629",
  de: "Wiederholungs- und Interviewfragen",
  fr: "Questions de r\xE9vision et d\u2019entretien",
  es: "Preguntas de repaso y entrevista",
  it: "Domande di ripasso e colloquio",
  pt: "Perguntas de revis\xE3o e entrevista",
  nl: "Herhalings- en interviewvragen",
  sv: "Repetitions- och intervjufr\xE5gor",
  fi: "Kertaus- ja haastattelukysymykset",
  pl: "Pytania powt\xF3rkowe i rekrutacyjne",
  tr: "Tekrar ve m\xFClakat sorular\u0131",
  ru: "\u0412\u043E\u043F\u0440\u043E\u0441\u044B \u0434\u043B\u044F \u043F\u043E\u0432\u0442\u043E\u0440\u0435\u043D\u0438\u044F \u0438 \u0441\u043E\u0431\u0435\u0441\u0435\u0434\u043E\u0432\u0430\u043D\u0438\u044F"
};
var HEADER_TEXT = {
  en: {
    outlineTitle: "Outline",
    generatedAt: "Generated at",
    chapterNumber: "Chapter",
    generated: "Auto-generated review and interview notes. Edit freely."
  },
  zh: {
    outlineTitle: "\u5927\u7DB1",
    generatedAt: "\u81EA\u52D5\u751F\u6210\u6642\u9593",
    chapterNumber: "\u7AE0\u7BC0\u7DE8\u865F",
    generated: "\u81EA\u52D5\u751F\u6210\u7684\u8907\u7FD2/\u9762\u8A66\u77E5\u8B58\u9EDE\uFF0C\u53EF\u81EA\u7531\u7DE8\u8F2F\u88DC\u5145"
  },
  zh_tw: {
    outlineTitle: "\u5927\u7DB1",
    generatedAt: "\u81EA\u52D5\u751F\u6210\u6642\u9593",
    chapterNumber: "\u7AE0\u7BC0\u7DE8\u865F",
    generated: "\u81EA\u52D5\u751F\u6210\u7684\u8907\u7FD2/\u9762\u8A66\u77E5\u8B58\u9EDE\uFF0C\u53EF\u81EA\u7531\u7DE8\u8F2F\u88DC\u5145"
  },
  ja: {
    outlineTitle: "\u30A2\u30A6\u30C8\u30E9\u30A4\u30F3",
    generatedAt: "\u751F\u6210\u65E5\u6642",
    chapterNumber: "\u7AE0",
    generated: "\u81EA\u52D5\u751F\u6210\u3055\u308C\u305F\u5FA9\u7FD2\u30FB\u9762\u63A5\u7528\u30CE\u30FC\u30C8\u3067\u3059\u3002\u81EA\u7531\u306B\u7DE8\u96C6\u3067\u304D\u307E\u3059\u3002"
  },
  ko: {
    outlineTitle: "\uAC1C\uC694",
    generatedAt: "\uC0DD\uC131 \uC2DC\uAC04",
    chapterNumber: "\uC7A5",
    generated: "\uC790\uB3D9 \uC0DD\uC131\uB41C \uBCF5\uC2B5 \uBC0F \uC778\uD130\uBDF0 \uB178\uD2B8\uC785\uB2C8\uB2E4. \uC790\uC720\uB86D\uAC8C \uC218\uC815\uD558\uC138\uC694."
  },
  vi: {
    outlineTitle: "D\xE0n \xFD",
    generatedAt: "\u0110\u01B0\u1EE3c t\u1EA1o l\xFAc",
    chapterNumber: "Ch\u01B0\u01A1ng",
    generated: "Ghi ch\xFA \xF4n t\u1EADp v\xE0 ph\u1ECFng v\u1EA5n \u0111\u01B0\u1EE3c t\u1EA1o t\u1EF1 \u0111\u1ED9ng. B\u1EA1n c\xF3 th\u1EC3 ch\u1EC9nh s\u1EEDa."
  },
  th: {
    outlineTitle: "\u0E42\u0E04\u0E23\u0E07\u0E23\u0E48\u0E32\u0E07",
    generatedAt: "\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E40\u0E21\u0E37\u0E48\u0E2D",
    chapterNumber: "\u0E1A\u0E17",
    generated: "\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E17\u0E1A\u0E17\u0E27\u0E19\u0E41\u0E25\u0E30\u0E2A\u0E31\u0E21\u0E20\u0E32\u0E29\u0E13\u0E4C\u0E17\u0E35\u0E48\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E2D\u0E31\u0E15\u0E42\u0E19\u0E21\u0E31\u0E15\u0E34 \u0E41\u0E01\u0E49\u0E44\u0E02\u0E44\u0E14\u0E49\u0E15\u0E32\u0E21\u0E15\u0E49\u0E2D\u0E07\u0E01\u0E32\u0E23"
  },
  id: {
    outlineTitle: "Garis besar",
    generatedAt: "Dibuat pada",
    chapterNumber: "Bab",
    generated: "Catatan ulasan dan wawancara yang dibuat otomatis. Silakan edit."
  },
  ms: {
    outlineTitle: "Rangka",
    generatedAt: "Dijana pada",
    chapterNumber: "Bab",
    generated: "Nota ulang kaji dan temu duga yang dijana automatik. Sila edit."
  },
  hi: {
    outlineTitle: "\u0930\u0942\u092A\u0930\u0947\u0916\u093E",
    generatedAt: "\u092C\u0928\u093E\u092F\u093E \u0917\u092F\u093E",
    chapterNumber: "\u0905\u0927\u094D\u092F\u093E\u092F",
    generated: "\u0938\u094D\u0935\u0924\u0903 \u092C\u0928\u093E\u090F \u0917\u090F \u092A\u0941\u0928\u0930\u093E\u0935\u0932\u094B\u0915\u0928 \u0914\u0930 \u0938\u093E\u0915\u094D\u0937\u093E\u0924\u094D\u0915\u093E\u0930 \u0928\u094B\u091F\u094D\u0938\u0964 \u0907\u0928\u094D\u0939\u0947\u0902 \u0938\u094D\u0935\u0924\u0902\u0924\u094D\u0930 \u0930\u0942\u092A \u0938\u0947 \u0938\u0902\u092A\u093E\u0926\u093F\u0924 \u0915\u0930\u0947\u0902\u0964"
  },
  ar: {
    outlineTitle: "\u0627\u0644\u0645\u062E\u0637\u0637",
    generatedAt: "\u062A\u0645 \u0627\u0644\u0625\u0646\u0634\u0627\u0621 \u0641\u064A",
    chapterNumber: "\u0627\u0644\u0641\u0635\u0644",
    generated: "\u0645\u0644\u0627\u062D\u0638\u0627\u062A \u0645\u0631\u0627\u062C\u0639\u0629 \u0648\u0645\u0642\u0627\u0628\u0644\u0629 \u0645\u0648\u0644\u062F\u0629 \u062A\u0644\u0642\u0627\u0626\u064A\u0627. \u064A\u0645\u0643\u0646\u0643 \u062A\u0639\u062F\u064A\u0644\u0647\u0627 \u0628\u062D\u0631\u064A\u0629."
  },
  de: {
    outlineTitle: "Gliederung",
    generatedAt: "Erstellt am",
    chapterNumber: "Kapitel",
    generated: "Automatisch erstellte Lern- und Interviewnotizen. Frei bearbeitbar."
  },
  fr: {
    outlineTitle: "Plan",
    generatedAt: "G\xE9n\xE9r\xE9 le",
    chapterNumber: "Chapitre",
    generated: "Notes de r\xE9vision et d'entretien g\xE9n\xE9r\xE9es automatiquement. Modifiez-les librement."
  },
  es: {
    outlineTitle: "Esquema",
    generatedAt: "Generado el",
    chapterNumber: "Cap\xEDtulo",
    generated: "Notas de repaso y entrevista generadas autom\xE1ticamente. Ed\xEDtalas libremente."
  },
  it: {
    outlineTitle: "Schema",
    generatedAt: "Generato il",
    chapterNumber: "Capitolo",
    generated: "Note di ripasso e colloquio generate automaticamente. Modificale liberamente."
  },
  pt: {
    outlineTitle: "Esbo\xE7o",
    generatedAt: "Gerado em",
    chapterNumber: "Cap\xEDtulo",
    generated: "Notas de revis\xE3o e entrevista geradas automaticamente. Edite livremente."
  },
  nl: {
    outlineTitle: "Overzicht",
    generatedAt: "Gegenereerd op",
    chapterNumber: "Hoofdstuk",
    generated: "Automatisch gegenereerde herhalings- en interviewnotities. Vrij te bewerken."
  },
  sv: {
    outlineTitle: "Disposition",
    generatedAt: "Skapad",
    chapterNumber: "Kapitel",
    generated: "Automatiskt skapade repetitions- och intervjunoteringar. Redigera fritt."
  },
  fi: {
    outlineTitle: "J\xE4sennys",
    generatedAt: "Luotu",
    chapterNumber: "Luku",
    generated: "Automaattisesti luodut kertaus- ja haastattelumuistiinpanot. Muokkaa vapaasti."
  },
  pl: {
    outlineTitle: "Konspekt",
    generatedAt: "Wygenerowano",
    chapterNumber: "Rozdzia\u0142",
    generated: "Automatycznie wygenerowane notatki do powt\xF3rki i rozmowy. Edytuj swobodnie."
  },
  tr: {
    outlineTitle: "Taslak",
    generatedAt: "Olu\u015Fturulma zaman\u0131",
    chapterNumber: "B\xF6l\xFCm",
    generated: "Otomatik olu\u015Fturulmu\u015F tekrar ve m\xFClakat notlar\u0131. Serbest\xE7e d\xFCzenleyin."
  },
  ru: {
    outlineTitle: "\u041F\u043B\u0430\u043D",
    generatedAt: "\u0421\u043E\u0437\u0434\u0430\u043D\u043E",
    chapterNumber: "\u0413\u043B\u0430\u0432\u0430",
    generated: "\u0410\u0432\u0442\u043E\u043C\u0430\u0442\u0438\u0447\u0435\u0441\u043A\u0438 \u0441\u043E\u0437\u0434\u0430\u043D\u043D\u044B\u0435 \u0437\u0430\u043C\u0435\u0442\u043A\u0438 \u0434\u043B\u044F \u043F\u043E\u0432\u0442\u043E\u0440\u0435\u043D\u0438\u044F \u0438 \u0438\u043D\u0442\u0435\u0440\u0432\u044C\u044E. \u0420\u0435\u0434\u0430\u043A\u0442\u0438\u0440\u0443\u0439\u0442\u0435 \u0441\u0432\u043E\u0431\u043E\u0434\u043D\u043E."
  }
};
var UI_TEXT = {
  en: {
    generateKnowledge: "Generate Knowledge Overview",
    resumeFailedChapters: "Resume Failed Chapter Generation"
  },
  zh: {
    generateKnowledge: "\u751F\u6210\u77E5\u8BC6\u6982\u89C8",
    resumeFailedChapters: "\u7EE7\u7EED\u751F\u6210\u5931\u8D25\u7AE0\u8282"
  },
  zh_tw: {
    generateKnowledge: "\u751F\u6210\u77E5\u8B58\u6982\u89BD",
    resumeFailedChapters: "\u7E7C\u7E8C\u751F\u6210\u5931\u6557\u7AE0\u7BC0"
  },
  ja: {
    generateKnowledge: "\u77E5\u8B58\u6982\u8981\u3092\u751F\u6210",
    resumeFailedChapters: "\u5931\u6557\u3057\u305F\u7AE0\u306E\u751F\u6210\u3092\u518D\u958B"
  },
  ko: {
    generateKnowledge: "\uC9C0\uC2DD \uAC1C\uC694 \uC0DD\uC131",
    resumeFailedChapters: "\uC2E4\uD328\uD55C \uC7A5 \uC0DD\uC131 \uC7AC\uAC1C"
  },
  vi: {
    generateKnowledge: "T\u1EA1o t\u1ED5ng quan ki\u1EBFn th\u1EE9c",
    resumeFailedChapters: "Ti\u1EBFp t\u1EE5c t\u1EA1o c\xE1c ch\u01B0\u01A1ng l\u1ED7i"
  },
  th: {
    generateKnowledge: "\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E20\u0E32\u0E1E\u0E23\u0E27\u0E21\u0E04\u0E27\u0E32\u0E21\u0E23\u0E39\u0E49",
    resumeFailedChapters: "\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E1A\u0E17\u0E17\u0E35\u0E48\u0E25\u0E49\u0E21\u0E40\u0E2B\u0E25\u0E27\u0E15\u0E48\u0E2D"
  },
  id: {
    generateKnowledge: "Buat ringkasan pengetahuan",
    resumeFailedChapters: "Lanjutkan pembuatan bab gagal"
  },
  ms: {
    generateKnowledge: "Jana gambaran pengetahuan",
    resumeFailedChapters: "Sambung penjanaan bab yang gagal"
  },
  hi: {
    generateKnowledge: "\u091C\u094D\u091E\u093E\u0928 \u0905\u0935\u0932\u094B\u0915\u0928 \u092C\u0928\u093E\u090F\u0902",
    resumeFailedChapters: "\u0935\u093F\u092B\u0932 \u0905\u0927\u094D\u092F\u093E\u092F\u094B\u0902 \u0915\u093E \u0928\u093F\u0930\u094D\u092E\u093E\u0923 \u092B\u093F\u0930 \u0936\u0941\u0930\u0942 \u0915\u0930\u0947\u0902"
  },
  ar: {
    generateKnowledge: "\u0625\u0646\u0634\u0627\u0621 \u0646\u0638\u0631\u0629 \u0639\u0627\u0645\u0629 \u0645\u0639\u0631\u0641\u064A\u0629",
    resumeFailedChapters: "\u0627\u0633\u062A\u0626\u0646\u0627\u0641 \u0625\u0646\u0634\u0627\u0621 \u0627\u0644\u0641\u0635\u0648\u0644 \u0627\u0644\u0641\u0627\u0634\u0644\u0629"
  },
  de: {
    generateKnowledge: "Wissens\xFCbersicht erstellen",
    resumeFailedChapters: "Fehlgeschlagene Kapitel fortsetzen"
  },
  fr: {
    generateKnowledge: "G\xE9n\xE9rer une vue d'ensemble",
    resumeFailedChapters: "Reprendre les chapitres \xE9chou\xE9s"
  },
  es: {
    generateKnowledge: "Generar resumen de conocimiento",
    resumeFailedChapters: "Reanudar cap\xEDtulos fallidos"
  },
  it: {
    generateKnowledge: "Genera panoramica della conoscenza",
    resumeFailedChapters: "Riprendi capitoli non riusciti"
  },
  pt: {
    generateKnowledge: "Gerar vis\xE3o geral do conhecimento",
    resumeFailedChapters: "Retomar cap\xEDtulos com falha"
  },
  nl: {
    generateKnowledge: "Kennisoverzicht genereren",
    resumeFailedChapters: "Mislukte hoofdstukken hervatten"
  },
  sv: {
    generateKnowledge: "Skapa kunskaps\xF6versikt",
    resumeFailedChapters: "\xC5teruppta misslyckade kapitel"
  },
  fi: {
    generateKnowledge: "Luo tietokatsaus",
    resumeFailedChapters: "Jatka ep\xE4onnistuneiden lukujen luontia"
  },
  pl: {
    generateKnowledge: "Wygeneruj przegl\u0105d wiedzy",
    resumeFailedChapters: "Wzn\xF3w nieudane rozdzia\u0142y"
  },
  tr: {
    generateKnowledge: "Bilgi genel bak\u0131\u015F\u0131 olu\u015Ftur",
    resumeFailedChapters: "Ba\u015Far\u0131s\u0131z b\xF6l\xFCmleri s\xFCrd\xFCr"
  },
  ru: {
    generateKnowledge: "\u0421\u043E\u0437\u0434\u0430\u0442\u044C \u043E\u0431\u0437\u043E\u0440 \u0437\u043D\u0430\u043D\u0438\u0439",
    resumeFailedChapters: "\u0412\u043E\u0437\u043E\u0431\u043D\u043E\u0432\u0438\u0442\u044C \u043D\u0435\u0443\u0434\u0430\u0447\u043D\u044B\u0435 \u0433\u043B\u0430\u0432\u044B"
  }
};
var SETTING_DESCRIPTION_TEXT = {
  en: {
    apiKey: "Your provider API key. The default endpoint uses Google's OpenAI-compatible Gemini API.",
    apiBaseUrl: "OpenAI-compatible API base URL.",
    outlineModel: "LLM model for generating course outlines.",
    chapterModel: "LLM model for generating chapter details.",
    knowledgeType: "Use Auto for planning-based classification, or force a chapter structure.",
    minimumChapterCharacters: "Used by the quality evaluator and repair pass for long-form chapters.",
    maxCompletionTokens: "Advanced. Output token limit passed as max_completion_tokens. Set a larger value if your provider truncates long chapters.",
    temperature: "Advanced. Leave empty to omit this provider option.",
    reasoningEffort: "Advanced provider-specific option. Leave unset unless your provider supports it.",
    verbosity: "Advanced provider-specific option. Leave unset unless your provider supports it.",
    chapterConcurrency: "Manual concurrency for chapter generation. Default is 1; increase only if your provider is stable under parallel requests.",
    language: "Output language preference."
  },
  zh: {
    apiKey: "\u4F60\u7684\u4F9B\u5E94\u5546 API key\u3002\u9ED8\u8BA4\u7AEF\u70B9\u4F7F\u7528 Google \u7684 OpenAI-compatible Gemini API\u3002",
    apiBaseUrl: "OpenAI-compatible API base URL\u3002",
    outlineModel: "\u7528\u4E8E\u751F\u6210\u8BFE\u7A0B\u5927\u7EB2\u7684 LLM \u6A21\u578B\u3002",
    chapterModel: "\u7528\u4E8E\u751F\u6210\u7AE0\u8282\u5185\u5BB9\u7684 LLM \u6A21\u578B\u3002",
    knowledgeType: "\u4F7F\u7528 Auto \u8FDB\u884C\u89C4\u5212\u5F0F\u5206\u7C7B\uFF0C\u6216\u5F3A\u5236\u6307\u5B9A\u7AE0\u8282\u7ED3\u6784\u3002",
    minimumChapterCharacters: "\u4F9B\u8D28\u91CF\u68C0\u67E5\u5668\u548C\u4FEE\u590D\u6269\u5199\u6D41\u7A0B\u5224\u65AD\u957F\u7AE0\u8282\u662F\u5426\u8DB3\u591F\u5145\u5B9E\u3002",
    maxCompletionTokens: "\u9AD8\u7EA7\u8BBE\u7F6E\u3002\u4F5C\u4E3A max_completion_tokens \u4F20\u9012\u7684\u8F93\u51FA token \u4E0A\u9650\uFF1B\u5982\u679C\u4F9B\u5E94\u5546\u622A\u65AD\u957F\u7AE0\u8282\uFF0C\u8BF7\u8C03\u5927\u3002",
    temperature: "\u9AD8\u7EA7\u8BBE\u7F6E\u3002\u7559\u7A7A\u5219\u4E0D\u53D1\u9001\u6B64\u4F9B\u5E94\u5546\u9009\u9879\u3002",
    reasoningEffort: "\u9AD8\u7EA7\u4F9B\u5E94\u5546\u7279\u5B9A\u9009\u9879\u3002\u9664\u975E\u4F9B\u5E94\u5546\u652F\u6301\uFF0C\u5426\u5219\u4FDD\u6301\u672A\u8BBE\u7F6E\u3002",
    verbosity: "\u9AD8\u7EA7\u4F9B\u5E94\u5546\u7279\u5B9A\u9009\u9879\u3002\u9664\u975E\u4F9B\u5E94\u5546\u652F\u6301\uFF0C\u5426\u5219\u4FDD\u6301\u672A\u8BBE\u7F6E\u3002",
    chapterConcurrency: "\u7AE0\u8282\u751F\u6210\u7684\u624B\u52A8\u5E76\u53D1\u6570\u3002\u9ED8\u8BA4\u4E3A 1\uFF1B\u53EA\u6709\u4F9B\u5E94\u5546\u80FD\u7A33\u5B9A\u5904\u7406\u5E76\u884C\u8BF7\u6C42\u65F6\u624D\u63D0\u9AD8\u3002",
    language: "\u8F93\u51FA\u8BED\u8A00\u504F\u597D\u3002"
  },
  zh_tw: {
    apiKey: "\u4F60\u7684\u4F9B\u61C9\u5546 API key\u3002\u9810\u8A2D\u7AEF\u9EDE\u4F7F\u7528 Google \u7684 OpenAI-compatible Gemini API\u3002",
    apiBaseUrl: "OpenAI-compatible API base URL\u3002",
    outlineModel: "\u7528\u65BC\u751F\u6210\u8AB2\u7A0B\u5927\u7DB1\u7684 LLM \u6A21\u578B\u3002",
    chapterModel: "\u7528\u65BC\u751F\u6210\u7AE0\u7BC0\u5167\u5BB9\u7684 LLM \u6A21\u578B\u3002",
    knowledgeType: "\u4F7F\u7528 Auto \u9032\u884C\u898F\u5283\u5F0F\u5206\u985E\uFF0C\u6216\u5F37\u5236\u6307\u5B9A\u7AE0\u7BC0\u7D50\u69CB\u3002",
    minimumChapterCharacters: "\u4F9B\u54C1\u8CEA\u6AA2\u67E5\u5668\u8207\u4FEE\u5FA9\u64F4\u5BEB\u6D41\u7A0B\u5224\u65B7\u9577\u7AE0\u7BC0\u662F\u5426\u8DB3\u5920\u5145\u5BE6\u3002",
    maxCompletionTokens: "\u9032\u968E\u8A2D\u5B9A\u3002\u4F5C\u70BA max_completion_tokens \u50B3\u905E\u7684\u8F38\u51FA token \u4E0A\u9650\uFF1B\u5982\u679C\u4F9B\u61C9\u5546\u622A\u65B7\u9577\u7AE0\u7BC0\uFF0C\u8ACB\u8ABF\u5927\u3002",
    temperature: "\u9032\u968E\u8A2D\u5B9A\u3002\u7559\u7A7A\u5247\u4E0D\u9001\u51FA\u6B64\u4F9B\u61C9\u5546\u9078\u9805\u3002",
    reasoningEffort: "\u9032\u968E\u4F9B\u61C9\u5546\u7279\u5B9A\u9078\u9805\u3002\u9664\u975E\u4F9B\u61C9\u5546\u652F\u63F4\uFF0C\u5426\u5247\u4FDD\u6301\u672A\u8A2D\u5B9A\u3002",
    verbosity: "\u9032\u968E\u4F9B\u61C9\u5546\u7279\u5B9A\u9078\u9805\u3002\u9664\u975E\u4F9B\u61C9\u5546\u652F\u63F4\uFF0C\u5426\u5247\u4FDD\u6301\u672A\u8A2D\u5B9A\u3002",
    chapterConcurrency: "\u7AE0\u7BC0\u751F\u6210\u7684\u624B\u52D5\u4E26\u767C\u6578\u3002\u9810\u8A2D\u70BA 1\uFF1B\u53EA\u6709\u4F9B\u61C9\u5546\u80FD\u7A69\u5B9A\u8655\u7406\u4E26\u884C\u8ACB\u6C42\u6642\u624D\u63D0\u9AD8\u3002",
    language: "\u8F38\u51FA\u8A9E\u8A00\u504F\u597D\u3002"
  },
  ja: {
    apiKey: "\u30D7\u30ED\u30D0\u30A4\u30C0\u30FC\u306E API key \u3067\u3059\u3002\u65E2\u5B9A\u306E\u30A8\u30F3\u30C9\u30DD\u30A4\u30F3\u30C8\u306F Google \u306E OpenAI-compatible Gemini API \u3092\u4F7F\u3044\u307E\u3059\u3002",
    apiBaseUrl: "OpenAI-compatible API base URL\u3002",
    outlineModel: "\u30B3\u30FC\u30B9\u30A2\u30A6\u30C8\u30E9\u30A4\u30F3\u751F\u6210\u306B\u4F7F\u3046 LLM \u30E2\u30C7\u30EB\u3002",
    chapterModel: "\u7AE0\u306E\u8A73\u7D30\u751F\u6210\u306B\u4F7F\u3046 LLM \u30E2\u30C7\u30EB\u3002",
    knowledgeType: "Auto \u3067\u8A08\u753B\u30D9\u30FC\u30B9\u306E\u5206\u985E\u3092\u4F7F\u3046\u304B\u3001\u7AE0\u69CB\u9020\u3092\u5F37\u5236\u6307\u5B9A\u3057\u307E\u3059\u3002",
    minimumChapterCharacters: "\u9577\u6587\u306E\u7AE0\u304C\u5341\u5206\u306B\u5145\u5B9F\u3057\u3066\u3044\u308B\u304B\u3092\u54C1\u8CEA\u8A55\u4FA1\u3068\u4FEE\u5FA9\u30D1\u30B9\u3067\u5224\u65AD\u3059\u308B\u305F\u3081\u306B\u4F7F\u3044\u307E\u3059\u3002",
    maxCompletionTokens: "\u8A73\u7D30\u8A2D\u5B9A\u3002max_completion_tokens \u3068\u3057\u3066\u6E21\u3059\u51FA\u529B token \u4E0A\u9650\u3067\u3059\u3002\u9577\u3044\u7AE0\u304C\u5207\u308C\u308B\u5834\u5408\u306F\u5927\u304D\u304F\u3057\u3066\u304F\u3060\u3055\u3044\u3002",
    temperature: "\u8A73\u7D30\u8A2D\u5B9A\u3002\u7A7A\u6B04\u306B\u3059\u308B\u3068\u3001\u3053\u306E\u30D7\u30ED\u30D0\u30A4\u30C0\u30FC\u30AA\u30D7\u30B7\u30E7\u30F3\u306F\u9001\u4FE1\u3057\u307E\u305B\u3093\u3002",
    reasoningEffort: "\u8A73\u7D30\u306A\u30D7\u30ED\u30D0\u30A4\u30C0\u30FC\u56FA\u6709\u30AA\u30D7\u30B7\u30E7\u30F3\u3067\u3059\u3002\u5BFE\u5FDC\u3057\u3066\u3044\u308B\u5834\u5408\u3060\u3051\u8A2D\u5B9A\u3057\u3066\u304F\u3060\u3055\u3044\u3002",
    verbosity: "\u8A73\u7D30\u306A\u30D7\u30ED\u30D0\u30A4\u30C0\u30FC\u56FA\u6709\u30AA\u30D7\u30B7\u30E7\u30F3\u3067\u3059\u3002\u5BFE\u5FDC\u3057\u3066\u3044\u308B\u5834\u5408\u3060\u3051\u8A2D\u5B9A\u3057\u3066\u304F\u3060\u3055\u3044\u3002",
    chapterConcurrency: "\u7AE0\u751F\u6210\u306E\u624B\u52D5\u4E26\u5217\u6570\u3002\u65E2\u5B9A\u5024\u306F 1 \u3067\u3059\u3002\u30D7\u30ED\u30D0\u30A4\u30C0\u30FC\u304C\u4E26\u5217\u30EA\u30AF\u30A8\u30B9\u30C8\u306B\u5B89\u5B9A\u3057\u3066\u3044\u308B\u5834\u5408\u3060\u3051\u5897\u3084\u3057\u3066\u304F\u3060\u3055\u3044\u3002",
    language: "\u51FA\u529B\u8A00\u8A9E\u306E\u8A2D\u5B9A\u3002"
  },
  ko: {
    apiKey: "\uACF5\uAE09\uC790 API key\uC785\uB2C8\uB2E4. \uAE30\uBCF8 \uC5D4\uB4DC\uD3EC\uC778\uD2B8\uB294 Google\uC758 OpenAI-compatible Gemini API\uB97C \uC0AC\uC6A9\uD569\uB2C8\uB2E4.",
    apiBaseUrl: "OpenAI-compatible API base URL\uC785\uB2C8\uB2E4.",
    outlineModel: "\uAC15\uC758 \uAC1C\uC694\uB97C \uC0DD\uC131\uD558\uB294 LLM \uBAA8\uB378\uC785\uB2C8\uB2E4.",
    chapterModel: "\uC7A5 \uC138\uBD80 \uB0B4\uC6A9\uC744 \uC0DD\uC131\uD558\uB294 LLM \uBAA8\uB378\uC785\uB2C8\uB2E4.",
    knowledgeType: "Auto\uB85C \uACC4\uD68D \uAE30\uBC18 \uBD84\uB958\uB97C \uC0AC\uC6A9\uD558\uAC70\uB098 \uC7A5 \uAD6C\uC870\uB97C \uAC15\uC81C\uB85C \uC9C0\uC815\uD569\uB2C8\uB2E4.",
    minimumChapterCharacters: "\uAE34 \uC7A5\uC774 \uCDA9\uBD84\uD788 \uCDA9\uC2E4\uD55C\uC9C0 \uD488\uC9C8 \uD3C9\uAC00\uAE30\uC640 \uC218\uC815 \uD655\uC7A5 \uB2E8\uACC4\uC5D0\uC11C \uD310\uB2E8\uD558\uB294 \uB370 \uC0AC\uC6A9\uD569\uB2C8\uB2E4.",
    maxCompletionTokens: "\uACE0\uAE09 \uC124\uC815\uC785\uB2C8\uB2E4. max_completion_tokens\uB85C \uC804\uB2EC\uB418\uB294 \uCD9C\uB825 token \uD55C\uB3C4\uC785\uB2C8\uB2E4. \uAE34 \uC7A5\uC774 \uC798\uB9AC\uBA74 \uAC12\uC744 \uB192\uC774\uC138\uC694.",
    temperature: "\uACE0\uAE09 \uC124\uC815\uC785\uB2C8\uB2E4. \uBE44\uC6CC \uB450\uBA74 \uC774 \uACF5\uAE09\uC790 \uC635\uC158\uC744 \uBCF4\uB0B4\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.",
    reasoningEffort: "\uACE0\uAE09 \uACF5\uAE09\uC790\uBCC4 \uC635\uC158\uC785\uB2C8\uB2E4. \uACF5\uAE09\uC790\uAC00 \uC9C0\uC6D0\uD560 \uB54C\uB9CC \uC124\uC815\uD558\uC138\uC694.",
    verbosity: "\uACE0\uAE09 \uACF5\uAE09\uC790\uBCC4 \uC635\uC158\uC785\uB2C8\uB2E4. \uACF5\uAE09\uC790\uAC00 \uC9C0\uC6D0\uD560 \uB54C\uB9CC \uC124\uC815\uD558\uC138\uC694.",
    chapterConcurrency: "\uC7A5 \uC0DD\uC131\uC758 \uC218\uB3D9 \uB3D9\uC2DC\uC131\uC785\uB2C8\uB2E4. \uAE30\uBCF8\uAC12\uC740 1\uC774\uBA70, \uACF5\uAE09\uC790\uAC00 \uBCD1\uB82C \uC694\uCCAD\uC744 \uC548\uC815\uC801\uC73C\uB85C \uCC98\uB9AC\uD560 \uB54C\uB9CC \uC62C\uB9AC\uC138\uC694.",
    language: "\uCD9C\uB825 \uC5B8\uC5B4 \uC124\uC815\uC785\uB2C8\uB2E4."
  },
  vi: {
    apiKey: "API key c\u1EE7a nh\xE0 cung c\u1EA5p. \u0110i\u1EC3m cu\u1ED1i m\u1EB7c \u0111\u1ECBnh d\xF9ng Gemini API t\u01B0\u01A1ng th\xEDch OpenAI c\u1EE7a Google.",
    apiBaseUrl: "OpenAI-compatible API base URL.",
    outlineModel: "M\xF4 h\xECnh LLM d\xF9ng \u0111\u1EC3 t\u1EA1o d\xE0n \xFD kh\xF3a h\u1ECDc.",
    chapterModel: "M\xF4 h\xECnh LLM d\xF9ng \u0111\u1EC3 t\u1EA1o n\u1ED9i dung chi ti\u1EBFt cho t\u1EEBng ch\u01B0\u01A1ng.",
    knowledgeType: "D\xF9ng Auto \u0111\u1EC3 ph\xE2n lo\u1EA1i b\u1EB1ng b\u01B0\u1EDBc l\u1EADp k\u1EBF ho\u1EA1ch, ho\u1EB7c \xE9p c\u1EA5u tr\xFAc ch\u01B0\u01A1ng.",
    minimumChapterCharacters: "D\xF9ng cho b\u1ED9 \u0111\xE1nh gi\xE1 ch\u1EA5t l\u01B0\u1EE3ng v\xE0 b\u01B0\u1EDBc s\u1EEDa m\u1EDF r\u1ED9ng \u0111\u1EC3 ki\u1EC3m tra ch\u01B0\u01A1ng d\xE0i c\xF3 \u0111\u1EE7 n\u1ED9i dung hay kh\xF4ng.",
    maxCompletionTokens: "N\xE2ng cao. Gi\u1EDBi h\u1EA1n token \u0111\u1EA7u ra truy\u1EC1n qua max_completion_tokens. T\u0103ng gi\xE1 tr\u1ECB n\u1EBFu nh\xE0 cung c\u1EA5p c\u1EAFt ng\u1EAFn ch\u01B0\u01A1ng d\xE0i.",
    temperature: "N\xE2ng cao. \u0110\u1EC3 tr\u1ED1ng \u0111\u1EC3 kh\xF4ng g\u1EEDi t\xF9y ch\u1ECDn nh\xE0 cung c\u1EA5p n\xE0y.",
    reasoningEffort: "T\xF9y ch\u1ECDn n\xE2ng cao theo nh\xE0 cung c\u1EA5p. Ch\u1EC9 \u0111\u1EB7t n\u1EBFu nh\xE0 cung c\u1EA5p h\u1ED7 tr\u1EE3.",
    verbosity: "T\xF9y ch\u1ECDn n\xE2ng cao theo nh\xE0 cung c\u1EA5p. Ch\u1EC9 \u0111\u1EB7t n\u1EBFu nh\xE0 cung c\u1EA5p h\u1ED7 tr\u1EE3.",
    chapterConcurrency: "S\u1ED1 ch\u01B0\u01A1ng t\u1EA1o song song th\u1EE7 c\xF4ng. M\u1EB7c \u0111\u1ECBnh l\xE0 1; ch\u1EC9 t\u0103ng n\u1EBFu nh\xE0 cung c\u1EA5p x\u1EED l\xFD song song \u1ED5n \u0111\u1ECBnh.",
    language: "T\xF9y ch\u1ECDn ng\xF4n ng\u1EEF \u0111\u1EA7u ra."
  },
  th: {
    apiKey: "API key \u0E02\u0E2D\u0E07\u0E1C\u0E39\u0E49\u0E43\u0E2B\u0E49\u0E1A\u0E23\u0E34\u0E01\u0E32\u0E23 \u0E1B\u0E25\u0E32\u0E22\u0E17\u0E32\u0E07\u0E40\u0E23\u0E34\u0E48\u0E21\u0E15\u0E49\u0E19\u0E43\u0E0A\u0E49 Gemini API \u0E02\u0E2D\u0E07 Google \u0E17\u0E35\u0E48\u0E40\u0E02\u0E49\u0E32\u0E01\u0E31\u0E19\u0E44\u0E14\u0E49\u0E01\u0E31\u0E1A OpenAI",
    apiBaseUrl: "OpenAI-compatible API base URL",
    outlineModel: "\u0E42\u0E21\u0E40\u0E14\u0E25 LLM \u0E2A\u0E33\u0E2B\u0E23\u0E31\u0E1A\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E42\u0E04\u0E23\u0E07\u0E23\u0E48\u0E32\u0E07\u0E04\u0E2D\u0E23\u0E4C\u0E2A",
    chapterModel: "\u0E42\u0E21\u0E40\u0E14\u0E25 LLM \u0E2A\u0E33\u0E2B\u0E23\u0E31\u0E1A\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E23\u0E32\u0E22\u0E25\u0E30\u0E40\u0E2D\u0E35\u0E22\u0E14\u0E02\u0E2D\u0E07\u0E1A\u0E17",
    knowledgeType: "\u0E43\u0E0A\u0E49 Auto \u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E08\u0E33\u0E41\u0E19\u0E01\u0E14\u0E49\u0E27\u0E22\u0E02\u0E31\u0E49\u0E19\u0E15\u0E2D\u0E19\u0E27\u0E32\u0E07\u0E41\u0E1C\u0E19 \u0E2B\u0E23\u0E37\u0E2D\u0E1A\u0E31\u0E07\u0E04\u0E31\u0E1A\u0E43\u0E0A\u0E49\u0E42\u0E04\u0E23\u0E07\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E1A\u0E17\u0E17\u0E35\u0E48\u0E01\u0E33\u0E2B\u0E19\u0E14",
    minimumChapterCharacters: "\u0E43\u0E0A\u0E49\u0E42\u0E14\u0E22\u0E15\u0E31\u0E27\u0E1B\u0E23\u0E30\u0E40\u0E21\u0E34\u0E19\u0E04\u0E38\u0E13\u0E20\u0E32\u0E1E\u0E41\u0E25\u0E30\u0E02\u0E31\u0E49\u0E19\u0E15\u0E2D\u0E19\u0E0B\u0E48\u0E2D\u0E21\u0E41\u0E0B\u0E21\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E14\u0E39\u0E27\u0E48\u0E32\u0E1A\u0E17\u0E22\u0E32\u0E27\u0E21\u0E35\u0E40\u0E19\u0E37\u0E49\u0E2D\u0E2B\u0E32\u0E40\u0E1E\u0E35\u0E22\u0E07\u0E1E\u0E2D\u0E2B\u0E23\u0E37\u0E2D\u0E44\u0E21\u0E48",
    maxCompletionTokens: "\u0E02\u0E31\u0E49\u0E19\u0E2A\u0E39\u0E07 \u0E02\u0E35\u0E14\u0E08\u0E33\u0E01\u0E31\u0E14 token \u0E40\u0E2D\u0E32\u0E15\u0E4C\u0E1E\u0E38\u0E15\u0E17\u0E35\u0E48\u0E2A\u0E48\u0E07\u0E40\u0E1B\u0E47\u0E19 max_completion_tokens \u0E40\u0E1E\u0E34\u0E48\u0E21\u0E04\u0E48\u0E32\u0E19\u0E35\u0E49\u0E2B\u0E32\u0E01\u0E1C\u0E39\u0E49\u0E43\u0E2B\u0E49\u0E1A\u0E23\u0E34\u0E01\u0E32\u0E23\u0E15\u0E31\u0E14\u0E1A\u0E17\u0E22\u0E32\u0E27",
    temperature: "\u0E02\u0E31\u0E49\u0E19\u0E2A\u0E39\u0E07 \u0E40\u0E27\u0E49\u0E19\u0E27\u0E48\u0E32\u0E07\u0E44\u0E27\u0E49\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E44\u0E21\u0E48\u0E2A\u0E48\u0E07\u0E15\u0E31\u0E27\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E19\u0E35\u0E49\u0E43\u0E2B\u0E49\u0E1C\u0E39\u0E49\u0E43\u0E2B\u0E49\u0E1A\u0E23\u0E34\u0E01\u0E32\u0E23",
    reasoningEffort: "\u0E15\u0E31\u0E27\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E02\u0E31\u0E49\u0E19\u0E2A\u0E39\u0E07\u0E40\u0E09\u0E1E\u0E32\u0E30\u0E1C\u0E39\u0E49\u0E43\u0E2B\u0E49\u0E1A\u0E23\u0E34\u0E01\u0E32\u0E23 \u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32\u0E40\u0E09\u0E1E\u0E32\u0E30\u0E40\u0E21\u0E37\u0E48\u0E2D\u0E1C\u0E39\u0E49\u0E43\u0E2B\u0E49\u0E1A\u0E23\u0E34\u0E01\u0E32\u0E23\u0E23\u0E2D\u0E07\u0E23\u0E31\u0E1A",
    verbosity: "\u0E15\u0E31\u0E27\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E02\u0E31\u0E49\u0E19\u0E2A\u0E39\u0E07\u0E40\u0E09\u0E1E\u0E32\u0E30\u0E1C\u0E39\u0E49\u0E43\u0E2B\u0E49\u0E1A\u0E23\u0E34\u0E01\u0E32\u0E23 \u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32\u0E40\u0E09\u0E1E\u0E32\u0E30\u0E40\u0E21\u0E37\u0E48\u0E2D\u0E1C\u0E39\u0E49\u0E43\u0E2B\u0E49\u0E1A\u0E23\u0E34\u0E01\u0E32\u0E23\u0E23\u0E2D\u0E07\u0E23\u0E31\u0E1A",
    chapterConcurrency: "\u0E08\u0E33\u0E19\u0E27\u0E19\u0E1A\u0E17\u0E17\u0E35\u0E48\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E1E\u0E23\u0E49\u0E2D\u0E21\u0E01\u0E31\u0E19\u0E41\u0E1A\u0E1A\u0E01\u0E33\u0E2B\u0E19\u0E14\u0E40\u0E2D\u0E07 \u0E04\u0E48\u0E32\u0E40\u0E23\u0E34\u0E48\u0E21\u0E15\u0E49\u0E19\u0E04\u0E37\u0E2D 1 \u0E40\u0E1E\u0E34\u0E48\u0E21\u0E40\u0E09\u0E1E\u0E32\u0E30\u0E40\u0E21\u0E37\u0E48\u0E2D\u0E1C\u0E39\u0E49\u0E43\u0E2B\u0E49\u0E1A\u0E23\u0E34\u0E01\u0E32\u0E23\u0E23\u0E2D\u0E07\u0E23\u0E31\u0E1A\u0E04\u0E33\u0E02\u0E2D\u0E02\u0E19\u0E32\u0E19\u0E44\u0E14\u0E49\u0E40\u0E2A\u0E16\u0E35\u0E22\u0E23",
    language: "\u0E20\u0E32\u0E29\u0E32\u0E17\u0E35\u0E48\u0E15\u0E49\u0E2D\u0E07\u0E01\u0E32\u0E23\u0E2A\u0E33\u0E2B\u0E23\u0E31\u0E1A\u0E40\u0E2D\u0E32\u0E15\u0E4C\u0E1E\u0E38\u0E15"
  },
  id: {
    apiKey: "API key penyedia Anda. Endpoint default menggunakan Gemini API Google yang kompatibel dengan OpenAI.",
    apiBaseUrl: "OpenAI-compatible API base URL.",
    outlineModel: "Model LLM untuk membuat garis besar kursus.",
    chapterModel: "Model LLM untuk membuat detail bab.",
    knowledgeType: "Gunakan Auto untuk klasifikasi berbasis perencanaan, atau paksa struktur bab.",
    minimumChapterCharacters: "Dipakai oleh evaluator kualitas dan pass perbaikan untuk menilai apakah bab panjang sudah cukup padat.",
    maxCompletionTokens: "Lanjutan. Batas token keluaran yang dikirim sebagai max_completion_tokens. Naikkan jika penyedia memotong bab panjang.",
    temperature: "Lanjutan. Biarkan kosong untuk tidak mengirim opsi penyedia ini.",
    reasoningEffort: "Opsi lanjutan khusus penyedia. Biarkan tidak disetel kecuali penyedia mendukungnya.",
    verbosity: "Opsi lanjutan khusus penyedia. Biarkan tidak disetel kecuali penyedia mendukungnya.",
    chapterConcurrency: "Konkurensi manual untuk pembuatan bab. Default 1; naikkan hanya jika penyedia stabil menangani permintaan paralel.",
    language: "Preferensi bahasa keluaran."
  },
  ms: {
    apiKey: "API key penyedia anda. Endpoint lalai menggunakan Gemini API Google yang serasi OpenAI.",
    apiBaseUrl: "OpenAI-compatible API base URL.",
    outlineModel: "Model LLM untuk menjana rangka kursus.",
    chapterModel: "Model LLM untuk menjana butiran bab.",
    knowledgeType: "Gunakan Auto untuk klasifikasi berasaskan perancangan, atau paksa struktur bab.",
    minimumChapterCharacters: "Digunakan oleh penilai kualiti dan pusingan pembaikan untuk menilai sama ada bab panjang cukup lengkap.",
    maxCompletionTokens: "Lanjutan. Had token output yang dihantar sebagai max_completion_tokens. Tingkatkan jika penyedia memotong bab panjang.",
    temperature: "Lanjutan. Biarkan kosong untuk tidak menghantar pilihan penyedia ini.",
    reasoningEffort: "Pilihan lanjutan khusus penyedia. Biarkan tidak ditetapkan kecuali penyedia menyokongnya.",
    verbosity: "Pilihan lanjutan khusus penyedia. Biarkan tidak ditetapkan kecuali penyedia menyokongnya.",
    chapterConcurrency: "Konkuren manual untuk penjanaan bab. Lalai ialah 1; tingkatkan hanya jika penyedia stabil dengan permintaan selari.",
    language: "Keutamaan bahasa output."
  },
  hi: {
    apiKey: "\u0906\u092A\u0915\u0947 \u092A\u094D\u0930\u0926\u093E\u0924\u093E \u0915\u0940 API key\u0964 \u0921\u093F\u092B\u093C\u0949\u0932\u094D\u091F endpoint Google \u0915\u0940 OpenAI-compatible Gemini API \u0915\u093E \u0909\u092A\u092F\u094B\u0917 \u0915\u0930\u0924\u093E \u0939\u0948\u0964",
    apiBaseUrl: "OpenAI-compatible API base URL.",
    outlineModel: "\u0915\u094B\u0930\u094D\u0938 \u0906\u0909\u091F\u0932\u093E\u0907\u0928 \u092C\u0928\u093E\u0928\u0947 \u0915\u0947 \u0932\u093F\u090F LLM \u092E\u0949\u0921\u0932\u0964",
    chapterModel: "\u0905\u0927\u094D\u092F\u093E\u092F \u0935\u093F\u0935\u0930\u0923 \u092C\u0928\u093E\u0928\u0947 \u0915\u0947 \u0932\u093F\u090F LLM \u092E\u0949\u0921\u0932\u0964",
    knowledgeType: "\u092F\u094B\u091C\u0928\u093E-\u0906\u0927\u093E\u0930\u093F\u0924 \u0935\u0930\u094D\u0917\u0940\u0915\u0930\u0923 \u0915\u0947 \u0932\u093F\u090F Auto \u0909\u092A\u092F\u094B\u0917 \u0915\u0930\u0947\u0902, \u092F\u093E \u0905\u0927\u094D\u092F\u093E\u092F \u0938\u0902\u0930\u091A\u0928\u093E \u0915\u094B \u092C\u093E\u0927\u094D\u092F \u0915\u0930\u0947\u0902\u0964",
    minimumChapterCharacters: "\u0932\u0902\u092C\u0947 \u0905\u0927\u094D\u092F\u093E\u092F \u092A\u0930\u094D\u092F\u093E\u092A\u094D\u0924 \u0930\u0942\u092A \u0938\u0947 \u0935\u093F\u0938\u094D\u0924\u0943\u0924 \u0939\u0948\u0902 \u092F\u093E \u0928\u0939\u0940\u0902, \u092F\u0939 \u0917\u0941\u0923\u0935\u0924\u094D\u0924\u093E \u092E\u0942\u0932\u094D\u092F\u093E\u0902\u0915\u0928 \u0914\u0930 \u0938\u0941\u0927\u093E\u0930 \u091A\u0930\u0923 \u092E\u0947\u0902 \u091C\u093E\u0901\u091A\u0928\u0947 \u0915\u0947 \u0932\u093F\u090F \u0909\u092A\u092F\u094B\u0917 \u0939\u094B\u0924\u093E \u0939\u0948\u0964",
    maxCompletionTokens: "\u0909\u0928\u094D\u0928\u0924\u0964 max_completion_tokens \u0915\u0947 \u0930\u0942\u092A \u092E\u0947\u0902 \u092D\u0947\u091C\u0940 \u091C\u093E\u0928\u0947 \u0935\u093E\u0932\u0940 \u0906\u0909\u091F\u092A\u0941\u091F token \u0938\u0940\u092E\u093E\u0964 \u092F\u0926\u093F \u092A\u094D\u0930\u0926\u093E\u0924\u093E \u0932\u0902\u092C\u0947 \u0905\u0927\u094D\u092F\u093E\u092F \u0915\u093E\u091F\u0924\u093E \u0939\u0948 \u0924\u094B \u0907\u0938\u0947 \u092C\u0922\u093C\u093E\u090F\u0901\u0964",
    temperature: "\u0909\u0928\u094D\u0928\u0924\u0964 \u0907\u0938 \u092A\u094D\u0930\u0926\u093E\u0924\u093E \u0935\u093F\u0915\u0932\u094D\u092A \u0915\u094B \u0928 \u092D\u0947\u091C\u0928\u0947 \u0915\u0947 \u0932\u093F\u090F \u0916\u093E\u0932\u0940 \u091B\u094B\u0921\u093C\u0947\u0902\u0964",
    reasoningEffort: "\u0909\u0928\u094D\u0928\u0924 \u092A\u094D\u0930\u0926\u093E\u0924\u093E-\u0935\u093F\u0936\u093F\u0937\u094D\u091F \u0935\u093F\u0915\u0932\u094D\u092A\u0964 \u0915\u0947\u0935\u0932 \u0924\u092C \u0938\u0947\u091F \u0915\u0930\u0947\u0902 \u091C\u092C \u092A\u094D\u0930\u0926\u093E\u0924\u093E \u0907\u0938\u0915\u093E \u0938\u092E\u0930\u094D\u0925\u0928 \u0915\u0930\u0924\u093E \u0939\u094B\u0964",
    verbosity: "\u0909\u0928\u094D\u0928\u0924 \u092A\u094D\u0930\u0926\u093E\u0924\u093E-\u0935\u093F\u0936\u093F\u0937\u094D\u091F \u0935\u093F\u0915\u0932\u094D\u092A\u0964 \u0915\u0947\u0935\u0932 \u0924\u092C \u0938\u0947\u091F \u0915\u0930\u0947\u0902 \u091C\u092C \u092A\u094D\u0930\u0926\u093E\u0924\u093E \u0907\u0938\u0915\u093E \u0938\u092E\u0930\u094D\u0925\u0928 \u0915\u0930\u0924\u093E \u0939\u094B\u0964",
    chapterConcurrency: "\u0905\u0927\u094D\u092F\u093E\u092F \u0928\u093F\u0930\u094D\u092E\u093E\u0923 \u0915\u0947 \u0932\u093F\u090F \u092E\u0948\u0928\u0941\u0905\u0932 concurrency\u0964 \u0921\u093F\u092B\u093C\u0949\u0932\u094D\u091F 1 \u0939\u0948; \u0915\u0947\u0935\u0932 \u0924\u092C \u092C\u0922\u093C\u093E\u090F\u0901 \u091C\u092C \u092A\u094D\u0930\u0926\u093E\u0924\u093E parallel requests \u092A\u0930 \u0938\u094D\u0925\u093F\u0930 \u0939\u094B\u0964",
    language: "\u0906\u0909\u091F\u092A\u0941\u091F \u092D\u093E\u0937\u093E \u092A\u094D\u0930\u093E\u0925\u092E\u093F\u0915\u0924\u093E\u0964"
  },
  ar: {
    apiKey: "API key \u0627\u0644\u062E\u0627\u0635 \u0628\u0627\u0644\u0645\u0632\u0648\u0651\u062F. \u064A\u0633\u062A\u062E\u062F\u0645 \u0627\u0644\u0645\u0633\u0627\u0631 \u0627\u0644\u0627\u0641\u062A\u0631\u0627\u0636\u064A Gemini API \u0627\u0644\u0645\u062A\u0648\u0627\u0641\u0642 \u0645\u0639 OpenAI \u0645\u0646 Google.",
    apiBaseUrl: "OpenAI-compatible API base URL.",
    outlineModel: "\u0646\u0645\u0648\u0630\u062C LLM \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u0644\u0625\u0646\u0634\u0627\u0621 \u0645\u062E\u0637\u0637\u0627\u062A \u0627\u0644\u062F\u0648\u0631\u0627\u062A.",
    chapterModel: "\u0646\u0645\u0648\u0630\u062C LLM \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u0644\u0625\u0646\u0634\u0627\u0621 \u062A\u0641\u0627\u0635\u064A\u0644 \u0627\u0644\u0641\u0635\u0648\u0644.",
    knowledgeType: "\u0627\u0633\u062A\u062E\u062F\u0645 Auto \u0644\u0644\u062A\u0635\u0646\u064A\u0641 \u0627\u0644\u0645\u0639\u062A\u0645\u062F \u0639\u0644\u0649 \u0627\u0644\u062A\u062E\u0637\u064A\u0637\u060C \u0623\u0648 \u0627\u0641\u0631\u0636 \u0628\u0646\u064A\u0629 \u0641\u0635\u0644 \u0645\u062D\u062F\u062F\u0629.",
    minimumChapterCharacters: "\u064A\u0633\u062A\u062E\u062F\u0645\u0647 \u0645\u0642\u064A\u0645 \u0627\u0644\u062C\u0648\u062F\u0629 \u0648\u0645\u0631\u062D\u0644\u0629 \u0627\u0644\u0625\u0635\u0644\u0627\u062D \u0644\u062A\u062D\u062F\u064A\u062F \u0645\u0627 \u0625\u0630\u0627 \u0643\u0627\u0646 \u0627\u0644\u0641\u0635\u0644 \u0627\u0644\u0637\u0648\u064A\u0644 \u0643\u0627\u0641\u064A\u0627.",
    maxCompletionTokens: "\u0625\u0639\u062F\u0627\u062F \u0645\u062A\u0642\u062F\u0645. \u062D\u062F \u0631\u0645\u0648\u0632 \u0627\u0644\u0625\u062E\u0631\u0627\u062C \u0627\u0644\u0645\u0631\u0633\u0644 \u0628\u0627\u0633\u0645 max_completion_tokens. \u0627\u0631\u0641\u0639\u0647 \u0625\u0630\u0627 \u0643\u0627\u0646 \u0627\u0644\u0645\u0632\u0648\u0651\u062F \u064A\u0642\u0637\u0639 \u0627\u0644\u0641\u0635\u0648\u0644 \u0627\u0644\u0637\u0648\u064A\u0644\u0629.",
    temperature: "\u0625\u0639\u062F\u0627\u062F \u0645\u062A\u0642\u062F\u0645. \u0627\u062A\u0631\u0643\u0647 \u0641\u0627\u0631\u063A\u0627 \u0644\u0639\u062F\u0645 \u0625\u0631\u0633\u0627\u0644 \u0647\u0630\u0627 \u0627\u0644\u062E\u064A\u0627\u0631 \u0625\u0644\u0649 \u0627\u0644\u0645\u0632\u0648\u0651\u062F.",
    reasoningEffort: "\u062E\u064A\u0627\u0631 \u0645\u062A\u0642\u062F\u0645 \u062E\u0627\u0635 \u0628\u0627\u0644\u0645\u0632\u0648\u0651\u062F. \u0627\u062A\u0631\u0643\u0647 \u063A\u064A\u0631 \u0645\u0636\u0628\u0648\u0637 \u0625\u0644\u0627 \u0625\u0630\u0627 \u0643\u0627\u0646 \u0627\u0644\u0645\u0632\u0648\u0651\u062F \u064A\u062F\u0639\u0645\u0647.",
    verbosity: "\u062E\u064A\u0627\u0631 \u0645\u062A\u0642\u062F\u0645 \u062E\u0627\u0635 \u0628\u0627\u0644\u0645\u0632\u0648\u0651\u062F. \u0627\u062A\u0631\u0643\u0647 \u063A\u064A\u0631 \u0645\u0636\u0628\u0648\u0637 \u0625\u0644\u0627 \u0625\u0630\u0627 \u0643\u0627\u0646 \u0627\u0644\u0645\u0632\u0648\u0651\u062F \u064A\u062F\u0639\u0645\u0647.",
    chapterConcurrency: "\u0639\u062F\u062F \u0627\u0644\u0641\u0635\u0648\u0644 \u0627\u0644\u0645\u062A\u0632\u0627\u0645\u0646\u0629 \u0641\u064A \u0627\u0644\u062A\u0648\u0644\u064A\u062F \u064A\u062F\u0648\u064A\u0627. \u0627\u0644\u0627\u0641\u062A\u0631\u0627\u0636\u064A 1\u061B \u0632\u062F \u0627\u0644\u0642\u064A\u0645\u0629 \u0641\u0642\u0637 \u0625\u0630\u0627 \u0643\u0627\u0646 \u0627\u0644\u0645\u0632\u0648\u0651\u062F \u0645\u0633\u062A\u0642\u0631\u0627 \u0645\u0639 \u0627\u0644\u0637\u0644\u0628\u0627\u062A \u0627\u0644\u0645\u062A\u0648\u0627\u0632\u064A\u0629.",
    language: "\u062A\u0641\u0636\u064A\u0644 \u0644\u063A\u0629 \u0627\u0644\u0625\u062E\u0631\u0627\u062C."
  },
  de: {
    apiKey: "Ihr Anbieter-API-key. Der Standard-Endpunkt nutzt Googles OpenAI-kompatible Gemini API.",
    apiBaseUrl: "OpenAI-compatible API base URL.",
    outlineModel: "LLM-Modell zum Erstellen von Kursgliederungen.",
    chapterModel: "LLM-Modell zum Erstellen von Kapiteldetails.",
    knowledgeType: "Auto f\xFCr planungsbasierte Klassifikation verwenden oder eine Kapitelstruktur erzwingen.",
    minimumChapterCharacters: "Wird vom Qualit\xE4tspr\xFCfer und Reparaturdurchlauf genutzt, um lange Kapitel auf ausreichende Dichte zu pr\xFCfen.",
    maxCompletionTokens: "Erweitert. Ausgabelimit f\xFCr token, das als max_completion_tokens gesendet wird. Erh\xF6hen, wenn lange Kapitel abgeschnitten werden.",
    temperature: "Erweitert. Leer lassen, um diese Anbieteroption nicht zu senden.",
    reasoningEffort: "Erweiterte anbieterspezifische Option. Nur setzen, wenn der Anbieter sie unterst\xFCtzt.",
    verbosity: "Erweiterte anbieterspezifische Option. Nur setzen, wenn der Anbieter sie unterst\xFCtzt.",
    chapterConcurrency: "Manuelle Parallelit\xE4t f\xFCr Kapitelerzeugung. Standard ist 1; nur erh\xF6hen, wenn der Anbieter parallele Anfragen stabil verarbeitet.",
    language: "Bevorzugte Ausgabesprache."
  },
  fr: {
    apiKey: "Votre API key fournisseur. Le point de terminaison par d\xE9faut utilise l'API Gemini de Google compatible OpenAI.",
    apiBaseUrl: "OpenAI-compatible API base URL.",
    outlineModel: "Mod\xE8le LLM utilis\xE9 pour g\xE9n\xE9rer les plans de cours.",
    chapterModel: "Mod\xE8le LLM utilis\xE9 pour g\xE9n\xE9rer les d\xE9tails des chapitres.",
    knowledgeType: "Utilisez Auto pour une classification bas\xE9e sur la planification, ou forcez une structure de chapitre.",
    minimumChapterCharacters: "Utilis\xE9 par l'\xE9valuateur de qualit\xE9 et le passage de r\xE9paration pour v\xE9rifier qu'un chapitre long est assez dense.",
    maxCompletionTokens: "Avanc\xE9. Limite de token de sortie transmise via max_completion_tokens. Augmentez-la si le fournisseur tronque les longs chapitres.",
    temperature: "Avanc\xE9. Laissez vide pour ne pas envoyer cette option fournisseur.",
    reasoningEffort: "Option avanc\xE9e propre au fournisseur. Ne la d\xE9finissez que si le fournisseur la prend en charge.",
    verbosity: "Option avanc\xE9e propre au fournisseur. Ne la d\xE9finissez que si le fournisseur la prend en charge.",
    chapterConcurrency: "Concurrence manuelle pour la g\xE9n\xE9ration des chapitres. La valeur par d\xE9faut est 1; augmentez-la seulement si le fournisseur g\xE8re bien les requ\xEAtes parall\xE8les.",
    language: "Pr\xE9f\xE9rence de langue de sortie."
  },
  es: {
    apiKey: "Tu API key del proveedor. El endpoint predeterminado usa la API Gemini de Google compatible con OpenAI.",
    apiBaseUrl: "OpenAI-compatible API base URL.",
    outlineModel: "Modelo LLM para generar esquemas de cursos.",
    chapterModel: "Modelo LLM para generar detalles de cap\xEDtulos.",
    knowledgeType: "Usa Auto para clasificaci\xF3n basada en planificaci\xF3n, o fuerza una estructura de cap\xEDtulo.",
    minimumChapterCharacters: "Lo usan el evaluador de calidad y el paso de reparaci\xF3n para comprobar si los cap\xEDtulos largos tienen suficiente contenido.",
    maxCompletionTokens: "Avanzado. L\xEDmite de token de salida enviado como max_completion_tokens. Aum\xE9ntalo si el proveedor corta cap\xEDtulos largos.",
    temperature: "Avanzado. D\xE9jalo vac\xEDo para omitir esta opci\xF3n del proveedor.",
    reasoningEffort: "Opci\xF3n avanzada espec\xEDfica del proveedor. D\xE9jala sin configurar salvo que tu proveedor la admita.",
    verbosity: "Opci\xF3n avanzada espec\xEDfica del proveedor. D\xE9jala sin configurar salvo que tu proveedor la admita.",
    chapterConcurrency: "Concurrencia manual para generaci\xF3n de cap\xEDtulos. El valor predeterminado es 1; s\xFAbelo solo si el proveedor maneja bien solicitudes paralelas.",
    language: "Preferencia de idioma de salida."
  },
  it: {
    apiKey: "La tua API key del provider. L'endpoint predefinito usa l'API Gemini di Google compatibile con OpenAI.",
    apiBaseUrl: "OpenAI-compatible API base URL.",
    outlineModel: "Modello LLM per generare le scalette dei corsi.",
    chapterModel: "Modello LLM per generare i dettagli dei capitoli.",
    knowledgeType: "Usa Auto per una classificazione basata sulla pianificazione, oppure forza una struttura di capitolo.",
    minimumChapterCharacters: "Usato dal valutatore di qualit\xE0 e dal passaggio di riparazione per verificare se i capitoli lunghi sono abbastanza densi.",
    maxCompletionTokens: "Avanzato. Limite di token in uscita inviato come max_completion_tokens. Aumentalo se il provider tronca i capitoli lunghi.",
    temperature: "Avanzato. Lascia vuoto per omettere questa opzione del provider.",
    reasoningEffort: "Opzione avanzata specifica del provider. Lasciala non impostata salvo supporto del provider.",
    verbosity: "Opzione avanzata specifica del provider. Lasciala non impostata salvo supporto del provider.",
    chapterConcurrency: "Concorrenza manuale per la generazione dei capitoli. Il valore predefinito \xE8 1; aumentala solo se il provider gestisce bene richieste parallele.",
    language: "Preferenza della lingua di output."
  },
  pt: {
    apiKey: "Sua API key do provedor. O endpoint padr\xE3o usa a API Gemini do Google compat\xEDvel com OpenAI.",
    apiBaseUrl: "OpenAI-compatible API base URL.",
    outlineModel: "Modelo LLM para gerar esbo\xE7os de cursos.",
    chapterModel: "Modelo LLM para gerar detalhes dos cap\xEDtulos.",
    knowledgeType: "Use Auto para classifica\xE7\xE3o baseada em planejamento, ou force uma estrutura de cap\xEDtulo.",
    minimumChapterCharacters: "Usado pelo avaliador de qualidade e pela etapa de reparo para verificar se cap\xEDtulos longos t\xEAm conte\xFAdo suficiente.",
    maxCompletionTokens: "Avan\xE7ado. Limite de token de sa\xEDda enviado como max_completion_tokens. Aumente se o provedor truncar cap\xEDtulos longos.",
    temperature: "Avan\xE7ado. Deixe vazio para omitir esta op\xE7\xE3o do provedor.",
    reasoningEffort: "Op\xE7\xE3o avan\xE7ada espec\xEDfica do provedor. Deixe sem definir a menos que o provedor suporte.",
    verbosity: "Op\xE7\xE3o avan\xE7ada espec\xEDfica do provedor. Deixe sem definir a menos que o provedor suporte.",
    chapterConcurrency: "Concorr\xEAncia manual para gera\xE7\xE3o de cap\xEDtulos. O padr\xE3o \xE9 1; aumente somente se o provedor lidar bem com solicita\xE7\xF5es paralelas.",
    language: "Prefer\xEAncia de idioma de sa\xEDda."
  },
  nl: {
    apiKey: "Uw provider-API key. Het standaardendpoint gebruikt Google's OpenAI-compatibele Gemini API.",
    apiBaseUrl: "OpenAI-compatible API base URL.",
    outlineModel: "LLM-model voor het genereren van cursusoverzichten.",
    chapterModel: "LLM-model voor het genereren van hoofdstukdetails.",
    knowledgeType: "Gebruik Auto voor planning-gebaseerde classificatie, of forceer een hoofdstukstructuur.",
    minimumChapterCharacters: "Wordt gebruikt door de kwaliteitsbeoordelaar en reparatiestap om te controleren of lange hoofdstukken voldoende inhoud hebben.",
    maxCompletionTokens: "Geavanceerd. Uitvoer-tokenlimiet die als max_completion_tokens wordt verzonden. Verhoog dit als de provider lange hoofdstukken afkapt.",
    temperature: "Geavanceerd. Laat leeg om deze provideroptie niet te verzenden.",
    reasoningEffort: "Geavanceerde provider-specifieke optie. Laat oningesteld tenzij uw provider dit ondersteunt.",
    verbosity: "Geavanceerde provider-specifieke optie. Laat oningesteld tenzij uw provider dit ondersteunt.",
    chapterConcurrency: "Handmatige concurrency voor hoofdstukgeneratie. Standaard is 1; verhoog alleen als de provider parallelle verzoeken stabiel verwerkt.",
    language: "Voorkeur voor uitvoertaal."
  },
  sv: {
    apiKey: "Din leverant\xF6rs API key. Standardendpointen anv\xE4nder Googles OpenAI-kompatibla Gemini API.",
    apiBaseUrl: "OpenAI-compatible API base URL.",
    outlineModel: "LLM-modell f\xF6r att generera kurs\xF6versikter.",
    chapterModel: "LLM-modell f\xF6r att generera kapiteldetaljer.",
    knowledgeType: "Anv\xE4nd Auto f\xF6r planeringsbaserad klassificering, eller tvinga en kapitelstruktur.",
    minimumChapterCharacters: "Anv\xE4nds av kvalitetsutv\xE4rderaren och reparationssteget f\xF6r att kontrollera att l\xE5nga kapitel \xE4r tillr\xE4ckligt fylliga.",
    maxCompletionTokens: "Avancerat. Gr\xE4ns f\xF6r utdata-token som skickas som max_completion_tokens. H\xF6j om leverant\xF6ren kapar l\xE5nga kapitel.",
    temperature: "Avancerat. L\xE4mna tomt f\xF6r att utel\xE4mna detta leverant\xF6rsalternativ.",
    reasoningEffort: "Avancerat leverant\xF6rsspecifikt alternativ. L\xE4mna unset om inte leverant\xF6ren st\xF6der det.",
    verbosity: "Avancerat leverant\xF6rsspecifikt alternativ. L\xE4mna unset om inte leverant\xF6ren st\xF6der det.",
    chapterConcurrency: "Manuell concurrency f\xF6r kapitelgenerering. Standard \xE4r 1; h\xF6j bara om leverant\xF6ren hanterar parallella f\xF6rfr\xE5gningar stabilt.",
    language: "Inst\xE4llning f\xF6r utdataspr\xE5k."
  },
  fi: {
    apiKey: "Palveluntarjoajan API key. Oletusp\xE4\xE4tepiste k\xE4ytt\xE4\xE4 Googlen OpenAI-yhteensopivaa Gemini APIa.",
    apiBaseUrl: "OpenAI-compatible API base URL.",
    outlineModel: "LLM-malli kurssirakenteiden luomiseen.",
    chapterModel: "LLM-malli lukujen yksityiskohtien luomiseen.",
    knowledgeType: "K\xE4yt\xE4 Auto-valintaa suunnittelupohjaiseen luokitteluun tai pakota luvun rakenne.",
    minimumChapterCharacters: "Laadunarvioija ja korjausvaihe k\xE4ytt\xE4v\xE4t t\xE4t\xE4 tarkistaakseen, ovatko pitk\xE4t luvut riitt\xE4v\xE4n kattavia.",
    maxCompletionTokens: "Lis\xE4asetus. max_completion_tokens-kentt\xE4n\xE4 l\xE4hetett\xE4v\xE4 tulosteen token-raja. Kasvata arvoa, jos palveluntarjoaja katkaisee pitk\xE4t luvut.",
    temperature: "Lis\xE4asetus. J\xE4t\xE4 tyhj\xE4ksi, jos et halua l\xE4hett\xE4\xE4 t\xE4t\xE4 palveluntarjoajan asetusta.",
    reasoningEffort: "Edistynyt palveluntarjoajakohtainen asetus. J\xE4t\xE4 asettamatta, ellei palveluntarjoaja tue sit\xE4.",
    verbosity: "Edistynyt palveluntarjoajakohtainen asetus. J\xE4t\xE4 asettamatta, ellei palveluntarjoaja tue sit\xE4.",
    chapterConcurrency: "Manuaalinen concurrency lukujen generointiin. Oletus on 1; nosta vain, jos palveluntarjoaja k\xE4sittelee rinnakkaispyynn\xF6t vakaasti.",
    language: "Tulostekielen asetus."
  },
  pl: {
    apiKey: "API key Twojego dostawcy. Domy\u015Blny endpoint u\u017Cywa zgodnego z OpenAI Gemini API od Google.",
    apiBaseUrl: "OpenAI-compatible API base URL.",
    outlineModel: "Model LLM do generowania konspekt\xF3w kurs\xF3w.",
    chapterModel: "Model LLM do generowania szczeg\xF3\u0142\xF3w rozdzia\u0142\xF3w.",
    knowledgeType: "U\u017Cyj Auto do klasyfikacji opartej na planowaniu albo wymu\u015B struktur\u0119 rozdzia\u0142u.",
    minimumChapterCharacters: "U\u017Cywane przez ocen\u0119 jako\u015Bci i krok naprawy, aby sprawdzi\u0107, czy d\u0142ugie rozdzia\u0142y s\u0105 wystarczaj\u0105co tre\u015Bciwe.",
    maxCompletionTokens: "Zaawansowane. Limit token wyj\u015Bciowych wysy\u0142any jako max_completion_tokens. Zwi\u0119ksz, je\u015Bli dostawca ucina d\u0142ugie rozdzia\u0142y.",
    temperature: "Zaawansowane. Zostaw puste, aby nie wysy\u0142a\u0107 tej opcji dostawcy.",
    reasoningEffort: "Zaawansowana opcja specyficzna dla dostawcy. Zostaw nieustawione, chyba \u017Ce dostawca j\u0105 obs\u0142uguje.",
    verbosity: "Zaawansowana opcja specyficzna dla dostawcy. Zostaw nieustawione, chyba \u017Ce dostawca j\u0105 obs\u0142uguje.",
    chapterConcurrency: "R\u0119czna concurrency dla generowania rozdzia\u0142\xF3w. Domy\u015Blnie 1; zwi\u0119kszaj tylko, gdy dostawca stabilnie obs\u0142uguje r\xF3wnoleg\u0142e \u017C\u0105dania.",
    language: "Preferowany j\u0119zyk wyj\u015Bciowy."
  },
  tr: {
    apiKey: "Sa\u011Flay\u0131c\u0131 API key'iniz. Varsay\u0131lan endpoint Google'\u0131n OpenAI uyumlu Gemini API'sini kullan\u0131r.",
    apiBaseUrl: "OpenAI-compatible API base URL.",
    outlineModel: "Ders taslaklar\u0131 olu\u015Fturmak i\xE7in LLM modeli.",
    chapterModel: "B\xF6l\xFCm ayr\u0131nt\u0131lar\u0131 olu\u015Fturmak i\xE7in LLM modeli.",
    knowledgeType: "Planlama tabanl\u0131 s\u0131n\u0131fland\u0131rma i\xE7in Auto kullan\u0131n veya b\xF6l\xFCm yap\u0131s\u0131n\u0131 zorlay\u0131n.",
    minimumChapterCharacters: "Kalite de\u011Ferlendirici ve onar\u0131m ge\xE7i\u015Fi taraf\u0131ndan uzun b\xF6l\xFCmlerin yeterince dolu olup olmad\u0131\u011F\u0131n\u0131 kontrol etmek i\xE7in kullan\u0131l\u0131r.",
    maxCompletionTokens: "Geli\u015Fmi\u015F. max_completion_tokens olarak g\xF6nderilen \xE7\u0131kt\u0131 token s\u0131n\u0131r\u0131. Sa\u011Flay\u0131c\u0131 uzun b\xF6l\xFCmleri kesiyorsa art\u0131r\u0131n.",
    temperature: "Geli\u015Fmi\u015F. Bu sa\u011Flay\u0131c\u0131 se\xE7ene\u011Fini g\xF6ndermemek i\xE7in bo\u015F b\u0131rak\u0131n.",
    reasoningEffort: "Geli\u015Fmi\u015F sa\u011Flay\u0131c\u0131ya \xF6zel se\xE7enek. Sa\u011Flay\u0131c\u0131 desteklemiyorsa ayarlamay\u0131n.",
    verbosity: "Geli\u015Fmi\u015F sa\u011Flay\u0131c\u0131ya \xF6zel se\xE7enek. Sa\u011Flay\u0131c\u0131 desteklemiyorsa ayarlamay\u0131n.",
    chapterConcurrency: "B\xF6l\xFCm \xFCretimi i\xE7in manuel concurrency. Varsay\u0131lan 1'dir; yaln\u0131zca sa\u011Flay\u0131c\u0131 paralel isteklerde kararl\u0131ysa art\u0131r\u0131n.",
    language: "\xC7\u0131kt\u0131 dili tercihi."
  },
  ru: {
    apiKey: "API key \u0432\u0430\u0448\u0435\u0433\u043E \u043F\u0440\u043E\u0432\u0430\u0439\u0434\u0435\u0440\u0430. Endpoint \u043F\u043E \u0443\u043C\u043E\u043B\u0447\u0430\u043D\u0438\u044E \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0435\u0442 \u0441\u043E\u0432\u043C\u0435\u0441\u0442\u0438\u043C\u044B\u0439 \u0441 OpenAI Gemini API \u043E\u0442 Google.",
    apiBaseUrl: "OpenAI-compatible API base URL.",
    outlineModel: "LLM-\u043C\u043E\u0434\u0435\u043B\u044C \u0434\u043B\u044F \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u044F \u043F\u043B\u0430\u043D\u043E\u0432 \u043A\u0443\u0440\u0441\u043E\u0432.",
    chapterModel: "LLM-\u043C\u043E\u0434\u0435\u043B\u044C \u0434\u043B\u044F \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u044F \u043F\u043E\u0434\u0440\u043E\u0431\u043D\u043E\u0441\u0442\u0435\u0439 \u0433\u043B\u0430\u0432.",
    knowledgeType: "\u0418\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0439\u0442\u0435 Auto \u0434\u043B\u044F \u043A\u043B\u0430\u0441\u0441\u0438\u0444\u0438\u043A\u0430\u0446\u0438\u0438 \u043D\u0430 \u043E\u0441\u043D\u043E\u0432\u0435 \u043F\u043B\u0430\u043D\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u044F \u0438\u043B\u0438 \u0437\u0430\u0434\u0430\u0439\u0442\u0435 \u0441\u0442\u0440\u0443\u043A\u0442\u0443\u0440\u0443 \u0433\u043B\u0430\u0432\u044B \u0432\u0440\u0443\u0447\u043D\u0443\u044E.",
    minimumChapterCharacters: "\u0418\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0435\u0442\u0441\u044F \u043E\u0446\u0435\u043D\u0449\u0438\u043A\u043E\u043C \u043A\u0430\u0447\u0435\u0441\u0442\u0432\u0430 \u0438 \u044D\u0442\u0430\u043F\u043E\u043C \u0438\u0441\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u044F, \u0447\u0442\u043E\u0431\u044B \u043F\u0440\u043E\u0432\u0435\u0440\u0438\u0442\u044C, \u0434\u043E\u0441\u0442\u0430\u0442\u043E\u0447\u043D\u043E \u043B\u0438 \u0441\u043E\u0434\u0435\u0440\u0436\u0430\u0442\u0435\u043B\u044C\u043D\u0430 \u0434\u043B\u0438\u043D\u043D\u0430\u044F \u0433\u043B\u0430\u0432\u0430.",
    maxCompletionTokens: "\u0420\u0430\u0441\u0448\u0438\u0440\u0435\u043D\u043D\u0430\u044F \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0430. \u041B\u0438\u043C\u0438\u0442 \u0432\u044B\u0445\u043E\u0434\u043D\u044B\u0445 token, \u043F\u0435\u0440\u0435\u0434\u0430\u0432\u0430\u0435\u043C\u044B\u0439 \u043A\u0430\u043A max_completion_tokens. \u0423\u0432\u0435\u043B\u0438\u0447\u044C\u0442\u0435, \u0435\u0441\u043B\u0438 \u043F\u0440\u043E\u0432\u0430\u0439\u0434\u0435\u0440 \u043E\u0431\u0440\u0435\u0437\u0430\u0435\u0442 \u0434\u043B\u0438\u043D\u043D\u044B\u0435 \u0433\u043B\u0430\u0432\u044B.",
    temperature: "\u0420\u0430\u0441\u0448\u0438\u0440\u0435\u043D\u043D\u0430\u044F \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0430. \u041E\u0441\u0442\u0430\u0432\u044C\u0442\u0435 \u043F\u0443\u0441\u0442\u044B\u043C, \u0447\u0442\u043E\u0431\u044B \u043D\u0435 \u043E\u0442\u043F\u0440\u0430\u0432\u043B\u044F\u0442\u044C \u044D\u0442\u0443 \u043E\u043F\u0446\u0438\u044E \u043F\u0440\u043E\u0432\u0430\u0439\u0434\u0435\u0440\u0443.",
    reasoningEffort: "\u0420\u0430\u0441\u0448\u0438\u0440\u0435\u043D\u043D\u0430\u044F \u043E\u043F\u0446\u0438\u044F \u043A\u043E\u043D\u043A\u0440\u0435\u0442\u043D\u043E\u0433\u043E \u043F\u0440\u043E\u0432\u0430\u0439\u0434\u0435\u0440\u0430. \u041E\u0441\u0442\u0430\u0432\u044C\u0442\u0435 \u043D\u0435 \u0437\u0430\u0434\u0430\u043D\u043D\u043E\u0439, \u0435\u0441\u043B\u0438 \u043F\u0440\u043E\u0432\u0430\u0439\u0434\u0435\u0440 \u0435\u0435 \u043D\u0435 \u043F\u043E\u0434\u0434\u0435\u0440\u0436\u0438\u0432\u0430\u0435\u0442.",
    verbosity: "\u0420\u0430\u0441\u0448\u0438\u0440\u0435\u043D\u043D\u0430\u044F \u043E\u043F\u0446\u0438\u044F \u043A\u043E\u043D\u043A\u0440\u0435\u0442\u043D\u043E\u0433\u043E \u043F\u0440\u043E\u0432\u0430\u0439\u0434\u0435\u0440\u0430. \u041E\u0441\u0442\u0430\u0432\u044C\u0442\u0435 \u043D\u0435 \u0437\u0430\u0434\u0430\u043D\u043D\u043E\u0439, \u0435\u0441\u043B\u0438 \u043F\u0440\u043E\u0432\u0430\u0439\u0434\u0435\u0440 \u0435\u0435 \u043D\u0435 \u043F\u043E\u0434\u0434\u0435\u0440\u0436\u0438\u0432\u0430\u0435\u0442.",
    chapterConcurrency: "\u0420\u0443\u0447\u043D\u0430\u044F concurrency \u0434\u043B\u044F \u0433\u0435\u043D\u0435\u0440\u0430\u0446\u0438\u0438 \u0433\u043B\u0430\u0432. \u041F\u043E \u0443\u043C\u043E\u043B\u0447\u0430\u043D\u0438\u044E 1; \u0443\u0432\u0435\u043B\u0438\u0447\u0438\u0432\u0430\u0439\u0442\u0435 \u0442\u043E\u043B\u044C\u043A\u043E \u0435\u0441\u043B\u0438 \u043F\u0440\u043E\u0432\u0430\u0439\u0434\u0435\u0440 \u0441\u0442\u0430\u0431\u0438\u043B\u044C\u043D\u043E \u043E\u0431\u0440\u0430\u0431\u0430\u0442\u044B\u0432\u0430\u0435\u0442 \u043F\u0430\u0440\u0430\u043B\u043B\u0435\u043B\u044C\u043D\u044B\u0435 \u0437\u0430\u043F\u0440\u043E\u0441\u044B.",
    language: "\u041F\u0440\u0435\u0434\u043F\u043E\u0447\u0442\u0438\u0442\u0435\u043B\u044C\u043D\u044B\u0439 \u044F\u0437\u044B\u043A \u0432\u044B\u0432\u043E\u0434\u0430."
  }
};
var DEFAULT_LABEL_TEXT = {
  en: "Default",
  zh: "\u9ED8\u8BA4",
  zh_tw: "\u9810\u8A2D",
  ja: "\u65E2\u5B9A\u5024",
  ko: "\uAE30\uBCF8\uAC12",
  vi: "M\u1EB7c \u0111\u1ECBnh",
  th: "\u0E04\u0E48\u0E32\u0E40\u0E23\u0E34\u0E48\u0E21\u0E15\u0E49\u0E19",
  id: "Default",
  ms: "Lalai",
  hi: "\u0921\u093F\u092B\u093C\u0949\u0932\u094D\u091F",
  ar: "\u0627\u0644\u0627\u0641\u062A\u0631\u0627\u0636\u064A",
  de: "Standard",
  fr: "Par d\xE9faut",
  es: "Predeterminado",
  it: "Predefinito",
  pt: "Padr\xE3o",
  nl: "Standaard",
  sv: "Standard",
  fi: "Oletus",
  pl: "Domy\u015Blnie",
  tr: "Varsay\u0131lan",
  ru: "\u041F\u043E \u0443\u043C\u043E\u043B\u0447\u0430\u043D\u0438\u044E"
};
var KNOWLEDGE_DEPTH_DESCRIPTION_TEXT = {
  en: {
    scan: "High-level map of key topics.",
    onboarding: "Clear overview with essential details.",
    learn: "In-depth explanation with examples.",
    review: "Concise refresher for quick review."
  },
  zh: {
    scan: "\u5FEB\u901F\u5EFA\u7ACB\u4E3B\u9898\u5730\u56FE\u3002",
    onboarding: "\u6E05\u6670\u6982\u89C8\u6838\u5FC3\u77E5\u8BC6\u3002",
    learn: "\u6DF1\u5165\u8BB2\u89E3\u5E76\u914D\u4F8B\u5B50\u3002",
    review: "\u9002\u5408\u5FEB\u901F\u590D\u4E60\u5DE9\u56FA\u3002"
  },
  zh_tw: {
    scan: "\u5FEB\u901F\u5EFA\u7ACB\u4E3B\u984C\u5730\u5716\u3002",
    onboarding: "\u6E05\u6670\u6982\u89BD\u6838\u5FC3\u77E5\u8B58\u3002",
    learn: "\u6DF1\u5165\u8B1B\u89E3\u4E26\u914D\u4F8B\u5B50\u3002",
    review: "\u9069\u5408\u5FEB\u901F\u8907\u7FD2\u978F\u56FA\u3002"
  },
  ja: {
    scan: "\u4E3B\u8981\u30C8\u30D4\u30C3\u30AF\u3092\u4FEF\u77B0\u3057\u307E\u3059\u3002",
    onboarding: "\u8981\u70B9\u3092\u62BC\u3055\u3048\u305F\u660E\u5FEB\u306A\u6982\u89B3\u3002",
    learn: "\u4F8B\u3092\u4EA4\u3048\u3066\u6DF1\u304F\u5B66\u3073\u307E\u3059\u3002",
    review: "\u77ED\u6642\u9593\u306E\u5FA9\u7FD2\u306B\u5411\u304D\u307E\u3059\u3002"
  },
  ko: {
    scan: "\uD575\uC2EC \uC8FC\uC81C\uC758 \uD070 \uC9C0\uB3C4\uB97C \uB9CC\uB4ED\uB2C8\uB2E4.",
    onboarding: "\uD544\uC218 \uB0B4\uC6A9\uC744 \uB2F4\uC740 \uBA85\uD655\uD55C \uAC1C\uC694\uC785\uB2C8\uB2E4.",
    learn: "\uC608\uC2DC\uC640 \uD568\uAED8 \uAE4A\uC774 \uC124\uBA85\uD569\uB2C8\uB2E4.",
    review: "\uBE60\uB978 \uBCF5\uC2B5\uC5D0 \uC801\uD569\uD569\uB2C8\uB2E4."
  },
  vi: {
    scan: "L\u1EADp b\u1EA3n \u0111\u1ED3 nhanh c\xE1c ch\u1EE7 \u0111\u1EC1 ch\xEDnh.",
    onboarding: "T\u1ED5ng quan r\xF5 r\xE0ng v\u1EDBi chi ti\u1EBFt c\u1EA7n thi\u1EBFt.",
    learn: "Gi\u1EA3i th\xEDch s\xE2u k\xE8m v\xED d\u1EE5.",
    review: "\xD4n t\u1EADp nhanh v\xE0 c\xF4 \u0111\u1ECDng."
  },
  th: {
    scan: "\u0E17\u0E33\u0E41\u0E1C\u0E19\u0E17\u0E35\u0E48\u0E2B\u0E31\u0E27\u0E02\u0E49\u0E2D\u0E2B\u0E25\u0E31\u0E01\u0E41\u0E1A\u0E1A\u0E23\u0E27\u0E14\u0E40\u0E23\u0E47\u0E27",
    onboarding: "\u0E20\u0E32\u0E1E\u0E23\u0E27\u0E21\u0E0A\u0E31\u0E14\u0E40\u0E08\u0E19\u0E1E\u0E23\u0E49\u0E2D\u0E21\u0E23\u0E32\u0E22\u0E25\u0E30\u0E40\u0E2D\u0E35\u0E22\u0E14\u0E2A\u0E33\u0E04\u0E31\u0E0D",
    learn: "\u0E2D\u0E18\u0E34\u0E1A\u0E32\u0E22\u0E40\u0E0A\u0E34\u0E07\u0E25\u0E36\u0E01\u0E1E\u0E23\u0E49\u0E2D\u0E21\u0E15\u0E31\u0E27\u0E2D\u0E22\u0E48\u0E32\u0E07",
    review: "\u0E17\u0E1A\u0E17\u0E27\u0E19\u0E41\u0E1A\u0E1A\u0E01\u0E23\u0E30\u0E0A\u0E31\u0E1A\u0E41\u0E25\u0E30\u0E23\u0E27\u0E14\u0E40\u0E23\u0E47\u0E27"
  },
  id: {
    scan: "Peta cepat untuk topik utama.",
    onboarding: "Ikhtisar jelas dengan detail penting.",
    learn: "Penjelasan mendalam dengan contoh.",
    review: "Ringkasan cepat untuk mengulang."
  },
  ms: {
    scan: "Peta ringkas topik utama.",
    onboarding: "Gambaran jelas dengan butiran penting.",
    learn: "Penjelasan mendalam bersama contoh.",
    review: "Ulangan ringkas dan pantas."
  },
  hi: {
    scan: "\u092E\u0941\u0916\u094D\u092F \u0935\u093F\u0937\u092F\u094B\u0902 \u0915\u093E \u0924\u0947\u091C\u093C \u092E\u093E\u0928\u091A\u093F\u0924\u094D\u0930\u0964",
    onboarding: "\u091C\u093C\u0930\u0942\u0930\u0940 \u0935\u093F\u0935\u0930\u0923\u094B\u0902 \u0915\u0947 \u0938\u093E\u0925 \u0938\u094D\u092A\u0937\u094D\u091F \u0905\u0935\u0932\u094B\u0915\u0928\u0964",
    learn: "\u0909\u0926\u093E\u0939\u0930\u0923\u094B\u0902 \u0938\u0939\u093F\u0924 \u0917\u0939\u0930\u0940 \u0935\u094D\u092F\u093E\u0916\u094D\u092F\u093E\u0964",
    review: "\u0924\u094D\u0935\u0930\u093F\u0924 \u092A\u0941\u0928\u0930\u093E\u0935\u0943\u0924\u094D\u0924\u093F \u0915\u0947 \u0932\u093F\u090F \u0938\u0902\u0915\u094D\u0937\u093F\u092A\u094D\u0924\u0964"
  },
  ar: {
    scan: "\u062E\u0631\u064A\u0637\u0629 \u0633\u0631\u064A\u0639\u0629 \u0644\u0644\u0645\u0648\u0636\u0648\u0639\u0627\u062A \u0627\u0644\u0623\u0633\u0627\u0633\u064A\u0629.",
    onboarding: "\u0646\u0638\u0631\u0629 \u0639\u0627\u0645\u0629 \u0648\u0627\u0636\u062D\u0629 \u0645\u0639 \u0627\u0644\u062A\u0641\u0627\u0635\u064A\u0644 \u0627\u0644\u0636\u0631\u0648\u0631\u064A\u0629.",
    learn: "\u0634\u0631\u062D \u0639\u0645\u064A\u0642 \u0645\u0639 \u0623\u0645\u062B\u0644\u0629.",
    review: "\u0645\u0631\u0627\u062C\u0639\u0629 \u0645\u0648\u062C\u0632\u0629 \u0648\u0633\u0631\u064A\u0639\u0629."
  },
  de: {
    scan: "Schnelle Karte der Kernthemen.",
    onboarding: "Klarer \xDCberblick mit den wichtigsten Details.",
    learn: "Tiefe Erkl\xE4rung mit Beispielen.",
    review: "Knapp zum schnellen Wiederholen."
  },
  fr: {
    scan: "Carte rapide des sujets cl\xE9s.",
    onboarding: "Vue d'ensemble claire avec les d\xE9tails essentiels.",
    learn: "Explication approfondie avec exemples.",
    review: "R\xE9vision rapide et concise."
  },
  es: {
    scan: "Mapa r\xE1pido de los temas clave.",
    onboarding: "Resumen claro con detalles esenciales.",
    learn: "Explicaci\xF3n profunda con ejemplos.",
    review: "Repaso r\xE1pido y conciso."
  },
  it: {
    scan: "Mappa rapida dei temi chiave.",
    onboarding: "Panoramica chiara con dettagli essenziali.",
    learn: "Spiegazione approfondita con esempi.",
    review: "Ripasso rapido e conciso."
  },
  pt: {
    scan: "Mapa r\xE1pido dos t\xF3picos principais.",
    onboarding: "Vis\xE3o geral clara com detalhes essenciais.",
    learn: "Explica\xE7\xE3o profunda com exemplos.",
    review: "Revis\xE3o r\xE1pida e concisa."
  },
  nl: {
    scan: "Snelle kaart van kernthema's.",
    onboarding: "Helder overzicht met essenti\xEBle details.",
    learn: "Diepe uitleg met voorbeelden.",
    review: "Korte opfrisser voor snelle herhaling."
  },
  sv: {
    scan: "Snabb karta \xF6ver k\xE4rn\xE4mnen.",
    onboarding: "Tydlig \xF6versikt med viktiga detaljer.",
    learn: "Djup f\xF6rklaring med exempel.",
    review: "Kort repetition f\xF6r snabb \xF6versyn."
  },
  fi: {
    scan: "Nopea kartta keskeisist\xE4 aiheista.",
    onboarding: "Selke\xE4 yleiskuva t\xE4rkeill\xE4 yksityiskohdilla.",
    learn: "Syv\xE4 selitys esimerkkien kanssa.",
    review: "Tiivis kertaus nopeaan tarkistukseen."
  },
  pl: {
    scan: "Szybka mapa kluczowych temat\xF3w.",
    onboarding: "Jasny przegl\u0105d z najwa\u017Cniejszymi szczeg\xF3\u0142ami.",
    learn: "G\u0142\u0119bokie wyja\u015Bnienie z przyk\u0142adami.",
    review: "Kr\xF3tka powt\xF3rka do szybkiego przegl\u0105du."
  },
  tr: {
    scan: "Ana konular\u0131n h\u0131zl\u0131 haritas\u0131.",
    onboarding: "Temel ayr\u0131nt\u0131larla net bir genel bak\u0131\u015F.",
    learn: "\xD6rneklerle derin a\xE7\u0131klama.",
    review: "H\u0131zl\u0131 tekrar i\xE7in k\u0131sa \xF6zet."
  },
  ru: {
    scan: "\u0411\u044B\u0441\u0442\u0440\u0430\u044F \u043A\u0430\u0440\u0442\u0430 \u043A\u043B\u044E\u0447\u0435\u0432\u044B\u0445 \u0442\u0435\u043C.",
    onboarding: "\u042F\u0441\u043D\u044B\u0439 \u043E\u0431\u0437\u043E\u0440 \u0441 \u0432\u0430\u0436\u043D\u044B\u043C\u0438 \u0434\u0435\u0442\u0430\u043B\u044F\u043C\u0438.",
    learn: "\u041F\u043E\u0434\u0440\u043E\u0431\u043D\u043E\u0435 \u043E\u0431\u044A\u044F\u0441\u043D\u0435\u043D\u0438\u0435 \u0441 \u043F\u0440\u0438\u043C\u0435\u0440\u0430\u043C\u0438.",
    review: "\u041A\u0440\u0430\u0442\u043A\u043E\u0435 \u043F\u043E\u0432\u0442\u043E\u0440\u0435\u043D\u0438\u0435 \u0434\u043B\u044F \u0431\u044B\u0441\u0442\u0440\u043E\u0433\u043E \u043E\u0431\u0437\u043E\u0440\u0430."
  }
};
function getLanguageLabel(language) {
  var _a;
  return (_a = LANGUAGE_OPTIONS[language]) != null ? _a : language;
}
function getReviewQuestionHeading(language) {
  var _a;
  return (_a = REVIEW_QUESTION_HEADING_TEXT[language]) != null ? _a : REVIEW_QUESTION_HEADING_TEXT.en;
}
function getHeaderText(language) {
  var _a;
  return (_a = HEADER_TEXT[language]) != null ? _a : HEADER_TEXT.en;
}
function getUiText(language) {
  var _a, _b;
  const uiText = (_a = UI_TEXT[language]) != null ? _a : UI_TEXT.en;
  const cancelText = {
    en: "Cancel active knowledge generation",
    zh: "\u53D6\u6D88\u5F53\u524D\u77E5\u8BC6\u6982\u89C8\u751F\u6210",
    zh_tw: "\u53D6\u6D88\u76EE\u524D\u77E5\u8B58\u6982\u89BD\u751F\u6210"
  };
  return {
    ...uiText,
    cancelActiveGeneration: (_b = cancelText[language]) != null ? _b : cancelText.en
  };
}
function getSettingDescriptionText(language) {
  var _a, _b;
  const descriptions = (_a = SETTING_DESCRIPTION_TEXT[language]) != null ? _a : SETTING_DESCRIPTION_TEXT.en;
  const updatedDescriptions = {
    en: {
      knowledgeType: "Auto uses the course blueprint classification, or you can force a chapter structure.",
      minimumChapterCharacters: "Used by the local quality check. It never triggers another model request."
    },
    zh: {
      knowledgeType: "Auto \u4F7F\u7528\u8BFE\u7A0B\u84DD\u56FE\u4E2D\u7684\u5206\u7C7B\uFF0C\u4E5F\u53EF\u4EE5\u5F3A\u5236\u6307\u5B9A\u7AE0\u8282\u7ED3\u6784\u3002",
      minimumChapterCharacters: "\u4F9B\u672C\u5730\u8D28\u91CF\u68C0\u67E5\u4F7F\u7528\uFF0C\u4E0D\u4F1A\u89E6\u53D1\u989D\u5916\u6A21\u578B\u8BF7\u6C42\u3002"
    },
    zh_tw: {
      knowledgeType: "Auto \u4F7F\u7528\u8AB2\u7A0B\u85CD\u5716\u4E2D\u7684\u5206\u985E\uFF0C\u4E5F\u53EF\u4EE5\u5F37\u5236\u6307\u5B9A\u7AE0\u7BC0\u7D50\u69CB\u3002",
      minimumChapterCharacters: "\u4F9B\u672C\u5730\u54C1\u8CEA\u6AA2\u67E5\u4F7F\u7528\uFF0C\u4E0D\u6703\u89F8\u767C\u984D\u5916\u6A21\u578B\u8ACB\u6C42\u3002"
    }
  };
  const updated = (_b = updatedDescriptions[language]) != null ? _b : updatedDescriptions.en;
  return { ...descriptions, ...updated };
}
function getDefaultLabel(language) {
  var _a;
  return (_a = DEFAULT_LABEL_TEXT[language]) != null ? _a : DEFAULT_LABEL_TEXT.en;
}
function getKnowledgeDepthDescriptionText(language) {
  var _a;
  return (_a = KNOWLEDGE_DEPTH_DESCRIPTION_TEXT[language]) != null ? _a : KNOWLEDGE_DEPTH_DESCRIPTION_TEXT.en;
}

// src/modals.ts
var import_obsidian2 = require("obsidian");
var DEPTH_CHOICES = [
  {
    value: "scan",
    icon: "map"
  },
  {
    value: "onboarding",
    icon: "list-checks"
  },
  {
    value: "learn",
    icon: "graduation-cap"
  },
  {
    value: "review",
    icon: "refresh-cw"
  }
];
var InputModal = class extends import_obsidian2.Modal {
  constructor(app, plugin) {
    super(app);
    this.plugin = plugin;
  }
  onOpen() {
    var _a;
    const { contentEl } = this;
    this.modalEl.addClass("knowledge-generate-modal");
    contentEl.empty();
    contentEl.addClass("knowledge-input-modal");
    const depthDescriptions = getKnowledgeDepthDescriptionText(
      this.plugin.settings.language
    );
    contentEl.createEl("h2", {
      cls: "knowledge-modal-title",
      text: "Generate knowledge overview"
    });
    const subjectGroup = contentEl.createDiv({
      cls: "knowledge-field-group"
    });
    subjectGroup.createEl("label", {
      cls: "knowledge-field-label",
      text: "Subject"
    });
    const input = subjectGroup.createEl("input", {
      type: "text",
      placeholder: "Enter subject (e.g. Signal Processing)"
    });
    const depthGroup = contentEl.createDiv({
      cls: "knowledge-field-group"
    });
    const depthHeader = depthGroup.createDiv({
      cls: "knowledge-depth-header"
    });
    depthHeader.createSpan({
      cls: "knowledge-field-label",
      text: "Chapter depth"
    });
    depthHeader.createSpan({
      cls: "knowledge-field-hint",
      text: "Choose intent for this run"
    });
    let selectedDepth = (_a = this.plugin.settings.knowledgeDepth) != null ? _a : DEFAULT_SETTINGS.knowledgeDepth;
    const depthGrid = depthGroup.createDiv({
      cls: "knowledge-depth-grid"
    });
    const depthButtons = {};
    const updateDepthSelection = (nextDepth) => {
      selectedDepth = nextDepth;
      DEPTH_CHOICES.forEach(({ value }) => {
        const depthButton = depthButtons[value];
        if (!depthButton) {
          return;
        }
        const selected = value === selectedDepth;
        depthButton.toggleClass("is-selected", selected);
        depthButton.setAttr("aria-pressed", selected ? "true" : "false");
      });
    };
    DEPTH_CHOICES.forEach(({ value, icon }) => {
      const depthButton = depthGrid.createEl("button", {
        cls: "knowledge-depth-card",
        type: "button"
      });
      depthButton.setAttr("aria-pressed", "false");
      const iconEl = depthButton.createSpan({
        cls: "knowledge-depth-icon"
      });
      (0, import_obsidian2.setIcon)(iconEl, icon);
      depthButton.createSpan({
        cls: "knowledge-depth-title",
        text: KNOWLEDGE_DEPTH_LABELS[value]
      });
      depthButton.createSpan({
        cls: "knowledge-depth-description",
        text: depthDescriptions[value]
      });
      depthButton.onclick = () => updateDepthSelection(value);
      depthButtons[value] = depthButton;
    });
    updateDepthSelection(selectedDepth);
    const footer = contentEl.createDiv({
      cls: "knowledge-modal-footer"
    });
    const cancelButton = footer.createEl("button", {
      cls: "knowledge-secondary-button",
      text: "Cancel"
    });
    cancelButton.onclick = () => this.close();
    const button = footer.createEl("button", {
      cls: "knowledge-primary-button",
      text: "Generate"
    });
    button.onclick = async () => {
      const subject = input.value.trim();
      if (!subject) {
        new import_obsidian2.Notice("Please enter a subject name");
        return;
      }
      this.close();
      void this.plugin.generate(subject, selectedDepth);
    };
    input.focus();
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        button.click();
      }
    });
  }
};
var ResumeFailedModal = class extends import_obsidian2.Modal {
  constructor(app, plugin, initialCourseName) {
    super(app);
    this.plugin = plugin;
    this.initialCourseName = initialCourseName;
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("knowledge-input-modal");
    contentEl.createEl("p", {
      cls: "knowledge-modal-help",
      text: "Resume chapters listed in Failed_Chapters.md for a subject folder."
    });
    const input = contentEl.createEl("input", {
      type: "text",
      placeholder: "Subject folder (e.g. Signal Processing)",
      value: this.initialCourseName
    });
    const button = contentEl.createEl("button", {
      text: "Resume failed chapters"
    });
    button.onclick = async () => {
      const subject = input.value.trim();
      if (!subject) {
        new import_obsidian2.Notice("Please enter a subject folder name");
        return;
      }
      this.close();
      void this.plugin.resumeFailedChapters(subject);
    };
    input.focus();
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        button.click();
      }
    });
  }
};

// src/prompts.ts
function formatList(values, emptyLabel = "none") {
  return values.length > 0 ? values.map((value) => `- ${value}`).join("\n") : `- ${emptyLabel}`;
}
function buildOutlinePrompt(courseName, language, depth) {
  const targetLanguage = getLanguageLabel(language);
  const chapterRange = COURSE_CHAPTER_RANGES[depth];
  return `Design one coherent course blueprint for rapid knowledge acquisition,
review, and interview preparation.

Course: ${courseName}
Output language: ${targetLanguage}
Requested depth: ${depth}

Return strict JSON only. Do not use Markdown fences or add commentary.

Schema:
{
  "schemaVersion": 1,
  "courseName": "localized course name",
  "courseGoal": "one precise scope statement",
  "prerequisites": ["knowledge the course may assume"],
  "canonicalTerms": ["consistent term or symbol used across chapters"],
  "chapters": [
    {
      "chapterNumber": "1",
      "title": "specific, useful chapter title",
      "focus": "what this chapter teaches and why it is here",
      "subtopics": ["4-8 bounded subtopics"],
      "learningObjectives": ["3-6 observable outcomes"],
      "prerequisites": ["concepts this chapter may assume"],
      "outOfScope": ["material reserved for another chapter"],
      "knowledgeType": "conceptual | mathematical | procedural | empirical | craft | historical | interpretive | argumentative | case_based | hybrid",
      "secondaryKnowledgeTypes": ["at most two types from the same list except hybrid"],
      "canonicalTerms": ["chapter terms whose wording must remain consistent"]
    }
  ]
}

Blueprint rules:
- Prefer ${chapterRange.preferredMin}-${chapterRange.preferredMax} chapters for this depth.
- Never return fewer than ${chapterRange.minimum} usable chapters or more than ${MAX_COURSE_CHAPTERS} chapters.
- Preserve textbook-like subject coverage. Review and overview modes may compress exposition, but must not merge distinct foundational topics merely to reduce chapter count.
- For a genuinely broad subject, use additional well-bounded chapters up to the hard cap instead of creating a few oversized survey chapters.
- Sequence prerequisites before dependent material.
- Give every chapter a clear boundary; avoid duplicate coverage.
- Each chapter should support a focused chapter of roughly 10,000 effective characters, not a mini textbook.
- Use mathematical or empirical structures only when the subject needs them.
- For literature and textual study, use interpretive.
- For philosophy, ethics, theory debates, or normative questions, use argumentative.
- For institutions, policy, and comparative social-science cases, use case_based.
- Preserve important disagreements and evidence limits in humanities subjects.
- Use ${targetLanguage} for titles and prose. Canonical terms may include English in parentheses when useful.`;
}
function buildInstructionalSystemPrompt() {
  return [
    "You write focused learning chapters for rapid mastery and review.",
    "Treat the course blueprint as the scope boundary.",
    "Teach concepts before testing them.",
    "Use headings as meaningful navigation, not as a repeated form template.",
    "Prefer depth on a bounded set of ideas over encyclopedic coverage."
  ].join(" ");
}
function buildChapterPrompt(args) {
  const { context, language, depth, plan, adapter, density } = args;
  const { blueprint, chapter, previousChapter, nextChapter } = context;
  const targetLanguage = getLanguageLabel(language);
  const reviewQuestionHeading = getReviewQuestionHeading(language);
  return `Write one self-contained Markdown learning chapter.

# Course context

Course: ${blueprint.courseName}
Course goal: ${blueprint.courseGoal}
Course prerequisites:
${formatList(blueprint.prerequisites)}

Canonical course terms:
${formatList(blueprint.canonicalTerms)}

Previous chapter: ${previousChapter ? `${previousChapter.title} \u2014 ${previousChapter.focus}` : "none"}
Current chapter: ${chapter.title}
Current focus: ${chapter.focus}
Next chapter: ${nextChapter ? `${nextChapter.title} \u2014 ${nextChapter.focus}` : "none"}

This chapter must cover:
${formatList(chapter.subtopics)}

Learning objectives:
${formatList(chapter.learningObjectives)}

Allowed prerequisites:
${formatList(chapter.prerequisites)}

Explicitly out of scope:
${formatList(chapter.outOfScope)}

Canonical chapter terms:
${formatList(chapter.canonicalTerms)}

# Teaching contract

Output language: ${targetLanguage}
Knowledge type: ${plan.primaryKnowledgeType}
Secondary types: ${plan.secondaryKnowledgeTypes.join(", ") || "none"}
Depth: ${density.label} (${depth})

- Target ${density.targetChars.min}-${density.targetChars.max} effective characters; aim near ${density.targetChars.ideal}.
- Effective characters means non-whitespace learning content, not words, Markdown bytes, or hidden metadata. Reach the range by deepening explanations, evidence, and worked reasoning rather than adding filler.
- Treat ${density.targetChars.max} as an upper bound. Narrow examples before exceeding it.
- Usually develop ${density.coreUnits.min}-${density.coreUnits.max} core learning units. Treat this as planning guidance, not a quota: use one fewer or one more when the chapter's natural conceptual structure clearly requires it, without padding or fragmenting coherent ideas.
- Include at least ${density.concreteExamples} concrete examples and ${density.workedExamples} worked examples when the topic permits.
- Explain approximately ${density.failureModes} important misconceptions, failure modes, objections, or evidence limits.
- End with ${density.retrievalQuestions} review or interview questions.
- Use the available chapter budget. Do not begin the final questions until every named subtopic and learning objective has received enough explanation, evidence, or worked reasoning to stand on its own.
- If space is tight, remove repeated introductions, conclusions, and decorative examples before shortening the teaching body.
- Do not introduce a large glossary or try to mention every related concept.
- Do not repeat material assigned to the previous or next chapter.

Pedagogical roles to cover naturally when relevant:
${formatList(adapter.requiredSections)}

Useful fields for the chapter's core learning units; integrate them into prose rather than turning every field into a heading:
${formatList(adapter.unitFields)}

Domain-specific requirements:
${formatList(adapter.exampleRequirements)}

Reliability rules for this chapter's actual knowledge type:
${formatList(adapter.reliabilityRules)}

# Heading rules

- Use 4-8 topic-specific teaching H2 headings that explain what the section teaches, then one final QA H2; the chapter must have 5-9 H2 headings in total.
- H2 teaching headings should form a clear learning progression.
- Do not add section-number prefixes to headings; the application adds chapter-aware numbering after generation.
- Prefer connected explanatory paragraphs. Do not turn each example, misconception, field, or workflow step into its own heading.
- Use H3 only when a teaching section genuinely contains a substantial subordinate idea. Use at most one H3 under any teaching H2 and at most six H3 headings in the whole chapter; many H2 sections need no H3 at all.
- Never use H4 or deeper headings. Keep worked-example steps, definitions, cases, and short contrasts inside their teaching section as paragraphs, bold lead-ins, or a compact list instead of promoting them to headings.
- Use bullet or numbered lists only for real sequences, comparisons, compact checklists, or parallel items. For non-procedural chapters, keep most exposition in paragraphs and normally stay below 40 bullet lines.
- Never repeat generic headings such as Definition, Why It Exists, Example, or Common Mistakes for every unit.
- Do not use a fixed adapter field as a literal heading unless it is the clearest title for this specific chapter.
- Do not force bilingual parentheses into every heading. Give a bilingual term only at its first useful appearance in the prose.

# Context and QA consistency

- Define every non-prerequisite concept before relying on it.
- Keep terminology and mathematical symbols consistent with the blueprint.
- Treat explicitly out-of-scope items as prohibited, including optional asides and advanced exceptions.
- Every review question must be answerable from the chapter body without outside knowledge.
- A question may combine at most two claims explicitly taught in the body.
- Do not introduce a new concept, formula, historical fact, text, author, procedure, or case for the first time in a question.
- End the teaching body with this exact localized H2 line:
  ## ${reviewQuestionHeading} <!-- qa-section -->
- Put only the requested numbered questions under that final H2. Do not add a summary, answer key, or another heading after it.
- After every question, on the same line, add an invisible source anchor using the exact H2 title that teaches the answer:
  <!-- source: Exact H2 Title -->
- The source comment is metadata; do not explain it to the reader.

# Rich Markdown and formula format

- Use tables, callouts, compact lists, or other standard Markdown structures when they make a comparison or explanation clearer than prose alone.
- When a relationship, process, hierarchy, or state transition genuinely benefits from a visual and you can write valid Mermaid syntax, you may include one concise fenced diagram whose info string is \`mermaid\`. Mermaid is optional: do not use it as decoration or when a table, formula, or short explanation is clearer. Explain the diagram's important meaning in the surrounding prose.
- Use Obsidian-compatible KaTeX for every mathematical or chemical formula that needs typesetting.
- Inline formulas must use one dollar sign on each side, for example: \`$E = mc^2$\`.
- Display formulas must use double dollar signs on separate lines before and after the formula.
- Never use \`\\(...\\)\` or \`\\[...\\]\` as math delimiters. Never place formulas in a fenced \`latex\` or \`math\` code block.
- Define important symbols, units, and assumptions after each major formula.

# Final self-check

- Before answering, remove any claim whose factual precision you cannot support; state uncertainty when the uncertainty matters.
- Verify that the body contains no H1 or H4/deeper headings, has 4-8 teaching H2 sections plus the one marked QA H2, uses no more than one H3 per teaching H2 and no more than six H3 headings in total, and stays within the requested scope.
- Verify that every final question appears after the <!-- qa-section --> H2 boundary, is taught before that boundary, and cites one exact existing teaching H2 on the same line.
- Verify that every typeset formula uses only \`$...$\` or standalone \`$$\` delimiters and that every Mermaid block has valid syntax.

Start directly with the chapter content. Do not greet the reader, describe the writing process, or add a second H1 title.`;
}

// src/settings-tab.ts
var import_obsidian3 = require("obsidian");
var KNOWLEDGE_TYPE_OPTIONS = {
  auto: "Auto",
  conceptual: "Conceptual",
  mathematical: "Mathematical",
  procedural: "Procedural",
  empirical: "Empirical / research",
  craft: "Craft / technique",
  historical: "Historical / cultural",
  interpretive: "Interpretive / textual",
  argumentative: "Argumentative / normative",
  case_based: "Case based / social science",
  hybrid: "Hybrid"
};
function parseOptionalNumber(value) {
  if (value.trim() === "") {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
var SettingTab = class extends import_obsidian3.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
    this.containerEl.addClass("knowledge-settings");
  }
  /**
   * Describe settings for Obsidian 1.13 search while retaining the legacy
   * display path for Obsidian 1.12.7. Both paths share these render callbacks.
   */
  getSettingDefinitions() {
    const settingDescriptions = getSettingDescriptionText(
      this.plugin.settings.language
    );
    const defaultLabel = getDefaultLabel(this.plugin.settings.language);
    return [
      {
        name: "API key",
        desc: settingDescriptions.apiKey,
        render: (setting) => {
          setting.addText(
            (text) => text.setPlaceholder("API key").setValue(this.plugin.settings.apiKey).onChange(async (value) => {
              this.plugin.settings.apiKey = value;
              await this.plugin.saveSettings();
            })
          );
        }
      },
      {
        name: "API base URL",
        desc: `${settingDescriptions.apiBaseUrl} ${defaultLabel}: ${DEFAULT_SETTINGS.apiBaseUrl}`,
        render: (setting) => {
          setting.addText(
            (text) => text.setValue(this.plugin.settings.apiBaseUrl).onChange(async (value) => {
              this.plugin.settings.apiBaseUrl = value;
              await this.plugin.saveSettings();
            })
          );
        }
      },
      {
        name: "Outline model",
        desc: settingDescriptions.outlineModel,
        render: (setting) => {
          setting.addText(
            (text) => text.setValue(this.plugin.settings.modelOutline).onChange(async (value) => {
              this.plugin.settings.modelOutline = value;
              await this.plugin.saveSettings();
            })
          );
        }
      },
      {
        name: "Chapter model",
        desc: settingDescriptions.chapterModel,
        render: (setting) => {
          setting.addText(
            (text) => text.setValue(this.plugin.settings.modelChapter).onChange(async (value) => {
              this.plugin.settings.modelChapter = value;
              await this.plugin.saveSettings();
            })
          );
        }
      },
      {
        name: "Knowledge type",
        desc: settingDescriptions.knowledgeType,
        render: (setting) => {
          setting.addDropdown((dropdown) => {
            Object.entries(KNOWLEDGE_TYPE_OPTIONS).forEach(([value, label]) => {
              dropdown.addOption(value, label);
            });
            return dropdown.setValue(this.plugin.settings.knowledgeTypeOverride).onChange(async (value) => {
              this.plugin.settings.knowledgeTypeOverride = value;
              this.plugin.settings.autoDetectKnowledgeType = value === "auto";
              await this.plugin.saveSettings();
            });
          });
        }
      },
      {
        name: "Minimum chapter characters",
        desc: settingDescriptions.minimumChapterCharacters,
        render: (setting) => {
          setting.addText((text) => {
            text.inputEl.type = "number";
            text.inputEl.min = "1";
            text.inputEl.step = "100";
            return text.setPlaceholder(String(DEFAULT_SETTINGS.minChapterChars)).setValue(String(this.plugin.settings.minChapterChars)).onChange(async (value) => {
              var _a;
              this.plugin.settings.minChapterChars = (_a = parseOptionalPositiveInteger(value)) != null ? _a : DEFAULT_SETTINGS.minChapterChars;
              await this.plugin.saveSettings();
            });
          });
        }
      },
      {
        name: "Max completion tokens",
        desc: settingDescriptions.maxCompletionTokens,
        render: (setting) => {
          setting.addText((text) => {
            text.inputEl.type = "number";
            text.inputEl.min = "1";
            text.inputEl.step = "1";
            return text.setPlaceholder("None").setValue(
              this.plugin.settings.maxCompletionTokens === null ? "" : String(this.plugin.settings.maxCompletionTokens)
            ).onChange(async (value) => {
              this.plugin.settings.maxCompletionTokens = parseOptionalPositiveInteger(value);
              await this.plugin.saveSettings();
            });
          });
        }
      },
      {
        name: "Temperature",
        desc: settingDescriptions.temperature,
        render: (setting) => {
          setting.addText((text) => {
            text.inputEl.type = "number";
            text.inputEl.step = "0.1";
            return text.setPlaceholder("Omit").setValue(
              this.plugin.settings.temperature === null ? "" : String(this.plugin.settings.temperature)
            ).onChange(async (value) => {
              this.plugin.settings.temperature = parseOptionalNumber(value);
              await this.plugin.saveSettings();
            });
          });
        }
      },
      {
        name: "Reasoning effort",
        desc: settingDescriptions.reasoningEffort,
        render: (setting) => {
          setting.addDropdown((dropdown) => {
            var _a;
            dropdown.addOption("", "Unset");
            ["none", "minimal", "low", "medium", "high", "xhigh", "max"].forEach(
              (value) => {
                dropdown.addOption(value, value);
              }
            );
            return dropdown.setValue((_a = this.plugin.settings.reasoningEffort) != null ? _a : "").onChange(async (value) => {
              this.plugin.settings.reasoningEffort = value === "" ? null : value;
              await this.plugin.saveSettings();
            });
          });
        }
      },
      {
        name: "Verbosity",
        desc: settingDescriptions.verbosity,
        render: (setting) => {
          setting.addDropdown((dropdown) => {
            var _a;
            dropdown.addOption("", "Unset");
            ["low", "medium", "high"].forEach((value) => {
              dropdown.addOption(value, value);
            });
            return dropdown.setValue((_a = this.plugin.settings.verbosity) != null ? _a : "").onChange(async (value) => {
              this.plugin.settings.verbosity = value === "" ? null : value;
              await this.plugin.saveSettings();
            });
          });
        }
      },
      {
        name: "Thinking mode",
        desc: "Auto omits the provider-specific toggle. Use enabled or disabled only when your provider documents support.",
        render: (setting) => {
          setting.addDropdown((dropdown) => {
            dropdown.addOption("auto", "Auto");
            dropdown.addOption("enabled", "Enabled");
            dropdown.addOption("disabled", "Disabled");
            return dropdown.setValue(this.plugin.settings.thinkingMode).onChange(async (value) => {
              this.plugin.settings.thinkingMode = value;
              await this.plugin.saveSettings();
            });
          });
        }
      },
      {
        name: "Chapter concurrency",
        desc: settingDescriptions.chapterConcurrency,
        render: (setting) => {
          setting.addText((text) => {
            text.inputEl.type = "number";
            text.inputEl.min = String(MIN_CONCURRENCY);
            text.inputEl.max = String(MAX_CHAPTER_CONCURRENCY);
            text.inputEl.step = "1";
            return text.setPlaceholder(String(DEFAULT_SETTINGS.chapterConcurrency)).setValue(String(this.plugin.settings.chapterConcurrency)).onChange(async (value) => {
              this.plugin.settings.chapterConcurrency = clampInteger(
                Number(value),
                MIN_CONCURRENCY,
                MAX_CHAPTER_CONCURRENCY
              );
              await this.plugin.saveSettings();
            });
          });
        }
      },
      {
        name: "Language",
        desc: settingDescriptions.language,
        render: (setting) => {
          setting.addDropdown((dropdown) => {
            Object.entries(LANGUAGE_OPTIONS).forEach(([value, label]) => {
              dropdown.addOption(value, label);
            });
            return dropdown.setValue(this.plugin.settings.language).onChange(async (value) => {
              this.plugin.settings.language = value;
              await this.plugin.saveSettings();
              this.plugin.refreshLocalizedUi();
            });
          });
        }
      }
    ];
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    for (const definition of this.getSettingDefinitions()) {
      const setting = new import_obsidian3.Setting(containerEl).setName(definition.name).setDesc(definition.desc);
      definition.render(setting);
    }
  }
};

// src/plugin.ts
var KnowledgePlugin = class extends import_obsidian4.Plugin {
  constructor() {
    super(...arguments);
    this.commandsRegistered = false;
  }
  async onload() {
    await this.loadSettings();
    this.setupProgressStatus();
    const uiText = getUiText(this.settings.language);
    this.registerLocalizedCommands(uiText);
    this.generateRibbonIcon = this.addRibbonIcon(
      "book-open",
      uiText.generateKnowledge,
      () => {
        new InputModal(this.app, this).open();
      }
    );
    this.generateRibbonIcon.addClass("knowledge-ribbon-icon");
    this.resumeRibbonIcon = this.addRibbonIcon(
      "refresh-cw",
      uiText.resumeFailedChapters,
      () => {
        new ResumeFailedModal(this.app, this, this.getActiveCourseName()).open();
      }
    );
    this.resumeRibbonIcon.addClass("knowledge-ribbon-icon");
    this.addSettingTab(new SettingTab(this.app, this));
  }
  onunload() {
    var _a, _b;
    (_a = this.activeRun) == null ? void 0 : _a.cancellation.cancel();
    if (this.progressHideTimer !== void 0) {
      window.clearTimeout(this.progressHideTimer);
    }
    (_b = this.progressNotice) == null ? void 0 : _b.hide();
  }
  async loadSettings() {
    var _a;
    const loadedSettings = await this.loadData();
    this.settings = Object.assign({}, DEFAULT_SETTINGS, loadedSettings != null ? loadedSettings : {});
    this.settings.chapterConcurrency = clampInteger(
      this.settings.chapterConcurrency,
      MIN_CONCURRENCY,
      MAX_CHAPTER_CONCURRENCY
    );
    this.settings.maxCompletionTokens = parseOptionalPositiveInteger(
      this.settings.maxCompletionTokens
    );
    this.settings.minChapterChars = (_a = parseOptionalPositiveInteger(this.settings.minChapterChars)) != null ? _a : DEFAULT_SETTINGS.minChapterChars;
    if (this.settings.thinkingMode !== "auto" && this.settings.thinkingMode !== "enabled" && this.settings.thinkingMode !== "disabled") {
      this.settings.thinkingMode = DEFAULT_SETTINGS.thinkingMode;
    }
  }
  async saveSettings() {
    await this.saveData(this.settings);
  }
  refreshLocalizedUi() {
    const uiText = getUiText(this.settings.language);
    this.registerLocalizedCommands(uiText);
    this.updateRibbonLabel(this.generateRibbonIcon, uiText.generateKnowledge);
    this.updateRibbonLabel(this.resumeRibbonIcon, uiText.resumeFailedChapters);
  }
  registerLocalizedCommands(uiText) {
    if (this.commandsRegistered) {
      this.removeCommand("generate-knowledge");
      this.removeCommand("resume-failed-chapters");
      this.removeCommand("cancel-knowledge-generation");
    }
    this.addCommand({
      id: "generate-knowledge",
      name: uiText.generateKnowledge,
      icon: "book-open",
      callback: () => {
        new InputModal(this.app, this).open();
      }
    });
    this.addCommand({
      id: "resume-failed-chapters",
      name: uiText.resumeFailedChapters,
      icon: "refresh-cw",
      callback: () => {
        new ResumeFailedModal(this.app, this, this.getActiveCourseName()).open();
      }
    });
    this.addCommand({
      id: "cancel-knowledge-generation",
      name: uiText.cancelActiveGeneration,
      icon: "circle-stop",
      callback: () => this.cancelActiveGeneration()
    });
    this.commandsRegistered = true;
  }
  updateRibbonLabel(ribbonIcon, label) {
    if (!ribbonIcon) return;
    (0, import_obsidian4.setTooltip)(ribbonIcon, label, { placement: "right" });
    ribbonIcon.setAttr("aria-label", label);
    ribbonIcon.setAttr("title", label);
  }
  getActiveCourseName() {
    var _a, _b, _c;
    return (_c = (_b = (_a = this.app.workspace.getActiveFile()) == null ? void 0 : _a.parent) == null ? void 0 : _b.path) != null ? _c : "";
  }
  setupProgressStatus() {
    this.progressStatusEl = this.addStatusBarItem();
    this.progressStatusEl.addClass("knowledge-progress-status");
    if (import_obsidian4.Platform.isMobile) {
      this.progressStatusEl.addClass("knowledge-progress-mobile");
    }
    this.progressStatusEl.empty();
    this.progressLabelEl = this.progressStatusEl.createSpan({
      cls: "knowledge-progress-label"
    });
    const track = this.progressStatusEl.createDiv({
      cls: "knowledge-progress-track"
    });
    this.progressFillEl = track.createDiv({
      cls: "knowledge-progress-fill"
    });
    this.hideProgress();
  }
  showProgress(label, percent, runId) {
    if (runId && this.progressRunId !== runId) return;
    const safePercent = clampInteger(percent, 0, 100);
    const message = `${label} (${safePercent}%)`;
    const activeRun = this.activeRun;
    if (activeRun && activeRun.id === runId) {
      activeRun.currentPercent = safePercent;
    }
    if (this.progressStatusEl && this.progressLabelEl && this.progressFillEl) {
      this.progressStatusEl.removeClass("knowledge-progress-hidden");
      this.progressLabelEl.setText(label);
      this.progressFillEl.setCssProps({
        "--knowledge-progress-width": `${safePercent}%`
      });
    }
    if (!this.progressNotice) {
      this.progressNotice = new import_obsidian4.Notice(message, 0);
      this.progressNotice.containerEl.addClass("knowledge-progress-notice");
    } else {
      this.progressNotice.setMessage(message);
    }
  }
  hideProgress(runId) {
    var _a, _b, _c;
    if (runId && this.progressRunId !== runId) return;
    (_a = this.progressStatusEl) == null ? void 0 : _a.addClass("knowledge-progress-hidden");
    (_b = this.progressFillEl) == null ? void 0 : _b.setCssProps({
      "--knowledge-progress-width": "0%"
    });
    (_c = this.progressNotice) == null ? void 0 : _c.hide();
    this.progressNotice = void 0;
  }
  finishProgress(label, runId) {
    this.showProgress(label, 100, runId);
    if (this.progressHideTimer !== void 0) {
      window.clearTimeout(this.progressHideTimer);
    }
    this.progressHideTimer = window.setTimeout(
      () => this.hideProgress(runId),
      5e3
    );
  }
  cancelActiveGeneration() {
    if (!this.activeRun) {
      new import_obsidian4.Notice("No active knowledge generation to cancel");
      return;
    }
    this.activeRun.cancellation.cancel();
    this.showProgress(
      "Cancelling after active requests finish",
      this.activeRun.currentPercent,
      this.activeRun.id
    );
    new import_obsidian4.Notice("Cancellation requested; queued requests will not start");
  }
  startRun(kind, maxLogicalRequests) {
    if (this.activeRun) {
      new import_obsidian4.Notice(
        "Another knowledge generation is already active. Cancel it before starting a new one.",
        7e3
      );
      return null;
    }
    const config = Object.freeze({ ...this.settings });
    const run = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      kind,
      config,
      cancellation: new GenerationCancellation(),
      requestBudget: new LogicalRequestBudget(maxLogicalRequests),
      requestSemaphore: new Semaphore(config.chapterConcurrency),
      telemetry: {
        logicalRequests: 0,
        physicalRequests: 0,
        retries: 0,
        compatibilityFallbacks: 0,
        promptChars: 0,
        outputChars: 0,
        promptTokens: 0,
        completionTokens: 0
      },
      currentPercent: 0
    };
    if (this.progressHideTimer !== void 0) {
      window.clearTimeout(this.progressHideTimer);
      this.progressHideTimer = void 0;
    }
    this.activeRun = run;
    this.progressRunId = run.id;
    return run;
  }
  endRun(run) {
    var _a;
    new import_obsidian4.Notice(
      `Requests: ${run.telemetry.logicalRequests} logical, ${run.telemetry.physicalRequests} HTTP, ${run.telemetry.retries} retries`,
      6e3
    );
    if (((_a = this.activeRun) == null ? void 0 : _a.id) === run.id) {
      this.activeRun = void 0;
    }
  }
  handleRequestEvent(run, event) {
    var _a, _b, _c, _d, _e;
    if (event.kind === "request") {
      run.telemetry.physicalRequests += 1;
      run.telemetry.promptChars += (_a = event.promptChars) != null ? _a : 0;
    } else if (event.kind === "success") {
      run.telemetry.outputChars += (_b = event.outputChars) != null ? _b : 0;
      run.telemetry.promptTokens += (_c = event.promptTokens) != null ? _c : 0;
      run.telemetry.completionTokens += (_d = event.completionTokens) != null ? _d : 0;
    } else if (event.kind === "retry") {
      run.telemetry.retries += 1;
      this.showProgress(
        `Provider retry queued in ${(_e = event.delayMs) != null ? _e : 0} ms`,
        run.currentPercent,
        run.id
      );
    } else if (event.kind === "compatibility") {
      run.telemetry.compatibilityFallbacks += 1;
    }
  }
  async callLLM(prompt, model, run, systemPrompt, maxCompletionTokens = run.config.maxCompletionTokens) {
    run.cancellation.throwIfCancelled();
    run.requestBudget.consume();
    run.telemetry.logicalRequests += 1;
    let provenance = { model };
    const content = await callChatCompletion(
      {
        apiKey: run.config.apiKey,
        apiBaseUrl: run.config.apiBaseUrl,
        model,
        userPrompt: prompt,
        systemPrompt,
        maxCompletionTokens,
        temperature: run.config.temperature,
        reasoningEffort: run.config.reasoningEffort,
        verbosity: run.config.verbosity,
        thinkingMode: run.config.thinkingMode
      },
      {
        shouldCancel: () => run.cancellation.isCancelled,
        scheduleRequest: (request) => run.requestSemaphore.run(async () => {
          run.cancellation.throwIfCancelled();
          const stalledTimer = window.setTimeout(() => {
            this.showProgress(
              "Provider request is still running",
              run.currentPercent,
              run.id
            );
          }, 6e4);
          try {
            return await request();
          } finally {
            window.clearTimeout(stalledTimer);
          }
        }),
        onEvent: (event) => {
          var _a;
          this.handleRequestEvent(run, event);
          if (event.kind === "success") {
            provenance = {
              model: (_a = event.model) != null ? _a : model,
              promptTokens: event.promptTokens,
              completionTokens: event.completionTokens,
              totalTokens: event.totalTokens,
              reasoningTokens: event.reasoningTokens
            };
          }
        }
      }
    );
    return { content, ...provenance };
  }
  async fetchCourseBlueprint(courseName, depth, run) {
    const prompt = buildOutlinePrompt(courseName, run.config.language, depth);
    const outlineMaxTokens = resolveBlueprintMaxCompletionTokens(
      run.config.maxCompletionTokens
    );
    const response = await this.callLLM(
      prompt,
      run.config.modelOutline,
      run,
      "You design coherent course blueprints. Return strict JSON only.",
      outlineMaxTokens
    );
    return parseCourseBlueprint(response.content, courseName, depth, {
      enforceMinimumChapters: true
    });
  }
  async fetchChapterNote(context, depth, run) {
    const density = applyMinimumChapterChars(
      DENSITY_PRESETS[depth],
      run.config.minChapterChars
    );
    const override = run.config.knowledgeTypeOverride;
    const plan = !run.config.autoDetectKnowledgeType || override !== "auto" ? buildManualPlan(
      override === "auto" ? "conceptual" : override,
      depth
    ) : buildBlueprintPlan(
      context.chapter.knowledgeType,
      context.chapter.secondaryKnowledgeTypes,
      depth
    );
    const adapter = selectAdapter(plan);
    const prompt = buildChapterPrompt({
      context,
      language: run.config.language,
      depth,
      plan,
      adapter,
      density
    });
    const completion = await this.callLLM(
      prompt,
      run.config.modelChapter,
      run,
      buildInstructionalSystemPrompt()
    );
    const normalizedContent = normalizeObsidianMathDelimiters(
      completion.content
    );
    const numberedContent = numberChapterHeadings(
      normalizedContent,
      context.chapter.chapterNumber
    );
    const qualityReport = evaluateChapterQuality(numberedContent, density);
    return {
      content: numberedContent,
      qualityWarnings: getChapterQualityWarnings(qualityReport),
      provenance: {
        model: completion.model,
        promptTokens: completion.promptTokens,
        completionTokens: completion.completionTokens,
        totalTokens: completion.totalTokens,
        reasoningTokens: completion.reasoningTokens
      }
    };
  }
  buildChapterContext(blueprint, chapter) {
    const index = blueprint.chapters.findIndex(
      (candidate) => candidate.chapterNumber === chapter.chapterNumber || candidate.title === chapter.title
    );
    return {
      blueprint,
      chapter,
      previousChapter: index > 0 ? blueprint.chapters[index - 1] : void 0,
      nextChapter: index >= 0 && index < blueprint.chapters.length - 1 ? blueprint.chapters[index + 1] : void 0
    };
  }
  async generateChapterContent(courseFolder, context, run, depth, onComplete) {
    const { chapter } = context;
    let result;
    try {
      const generated = await this.fetchChapterNote(context, depth, run);
      const numStr = String(Number.parseInt(chapter.chapterNumber, 10)).padStart(
        2,
        "0"
      );
      const fileName = `${numStr}_${slugifyTitle(chapter.title)}.md`;
      const headerText = getHeaderText(run.config.language);
      const header = `# ${chapter.title}

*${headerText.chapterNumber}: ${chapter.chapterNumber}*

*${headerText.generated}*

---

`;
      const filePath = (0, import_obsidian4.normalizePath)(`${courseFolder.path}/${fileName}`);
      const existing = this.app.vault.getAbstractFileByPath(filePath);
      const fullContent = [
        `${header}${trimTrailingWhitespace(generated.content)}`,
        renderGenerationProvenance(generated.provenance),
        ""
      ].join("\n\n");
      if (existing instanceof import_obsidian4.TFile) {
        await this.app.vault.modify(existing, fullContent);
      } else if (existing) {
        throw new Error(`Path "${filePath}" exists and is not a file`);
      } else {
        await this.app.vault.create(filePath, fullContent);
      }
      if (generated.qualityWarnings.length > 0) {
        new import_obsidian4.Notice(
          `\u26A0 ${fileName}: ${generated.qualityWarnings.join("; ")}`,
          8e3
        );
      } else {
        new import_obsidian4.Notice(`\u2713 ${fileName}`);
      }
      result = {
        chapterNum: chapter.chapterNumber,
        title: chapter.title,
        fileName,
        success: true,
        qualityWarnings: generated.qualityWarnings
      };
    } catch (error) {
      const errorMsg = errorToMessage(error);
      if (!(error instanceof GenerationCancelledError)) {
        new import_obsidian4.Notice(
          `\u2717 Error generating chapter ${chapter.chapterNumber}: ${errorMsg}`,
          5e3
        );
        console.error(
          `Error generating chapter ${chapter.chapterNumber} (${chapter.title}):`,
          error
        );
      }
      result = {
        chapterNum: chapter.chapterNumber,
        title: chapter.title,
        success: false,
        error: errorMsg
      };
    } finally {
      onComplete == null ? void 0 : onComplete(result);
    }
    return result;
  }
  async writeFailureReport(courseFolder, courseName, depth, failedChapters) {
    if (failedChapters.length === 0) return;
    const content = [
      "---",
      `knowledgeDepth: ${depth}`,
      "---",
      "",
      `# ${courseName} Failed Chapters`,
      "",
      `Generated at: ${(/* @__PURE__ */ new Date()).toLocaleString()}`,
      "",
      "Only the chapters below need to be resumed.",
      "",
      ...failedChapters.reduce((lines, chapter) => {
        var _a;
        lines.push(`- ${chapter.chapterNum}. ${chapter.title}`);
        lines.push(`  - Error: ${(_a = chapter.error) != null ? _a : "Unknown error"}`);
        return lines;
      }, []),
      ""
    ].join("\n");
    const reportPath = (0, import_obsidian4.normalizePath)(`${courseFolder.path}/Failed_Chapters.md`);
    const existing = this.app.vault.getAbstractFileByPath(reportPath);
    if (existing instanceof import_obsidian4.TFile) {
      await this.app.vault.modify(existing, content);
    } else {
      await this.app.vault.create(reportPath, content);
    }
  }
  async clearFailureReport(courseFolder, courseName) {
    const reportPath = (0, import_obsidian4.normalizePath)(`${courseFolder.path}/Failed_Chapters.md`);
    const existing = this.app.vault.getAbstractFileByPath(reportPath);
    if (!(existing instanceof import_obsidian4.TFile)) return;
    await this.app.vault.modify(
      existing,
      [
        `# ${courseName} Failed Chapters`,
        "",
        `Resolved at: ${(/* @__PURE__ */ new Date()).toLocaleString()}`,
        "",
        "All previously failed chapters were generated successfully.",
        ""
      ].join("\n")
    );
  }
  async readSavedBlueprint(courseFolder) {
    const outlinePath = (0, import_obsidian4.normalizePath)(`${courseFolder.path}/Outlines.md`);
    const outlineFile = this.app.vault.getAbstractFileByPath(outlinePath);
    if (!(outlineFile instanceof import_obsidian4.TFile)) return null;
    return parseBlueprintComment(await this.app.vault.read(outlineFile));
  }
  async resumeFailedChapters(courseName) {
    var _a;
    if (!this.settings.apiKey) {
      new import_obsidian4.Notice("\u274C API key not set! Please configure it in settings.");
      return;
    }
    if (this.activeRun) {
      new import_obsidian4.Notice("Another knowledge generation is already active", 7e3);
      return;
    }
    const folderPath = (0, import_obsidian4.normalizePath)(courseName.trim());
    const courseFolder = this.app.vault.getAbstractFileByPath(folderPath);
    if (!(courseFolder instanceof import_obsidian4.TFolder)) {
      new import_obsidian4.Notice(`\u274C Folder not found: ${folderPath}`, 7e3);
      return;
    }
    const reportPath = (0, import_obsidian4.normalizePath)(`${courseFolder.path}/Failed_Chapters.md`);
    const reportFile = this.app.vault.getAbstractFileByPath(reportPath);
    if (!(reportFile instanceof import_obsidian4.TFile)) {
      new import_obsidian4.Notice(`No Failed_Chapters.md found in ${courseFolder.path}`, 7e3);
      return;
    }
    const report = await this.app.vault.read(reportFile);
    const failedChapterEntries = parseFailedChapters(report).slice(
      0,
      MAX_BLUEPRINT_CHAPTERS
    );
    const depth = (_a = parseFailedChapterDepth(report)) != null ? _a : DEFAULT_SETTINGS.knowledgeDepth;
    if (failedChapterEntries.length === 0) {
      new import_obsidian4.Notice("No failed chapters found to resume");
      return;
    }
    const savedBlueprint = await this.readSavedBlueprint(courseFolder);
    const blueprint = savedBlueprint != null ? savedBlueprint : {
      schemaVersion: 1,
      courseName: courseFolder.name,
      courseGoal: `Build a practical overview of ${courseFolder.name}.`,
      prerequisites: [],
      canonicalTerms: [],
      chapters: failedChapterEntries.map(
        ([chapterNumber, title]) => buildFallbackChapterSpec(
          courseFolder.name,
          chapterNumber,
          title,
          depth
        )
      )
    };
    const chapters = failedChapterEntries.map(([chapterNumber, title]) => {
      var _a2;
      return (_a2 = blueprint.chapters.find(
        (chapter) => chapter.chapterNumber === chapterNumber || chapter.title === title
      )) != null ? _a2 : buildFallbackChapterSpec(
        blueprint.courseName,
        chapterNumber,
        title,
        depth
      );
    });
    const run = this.startRun("resume", chapters.length);
    if (!run) return;
    new import_obsidian4.Notice(`\u{1F501} Resuming ${chapters.length} failed chapters`);
    this.showProgress(`Resuming failed chapters: 0/${chapters.length}`, 5, run.id);
    try {
      let completed = 0;
      let failed = 0;
      const results = await Promise.all(
        chapters.map(
          (chapter) => this.generateChapterContent(
            courseFolder,
            this.buildChapterContext(blueprint, chapter),
            run,
            depth,
            (result) => {
              completed += 1;
              if (!result.success) failed += 1;
              this.showProgress(
                `Resumed ${completed}/${chapters.length}, ${failed} failed`,
                5 + Math.round(completed / chapters.length * 90),
                run.id
              );
            }
          )
        )
      );
      const failedResults = results.filter((result) => !result.success);
      if (failedResults.length > 0) {
        await this.writeFailureReport(
          courseFolder,
          blueprint.courseName,
          depth,
          failedResults
        );
      } else {
        await this.clearFailureReport(courseFolder, blueprint.courseName);
      }
      const successCount = results.length - failedResults.length;
      if (run.cancellation.isCancelled) {
        this.finishProgress(
          `Cancelled: ${successCount}/${chapters.length} chapters saved`,
          run.id
        );
      } else if (failedResults.length > 0) {
        this.finishProgress(
          `Resume finished: ${successCount}/${chapters.length} generated`,
          run.id
        );
      } else {
        this.finishProgress(
          `Resume complete: ${chapters.length} chapters generated`,
          run.id
        );
      }
    } catch (error) {
      const message = errorToMessage(error);
      this.finishProgress(`Resume failed: ${message}`, run.id);
      if (!(error instanceof GenerationCancelledError)) {
        console.error("Resume generation error:", error);
      }
    } finally {
      this.endRun(run);
    }
  }
  async generate(courseName, depth = DEFAULT_SETTINGS.knowledgeDepth) {
    if (!this.settings.apiKey) {
      new import_obsidian4.Notice("\u274C API key not set! Please configure it in settings.");
      return;
    }
    const normalizedCourseName = courseName.trim();
    if (!normalizedCourseName) {
      new import_obsidian4.Notice("Please enter a subject name");
      return;
    }
    const run = this.startRun("generate", MAX_BLUEPRINT_CHAPTERS + 1);
    if (!run) return;
    new import_obsidian4.Notice(`\u{1F4DA} Generating: ${normalizedCourseName}`);
    this.showProgress(`Generating course blueprint`, 5, run.id);
    try {
      const blueprint = await this.fetchCourseBlueprint(
        normalizedCourseName,
        depth,
        run
      );
      const folderPath = (0, import_obsidian4.normalizePath)(normalizedCourseName);
      const existing = this.app.vault.getAbstractFileByPath(folderPath);
      let courseFolder;
      if (existing instanceof import_obsidian4.TFolder) {
        courseFolder = existing;
      } else if (existing) {
        throw new Error(`Path "${folderPath}" exists as a file`);
      } else {
        courseFolder = await this.app.vault.createFolder(folderPath);
      }
      const headerText = getHeaderText(run.config.language);
      const depthLabel = KNOWLEDGE_DEPTH_LABELS[depth];
      const outlineContent = [
        `# ${blueprint.courseName} ${headerText.outlineTitle}`,
        "",
        `*${headerText.generatedAt}: ${(/* @__PURE__ */ new Date()).toLocaleString()}*`,
        "",
        `*Chapter depth: ${depthLabel} (${depth})*`,
        "",
        `> ${blueprint.courseGoal}`,
        "",
        renderCourseOutline(blueprint),
        "",
        serializeBlueprintComment(blueprint)
      ].join("\n");
      const outlinePath = (0, import_obsidian4.normalizePath)(`${courseFolder.path}/Outlines.md`);
      const existingOutline = this.app.vault.getAbstractFileByPath(outlinePath);
      if (existingOutline instanceof import_obsidian4.TFile) {
        await this.app.vault.modify(existingOutline, outlineContent);
      } else if (existingOutline) {
        throw new Error(`Path "${outlinePath}" exists and is not a file`);
      } else {
        await this.app.vault.create(outlinePath, outlineContent);
      }
      const chapters = blueprint.chapters;
      let completed = 0;
      let failed = 0;
      this.showProgress(`0/${chapters.length} chapters generated`, 15, run.id);
      const results = await Promise.all(
        chapters.map(
          (chapter) => this.generateChapterContent(
            courseFolder,
            this.buildChapterContext(blueprint, chapter),
            run,
            depth,
            (result) => {
              completed += 1;
              if (!result.success) failed += 1;
              this.showProgress(
                `${completed}/${chapters.length} chapters done, ${failed} failed`,
                15 + Math.round(completed / chapters.length * 80),
                run.id
              );
            }
          )
        )
      );
      const failedResults = results.filter((result) => !result.success);
      if (failedResults.length > 0) {
        await this.writeFailureReport(
          courseFolder,
          blueprint.courseName,
          depth,
          failedResults
        );
      } else {
        await this.clearFailureReport(courseFolder, blueprint.courseName);
      }
      const successCount = results.length - failedResults.length;
      if (run.cancellation.isCancelled) {
        this.finishProgress(
          `Cancelled: ${successCount}/${chapters.length} chapters saved`,
          run.id
        );
      } else if (failedResults.length > 0) {
        this.finishProgress(
          `Done: ${successCount}/${chapters.length} generated`,
          run.id
        );
      } else {
        this.finishProgress(
          `Done: ${chapters.length} chapters generated`,
          run.id
        );
      }
    } catch (error) {
      const message = errorToMessage(error);
      if (error instanceof GenerationCancelledError) {
        this.finishProgress("Generation cancelled", run.id);
      } else {
        new import_obsidian4.Notice(`\u274C Error: ${message}`, 5e3);
        this.finishProgress(`Failed: ${message}`, run.id);
        console.error("Generation error:", error);
      }
    } finally {
      this.endRun(run);
    }
  }
};

// main.ts
var main_default = KnowledgePlugin;

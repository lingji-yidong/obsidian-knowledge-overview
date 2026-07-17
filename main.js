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
  maxCompletionTokens: 24e3,
  chapterConcurrency: 1,
  knowledgeDepth: "onboarding",
  autoDetectKnowledgeType: true,
  knowledgeTypeOverride: "auto",
  minChapterChars: 9e3,
  autoExpandShortChapters: true,
  temperature: 0.4,
  reasoningEffort: null,
  verbosity: null
};
var MIN_CONCURRENCY = 1;
var MAX_CHAPTER_CONCURRENCY = 20;
var MAX_API_RETRIES = 2;
var RETRY_BASE_DELAY_MS = 1500;

// src/api.ts
var ApiError = class extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
};
var CompletionTruncatedError = class extends Error {
  constructor() {
    super(
      "API response was truncated because the model reached its output token limit. Increase Max completion tokens or choose a model/provider with a larger output limit."
    );
    this.name = "CompletionTruncatedError";
  }
};
function isRetryableStatus(status) {
  return status === 408 || status === 409 || status === 425 || status === 429 || status >= 500;
}
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
function buildPromptWithSystem(userPrompt, systemPrompt) {
  if (!systemPrompt) {
    return userPrompt;
  }
  return `${systemPrompt}

${userPrompt}`;
}
function isChatCompletionResponse(value) {
  if (!value || typeof value !== "object") {
    return false;
  }
  const choices = value.choices;
  if (!Array.isArray(choices) || choices.length === 0) {
    return false;
  }
  return typeof choices[0] === "object" && choices[0] !== null;
}
function extractTextContent(content) {
  if (typeof content === "string") {
    return content;
  }
  if (!Array.isArray(content)) {
    return null;
  }
  const parts = content.map((part) => {
    if (typeof part === "string") {
      return part;
    }
    if (!part || typeof part !== "object") {
      return "";
    }
    const maybeText = part;
    if (typeof maybeText.text === "string") {
      return maybeText.text;
    }
    if (typeof maybeText.content === "string") {
      return maybeText.content;
    }
    return "";
  }).join("");
  return parts || null;
}
function extractChatCompletionContent(data) {
  var _a;
  const firstChoice = data.choices[0];
  const messageContent = extractTextContent((_a = firstChoice.message) == null ? void 0 : _a.content);
  if (messageContent !== null) {
    return messageContent;
  }
  return extractTextContent(firstChoice.text);
}
async function requestChatCompletion(options, useSystemMessage, includeOptionalFields) {
  const {
    apiKey,
    apiBaseUrl,
    model,
    userPrompt,
    systemPrompt,
    maxCompletionTokens,
    temperature,
    reasoningEffort,
    verbosity
  } = options;
  const messages = useSystemMessage && systemPrompt ? [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt }
  ] : [{ role: "user", content: buildPromptWithSystem(userPrompt, systemPrompt) }];
  const body = {
    model,
    messages
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
  const res = await (0, import_obsidian.requestUrl)({
    url: buildChatCompletionsUrl(apiBaseUrl),
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
  if (res.status < 200 || res.status >= 300) {
    throw new ApiError(`API Error: ${res.status} - ${res.text}`, res.status);
  }
  const data = res.json;
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
async function callChatCompletion(options) {
  const attempts = [
    { useSystemMessage: true, includeOptionalFields: true },
    { useSystemMessage: true, includeOptionalFields: false },
    { useSystemMessage: false, includeOptionalFields: false }
  ];
  let lastError;
  for (const attempt of attempts) {
    try {
      return await requestChatCompletion(
        options,
        attempt.useSystemMessage,
        attempt.includeOptionalFields
      );
    } catch (error) {
      lastError = error;
      const status = error instanceof ApiError ? error.status : void 0;
      if (status === void 0 || status >= 500) {
        throw error;
      }
    }
  }
  throw lastError;
}

// src/sectionHeadings.ts
var ENGLISH_SECTION_TITLES = {
  "orientation": "Orientation",
  "prerequisite map": "Prerequisite Map",
  "core concept map": "Core Concept Map",
  "concept explanations": "Concept Explanations",
  "relationships and tradeoffs": "Relationships and Tradeoffs",
  "examples": "Examples",
  "common misconceptions": "Common Misconceptions",
  "retrieval questions": "Retrieval Questions",
  "next steps": "Next Steps",
  "core quantities and models": "Core Quantities and Models",
  "symbols, units, and dimensions": "Symbols, Units, and Dimensions",
  "formula intuition": "Formula Intuition",
  "assumptions and regimes": "Assumptions and Regimes",
  "worked examples": "Worked Examples",
  "edge cases and limiting cases": "Edge Cases and Limiting Cases",
  "common mistakes": "Common Mistakes",
  "minimal working workflow": "Minimal Working Workflow",
  "prerequisite tools and setup": "Prerequisite Tools and Setup",
  "core tasks": "Core Tasks",
  "step-by-step workflows": "Step-by-Step Workflows",
  "verification checklist": "Verification Checklist",
  "common mistakes and troubleshooting": "Common Mistakes and Troubleshooting",
  "practice tasks": "Practice Tasks",
  "hypothesis": "Hypothesis",
  "data and assumptions": "Data and Assumptions",
  "evaluation pipeline": "Evaluation Pipeline",
  "metrics": "Metrics",
  "baseline comparison": "Baseline Comparison",
  "bias and leakage risks": "Bias and Leakage Risks",
  "robustness checks": "Robustness Checks",
  "failure modes": "Failure Modes",
  "materials and tools": "Materials and Tools",
  "style or quality standards": "Style or Quality Standards",
  "core techniques": "Core Techniques",
  "process": "Process",
  "representative cases": "Representative Cases",
  "sensory or output standards": "Sensory or Output Standards",
  "common failures and fixes": "Common Failures and Fixes",
  "timeline": "Timeline",
  "key actors, works, or institutions": "Key Actors, Works, or Institutions",
  "causal forces": "Causal Forces",
  "major transitions": "Major Transitions",
  "conflicts or debates": "Conflicts or Debates",
  "legacy and modern relevance": "Legacy and Modern Relevance",
  "definition and intuition": "Definition and Intuition",
  "why it exists": "Why It Exists",
  "problem it solves": "Problem It Solves",
  "prerequisites": "Prerequisites",
  "concrete example": "Concrete Example",
  "relationship to neighboring concepts": "Relationship to Neighboring Concepts",
  "common misconception": "Common Misconception",
  "definition": "Definition",
  "intuition": "Intuition",
  "symbols and units": "Symbols and Units",
  "assumptions": "Assumptions",
  "when the model applies": "When the Model Applies",
  "simple numerical example": "Simple Numerical Example",
  "what breaks when assumptions fail": "What Breaks When Assumptions Fail",
  "goal": "Goal",
  "when to use it": "When to Use It",
  "steps": "Steps",
  "menu path or shortcut if applicable": "Menu Path or Shortcut If Applicable",
  "expected result": "Expected Result",
  "how to verify the output": "How to Verify the Output",
  "what it measures": "What It Measures",
  "why it matters": "Why It Matters",
  "how to compute or test it": "How to Compute or Test It",
  "how it fails": "How It Fails",
  "example": "Example",
  "diagnostic check": "Diagnostic Check",
  "purpose": "Purpose",
  "materials or conditions": "Materials or Conditions",
  "sensory or quality standard": "Sensory or Quality Standard",
  "common failure": "Common Failure",
  "fix": "Fix",
  "period or transition": "Period or Transition",
  "what changed": "What Changed",
  "why it changed": "Why It Changed",
  "key actors or examples": "Key Actors or Examples",
  "broader context": "Broader Context",
  "modern relevance": "Modern Relevance"
};
var LOCALIZED_SECTION_TITLES = {
  zh: {
    "orientation": "\u5B66\u4E60\u5B9A\u4F4D",
    "prerequisite map": "\u524D\u7F6E\u77E5\u8BC6\u5730\u56FE",
    "core concept map": "\u6838\u5FC3\u6982\u5FF5\u5730\u56FE",
    "concept explanations": "\u6982\u5FF5\u89E3\u91CA",
    "relationships and tradeoffs": "\u5173\u7CFB\u4E0E\u53D6\u820D",
    "examples": "\u4F8B\u5B50",
    "common misconceptions": "\u5E38\u89C1\u8BEF\u89E3",
    "retrieval questions": "\u81EA\u6211\u68C0\u7D22\u95EE\u9898",
    "next steps": "\u540E\u7EED\u5B66\u4E60",
    "core quantities and models": "\u6838\u5FC3\u91CF\u4E0E\u6A21\u578B",
    "symbols, units, and dimensions": "\u7B26\u53F7\u3001\u5355\u4F4D\u4E0E\u91CF\u7EB2",
    "formula intuition": "\u516C\u5F0F\u76F4\u89C9",
    "assumptions and regimes": "\u5047\u8BBE\u4E0E\u9002\u7528\u533A\u95F4",
    "worked examples": "\u6F14\u7B97\u4F8B\u5B50",
    "edge cases and limiting cases": "\u8FB9\u754C\u60C5\u51B5\u4E0E\u6781\u9650\u60C5\u51B5",
    "common mistakes": "\u5E38\u89C1\u9519\u8BEF",
    "minimal working workflow": "\u6700\u5C0F\u53EF\u7528\u6D41\u7A0B",
    "prerequisite tools and setup": "\u524D\u7F6E\u5DE5\u5177\u4E0E\u8BBE\u7F6E",
    "core tasks": "\u6838\u5FC3\u4EFB\u52A1",
    "step-by-step workflows": "\u5206\u6B65\u5DE5\u4F5C\u6D41",
    "verification checklist": "\u9A8C\u8BC1\u6E05\u5355",
    "common mistakes and troubleshooting": "\u5E38\u89C1\u9519\u8BEF\u4E0E\u6392\u67E5",
    "practice tasks": "\u7EC3\u4E60\u4EFB\u52A1",
    "hypothesis": "\u5047\u8BBE",
    "data and assumptions": "\u6570\u636E\u4E0E\u5047\u8BBE",
    "evaluation pipeline": "\u8BC4\u4F30\u6D41\u7A0B",
    "metrics": "\u6307\u6807",
    "baseline comparison": "\u57FA\u7EBF\u6BD4\u8F83",
    "bias and leakage risks": "\u504F\u5DEE\u4E0E\u6CC4\u6F0F\u98CE\u9669",
    "robustness checks": "\u7A33\u5065\u6027\u68C0\u67E5",
    "failure modes": "\u5931\u8D25\u6A21\u5F0F",
    "materials and tools": "\u6750\u6599\u4E0E\u5DE5\u5177",
    "style or quality standards": "\u98CE\u683C\u6216\u8D28\u91CF\u6807\u51C6",
    "core techniques": "\u6838\u5FC3\u6280\u6CD5",
    "process": "\u8FC7\u7A0B",
    "representative cases": "\u4EE3\u8868\u6027\u6848\u4F8B",
    "sensory or output standards": "\u611F\u5B98\u6216\u8F93\u51FA\u6807\u51C6",
    "common failures and fixes": "\u5E38\u89C1\u5931\u8D25\u4E0E\u4FEE\u6B63",
    "timeline": "\u65F6\u95F4\u7EBF",
    "key actors, works, or institutions": "\u5173\u952E\u4EBA\u7269\u3001\u4F5C\u54C1\u6216\u673A\u6784",
    "causal forces": "\u56E0\u679C\u529B\u91CF",
    "major transitions": "\u4E3B\u8981\u8F6C\u53D8",
    "conflicts or debates": "\u51B2\u7A81\u6216\u4E89\u8BBA",
    "legacy and modern relevance": "\u9057\u4EA7\u4E0E\u5F53\u4EE3\u5173\u8054",
    "definition and intuition": "\u5B9A\u4E49\u4E0E\u76F4\u89C9",
    "why it exists": "\u4E3A\u4EC0\u4E48\u5B58\u5728",
    "problem it solves": "\u89E3\u51B3\u7684\u95EE\u9898",
    "prerequisites": "\u524D\u7F6E\u77E5\u8BC6",
    "concrete example": "\u5177\u4F53\u4F8B\u5B50",
    "relationship to neighboring concepts": "\u4E0E\u76F8\u90BB\u6982\u5FF5\u7684\u5173\u7CFB",
    "common misconception": "\u5E38\u89C1\u8BEF\u89E3",
    "definition": "\u5B9A\u4E49",
    "intuition": "\u76F4\u89C9",
    "symbols and units": "\u7B26\u53F7\u4E0E\u5355\u4F4D",
    "assumptions": "\u5047\u8BBE",
    "when the model applies": "\u6A21\u578B\u9002\u7528\u6761\u4EF6",
    "simple numerical example": "\u7B80\u5355\u6570\u503C\u4F8B\u5B50",
    "what breaks when assumptions fail": "\u5047\u8BBE\u5931\u6548\u65F6\u4F1A\u51FA\u4EC0\u4E48\u95EE\u9898",
    "goal": "\u76EE\u6807",
    "when to use it": "\u4F55\u65F6\u4F7F\u7528",
    "steps": "\u6B65\u9AA4",
    "menu path or shortcut if applicable": "\u83DC\u5355\u8DEF\u5F84\u6216\u5FEB\u6377\u952E",
    "expected result": "\u9884\u671F\u7ED3\u679C",
    "how to verify the output": "\u5982\u4F55\u9A8C\u8BC1\u8F93\u51FA",
    "what it measures": "\u8861\u91CF\u4EC0\u4E48",
    "why it matters": "\u4E3A\u4EC0\u4E48\u91CD\u8981",
    "how to compute or test it": "\u5982\u4F55\u8BA1\u7B97\u6216\u6D4B\u8BD5",
    "how it fails": "\u5982\u4F55\u5931\u6548",
    "example": "\u4F8B\u5B50",
    "diagnostic check": "\u8BCA\u65AD\u68C0\u67E5",
    "purpose": "\u76EE\u7684",
    "materials or conditions": "\u6750\u6599\u6216\u6761\u4EF6",
    "sensory or quality standard": "\u611F\u5B98\u6216\u8D28\u91CF\u6807\u51C6",
    "common failure": "\u5E38\u89C1\u5931\u8D25",
    "fix": "\u4FEE\u6B63",
    "period or transition": "\u65F6\u671F\u6216\u8F6C\u53D8",
    "what changed": "\u53D1\u751F\u4E86\u4EC0\u4E48\u53D8\u5316",
    "why it changed": "\u4E3A\u4EC0\u4E48\u53D8\u5316",
    "key actors or examples": "\u5173\u952E\u4EBA\u7269\u6216\u4F8B\u5B50",
    "broader context": "\u66F4\u5E7F\u80CC\u666F",
    "modern relevance": "\u5F53\u4EE3\u5173\u8054"
  },
  zh_tw: {
    "orientation": "\u5B78\u7FD2\u5B9A\u4F4D",
    "prerequisite map": "\u524D\u7F6E\u77E5\u8B58\u5730\u5716",
    "core concept map": "\u6838\u5FC3\u6982\u5FF5\u5730\u5716",
    "concept explanations": "\u6982\u5FF5\u89E3\u91CB",
    "relationships and tradeoffs": "\u95DC\u4FC2\u8207\u53D6\u6368",
    "examples": "\u4F8B\u5B50",
    "common misconceptions": "\u5E38\u898B\u8AA4\u89E3",
    "retrieval questions": "\u81EA\u6211\u6AA2\u7D22\u554F\u984C",
    "next steps": "\u5F8C\u7E8C\u5B78\u7FD2",
    "core quantities and models": "\u6838\u5FC3\u91CF\u8207\u6A21\u578B",
    "symbols, units, and dimensions": "\u7B26\u865F\u3001\u55AE\u4F4D\u8207\u91CF\u7DB1",
    "formula intuition": "\u516C\u5F0F\u76F4\u89BA",
    "assumptions and regimes": "\u5047\u8A2D\u8207\u9069\u7528\u5340\u9593",
    "worked examples": "\u6F14\u7B97\u4F8B\u5B50",
    "edge cases and limiting cases": "\u908A\u754C\u60C5\u6CC1\u8207\u6975\u9650\u60C5\u6CC1",
    "common mistakes": "\u5E38\u898B\u932F\u8AA4",
    "minimal working workflow": "\u6700\u5C0F\u53EF\u7528\u6D41\u7A0B",
    "prerequisite tools and setup": "\u524D\u7F6E\u5DE5\u5177\u8207\u8A2D\u5B9A",
    "core tasks": "\u6838\u5FC3\u4EFB\u52D9",
    "step-by-step workflows": "\u5206\u6B65\u5DE5\u4F5C\u6D41",
    "verification checklist": "\u9A57\u8B49\u6E05\u55AE",
    "common mistakes and troubleshooting": "\u5E38\u898B\u932F\u8AA4\u8207\u6392\u67E5",
    "practice tasks": "\u7DF4\u7FD2\u4EFB\u52D9",
    "hypothesis": "\u5047\u8A2D",
    "data and assumptions": "\u8CC7\u6599\u8207\u5047\u8A2D",
    "evaluation pipeline": "\u8A55\u4F30\u6D41\u7A0B",
    "metrics": "\u6307\u6A19",
    "baseline comparison": "\u57FA\u7DDA\u6BD4\u8F03",
    "bias and leakage risks": "\u504F\u5DEE\u8207\u6D29\u6F0F\u98A8\u96AA",
    "robustness checks": "\u7A69\u5065\u6027\u6AA2\u67E5",
    "failure modes": "\u5931\u6557\u6A21\u5F0F",
    "materials and tools": "\u6750\u6599\u8207\u5DE5\u5177",
    "style or quality standards": "\u98A8\u683C\u6216\u54C1\u8CEA\u6A19\u6E96",
    "core techniques": "\u6838\u5FC3\u6280\u6CD5",
    "process": "\u904E\u7A0B",
    "representative cases": "\u4EE3\u8868\u6027\u6848\u4F8B",
    "sensory or output standards": "\u611F\u5B98\u6216\u8F38\u51FA\u6A19\u6E96",
    "common failures and fixes": "\u5E38\u898B\u5931\u6557\u8207\u4FEE\u6B63",
    "timeline": "\u6642\u9593\u7DDA",
    "key actors, works, or institutions": "\u95DC\u9375\u4EBA\u7269\u3001\u4F5C\u54C1\u6216\u6A5F\u69CB",
    "causal forces": "\u56E0\u679C\u529B\u91CF",
    "major transitions": "\u4E3B\u8981\u8F49\u8B8A",
    "conflicts or debates": "\u885D\u7A81\u6216\u722D\u8AD6",
    "legacy and modern relevance": "\u907A\u7522\u8207\u7576\u4EE3\u95DC\u806F",
    "definition and intuition": "\u5B9A\u7FA9\u8207\u76F4\u89BA",
    "why it exists": "\u70BA\u4EC0\u9EBC\u5B58\u5728",
    "problem it solves": "\u89E3\u6C7A\u7684\u554F\u984C",
    "prerequisites": "\u524D\u7F6E\u77E5\u8B58",
    "concrete example": "\u5177\u9AD4\u4F8B\u5B50",
    "relationship to neighboring concepts": "\u8207\u76F8\u9130\u6982\u5FF5\u7684\u95DC\u4FC2",
    "common misconception": "\u5E38\u898B\u8AA4\u89E3",
    "definition": "\u5B9A\u7FA9",
    "intuition": "\u76F4\u89BA",
    "symbols and units": "\u7B26\u865F\u8207\u55AE\u4F4D",
    "assumptions": "\u5047\u8A2D",
    "when the model applies": "\u6A21\u578B\u9069\u7528\u689D\u4EF6",
    "simple numerical example": "\u7C21\u55AE\u6578\u503C\u4F8B\u5B50",
    "what breaks when assumptions fail": "\u5047\u8A2D\u5931\u6548\u6642\u6703\u51FA\u4EC0\u9EBC\u554F\u984C",
    "goal": "\u76EE\u6A19",
    "when to use it": "\u4F55\u6642\u4F7F\u7528",
    "steps": "\u6B65\u9A5F",
    "menu path or shortcut if applicable": "\u9078\u55AE\u8DEF\u5F91\u6216\u5FEB\u6377\u9375",
    "expected result": "\u9810\u671F\u7D50\u679C",
    "how to verify the output": "\u5982\u4F55\u9A57\u8B49\u8F38\u51FA",
    "what it measures": "\u8861\u91CF\u4EC0\u9EBC",
    "why it matters": "\u70BA\u4EC0\u9EBC\u91CD\u8981",
    "how to compute or test it": "\u5982\u4F55\u8A08\u7B97\u6216\u6E2C\u8A66",
    "how it fails": "\u5982\u4F55\u5931\u6548",
    "example": "\u4F8B\u5B50",
    "diagnostic check": "\u8A3A\u65B7\u6AA2\u67E5",
    "purpose": "\u76EE\u7684",
    "materials or conditions": "\u6750\u6599\u6216\u689D\u4EF6",
    "sensory or quality standard": "\u611F\u5B98\u6216\u54C1\u8CEA\u6A19\u6E96",
    "common failure": "\u5E38\u898B\u5931\u6557",
    "fix": "\u4FEE\u6B63",
    "period or transition": "\u6642\u671F\u6216\u8F49\u8B8A",
    "what changed": "\u767C\u751F\u4E86\u4EC0\u9EBC\u8B8A\u5316",
    "why it changed": "\u70BA\u4EC0\u9EBC\u8B8A\u5316",
    "key actors or examples": "\u95DC\u9375\u4EBA\u7269\u6216\u4F8B\u5B50",
    "broader context": "\u66F4\u5EE3\u80CC\u666F",
    "modern relevance": "\u7576\u4EE3\u95DC\u806F"
  },
  ja: {
    "orientation": "\u5B66\u7FD2\u306E\u4F4D\u7F6E\u3065\u3051",
    "prerequisite map": "\u524D\u63D0\u77E5\u8B58\u30DE\u30C3\u30D7",
    "core concept map": "\u4E2D\u6838\u6982\u5FF5\u30DE\u30C3\u30D7",
    "concept explanations": "\u6982\u5FF5\u306E\u8AAC\u660E",
    "relationships and tradeoffs": "\u95A2\u4FC2\u3068\u30C8\u30EC\u30FC\u30C9\u30AA\u30D5",
    "examples": "\u4F8B",
    "common misconceptions": "\u3088\u304F\u3042\u308B\u8AA4\u89E3",
    "retrieval questions": "\u60F3\u8D77\u7DF4\u7FD2\u306E\u8CEA\u554F",
    "next steps": "\u6B21\u306E\u5B66\u7FD2",
    "core quantities and models": "\u4E2D\u6838\u3068\u306A\u308B\u91CF\u3068\u30E2\u30C7\u30EB",
    "symbols, units, and dimensions": "\u8A18\u53F7\u3001\u5358\u4F4D\u3001\u6B21\u5143",
    "formula intuition": "\u6570\u5F0F\u306E\u76F4\u611F",
    "assumptions and regimes": "\u4EEE\u5B9A\u3068\u9069\u7528\u9818\u57DF",
    "worked examples": "\u89E3\u6CD5\u4F8B",
    "edge cases and limiting cases": "\u7AEF\u70B9\u30B1\u30FC\u30B9\u3068\u6975\u9650\u30B1\u30FC\u30B9",
    "common mistakes": "\u3088\u304F\u3042\u308B\u9593\u9055\u3044",
    "minimal working workflow": "\u6700\u5C0F\u5B9F\u7528\u30EF\u30FC\u30AF\u30D5\u30ED\u30FC",
    "prerequisite tools and setup": "\u524D\u63D0\u30C4\u30FC\u30EB\u3068\u8A2D\u5B9A",
    "core tasks": "\u4E2D\u6838\u30BF\u30B9\u30AF",
    "step-by-step workflows": "\u6BB5\u968E\u7684\u30EF\u30FC\u30AF\u30D5\u30ED\u30FC",
    "verification checklist": "\u691C\u8A3C\u30C1\u30A7\u30C3\u30AF\u30EA\u30B9\u30C8",
    "common mistakes and troubleshooting": "\u3088\u304F\u3042\u308B\u9593\u9055\u3044\u3068\u30C8\u30E9\u30D6\u30EB\u30B7\u30E5\u30FC\u30C6\u30A3\u30F3\u30B0",
    "practice tasks": "\u7DF4\u7FD2\u30BF\u30B9\u30AF",
    "hypothesis": "\u4EEE\u8AAC",
    "data and assumptions": "\u30C7\u30FC\u30BF\u3068\u4EEE\u5B9A",
    "evaluation pipeline": "\u8A55\u4FA1\u30D1\u30A4\u30D7\u30E9\u30A4\u30F3",
    "metrics": "\u6307\u6A19",
    "baseline comparison": "\u30D9\u30FC\u30B9\u30E9\u30A4\u30F3\u6BD4\u8F03",
    "bias and leakage risks": "\u30D0\u30A4\u30A2\u30B9\u3068\u6F0F\u6D29\u30EA\u30B9\u30AF",
    "robustness checks": "\u9811\u5065\u6027\u30C1\u30A7\u30C3\u30AF",
    "failure modes": "\u5931\u6557\u30E2\u30FC\u30C9",
    "materials and tools": "\u6750\u6599\u3068\u9053\u5177",
    "style or quality standards": "\u30B9\u30BF\u30A4\u30EB\u307E\u305F\u306F\u54C1\u8CEA\u57FA\u6E96",
    "core techniques": "\u4E2D\u6838\u6280\u6CD5",
    "process": "\u5DE5\u7A0B",
    "representative cases": "\u4EE3\u8868\u4F8B",
    "sensory or output standards": "\u611F\u899A\u307E\u305F\u306F\u51FA\u529B\u306E\u57FA\u6E96",
    "common failures and fixes": "\u3088\u304F\u3042\u308B\u5931\u6557\u3068\u4FEE\u6B63",
    "timeline": "\u5E74\u8868",
    "key actors, works, or institutions": "\u4E3B\u8981\u4EBA\u7269\u3001\u4F5C\u54C1\u3001\u5236\u5EA6",
    "causal forces": "\u56E0\u679C\u8981\u56E0",
    "major transitions": "\u4E3B\u8981\u306A\u8EE2\u63DB",
    "conflicts or debates": "\u5BFE\u7ACB\u307E\u305F\u306F\u8AD6\u4E89",
    "legacy and modern relevance": "\u907A\u7523\u3068\u73FE\u4EE3\u7684\u610F\u7FA9"
  },
  ko: {
    "orientation": "\uD559\uC2B5 \uC704\uCE58 \uC7A1\uAE30",
    "prerequisite map": "\uC120\uC218 \uC9C0\uC2DD \uC9C0\uB3C4",
    "core concept map": "\uD575\uC2EC \uAC1C\uB150 \uC9C0\uB3C4",
    "concept explanations": "\uAC1C\uB150 \uC124\uBA85",
    "relationships and tradeoffs": "\uAD00\uACC4\uC640 \uD2B8\uB808\uC774\uB4DC\uC624\uD504",
    "examples": "\uC608\uC2DC",
    "common misconceptions": "\uD754\uD55C \uC624\uD574",
    "retrieval questions": "\uC778\uCD9C \uC5F0\uC2B5 \uC9C8\uBB38",
    "next steps": "\uB2E4\uC74C \uD559\uC2B5",
    "core quantities and models": "\uD575\uC2EC \uC218\uB7C9\uACFC \uBAA8\uB378",
    "symbols, units, and dimensions": "\uAE30\uD638, \uB2E8\uC704, \uCC28\uC6D0",
    "formula intuition": "\uACF5\uC2DD\uC758 \uC9C1\uAD00",
    "assumptions and regimes": "\uAC00\uC815\uACFC \uC801\uC6A9 \uC601\uC5ED",
    "worked examples": "\uD480\uC774 \uC608\uC81C",
    "edge cases and limiting cases": "\uACBD\uACC4 \uC0AC\uB840\uC640 \uADF9\uD55C \uC0AC\uB840",
    "common mistakes": "\uD754\uD55C \uC2E4\uC218",
    "minimal working workflow": "\uCD5C\uC18C \uC2E4\uD589 \uC6CC\uD06C\uD50C\uB85C",
    "prerequisite tools and setup": "\uD544\uC218 \uB3C4\uAD6C\uC640 \uC124\uC815",
    "core tasks": "\uD575\uC2EC \uC791\uC5C5",
    "step-by-step workflows": "\uB2E8\uACC4\uBCC4 \uC6CC\uD06C\uD50C\uB85C",
    "verification checklist": "\uAC80\uC99D \uCCB4\uD06C\uB9AC\uC2A4\uD2B8",
    "common mistakes and troubleshooting": "\uD754\uD55C \uC2E4\uC218\uC640 \uBB38\uC81C \uD574\uACB0",
    "practice tasks": "\uC5F0\uC2B5 \uACFC\uC81C",
    "hypothesis": "\uAC00\uC124",
    "data and assumptions": "\uB370\uC774\uD130\uC640 \uAC00\uC815",
    "evaluation pipeline": "\uD3C9\uAC00 \uD30C\uC774\uD504\uB77C\uC778",
    "metrics": "\uC9C0\uD45C",
    "baseline comparison": "\uAE30\uC900\uC120 \uBE44\uAD50",
    "bias and leakage risks": "\uD3B8\uD5A5\uACFC \uB204\uC218 \uC704\uD5D8",
    "robustness checks": "\uAC15\uAC74\uC131 \uC810\uAC80",
    "failure modes": "\uC2E4\uD328 \uBAA8\uB4DC",
    "materials and tools": "\uC7AC\uB8CC\uC640 \uB3C4\uAD6C",
    "style or quality standards": "\uC2A4\uD0C0\uC77C \uB610\uB294 \uD488\uC9C8 \uAE30\uC900",
    "core techniques": "\uD575\uC2EC \uAE30\uBC95",
    "process": "\uACFC\uC815",
    "representative cases": "\uB300\uD45C \uC0AC\uB840",
    "sensory or output standards": "\uAC10\uAC01 \uB610\uB294 \uCD9C\uB825 \uAE30\uC900",
    "common failures and fixes": "\uD754\uD55C \uC2E4\uD328\uC640 \uC218\uC815",
    "timeline": "\uC5F0\uD45C",
    "key actors, works, or institutions": "\uC8FC\uC694 \uC778\uBB3C, \uC791\uD488, \uAE30\uAD00",
    "causal forces": "\uC778\uACFC \uC694\uC778",
    "major transitions": "\uC8FC\uC694 \uC804\uD658",
    "conflicts or debates": "\uAC08\uB4F1 \uB610\uB294 \uB17C\uC7C1",
    "legacy and modern relevance": "\uC720\uC0B0\uACFC \uD604\uB300\uC801 \uAD00\uB828\uC131"
  },
  vi: {
    "orientation": "\u0110\u1ECBnh h\u01B0\u1EDBng h\u1ECDc t\u1EADp",
    "prerequisite map": "B\u1EA3n \u0111\u1ED3 ki\u1EBFn th\u1EE9c ti\xEAn quy\u1EBFt",
    "core concept map": "B\u1EA3n \u0111\u1ED3 kh\xE1i ni\u1EC7m c\u1ED1t l\xF5i",
    "concept explanations": "Gi\u1EA3i th\xEDch kh\xE1i ni\u1EC7m",
    "relationships and tradeoffs": "Quan h\u1EC7 v\xE0 \u0111\xE1nh \u0111\u1ED5i",
    "examples": "V\xED d\u1EE5",
    "common misconceptions": "Hi\u1EC3u l\u1EA7m th\u01B0\u1EDDng g\u1EB7p",
    "retrieval questions": "C\xE2u h\u1ECFi g\u1EE3i nh\u1EDB",
    "next steps": "B\u01B0\u1EDBc h\u1ECDc ti\u1EBFp theo",
    "core quantities and models": "\u0110\u1EA1i l\u01B0\u1EE3ng v\xE0 m\xF4 h\xECnh c\u1ED1t l\xF5i",
    "symbols, units, and dimensions": "K\xFD hi\u1EC7u, \u0111\u01A1n v\u1ECB v\xE0 th\u1EE9 nguy\xEAn",
    "formula intuition": "Tr\u1EF1c gi\xE1c c\xF4ng th\u1EE9c",
    "assumptions and regimes": "Gi\u1EA3 \u0111\u1ECBnh v\xE0 ph\u1EA1m vi \xE1p d\u1EE5ng",
    "worked examples": "V\xED d\u1EE5 c\xF3 l\u1EDDi gi\u1EA3i",
    "edge cases and limiting cases": "Tr\u01B0\u1EDDng h\u1EE3p bi\xEAn v\xE0 gi\u1EDBi h\u1EA1n",
    "common mistakes": "L\u1ED7i th\u01B0\u1EDDng g\u1EB7p",
    "minimal working workflow": "Quy tr\xECnh t\u1ED1i thi\u1EC3u d\xF9ng \u0111\u01B0\u1EE3c",
    "prerequisite tools and setup": "C\xF4ng c\u1EE5 v\xE0 thi\u1EBFt l\u1EADp ti\xEAn quy\u1EBFt",
    "core tasks": "Nhi\u1EC7m v\u1EE5 c\u1ED1t l\xF5i",
    "step-by-step workflows": "Quy tr\xECnh t\u1EEBng b\u01B0\u1EDBc",
    "verification checklist": "Danh s\xE1ch ki\u1EC3m tra x\xE1c minh",
    "common mistakes and troubleshooting": "L\u1ED7i th\u01B0\u1EDDng g\u1EB7p v\xE0 x\u1EED l\xFD s\u1EF1 c\u1ED1",
    "practice tasks": "B\xE0i t\u1EADp th\u1EF1c h\xE0nh",
    "hypothesis": "Gi\u1EA3 thuy\u1EBFt",
    "data and assumptions": "D\u1EEF li\u1EC7u v\xE0 gi\u1EA3 \u0111\u1ECBnh",
    "evaluation pipeline": "Quy tr\xECnh \u0111\xE1nh gi\xE1",
    "metrics": "Ch\u1EC9 s\u1ED1",
    "baseline comparison": "So s\xE1nh v\u1EDBi \u0111\u01B0\u1EDDng c\u01A1 s\u1EDF",
    "bias and leakage risks": "R\u1EE7i ro thi\xEAn l\u1EC7ch v\xE0 r\xF2 r\u1EC9",
    "robustness checks": "Ki\u1EC3m tra \u0111\u1ED9 v\u1EEFng",
    "failure modes": "Ki\u1EC3u th\u1EA5t b\u1EA1i",
    "materials and tools": "V\u1EADt li\u1EC7u v\xE0 c\xF4ng c\u1EE5",
    "style or quality standards": "Chu\u1EA9n phong c\xE1ch ho\u1EB7c ch\u1EA5t l\u01B0\u1EE3ng",
    "core techniques": "K\u1EF9 thu\u1EADt c\u1ED1t l\xF5i",
    "process": "Quy tr\xECnh",
    "representative cases": "Tr\u01B0\u1EDDng h\u1EE3p ti\xEAu bi\u1EC3u",
    "sensory or output standards": "Chu\u1EA9n c\u1EA3m quan ho\u1EB7c \u0111\u1EA7u ra",
    "common failures and fixes": "L\u1ED7i th\u01B0\u1EDDng g\u1EB7p v\xE0 c\xE1ch s\u1EEDa",
    "timeline": "D\xF2ng th\u1EDDi gian",
    "key actors, works, or institutions": "Nh\xE2n v\u1EADt, t\xE1c ph\u1EA9m ho\u1EB7c th\u1EC3 ch\u1EBF ch\u1EE7 ch\u1ED1t",
    "causal forces": "L\u1EF1c nh\xE2n qu\u1EA3",
    "major transitions": "Chuy\u1EC3n \u0111\u1ED5i l\u1EDBn",
    "conflicts or debates": "Xung \u0111\u1ED9t ho\u1EB7c tranh lu\u1EADn",
    "legacy and modern relevance": "Di s\u1EA3n v\xE0 \xFD ngh\u0129a hi\u1EC7n \u0111\u1EA1i"
  },
  th: {
    "orientation": "\u0E01\u0E23\u0E2D\u0E1A\u0E01\u0E32\u0E23\u0E40\u0E23\u0E35\u0E22\u0E19\u0E23\u0E39\u0E49",
    "prerequisite map": "\u0E41\u0E1C\u0E19\u0E17\u0E35\u0E48\u0E04\u0E27\u0E32\u0E21\u0E23\u0E39\u0E49\u0E1E\u0E37\u0E49\u0E19\u0E10\u0E32\u0E19",
    "core concept map": "\u0E41\u0E1C\u0E19\u0E17\u0E35\u0E48\u0E41\u0E19\u0E27\u0E04\u0E34\u0E14\u0E2B\u0E25\u0E31\u0E01",
    "concept explanations": "\u0E04\u0E33\u0E2D\u0E18\u0E34\u0E1A\u0E32\u0E22\u0E41\u0E19\u0E27\u0E04\u0E34\u0E14",
    "relationships and tradeoffs": "\u0E04\u0E27\u0E32\u0E21\u0E2A\u0E31\u0E21\u0E1E\u0E31\u0E19\u0E18\u0E4C\u0E41\u0E25\u0E30\u0E01\u0E32\u0E23\u0E41\u0E25\u0E01\u0E40\u0E1B\u0E25\u0E35\u0E48\u0E22\u0E19",
    "examples": "\u0E15\u0E31\u0E27\u0E2D\u0E22\u0E48\u0E32\u0E07",
    "common misconceptions": "\u0E04\u0E27\u0E32\u0E21\u0E40\u0E02\u0E49\u0E32\u0E43\u0E08\u0E1C\u0E34\u0E14\u0E17\u0E35\u0E48\u0E1E\u0E1A\u0E1A\u0E48\u0E2D\u0E22",
    "retrieval questions": "\u0E04\u0E33\u0E16\u0E32\u0E21\u0E17\u0E1A\u0E17\u0E27\u0E19\u0E08\u0E32\u0E01\u0E04\u0E27\u0E32\u0E21\u0E08\u0E33",
    "next steps": "\u0E02\u0E31\u0E49\u0E19\u0E15\u0E2D\u0E19\u0E16\u0E31\u0E14\u0E44\u0E1B",
    "core quantities and models": "\u0E1B\u0E23\u0E34\u0E21\u0E32\u0E13\u0E41\u0E25\u0E30\u0E41\u0E1A\u0E1A\u0E08\u0E33\u0E25\u0E2D\u0E07\u0E2B\u0E25\u0E31\u0E01",
    "symbols, units, and dimensions": "\u0E2A\u0E31\u0E0D\u0E25\u0E31\u0E01\u0E29\u0E13\u0E4C \u0E2B\u0E19\u0E48\u0E27\u0E22 \u0E41\u0E25\u0E30\u0E21\u0E34\u0E15\u0E34",
    "formula intuition": "\u0E2A\u0E31\u0E0D\u0E0A\u0E32\u0E15\u0E0D\u0E32\u0E13\u0E02\u0E2D\u0E07\u0E2A\u0E39\u0E15\u0E23",
    "assumptions and regimes": "\u0E2A\u0E21\u0E21\u0E15\u0E34\u0E10\u0E32\u0E19\u0E41\u0E25\u0E30\u0E02\u0E2D\u0E1A\u0E40\u0E02\u0E15\u0E01\u0E32\u0E23\u0E43\u0E0A\u0E49",
    "worked examples": "\u0E15\u0E31\u0E27\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E1E\u0E23\u0E49\u0E2D\u0E21\u0E27\u0E34\u0E18\u0E35\u0E17\u0E33",
    "edge cases and limiting cases": "\u0E01\u0E23\u0E13\u0E35\u0E02\u0E2D\u0E1A\u0E41\u0E25\u0E30\u0E01\u0E23\u0E13\u0E35\u0E08\u0E33\u0E01\u0E31\u0E14",
    "common mistakes": "\u0E02\u0E49\u0E2D\u0E1C\u0E34\u0E14\u0E1E\u0E25\u0E32\u0E14\u0E17\u0E35\u0E48\u0E1E\u0E1A\u0E1A\u0E48\u0E2D\u0E22",
    "minimal working workflow": "\u0E40\u0E27\u0E34\u0E23\u0E4C\u0E01\u0E42\u0E1F\u0E25\u0E27\u0E4C\u0E02\u0E31\u0E49\u0E19\u0E15\u0E48\u0E33\u0E17\u0E35\u0E48\u0E43\u0E0A\u0E49\u0E07\u0E32\u0E19\u0E44\u0E14\u0E49",
    "prerequisite tools and setup": "\u0E40\u0E04\u0E23\u0E37\u0E48\u0E2D\u0E07\u0E21\u0E37\u0E2D\u0E41\u0E25\u0E30\u0E01\u0E32\u0E23\u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32\u0E17\u0E35\u0E48\u0E15\u0E49\u0E2D\u0E07\u0E21\u0E35",
    "core tasks": "\u0E07\u0E32\u0E19\u0E2B\u0E25\u0E31\u0E01",
    "step-by-step workflows": "\u0E40\u0E27\u0E34\u0E23\u0E4C\u0E01\u0E42\u0E1F\u0E25\u0E27\u0E4C\u0E17\u0E35\u0E25\u0E30\u0E02\u0E31\u0E49\u0E19",
    "verification checklist": "\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E15\u0E23\u0E27\u0E08\u0E2A\u0E2D\u0E1A",
    "common mistakes and troubleshooting": "\u0E02\u0E49\u0E2D\u0E1C\u0E34\u0E14\u0E1E\u0E25\u0E32\u0E14\u0E17\u0E35\u0E48\u0E1E\u0E1A\u0E1A\u0E48\u0E2D\u0E22\u0E41\u0E25\u0E30\u0E01\u0E32\u0E23\u0E41\u0E01\u0E49\u0E1B\u0E31\u0E0D\u0E2B\u0E32",
    "practice tasks": "\u0E07\u0E32\u0E19\u0E1D\u0E36\u0E01\u0E1B\u0E0F\u0E34\u0E1A\u0E31\u0E15\u0E34",
    "hypothesis": "\u0E2A\u0E21\u0E21\u0E15\u0E34\u0E10\u0E32\u0E19",
    "data and assumptions": "\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E41\u0E25\u0E30\u0E2A\u0E21\u0E21\u0E15\u0E34\u0E10\u0E32\u0E19",
    "evaluation pipeline": "\u0E01\u0E23\u0E30\u0E1A\u0E27\u0E19\u0E01\u0E32\u0E23\u0E1B\u0E23\u0E30\u0E40\u0E21\u0E34\u0E19",
    "metrics": "\u0E15\u0E31\u0E27\u0E0A\u0E35\u0E49\u0E27\u0E31\u0E14",
    "baseline comparison": "\u0E01\u0E32\u0E23\u0E40\u0E1B\u0E23\u0E35\u0E22\u0E1A\u0E40\u0E17\u0E35\u0E22\u0E1A\u0E01\u0E31\u0E1A\u0E10\u0E32\u0E19\u0E2D\u0E49\u0E32\u0E07\u0E2D\u0E34\u0E07",
    "bias and leakage risks": "\u0E04\u0E27\u0E32\u0E21\u0E40\u0E2A\u0E35\u0E48\u0E22\u0E07\u0E08\u0E32\u0E01\u0E2D\u0E04\u0E15\u0E34\u0E41\u0E25\u0E30\u0E01\u0E32\u0E23\u0E23\u0E31\u0E48\u0E27\u0E44\u0E2B\u0E25",
    "robustness checks": "\u0E01\u0E32\u0E23\u0E15\u0E23\u0E27\u0E08\u0E2A\u0E2D\u0E1A\u0E04\u0E27\u0E32\u0E21\u0E17\u0E19\u0E17\u0E32\u0E19",
    "failure modes": "\u0E23\u0E39\u0E1B\u0E41\u0E1A\u0E1A\u0E04\u0E27\u0E32\u0E21\u0E25\u0E49\u0E21\u0E40\u0E2B\u0E25\u0E27",
    "materials and tools": "\u0E27\u0E31\u0E2A\u0E14\u0E38\u0E41\u0E25\u0E30\u0E40\u0E04\u0E23\u0E37\u0E48\u0E2D\u0E07\u0E21\u0E37\u0E2D",
    "style or quality standards": "\u0E21\u0E32\u0E15\u0E23\u0E10\u0E32\u0E19\u0E2A\u0E44\u0E15\u0E25\u0E4C\u0E2B\u0E23\u0E37\u0E2D\u0E04\u0E38\u0E13\u0E20\u0E32\u0E1E",
    "core techniques": "\u0E40\u0E17\u0E04\u0E19\u0E34\u0E04\u0E2B\u0E25\u0E31\u0E01",
    "process": "\u0E01\u0E23\u0E30\u0E1A\u0E27\u0E19\u0E01\u0E32\u0E23",
    "representative cases": "\u0E01\u0E23\u0E13\u0E35\u0E15\u0E31\u0E27\u0E41\u0E17\u0E19",
    "sensory or output standards": "\u0E21\u0E32\u0E15\u0E23\u0E10\u0E32\u0E19\u0E17\u0E32\u0E07\u0E1B\u0E23\u0E30\u0E2A\u0E32\u0E17\u0E2A\u0E31\u0E21\u0E1C\u0E31\u0E2A\u0E2B\u0E23\u0E37\u0E2D\u0E1C\u0E25\u0E25\u0E31\u0E1E\u0E18\u0E4C",
    "common failures and fixes": "\u0E04\u0E27\u0E32\u0E21\u0E25\u0E49\u0E21\u0E40\u0E2B\u0E25\u0E27\u0E17\u0E35\u0E48\u0E1E\u0E1A\u0E1A\u0E48\u0E2D\u0E22\u0E41\u0E25\u0E30\u0E27\u0E34\u0E18\u0E35\u0E41\u0E01\u0E49",
    "timeline": "\u0E40\u0E2A\u0E49\u0E19\u0E40\u0E27\u0E25\u0E32",
    "key actors, works, or institutions": "\u0E1A\u0E38\u0E04\u0E04\u0E25 \u0E1C\u0E25\u0E07\u0E32\u0E19 \u0E2B\u0E23\u0E37\u0E2D\u0E2A\u0E16\u0E32\u0E1A\u0E31\u0E19\u0E2A\u0E33\u0E04\u0E31\u0E0D",
    "causal forces": "\u0E1B\u0E31\u0E08\u0E08\u0E31\u0E22\u0E40\u0E0A\u0E34\u0E07\u0E2A\u0E32\u0E40\u0E2B\u0E15\u0E38",
    "major transitions": "\u0E01\u0E32\u0E23\u0E40\u0E1B\u0E25\u0E35\u0E48\u0E22\u0E19\u0E1C\u0E48\u0E32\u0E19\u0E2B\u0E25\u0E31\u0E01",
    "conflicts or debates": "\u0E04\u0E27\u0E32\u0E21\u0E02\u0E31\u0E14\u0E41\u0E22\u0E49\u0E07\u0E2B\u0E23\u0E37\u0E2D\u0E02\u0E49\u0E2D\u0E16\u0E01\u0E40\u0E16\u0E35\u0E22\u0E07",
    "legacy and modern relevance": "\u0E21\u0E23\u0E14\u0E01\u0E41\u0E25\u0E30\u0E04\u0E27\u0E32\u0E21\u0E40\u0E01\u0E35\u0E48\u0E22\u0E27\u0E02\u0E49\u0E2D\u0E07\u0E43\u0E19\u0E1B\u0E31\u0E08\u0E08\u0E38\u0E1A\u0E31\u0E19"
  },
  id: {
    "orientation": "Orientasi Belajar",
    "prerequisite map": "Peta Prasyarat",
    "core concept map": "Peta Konsep Inti",
    "concept explanations": "Penjelasan Konsep",
    "relationships and tradeoffs": "Relasi dan Trade-off",
    "examples": "Contoh",
    "common misconceptions": "Kesalahpahaman Umum",
    "retrieval questions": "Pertanyaan Ingatan",
    "next steps": "Langkah Berikutnya",
    "core quantities and models": "Besaran dan Model Inti",
    "symbols, units, and dimensions": "Simbol, Satuan, dan Dimensi",
    "formula intuition": "Intuisi Rumus",
    "assumptions and regimes": "Asumsi dan Rezim Penerapan",
    "worked examples": "Contoh Terhitung",
    "edge cases and limiting cases": "Kasus Tepi dan Kasus Batas",
    "common mistakes": "Kesalahan Umum",
    "minimal working workflow": "Alur Kerja Minimum yang Berfungsi",
    "prerequisite tools and setup": "Alat dan Pengaturan Prasyarat",
    "core tasks": "Tugas Inti",
    "step-by-step workflows": "Alur Kerja Langkah demi Langkah",
    "verification checklist": "Daftar Periksa Verifikasi",
    "common mistakes and troubleshooting": "Kesalahan Umum dan Pemecahan Masalah",
    "practice tasks": "Tugas Latihan",
    "hypothesis": "Hipotesis",
    "data and assumptions": "Data dan Asumsi",
    "evaluation pipeline": "Alur Evaluasi",
    "metrics": "Metrik",
    "baseline comparison": "Perbandingan Baseline",
    "bias and leakage risks": "Risiko Bias dan Kebocoran",
    "robustness checks": "Pemeriksaan Robustness",
    "failure modes": "Mode Kegagalan",
    "materials and tools": "Bahan dan Alat",
    "style or quality standards": "Standar Gaya atau Kualitas",
    "core techniques": "Teknik Inti",
    "process": "Proses",
    "representative cases": "Kasus Representatif",
    "sensory or output standards": "Standar Sensorik atau Output",
    "common failures and fixes": "Kegagalan Umum dan Perbaikan",
    "timeline": "Linimasa",
    "key actors, works, or institutions": "Aktor, Karya, atau Institusi Kunci",
    "causal forces": "Kekuatan Kausal",
    "major transitions": "Transisi Besar",
    "conflicts or debates": "Konflik atau Perdebatan",
    "legacy and modern relevance": "Warisan dan Relevansi Modern"
  },
  ms: {
    "orientation": "Orientasi Pembelajaran",
    "prerequisite map": "Peta Prasyarat",
    "core concept map": "Peta Konsep Teras",
    "concept explanations": "Penjelasan Konsep",
    "relationships and tradeoffs": "Hubungan dan Tukar Ganti",
    "examples": "Contoh",
    "common misconceptions": "Salah Faham Lazim",
    "retrieval questions": "Soalan Ingatan Semula",
    "next steps": "Langkah Seterusnya",
    "core quantities and models": "Kuantiti dan Model Teras",
    "symbols, units, and dimensions": "Simbol, Unit, dan Dimensi",
    "formula intuition": "Intuisi Formula",
    "assumptions and regimes": "Andaian dan Rejim Aplikasi",
    "worked examples": "Contoh Berjawapan",
    "edge cases and limiting cases": "Kes Pinggir dan Kes Had",
    "common mistakes": "Kesilapan Lazim",
    "minimal working workflow": "Aliran Kerja Minimum yang Berfungsi",
    "prerequisite tools and setup": "Alat dan Tetapan Prasyarat",
    "core tasks": "Tugas Teras",
    "step-by-step workflows": "Aliran Kerja Langkah demi Langkah",
    "verification checklist": "Senarai Semak Pengesahan",
    "common mistakes and troubleshooting": "Kesilapan Lazim dan Penyelesaian Masalah",
    "practice tasks": "Tugas Latihan",
    "hypothesis": "Hipotesis",
    "data and assumptions": "Data dan Andaian",
    "evaluation pipeline": "Saluran Penilaian",
    "metrics": "Metrik",
    "baseline comparison": "Perbandingan Garis Dasar",
    "bias and leakage risks": "Risiko Bias dan Kebocoran",
    "robustness checks": "Semakan Keteguhan",
    "failure modes": "Mod Kegagalan",
    "materials and tools": "Bahan dan Alat",
    "style or quality standards": "Piawaian Gaya atau Kualiti",
    "core techniques": "Teknik Teras",
    "process": "Proses",
    "representative cases": "Kes Perwakilan",
    "sensory or output standards": "Piawaian Deria atau Output",
    "common failures and fixes": "Kegagalan Lazim dan Pembetulan",
    "timeline": "Garis Masa",
    "key actors, works, or institutions": "Tokoh, Karya, atau Institusi Utama",
    "causal forces": "Kuasa Sebab Akibat",
    "major transitions": "Peralihan Utama",
    "conflicts or debates": "Konflik atau Perdebatan",
    "legacy and modern relevance": "Warisan dan Kerelevanan Moden"
  },
  hi: {
    "orientation": "\u0938\u0940\u0916\u0928\u0947 \u0915\u0940 \u0926\u093F\u0936\u093E",
    "prerequisite map": "\u092A\u0942\u0930\u094D\u0935\u091C\u094D\u091E\u093E\u0928 \u092E\u093E\u0928\u091A\u093F\u0924\u094D\u0930",
    "core concept map": "\u092E\u0941\u0916\u094D\u092F \u0905\u0935\u0927\u093E\u0930\u0923\u093E \u092E\u093E\u0928\u091A\u093F\u0924\u094D\u0930",
    "concept explanations": "\u0905\u0935\u0927\u093E\u0930\u0923\u093E \u0935\u094D\u092F\u093E\u0916\u094D\u092F\u093E\u090F\u0901",
    "relationships and tradeoffs": "\u0938\u0902\u092C\u0902\u0927 \u0914\u0930 \u0938\u092E\u091D\u094C\u0924\u0947",
    "examples": "\u0909\u0926\u093E\u0939\u0930\u0923",
    "common misconceptions": "\u0938\u093E\u092E\u093E\u0928\u094D\u092F \u092D\u094D\u0930\u093E\u0902\u0924\u093F\u092F\u093E\u0901",
    "retrieval questions": "\u0938\u094D\u092E\u0930\u0923 \u0905\u092D\u094D\u092F\u093E\u0938 \u092A\u094D\u0930\u0936\u094D\u0928",
    "next steps": "\u0905\u0917\u0932\u0947 \u0915\u0926\u092E",
    "core quantities and models": "\u092E\u0941\u0916\u094D\u092F \u0930\u093E\u0936\u093F\u092F\u093E\u0901 \u0914\u0930 \u092E\u0949\u0921\u0932",
    "symbols, units, and dimensions": "\u092A\u094D\u0930\u0924\u0940\u0915, \u0907\u0915\u093E\u0907\u092F\u093E\u0901 \u0914\u0930 \u0906\u092F\u093E\u092E",
    "formula intuition": "\u0938\u0942\u0924\u094D\u0930 \u0915\u0940 \u0938\u0939\u091C \u0938\u092E\u091D",
    "assumptions and regimes": "\u092E\u093E\u0928\u094D\u092F\u0924\u093E\u090F\u0901 \u0914\u0930 \u0932\u093E\u0917\u0942 \u0915\u094D\u0937\u0947\u0924\u094D\u0930",
    "worked examples": "\u0939\u0932 \u0915\u093F\u090F \u0917\u090F \u0909\u0926\u093E\u0939\u0930\u0923",
    "edge cases and limiting cases": "\u0915\u093F\u0928\u093E\u0930\u0940 \u0914\u0930 \u0938\u0940\u092E\u093F\u0924 \u092E\u093E\u092E\u0932\u0947",
    "common mistakes": "\u0938\u093E\u092E\u093E\u0928\u094D\u092F \u0917\u0932\u0924\u093F\u092F\u093E\u0901",
    "minimal working workflow": "\u0928\u094D\u092F\u0942\u0928\u0924\u092E \u0915\u093E\u0930\u094D\u092F\u0936\u0940\u0932 \u092A\u094D\u0930\u0935\u093E\u0939",
    "prerequisite tools and setup": "\u0906\u0935\u0936\u094D\u092F\u0915 \u0909\u092A\u0915\u0930\u0923 \u0914\u0930 \u0938\u0947\u091F\u0905\u092A",
    "core tasks": "\u092E\u0941\u0916\u094D\u092F \u0915\u093E\u0930\u094D\u092F",
    "step-by-step workflows": "\u091A\u0930\u0923\u092C\u0926\u094D\u0927 \u0915\u093E\u0930\u094D\u092F\u092A\u094D\u0930\u0935\u093E\u0939",
    "verification checklist": "\u0938\u0924\u094D\u092F\u093E\u092A\u0928 \u0938\u0942\u091A\u0940",
    "common mistakes and troubleshooting": "\u0938\u093E\u092E\u093E\u0928\u094D\u092F \u0917\u0932\u0924\u093F\u092F\u093E\u0901 \u0914\u0930 \u0938\u092E\u0938\u094D\u092F\u093E \u0938\u092E\u093E\u0927\u093E\u0928",
    "practice tasks": "\u0905\u092D\u094D\u092F\u093E\u0938 \u0915\u093E\u0930\u094D\u092F",
    "hypothesis": "\u092A\u0930\u093F\u0915\u0932\u094D\u092A\u0928\u093E",
    "data and assumptions": "\u0921\u0947\u091F\u093E \u0914\u0930 \u092E\u093E\u0928\u094D\u092F\u0924\u093E\u090F\u0901",
    "evaluation pipeline": "\u092E\u0942\u0932\u094D\u092F\u093E\u0902\u0915\u0928 \u092A\u094D\u0930\u0935\u093E\u0939",
    "metrics": "\u092E\u093E\u092A\u0926\u0902\u0921",
    "baseline comparison": "\u0906\u0927\u093E\u0930\u0930\u0947\u0916\u093E \u0924\u0941\u0932\u0928\u093E",
    "bias and leakage risks": "\u092A\u0915\u094D\u0937\u092A\u093E\u0924 \u0914\u0930 \u0930\u093F\u0938\u093E\u0935 \u091C\u094B\u0916\u093F\u092E",
    "robustness checks": "\u092E\u091C\u092C\u0942\u0924\u0940 \u091C\u093E\u0901\u091A",
    "failure modes": "\u0935\u093F\u092B\u0932\u0924\u093E \u0930\u0942\u092A",
    "materials and tools": "\u0938\u093E\u092E\u0917\u094D\u0930\u0940 \u0914\u0930 \u0909\u092A\u0915\u0930\u0923",
    "style or quality standards": "\u0936\u0948\u0932\u0940 \u092F\u093E \u0917\u0941\u0923\u0935\u0924\u094D\u0924\u093E \u092E\u093E\u0928\u0915",
    "core techniques": "\u092E\u0941\u0916\u094D\u092F \u0924\u0915\u0928\u0940\u0915\u0947\u0902",
    "process": "\u092A\u094D\u0930\u0915\u094D\u0930\u093F\u092F\u093E",
    "representative cases": "\u092A\u094D\u0930\u0924\u093F\u0928\u093F\u0927\u093F \u092E\u093E\u092E\u0932\u0947",
    "sensory or output standards": "\u0938\u0902\u0935\u0947\u0926\u0940 \u092F\u093E \u0906\u0909\u091F\u092A\u0941\u091F \u092E\u093E\u0928\u0915",
    "common failures and fixes": "\u0938\u093E\u092E\u093E\u0928\u094D\u092F \u0935\u093F\u092B\u0932\u0924\u093E\u090F\u0901 \u0914\u0930 \u0938\u0941\u0927\u093E\u0930",
    "timeline": "\u0938\u092E\u092F\u0930\u0947\u0916\u093E",
    "key actors, works, or institutions": "\u092E\u0941\u0916\u094D\u092F \u0935\u094D\u092F\u0915\u094D\u0924\u093F, \u0915\u0943\u0924\u093F\u092F\u093E\u0901 \u092F\u093E \u0938\u0902\u0938\u094D\u0925\u093E\u0928",
    "causal forces": "\u0915\u093E\u0930\u0923\u0915\u093E\u0930\u0940 \u0936\u0915\u094D\u0924\u093F\u092F\u093E\u0901",
    "major transitions": "\u092E\u0941\u0916\u094D\u092F \u0938\u0902\u0915\u094D\u0930\u092E\u0923",
    "conflicts or debates": "\u0938\u0902\u0918\u0930\u094D\u0937 \u092F\u093E \u092C\u0939\u0938\u0947\u0902",
    "legacy and modern relevance": "\u0935\u093F\u0930\u093E\u0938\u0924 \u0914\u0930 \u0906\u0927\u0941\u0928\u093F\u0915 \u092A\u094D\u0930\u093E\u0938\u0902\u0917\u093F\u0915\u0924\u093E"
  },
  ar: {
    "orientation": "\u062A\u0648\u062C\u064A\u0647 \u0627\u0644\u062A\u0639\u0644\u0645",
    "prerequisite map": "\u062E\u0631\u064A\u0637\u0629 \u0627\u0644\u0645\u062A\u0637\u0644\u0628\u0627\u062A \u0627\u0644\u0633\u0627\u0628\u0642\u0629",
    "core concept map": "\u062E\u0631\u064A\u0637\u0629 \u0627\u0644\u0645\u0641\u0627\u0647\u064A\u0645 \u0627\u0644\u0623\u0633\u0627\u0633\u064A\u0629",
    "concept explanations": "\u0634\u0631\u062D \u0627\u0644\u0645\u0641\u0627\u0647\u064A\u0645",
    "relationships and tradeoffs": "\u0627\u0644\u0639\u0644\u0627\u0642\u0627\u062A \u0648\u0627\u0644\u0645\u0641\u0627\u0636\u0644\u0627\u062A",
    "examples": "\u0623\u0645\u062B\u0644\u0629",
    "common misconceptions": "\u0627\u0644\u0645\u0641\u0627\u0647\u064A\u0645 \u0627\u0644\u062E\u0627\u0637\u0626\u0629 \u0627\u0644\u0634\u0627\u0626\u0639\u0629",
    "retrieval questions": "\u0623\u0633\u0626\u0644\u0629 \u0627\u0644\u0627\u0633\u062A\u0631\u062C\u0627\u0639",
    "next steps": "\u0627\u0644\u062E\u0637\u0648\u0627\u062A \u0627\u0644\u062A\u0627\u0644\u064A\u0629",
    "core quantities and models": "\u0627\u0644\u0643\u0645\u064A\u0627\u062A \u0648\u0627\u0644\u0646\u0645\u0627\u0630\u062C \u0627\u0644\u0623\u0633\u0627\u0633\u064A\u0629",
    "symbols, units, and dimensions": "\u0627\u0644\u0631\u0645\u0648\u0632 \u0648\u0627\u0644\u0648\u062D\u062F\u0627\u062A \u0648\u0627\u0644\u0623\u0628\u0639\u0627\u062F",
    "formula intuition": "\u062D\u062F\u0633 \u0627\u0644\u0635\u064A\u063A",
    "assumptions and regimes": "\u0627\u0644\u0627\u0641\u062A\u0631\u0627\u0636\u0627\u062A \u0648\u0646\u0637\u0627\u0642\u0627\u062A \u0627\u0644\u062A\u0637\u0628\u064A\u0642",
    "worked examples": "\u0623\u0645\u062B\u0644\u0629 \u0645\u062D\u0644\u0648\u0644\u0629",
    "edge cases and limiting cases": "\u0627\u0644\u062D\u0627\u0644\u0627\u062A \u0627\u0644\u062D\u062F\u064A\u0629 \u0648\u062D\u0627\u0644\u0627\u062A \u0627\u0644\u0646\u0647\u0627\u064A\u0629",
    "common mistakes": "\u0627\u0644\u0623\u062E\u0637\u0627\u0621 \u0627\u0644\u0634\u0627\u0626\u0639\u0629",
    "minimal working workflow": "\u0633\u064A\u0631 \u0639\u0645\u0644 \u0623\u062F\u0646\u0649 \u0642\u0627\u0628\u0644 \u0644\u0644\u0627\u0633\u062A\u062E\u062F\u0627\u0645",
    "prerequisite tools and setup": "\u0627\u0644\u0623\u062F\u0648\u0627\u062A \u0648\u0627\u0644\u0625\u0639\u062F\u0627\u062F\u0627\u062A \u0627\u0644\u0645\u0637\u0644\u0648\u0628\u0629",
    "core tasks": "\u0627\u0644\u0645\u0647\u0627\u0645 \u0627\u0644\u0623\u0633\u0627\u0633\u064A\u0629",
    "step-by-step workflows": "\u0633\u064A\u0631 \u0627\u0644\u0639\u0645\u0644 \u062E\u0637\u0648\u0629 \u0628\u062E\u0637\u0648\u0629",
    "verification checklist": "\u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u062A\u062D\u0642\u0642",
    "common mistakes and troubleshooting": "\u0627\u0644\u0623\u062E\u0637\u0627\u0621 \u0627\u0644\u0634\u0627\u0626\u0639\u0629 \u0648\u0627\u0633\u062A\u0643\u0634\u0627\u0641 \u0627\u0644\u0645\u0634\u0643\u0644\u0627\u062A",
    "practice tasks": "\u0645\u0647\u0627\u0645 \u062A\u062F\u0631\u064A\u0628\u064A\u0629",
    "hypothesis": "\u0627\u0644\u0641\u0631\u0636\u064A\u0629",
    "data and assumptions": "\u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0648\u0627\u0644\u0627\u0641\u062A\u0631\u0627\u0636\u0627\u062A",
    "evaluation pipeline": "\u062E\u0637 \u0633\u064A\u0631 \u0627\u0644\u062A\u0642\u064A\u064A\u0645",
    "metrics": "\u0627\u0644\u0645\u0642\u0627\u064A\u064A\u0633",
    "baseline comparison": "\u0645\u0642\u0627\u0631\u0646\u0629 \u062E\u0637 \u0627\u0644\u0623\u0633\u0627\u0633",
    "bias and leakage risks": "\u0645\u062E\u0627\u0637\u0631 \u0627\u0644\u062A\u062D\u064A\u0632 \u0648\u0627\u0644\u062A\u0633\u0631\u0628",
    "robustness checks": "\u0627\u062E\u062A\u0628\u0627\u0631\u0627\u062A \u0627\u0644\u0645\u062A\u0627\u0646\u0629",
    "failure modes": "\u0623\u0646\u0645\u0627\u0637 \u0627\u0644\u0641\u0634\u0644",
    "materials and tools": "\u0627\u0644\u0645\u0648\u0627\u062F \u0648\u0627\u0644\u0623\u062F\u0648\u0627\u062A",
    "style or quality standards": "\u0645\u0639\u0627\u064A\u064A\u0631 \u0627\u0644\u0623\u0633\u0644\u0648\u0628 \u0623\u0648 \u0627\u0644\u062C\u0648\u062F\u0629",
    "core techniques": "\u0627\u0644\u062A\u0642\u0646\u064A\u0627\u062A \u0627\u0644\u0623\u0633\u0627\u0633\u064A\u0629",
    "process": "\u0627\u0644\u0639\u0645\u0644\u064A\u0629",
    "representative cases": "\u062D\u0627\u0644\u0627\u062A \u062A\u0645\u062B\u064A\u0644\u064A\u0629",
    "sensory or output standards": "\u0645\u0639\u0627\u064A\u064A\u0631 \u062D\u0633\u064A\u0629 \u0623\u0648 \u0645\u062E\u0631\u062C\u0627\u062A",
    "common failures and fixes": "\u0627\u0644\u0625\u062E\u0641\u0627\u0642\u0627\u062A \u0627\u0644\u0634\u0627\u0626\u0639\u0629 \u0648\u0625\u0635\u0644\u0627\u062D\u0647\u0627",
    "timeline": "\u0627\u0644\u062E\u0637 \u0627\u0644\u0632\u0645\u0646\u064A",
    "key actors, works, or institutions": "\u0627\u0644\u0641\u0627\u0639\u0644\u0648\u0646 \u0623\u0648 \u0627\u0644\u0623\u0639\u0645\u0627\u0644 \u0623\u0648 \u0627\u0644\u0645\u0624\u0633\u0633\u0627\u062A \u0627\u0644\u0631\u0626\u064A\u0633\u064A\u0629",
    "causal forces": "\u0627\u0644\u0642\u0648\u0649 \u0627\u0644\u0633\u0628\u0628\u064A\u0629",
    "major transitions": "\u0627\u0644\u062A\u062D\u0648\u0644\u0627\u062A \u0627\u0644\u0643\u0628\u0631\u0649",
    "conflicts or debates": "\u0627\u0644\u0635\u0631\u0627\u0639\u0627\u062A \u0623\u0648 \u0627\u0644\u0646\u0642\u0627\u0634\u0627\u062A",
    "legacy and modern relevance": "\u0627\u0644\u0625\u0631\u062B \u0648\u0627\u0644\u0623\u0647\u0645\u064A\u0629 \u0627\u0644\u062D\u062F\u064A\u062B\u0629"
  },
  de: {
    "orientation": "Lernorientierung",
    "prerequisite map": "Karte der Vorkenntnisse",
    "core concept map": "Karte der Kernkonzepte",
    "concept explanations": "Konzept-Erkl\xE4rungen",
    "relationships and tradeoffs": "Beziehungen und Abw\xE4gungen",
    "examples": "Beispiele",
    "common misconceptions": "H\xE4ufige Missverst\xE4ndnisse",
    "retrieval questions": "Abruffragen",
    "next steps": "N\xE4chste Schritte",
    "core quantities and models": "Kern-Gr\xF6\xDFen und Modelle",
    "symbols, units, and dimensions": "Symbole, Einheiten und Dimensionen",
    "formula intuition": "Formelintuition",
    "assumptions and regimes": "Annahmen und G\xFCltigkeitsbereiche",
    "worked examples": "Durchgerechnete Beispiele",
    "edge cases and limiting cases": "Randf\xE4lle und Grenzf\xE4lle",
    "common mistakes": "H\xE4ufige Fehler",
    "minimal working workflow": "Minimaler funktionsf\xE4higer Ablauf",
    "prerequisite tools and setup": "Erforderliche Werkzeuge und Einrichtung",
    "core tasks": "Kernaufgaben",
    "step-by-step workflows": "Schritt-f\xFCr-Schritt-Abl\xE4ufe",
    "verification checklist": "Pr\xFCfliste",
    "common mistakes and troubleshooting": "H\xE4ufige Fehler und Fehlersuche",
    "practice tasks": "\xDCbungsaufgaben",
    "hypothesis": "Hypothese",
    "data and assumptions": "Daten und Annahmen",
    "evaluation pipeline": "Bewertungsablauf",
    "metrics": "Metriken",
    "baseline comparison": "Vergleich mit der Basislinie",
    "bias and leakage risks": "Risiken durch Verzerrung und Leakage",
    "robustness checks": "Robustheitspr\xFCfungen",
    "failure modes": "Fehlermodi",
    "materials and tools": "Materialien und Werkzeuge",
    "style or quality standards": "Stil- oder Qualit\xE4tsstandards",
    "core techniques": "Kerntechniken",
    "process": "Prozess",
    "representative cases": "Repr\xE4sentative F\xE4lle",
    "sensory or output standards": "Sinnes- oder Ausgabestandards",
    "common failures and fixes": "H\xE4ufige Fehlschl\xE4ge und Korrekturen",
    "timeline": "Zeitlinie",
    "key actors, works, or institutions": "Schl\xFCsselakteure, Werke oder Institutionen",
    "causal forces": "Kausale Kr\xE4fte",
    "major transitions": "Wichtige \xDCberg\xE4nge",
    "conflicts or debates": "Konflikte oder Debatten",
    "legacy and modern relevance": "Verm\xE4chtnis und heutige Relevanz"
  },
  fr: {
    "orientation": "Orientation d'apprentissage",
    "prerequisite map": "Carte des pr\xE9requis",
    "core concept map": "Carte des concepts cl\xE9s",
    "concept explanations": "Explications des concepts",
    "relationships and tradeoffs": "Relations et compromis",
    "examples": "Exemples",
    "common misconceptions": "Id\xE9es re\xE7ues courantes",
    "retrieval questions": "Questions de rappel",
    "next steps": "\xC9tapes suivantes",
    "core quantities and models": "Grandeurs et mod\xE8les cl\xE9s",
    "symbols, units, and dimensions": "Symboles, unit\xE9s et dimensions",
    "formula intuition": "Intuition des formules",
    "assumptions and regimes": "Hypoth\xE8ses et r\xE9gimes d'application",
    "worked examples": "Exemples corrig\xE9s",
    "edge cases and limiting cases": "Cas limites et cas aux fronti\xE8res",
    "common mistakes": "Erreurs courantes",
    "minimal working workflow": "Flux de travail minimal fonctionnel",
    "prerequisite tools and setup": "Outils et configuration requis",
    "core tasks": "T\xE2ches cl\xE9s",
    "step-by-step workflows": "Flux de travail \xE9tape par \xE9tape",
    "verification checklist": "Liste de v\xE9rification",
    "common mistakes and troubleshooting": "Erreurs courantes et d\xE9pannage",
    "practice tasks": "Exercices pratiques",
    "hypothesis": "Hypoth\xE8se",
    "data and assumptions": "Donn\xE9es et hypoth\xE8ses",
    "evaluation pipeline": "Cha\xEEne d'\xE9valuation",
    "metrics": "M\xE9triques",
    "baseline comparison": "Comparaison avec la r\xE9f\xE9rence",
    "bias and leakage risks": "Risques de biais et de fuite",
    "robustness checks": "Contr\xF4les de robustesse",
    "failure modes": "Modes d'\xE9chec",
    "materials and tools": "Mat\xE9riaux et outils",
    "style or quality standards": "Normes de style ou de qualit\xE9",
    "core techniques": "Techniques cl\xE9s",
    "process": "Processus",
    "representative cases": "Cas repr\xE9sentatifs",
    "sensory or output standards": "Normes sensorielles ou de sortie",
    "common failures and fixes": "\xC9checs courants et corrections",
    "timeline": "Chronologie",
    "key actors, works, or institutions": "Acteurs, \u0153uvres ou institutions cl\xE9s",
    "causal forces": "Forces causales",
    "major transitions": "Transitions majeures",
    "conflicts or debates": "Conflits ou d\xE9bats",
    "legacy and modern relevance": "H\xE9ritage et pertinence moderne"
  },
  es: {
    "orientation": "Orientaci\xF3n de aprendizaje",
    "prerequisite map": "Mapa de requisitos previos",
    "core concept map": "Mapa de conceptos centrales",
    "concept explanations": "Explicaciones de conceptos",
    "relationships and tradeoffs": "Relaciones y compensaciones",
    "examples": "Ejemplos",
    "common misconceptions": "Malentendidos comunes",
    "retrieval questions": "Preguntas de recuperaci\xF3n",
    "next steps": "Pr\xF3ximos pasos",
    "core quantities and models": "Magnitudes y modelos centrales",
    "symbols, units, and dimensions": "S\xEDmbolos, unidades y dimensiones",
    "formula intuition": "Intuici\xF3n de las f\xF3rmulas",
    "assumptions and regimes": "Supuestos y reg\xEDmenes de aplicaci\xF3n",
    "worked examples": "Ejemplos resueltos",
    "edge cases and limiting cases": "Casos extremos y casos l\xEDmite",
    "common mistakes": "Errores comunes",
    "minimal working workflow": "Flujo m\xEDnimo funcional",
    "prerequisite tools and setup": "Herramientas y configuraci\xF3n previas",
    "core tasks": "Tareas centrales",
    "step-by-step workflows": "Flujos paso a paso",
    "verification checklist": "Lista de verificaci\xF3n",
    "common mistakes and troubleshooting": "Errores comunes y soluci\xF3n de problemas",
    "practice tasks": "Tareas de pr\xE1ctica",
    "hypothesis": "Hip\xF3tesis",
    "data and assumptions": "Datos y supuestos",
    "evaluation pipeline": "Flujo de evaluaci\xF3n",
    "metrics": "M\xE9tricas",
    "baseline comparison": "Comparaci\xF3n con la l\xEDnea base",
    "bias and leakage risks": "Riesgos de sesgo y fuga",
    "robustness checks": "Comprobaciones de robustez",
    "failure modes": "Modos de fallo",
    "materials and tools": "Materiales y herramientas",
    "style or quality standards": "Est\xE1ndares de estilo o calidad",
    "core techniques": "T\xE9cnicas centrales",
    "process": "Proceso",
    "representative cases": "Casos representativos",
    "sensory or output standards": "Est\xE1ndares sensoriales o de salida",
    "common failures and fixes": "Fallos comunes y correcciones",
    "timeline": "Cronolog\xEDa",
    "key actors, works, or institutions": "Actores, obras o instituciones clave",
    "causal forces": "Fuerzas causales",
    "major transitions": "Transiciones principales",
    "conflicts or debates": "Conflictos o debates",
    "legacy and modern relevance": "Legado y relevancia moderna"
  },
  it: {
    "orientation": "Orientamento allo studio",
    "prerequisite map": "Mappa dei prerequisiti",
    "core concept map": "Mappa dei concetti centrali",
    "concept explanations": "Spiegazioni dei concetti",
    "relationships and tradeoffs": "Relazioni e compromessi",
    "examples": "Esempi",
    "common misconceptions": "Fraintendimenti comuni",
    "retrieval questions": "Domande di recupero",
    "next steps": "Passi successivi",
    "core quantities and models": "Quantit\xE0 e modelli centrali",
    "symbols, units, and dimensions": "Simboli, unit\xE0 e dimensioni",
    "formula intuition": "Intuizione delle formule",
    "assumptions and regimes": "Assunzioni e regimi di validit\xE0",
    "worked examples": "Esempi svolti",
    "edge cases and limiting cases": "Casi limite e casi estremi",
    "common mistakes": "Errori comuni",
    "minimal working workflow": "Flusso minimo funzionante",
    "prerequisite tools and setup": "Strumenti e configurazione preliminari",
    "core tasks": "Compiti centrali",
    "step-by-step workflows": "Flussi passo per passo",
    "verification checklist": "Lista di verifica",
    "common mistakes and troubleshooting": "Errori comuni e risoluzione dei problemi",
    "practice tasks": "Esercizi pratici",
    "hypothesis": "Ipotesi",
    "data and assumptions": "Dati e assunzioni",
    "evaluation pipeline": "Pipeline di valutazione",
    "metrics": "Metriche",
    "baseline comparison": "Confronto con la baseline",
    "bias and leakage risks": "Rischi di bias e leakage",
    "robustness checks": "Controlli di robustezza",
    "failure modes": "Modalit\xE0 di fallimento",
    "materials and tools": "Materiali e strumenti",
    "style or quality standards": "Standard di stile o qualit\xE0",
    "core techniques": "Tecniche centrali",
    "process": "Processo",
    "representative cases": "Casi rappresentativi",
    "sensory or output standards": "Standard sensoriali o di output",
    "common failures and fixes": "Fallimenti comuni e correzioni",
    "timeline": "Linea temporale",
    "key actors, works, or institutions": "Attori, opere o istituzioni chiave",
    "causal forces": "Forze causali",
    "major transitions": "Transizioni principali",
    "conflicts or debates": "Conflitti o dibattiti",
    "legacy and modern relevance": "Eredit\xE0 e rilevanza moderna"
  },
  pt: {
    "orientation": "Orienta\xE7\xE3o de aprendizagem",
    "prerequisite map": "Mapa de pr\xE9-requisitos",
    "core concept map": "Mapa de conceitos centrais",
    "concept explanations": "Explica\xE7\xF5es de conceitos",
    "relationships and tradeoffs": "Rela\xE7\xF5es e trade-offs",
    "examples": "Exemplos",
    "common misconceptions": "Equ\xEDvocos comuns",
    "retrieval questions": "Perguntas de recupera\xE7\xE3o",
    "next steps": "Pr\xF3ximos passos",
    "core quantities and models": "Quantidades e modelos centrais",
    "symbols, units, and dimensions": "S\xEDmbolos, unidades e dimens\xF5es",
    "formula intuition": "Intui\xE7\xE3o das f\xF3rmulas",
    "assumptions and regimes": "Suposi\xE7\xF5es e regimes de aplica\xE7\xE3o",
    "worked examples": "Exemplos resolvidos",
    "edge cases and limiting cases": "Casos de borda e casos limite",
    "common mistakes": "Erros comuns",
    "minimal working workflow": "Fluxo m\xEDnimo funcional",
    "prerequisite tools and setup": "Ferramentas e configura\xE7\xE3o pr\xE9vias",
    "core tasks": "Tarefas centrais",
    "step-by-step workflows": "Fluxos passo a passo",
    "verification checklist": "Lista de verifica\xE7\xE3o",
    "common mistakes and troubleshooting": "Erros comuns e solu\xE7\xE3o de problemas",
    "practice tasks": "Tarefas pr\xE1ticas",
    "hypothesis": "Hip\xF3tese",
    "data and assumptions": "Dados e suposi\xE7\xF5es",
    "evaluation pipeline": "Pipeline de avalia\xE7\xE3o",
    "metrics": "M\xE9tricas",
    "baseline comparison": "Compara\xE7\xE3o com baseline",
    "bias and leakage risks": "Riscos de vi\xE9s e vazamento",
    "robustness checks": "Verifica\xE7\xF5es de robustez",
    "failure modes": "Modos de falha",
    "materials and tools": "Materiais e ferramentas",
    "style or quality standards": "Padr\xF5es de estilo ou qualidade",
    "core techniques": "T\xE9cnicas centrais",
    "process": "Processo",
    "representative cases": "Casos representativos",
    "sensory or output standards": "Padr\xF5es sensoriais ou de sa\xEDda",
    "common failures and fixes": "Falhas comuns e corre\xE7\xF5es",
    "timeline": "Linha do tempo",
    "key actors, works, or institutions": "Atores, obras ou institui\xE7\xF5es-chave",
    "causal forces": "For\xE7as causais",
    "major transitions": "Transi\xE7\xF5es principais",
    "conflicts or debates": "Conflitos ou debates",
    "legacy and modern relevance": "Legado e relev\xE2ncia moderna"
  },
  nl: {
    "orientation": "Leerori\xEBntatie",
    "prerequisite map": "Kaart van voorkennis",
    "core concept map": "Kaart van kernconcepten",
    "concept explanations": "Uitleg van concepten",
    "relationships and tradeoffs": "Relaties en afwegingen",
    "examples": "Voorbeelden",
    "common misconceptions": "Veelvoorkomende misvattingen",
    "retrieval questions": "Ophaalvragen",
    "next steps": "Volgende stappen",
    "core quantities and models": "Kern-grootheden en modellen",
    "symbols, units, and dimensions": "Symbolen, eenheden en dimensies",
    "formula intuition": "Formule-intu\xEFtie",
    "assumptions and regimes": "Aannames en toepassingsgebieden",
    "worked examples": "Uitgewerkte voorbeelden",
    "edge cases and limiting cases": "Randgevallen en limietgevallen",
    "common mistakes": "Veelvoorkomende fouten",
    "minimal working workflow": "Minimale werkende workflow",
    "prerequisite tools and setup": "Benodigde tools en configuratie",
    "core tasks": "Kerntaken",
    "step-by-step workflows": "Stapsgewijze workflows",
    "verification checklist": "Verificatiechecklist",
    "common mistakes and troubleshooting": "Veelvoorkomende fouten en probleemoplossing",
    "practice tasks": "Oefentaken",
    "hypothesis": "Hypothese",
    "data and assumptions": "Data en aannames",
    "evaluation pipeline": "Evaluatiepipeline",
    "metrics": "Metrieken",
    "baseline comparison": "Vergelijking met baseline",
    "bias and leakage risks": "Risico's op bias en leakage",
    "robustness checks": "Robuustheidscontroles",
    "failure modes": "Faalmodi",
    "materials and tools": "Materialen en tools",
    "style or quality standards": "Stijl- of kwaliteitsstandaarden",
    "core techniques": "Kerntechnieken",
    "process": "Proces",
    "representative cases": "Representatieve gevallen",
    "sensory or output standards": "Sensorische of outputstandaarden",
    "common failures and fixes": "Veelvoorkomende fouten en oplossingen",
    "timeline": "Tijdlijn",
    "key actors, works, or institutions": "Belangrijke actoren, werken of instellingen",
    "causal forces": "Causale krachten",
    "major transitions": "Belangrijke overgangen",
    "conflicts or debates": "Conflicten of debatten",
    "legacy and modern relevance": "Erfenis en moderne relevantie"
  },
  sv: {
    "orientation": "L\xE4randeorientering",
    "prerequisite map": "Karta \xF6ver f\xF6rkunskaper",
    "core concept map": "Karta \xF6ver k\xE4rnbegrepp",
    "concept explanations": "Begreppsf\xF6rklaringar",
    "relationships and tradeoffs": "Relationer och avv\xE4gningar",
    "examples": "Exempel",
    "common misconceptions": "Vanliga missuppfattningar",
    "retrieval questions": "\xC5terkallningsfr\xE5gor",
    "next steps": "N\xE4sta steg",
    "core quantities and models": "Centrala storheter och modeller",
    "symbols, units, and dimensions": "Symboler, enheter och dimensioner",
    "formula intuition": "Formelintuition",
    "assumptions and regimes": "Antaganden och till\xE4mpningsomr\xE5den",
    "worked examples": "Genomarbetade exempel",
    "edge cases and limiting cases": "Kantfall och gr\xE4nsfall",
    "common mistakes": "Vanliga misstag",
    "minimal working workflow": "Minsta fungerande arbetsfl\xF6de",
    "prerequisite tools and setup": "N\xF6dv\xE4ndiga verktyg och inst\xE4llningar",
    "core tasks": "K\xE4rnuppgifter",
    "step-by-step workflows": "Stegvisa arbetsfl\xF6den",
    "verification checklist": "Verifieringschecklista",
    "common mistakes and troubleshooting": "Vanliga misstag och fels\xF6kning",
    "practice tasks": "\xD6vningsuppgifter",
    "hypothesis": "Hypotes",
    "data and assumptions": "Data och antaganden",
    "evaluation pipeline": "Utv\xE4rderingsfl\xF6de",
    "metrics": "M\xE5tt",
    "baseline comparison": "J\xE4mf\xF6relse med baslinje",
    "bias and leakage risks": "Risker f\xF6r bias och l\xE4ckage",
    "robustness checks": "Robusthetskontroller",
    "failure modes": "Felll\xE4gen",
    "materials and tools": "Material och verktyg",
    "style or quality standards": "Stil- eller kvalitetsstandarder",
    "core techniques": "K\xE4rntekniker",
    "process": "Process",
    "representative cases": "Representativa fall",
    "sensory or output standards": "Sensoriska eller outputstandarder",
    "common failures and fixes": "Vanliga fel och korrigeringar",
    "timeline": "Tidslinje",
    "key actors, works, or institutions": "Nyckelakt\xF6rer, verk eller institutioner",
    "causal forces": "Kausala krafter",
    "major transitions": "Stora \xF6verg\xE5ngar",
    "conflicts or debates": "Konflikter eller debatter",
    "legacy and modern relevance": "Arv och modern relevans"
  },
  fi: {
    "orientation": "Oppimisen suuntaus",
    "prerequisite map": "Esitietokartta",
    "core concept map": "Keskeisten k\xE4sitteiden kartta",
    "concept explanations": "K\xE4sitteiden selitykset",
    "relationships and tradeoffs": "Suhteet ja kompromissit",
    "examples": "Esimerkit",
    "common misconceptions": "Yleiset v\xE4\xE4rink\xE4sitykset",
    "retrieval questions": "Mieleenpalautuskysymykset",
    "next steps": "Seuraavat vaiheet",
    "core quantities and models": "Keskeiset suureet ja mallit",
    "symbols, units, and dimensions": "Symbolit, yksik\xF6t ja dimensiot",
    "formula intuition": "Kaavojen intuitio",
    "assumptions and regimes": "Oletukset ja soveltamisalueet",
    "worked examples": "Ratkaistut esimerkit",
    "edge cases and limiting cases": "Reuna- ja rajatapaukset",
    "common mistakes": "Yleiset virheet",
    "minimal working workflow": "V\xE4himm\xE4istoimiva ty\xF6nkulku",
    "prerequisite tools and setup": "Tarvittavat ty\xF6kalut ja asetukset",
    "core tasks": "Keskeiset teht\xE4v\xE4t",
    "step-by-step workflows": "Vaiheittaiset ty\xF6nkulut",
    "verification checklist": "Varmistuslista",
    "common mistakes and troubleshooting": "Yleiset virheet ja vianm\xE4\xE4ritys",
    "practice tasks": "Harjoitusteht\xE4v\xE4t",
    "hypothesis": "Hypoteesi",
    "data and assumptions": "Data ja oletukset",
    "evaluation pipeline": "Arviointiputki",
    "metrics": "Mittarit",
    "baseline comparison": "Vertailu perustasoon",
    "bias and leakage risks": "Harhan ja vuodon riskit",
    "robustness checks": "Robustiustarkistukset",
    "failure modes": "Vikatilat",
    "materials and tools": "Materiaalit ja ty\xF6kalut",
    "style or quality standards": "Tyyli- tai laatustandardit",
    "core techniques": "Keskeiset tekniikat",
    "process": "Prosessi",
    "representative cases": "Edustavat tapaukset",
    "sensory or output standards": "Aistinvaraiset tai tulostestandardit",
    "common failures and fixes": "Yleiset ep\xE4onnistumiset ja korjaukset",
    "timeline": "Aikajana",
    "key actors, works, or institutions": "Keskeiset toimijat, teokset tai instituutiot",
    "causal forces": "Kausaaliset voimat",
    "major transitions": "Suuret siirtym\xE4t",
    "conflicts or debates": "Konfliktit tai v\xE4ittelyt",
    "legacy and modern relevance": "Perint\xF6 ja nykyinen merkitys"
  },
  pl: {
    "orientation": "Orientacja w nauce",
    "prerequisite map": "Mapa wiedzy wst\u0119pnej",
    "core concept map": "Mapa kluczowych poj\u0119\u0107",
    "concept explanations": "Wyja\u015Bnienia poj\u0119\u0107",
    "relationships and tradeoffs": "Relacje i kompromisy",
    "examples": "Przyk\u0142ady",
    "common misconceptions": "Cz\u0119ste nieporozumienia",
    "retrieval questions": "Pytania przypominaj\u0105ce",
    "next steps": "Nast\u0119pne kroki",
    "core quantities and models": "Kluczowe wielko\u015Bci i modele",
    "symbols, units, and dimensions": "Symbole, jednostki i wymiary",
    "formula intuition": "Intuicja wzor\xF3w",
    "assumptions and regimes": "Za\u0142o\u017Cenia i zakresy zastosowania",
    "worked examples": "Przyk\u0142ady rozwi\u0105zane",
    "edge cases and limiting cases": "Przypadki brzegowe i graniczne",
    "common mistakes": "Cz\u0119ste b\u0142\u0119dy",
    "minimal working workflow": "Minimalny dzia\u0142aj\u0105cy przep\u0142yw pracy",
    "prerequisite tools and setup": "Wymagane narz\u0119dzia i konfiguracja",
    "core tasks": "Kluczowe zadania",
    "step-by-step workflows": "Przep\u0142ywy pracy krok po kroku",
    "verification checklist": "Lista kontrolna weryfikacji",
    "common mistakes and troubleshooting": "Cz\u0119ste b\u0142\u0119dy i rozwi\u0105zywanie problem\xF3w",
    "practice tasks": "Zadania praktyczne",
    "hypothesis": "Hipoteza",
    "data and assumptions": "Dane i za\u0142o\u017Cenia",
    "evaluation pipeline": "Proces oceny",
    "metrics": "Metryki",
    "baseline comparison": "Por\xF3wnanie z baz\u0105 odniesienia",
    "bias and leakage risks": "Ryzyka stronniczo\u015Bci i wycieku",
    "robustness checks": "Kontrole odporno\u015Bci",
    "failure modes": "Tryby awarii",
    "materials and tools": "Materia\u0142y i narz\u0119dzia",
    "style or quality standards": "Standardy stylu lub jako\u015Bci",
    "core techniques": "Kluczowe techniki",
    "process": "Proces",
    "representative cases": "Przypadki reprezentatywne",
    "sensory or output standards": "Standardy sensoryczne lub wyj\u015Bciowe",
    "common failures and fixes": "Cz\u0119ste niepowodzenia i poprawki",
    "timeline": "O\u015B czasu",
    "key actors, works, or institutions": "Kluczowi aktorzy, dzie\u0142a lub instytucje",
    "causal forces": "Si\u0142y przyczynowe",
    "major transitions": "G\u0142\xF3wne przej\u015Bcia",
    "conflicts or debates": "Konflikty lub debaty",
    "legacy and modern relevance": "Dziedzictwo i wsp\xF3\u0142czesna istotno\u015B\u0107"
  },
  tr: {
    "orientation": "\xD6\u011Frenme Konumland\u0131rmas\u0131",
    "prerequisite map": "\xD6n Bilgi Haritas\u0131",
    "core concept map": "Temel Kavram Haritas\u0131",
    "concept explanations": "Kavram A\xE7\u0131klamalar\u0131",
    "relationships and tradeoffs": "\u0130li\u015Fkiler ve \xD6d\xFCnle\u015Fimler",
    "examples": "\xD6rnekler",
    "common misconceptions": "Yayg\u0131n Yanl\u0131\u015F Anlamalar",
    "retrieval questions": "Hat\u0131rlama Sorular\u0131",
    "next steps": "Sonraki Ad\u0131mlar",
    "core quantities and models": "Temel Nicelikler ve Modeller",
    "symbols, units, and dimensions": "Semboller, Birimler ve Boyutlar",
    "formula intuition": "Form\xFCl Sezgisi",
    "assumptions and regimes": "Varsay\u0131mlar ve Ge\xE7erlilik Alanlar\u0131",
    "worked examples": "\xC7\xF6z\xFCml\xFC \xD6rnekler",
    "edge cases and limiting cases": "U\xE7 Durumlar ve S\u0131n\u0131r Durumlar\u0131",
    "common mistakes": "Yayg\u0131n Hatalar",
    "minimal working workflow": "Minimum \xC7al\u0131\u015Fan \u0130\u015F Ak\u0131\u015F\u0131",
    "prerequisite tools and setup": "Gerekli Ara\xE7lar ve Kurulum",
    "core tasks": "Temel G\xF6revler",
    "step-by-step workflows": "Ad\u0131m Ad\u0131m \u0130\u015F Ak\u0131\u015Flar\u0131",
    "verification checklist": "Do\u011Frulama Kontrol Listesi",
    "common mistakes and troubleshooting": "Yayg\u0131n Hatalar ve Sorun Giderme",
    "practice tasks": "Pratik G\xF6revleri",
    "hypothesis": "Hipotez",
    "data and assumptions": "Veri ve Varsay\u0131mlar",
    "evaluation pipeline": "De\u011Ferlendirme Hatt\u0131",
    "metrics": "Metrikler",
    "baseline comparison": "Temel \xC7izgi Kar\u015F\u0131la\u015Ft\u0131rmas\u0131",
    "bias and leakage risks": "Yanl\u0131l\u0131k ve S\u0131z\u0131nt\u0131 Riskleri",
    "robustness checks": "Sa\u011Flaml\u0131k Kontrolleri",
    "failure modes": "Ba\u015Far\u0131s\u0131zl\u0131k Bi\xE7imleri",
    "materials and tools": "Malzemeler ve Ara\xE7lar",
    "style or quality standards": "Stil veya Kalite Standartlar\u0131",
    "core techniques": "Temel Teknikler",
    "process": "S\xFCre\xE7",
    "representative cases": "Temsil\xEE Vakalar",
    "sensory or output standards": "Duyusal veya \xC7\u0131kt\u0131 Standartlar\u0131",
    "common failures and fixes": "Yayg\u0131n Ba\u015Far\u0131s\u0131zl\u0131klar ve D\xFCzeltmeler",
    "timeline": "Zaman \xC7izelgesi",
    "key actors, works, or institutions": "Kilit Akt\xF6rler, Eserler veya Kurumlar",
    "causal forces": "Nedensel G\xFC\xE7ler",
    "major transitions": "Ba\u015Fl\u0131ca Ge\xE7i\u015Fler",
    "conflicts or debates": "\xC7at\u0131\u015Fmalar veya Tart\u0131\u015Fmalar",
    "legacy and modern relevance": "Miras ve Modern \u0130lgililik"
  },
  ru: {
    "orientation": "\u0423\u0447\u0435\u0431\u043D\u0430\u044F \u043E\u0440\u0438\u0435\u043D\u0442\u0430\u0446\u0438\u044F",
    "prerequisite map": "\u041A\u0430\u0440\u0442\u0430 \u043F\u0440\u0435\u0434\u0432\u0430\u0440\u0438\u0442\u0435\u043B\u044C\u043D\u044B\u0445 \u0437\u043D\u0430\u043D\u0438\u0439",
    "core concept map": "\u041A\u0430\u0440\u0442\u0430 \u043A\u043B\u044E\u0447\u0435\u0432\u044B\u0445 \u043F\u043E\u043D\u044F\u0442\u0438\u0439",
    "concept explanations": "\u041E\u0431\u044A\u044F\u0441\u043D\u0435\u043D\u0438\u044F \u043F\u043E\u043D\u044F\u0442\u0438\u0439",
    "relationships and tradeoffs": "\u0421\u0432\u044F\u0437\u0438 \u0438 \u043A\u043E\u043C\u043F\u0440\u043E\u043C\u0438\u0441\u0441\u044B",
    "examples": "\u041F\u0440\u0438\u043C\u0435\u0440\u044B",
    "common misconceptions": "\u0420\u0430\u0441\u043F\u0440\u043E\u0441\u0442\u0440\u0430\u043D\u0435\u043D\u043D\u044B\u0435 \u0437\u0430\u0431\u043B\u0443\u0436\u0434\u0435\u043D\u0438\u044F",
    "retrieval questions": "\u0412\u043E\u043F\u0440\u043E\u0441\u044B \u0434\u043B\u044F \u0432\u043E\u0441\u043F\u0440\u043E\u0438\u0437\u0432\u0435\u0434\u0435\u043D\u0438\u044F",
    "next steps": "\u0421\u043B\u0435\u0434\u0443\u044E\u0449\u0438\u0435 \u0448\u0430\u0433\u0438",
    "core quantities and models": "\u041A\u043B\u044E\u0447\u0435\u0432\u044B\u0435 \u0432\u0435\u043B\u0438\u0447\u0438\u043D\u044B \u0438 \u043C\u043E\u0434\u0435\u043B\u0438",
    "symbols, units, and dimensions": "\u0421\u0438\u043C\u0432\u043E\u043B\u044B, \u0435\u0434\u0438\u043D\u0438\u0446\u044B \u0438 \u0440\u0430\u0437\u043C\u0435\u0440\u043D\u043E\u0441\u0442\u0438",
    "formula intuition": "\u0418\u043D\u0442\u0443\u0438\u0446\u0438\u044F \u0444\u043E\u0440\u043C\u0443\u043B",
    "assumptions and regimes": "\u041F\u0440\u0435\u0434\u043F\u043E\u043B\u043E\u0436\u0435\u043D\u0438\u044F \u0438 \u043E\u0431\u043B\u0430\u0441\u0442\u0438 \u043F\u0440\u0438\u043C\u0435\u043D\u0438\u043C\u043E\u0441\u0442\u0438",
    "worked examples": "\u0420\u0430\u0437\u043E\u0431\u0440\u0430\u043D\u043D\u044B\u0435 \u043F\u0440\u0438\u043C\u0435\u0440\u044B",
    "edge cases and limiting cases": "\u041A\u0440\u0430\u0435\u0432\u044B\u0435 \u0438 \u043F\u0440\u0435\u0434\u0435\u043B\u044C\u043D\u044B\u0435 \u0441\u043B\u0443\u0447\u0430\u0438",
    "common mistakes": "\u0420\u0430\u0441\u043F\u0440\u043E\u0441\u0442\u0440\u0430\u043D\u0435\u043D\u043D\u044B\u0435 \u043E\u0448\u0438\u0431\u043A\u0438",
    "minimal working workflow": "\u041C\u0438\u043D\u0438\u043C\u0430\u043B\u044C\u043D\u044B\u0439 \u0440\u0430\u0431\u043E\u0447\u0438\u0439 \u043F\u0440\u043E\u0446\u0435\u0441\u0441",
    "prerequisite tools and setup": "\u041D\u0435\u043E\u0431\u0445\u043E\u0434\u0438\u043C\u044B\u0435 \u0438\u043D\u0441\u0442\u0440\u0443\u043C\u0435\u043D\u0442\u044B \u0438 \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0430",
    "core tasks": "\u041A\u043B\u044E\u0447\u0435\u0432\u044B\u0435 \u0437\u0430\u0434\u0430\u0447\u0438",
    "step-by-step workflows": "\u041F\u043E\u0448\u0430\u0433\u043E\u0432\u044B\u0435 \u0440\u0430\u0431\u043E\u0447\u0438\u0435 \u043F\u0440\u043E\u0446\u0435\u0441\u0441\u044B",
    "verification checklist": "\u041A\u043E\u043D\u0442\u0440\u043E\u043B\u044C\u043D\u044B\u0439 \u0441\u043F\u0438\u0441\u043E\u043A \u043F\u0440\u043E\u0432\u0435\u0440\u043A\u0438",
    "common mistakes and troubleshooting": "\u0420\u0430\u0441\u043F\u0440\u043E\u0441\u0442\u0440\u0430\u043D\u0435\u043D\u043D\u044B\u0435 \u043E\u0448\u0438\u0431\u043A\u0438 \u0438 \u0443\u0441\u0442\u0440\u0430\u043D\u0435\u043D\u0438\u0435 \u043D\u0435\u043F\u043E\u043B\u0430\u0434\u043E\u043A",
    "practice tasks": "\u041F\u0440\u0430\u043A\u0442\u0438\u0447\u0435\u0441\u043A\u0438\u0435 \u0437\u0430\u0434\u0430\u043D\u0438\u044F",
    "hypothesis": "\u0413\u0438\u043F\u043E\u0442\u0435\u0437\u0430",
    "data and assumptions": "\u0414\u0430\u043D\u043D\u044B\u0435 \u0438 \u043F\u0440\u0435\u0434\u043F\u043E\u043B\u043E\u0436\u0435\u043D\u0438\u044F",
    "evaluation pipeline": "\u041F\u0440\u043E\u0446\u0435\u0441\u0441 \u043E\u0446\u0435\u043D\u043A\u0438",
    "metrics": "\u041C\u0435\u0442\u0440\u0438\u043A\u0438",
    "baseline comparison": "\u0421\u0440\u0430\u0432\u043D\u0435\u043D\u0438\u0435 \u0441 \u0431\u0430\u0437\u043E\u0432\u043E\u0439 \u043B\u0438\u043D\u0438\u0435\u0439",
    "bias and leakage risks": "\u0420\u0438\u0441\u043A\u0438 \u0441\u043C\u0435\u0449\u0435\u043D\u0438\u044F \u0438 \u0443\u0442\u0435\u0447\u043A\u0438",
    "robustness checks": "\u041F\u0440\u043E\u0432\u0435\u0440\u043A\u0438 \u0443\u0441\u0442\u043E\u0439\u0447\u0438\u0432\u043E\u0441\u0442\u0438",
    "failure modes": "\u0420\u0435\u0436\u0438\u043C\u044B \u043E\u0442\u043A\u0430\u0437\u0430",
    "materials and tools": "\u041C\u0430\u0442\u0435\u0440\u0438\u0430\u043B\u044B \u0438 \u0438\u043D\u0441\u0442\u0440\u0443\u043C\u0435\u043D\u0442\u044B",
    "style or quality standards": "\u0421\u0442\u0430\u043D\u0434\u0430\u0440\u0442\u044B \u0441\u0442\u0438\u043B\u044F \u0438\u043B\u0438 \u043A\u0430\u0447\u0435\u0441\u0442\u0432\u0430",
    "core techniques": "\u041A\u043B\u044E\u0447\u0435\u0432\u044B\u0435 \u0442\u0435\u0445\u043D\u0438\u043A\u0438",
    "process": "\u041F\u0440\u043E\u0446\u0435\u0441\u0441",
    "representative cases": "\u0420\u0435\u043F\u0440\u0435\u0437\u0435\u043D\u0442\u0430\u0442\u0438\u0432\u043D\u044B\u0435 \u0441\u043B\u0443\u0447\u0430\u0438",
    "sensory or output standards": "\u0421\u0435\u043D\u0441\u043E\u0440\u043D\u044B\u0435 \u0438\u043B\u0438 \u0432\u044B\u0445\u043E\u0434\u043D\u044B\u0435 \u0441\u0442\u0430\u043D\u0434\u0430\u0440\u0442\u044B",
    "common failures and fixes": "\u0420\u0430\u0441\u043F\u0440\u043E\u0441\u0442\u0440\u0430\u043D\u0435\u043D\u043D\u044B\u0435 \u0441\u0431\u043E\u0438 \u0438 \u0438\u0441\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u044F",
    "timeline": "\u0425\u0440\u043E\u043D\u043E\u043B\u043E\u0433\u0438\u044F",
    "key actors, works, or institutions": "\u041A\u043B\u044E\u0447\u0435\u0432\u044B\u0435 \u0443\u0447\u0430\u0441\u0442\u043D\u0438\u043A\u0438, \u043F\u0440\u043E\u0438\u0437\u0432\u0435\u0434\u0435\u043D\u0438\u044F \u0438\u043B\u0438 \u0438\u043D\u0441\u0442\u0438\u0442\u0443\u0442\u044B",
    "causal forces": "\u041F\u0440\u0438\u0447\u0438\u043D\u043D\u044B\u0435 \u0441\u0438\u043B\u044B",
    "major transitions": "\u041E\u0441\u043D\u043E\u0432\u043D\u044B\u0435 \u043F\u0435\u0440\u0435\u0445\u043E\u0434\u044B",
    "conflicts or debates": "\u041A\u043E\u043D\u0444\u043B\u0438\u043A\u0442\u044B \u0438\u043B\u0438 \u0434\u0438\u0441\u043A\u0443\u0441\u0441\u0438\u0438",
    "legacy and modern relevance": "\u041D\u0430\u0441\u043B\u0435\u0434\u0438\u0435 \u0438 \u0441\u043E\u0432\u0440\u0435\u043C\u0435\u043D\u043D\u0430\u044F \u0437\u043D\u0430\u0447\u0438\u043C\u043E\u0441\u0442\u044C"
  }
};
var LOCALIZED_UNIT_FIELD_TITLES = {
  ja: {
    "definition and intuition": "\u5B9A\u7FA9\u3068\u76F4\u611F",
    "why it exists": "\u5B58\u5728\u3059\u308B\u7406\u7531",
    "problem it solves": "\u89E3\u6C7A\u3059\u308B\u554F\u984C",
    "prerequisites": "\u524D\u63D0\u77E5\u8B58",
    "concrete example": "\u5177\u4F53\u4F8B",
    "relationship to neighboring concepts": "\u96A3\u63A5\u6982\u5FF5\u3068\u306E\u95A2\u4FC2",
    "common misconception": "\u3088\u304F\u3042\u308B\u8AA4\u89E3",
    "definition": "\u5B9A\u7FA9",
    "intuition": "\u76F4\u611F",
    "symbols and units": "\u8A18\u53F7\u3068\u5358\u4F4D",
    "assumptions": "\u4EEE\u5B9A",
    "when the model applies": "\u30E2\u30C7\u30EB\u304C\u9069\u7528\u3067\u304D\u308B\u6761\u4EF6",
    "simple numerical example": "\u7C21\u5358\u306A\u6570\u5024\u4F8B",
    "what breaks when assumptions fail": "\u4EEE\u5B9A\u304C\u5D29\u308C\u308B\u3068\u4F55\u304C\u7834\u7DBB\u3059\u308B\u304B",
    "goal": "\u76EE\u7684",
    "when to use it": "\u4F7F\u3046\u5834\u9762",
    "steps": "\u624B\u9806",
    "menu path or shortcut if applicable": "\u30E1\u30CB\u30E5\u30FC\u7D4C\u8DEF\u307E\u305F\u306F\u30B7\u30E7\u30FC\u30C8\u30AB\u30C3\u30C8",
    "expected result": "\u671F\u5F85\u3055\u308C\u308B\u7D50\u679C",
    "how to verify the output": "\u51FA\u529B\u306E\u691C\u8A3C\u65B9\u6CD5",
    "what it measures": "\u6E2C\u5B9A\u3059\u308B\u3082\u306E",
    "why it matters": "\u91CD\u8981\u306A\u7406\u7531",
    "how to compute or test it": "\u8A08\u7B97\u307E\u305F\u306F\u30C6\u30B9\u30C8\u65B9\u6CD5",
    "how it fails": "\u5931\u6557\u306E\u4ED5\u65B9",
    "example": "\u4F8B",
    "diagnostic check": "\u8A3A\u65AD\u30C1\u30A7\u30C3\u30AF",
    "purpose": "\u76EE\u7684",
    "materials or conditions": "\u6750\u6599\u307E\u305F\u306F\u6761\u4EF6",
    "sensory or quality standard": "\u611F\u899A\u307E\u305F\u306F\u54C1\u8CEA\u57FA\u6E96",
    "common failure": "\u3088\u304F\u3042\u308B\u5931\u6557",
    "fix": "\u4FEE\u6B63",
    "period or transition": "\u6642\u671F\u307E\u305F\u306F\u8EE2\u63DB",
    "what changed": "\u5909\u5316\u3057\u305F\u3053\u3068",
    "why it changed": "\u5909\u5316\u3057\u305F\u7406\u7531",
    "key actors or examples": "\u4E3B\u8981\u4EBA\u7269\u307E\u305F\u306F\u4F8B",
    "broader context": "\u3088\u308A\u5E83\u3044\u6587\u8108",
    "modern relevance": "\u73FE\u4EE3\u7684\u610F\u7FA9"
  },
  ko: {
    "definition and intuition": "\uC815\uC758\uC640 \uC9C1\uAD00",
    "why it exists": "\uC874\uC7AC \uC774\uC720",
    "problem it solves": "\uD574\uACB0\uD558\uB294 \uBB38\uC81C",
    "prerequisites": "\uC120\uC218 \uC9C0\uC2DD",
    "concrete example": "\uAD6C\uCCB4\uC801 \uC608\uC2DC",
    "relationship to neighboring concepts": "\uC778\uC811 \uAC1C\uB150\uACFC\uC758 \uAD00\uACC4",
    "common misconception": "\uD754\uD55C \uC624\uD574",
    "definition": "\uC815\uC758",
    "intuition": "\uC9C1\uAD00",
    "symbols and units": "\uAE30\uD638\uC640 \uB2E8\uC704",
    "assumptions": "\uAC00\uC815",
    "when the model applies": "\uBAA8\uB378 \uC801\uC6A9 \uC870\uAC74",
    "simple numerical example": "\uAC04\uB2E8\uD55C \uC218\uCE58 \uC608\uC2DC",
    "what breaks when assumptions fail": "\uAC00\uC815\uC774 \uAE68\uC9C8 \uB54C \uC0DD\uAE30\uB294 \uBB38\uC81C",
    "goal": "\uBAA9\uD45C",
    "when to use it": "\uC0AC\uC6A9 \uC2DC\uC810",
    "steps": "\uB2E8\uACC4",
    "menu path or shortcut if applicable": "\uBA54\uB274 \uACBD\uB85C \uB610\uB294 \uB2E8\uCD95\uD0A4",
    "expected result": "\uC608\uC0C1 \uACB0\uACFC",
    "how to verify the output": "\uCD9C\uB825 \uAC80\uC99D \uBC29\uBC95",
    "what it measures": "\uCE21\uC815 \uB300\uC0C1",
    "why it matters": "\uC911\uC694\uD55C \uC774\uC720",
    "how to compute or test it": "\uACC4\uC0B0 \uB610\uB294 \uD14C\uC2A4\uD2B8 \uBC29\uBC95",
    "how it fails": "\uC2E4\uD328 \uBC29\uC2DD",
    "example": "\uC608\uC2DC",
    "diagnostic check": "\uC9C4\uB2E8 \uC810\uAC80",
    "purpose": "\uBAA9\uC801",
    "materials or conditions": "\uC7AC\uB8CC \uB610\uB294 \uC870\uAC74",
    "sensory or quality standard": "\uAC10\uAC01 \uB610\uB294 \uD488\uC9C8 \uAE30\uC900",
    "common failure": "\uD754\uD55C \uC2E4\uD328",
    "fix": "\uC218\uC815",
    "period or transition": "\uC2DC\uAE30 \uB610\uB294 \uC804\uD658",
    "what changed": "\uBB34\uC5C7\uC774 \uBC14\uB00C\uC5C8\uB294\uAC00",
    "why it changed": "\uC65C \uBC14\uB00C\uC5C8\uB294\uAC00",
    "key actors or examples": "\uC8FC\uC694 \uC778\uBB3C \uB610\uB294 \uC608\uC2DC",
    "broader context": "\uB354 \uB113\uC740 \uB9E5\uB77D",
    "modern relevance": "\uD604\uB300\uC801 \uAD00\uB828\uC131"
  },
  vi: {
    "definition and intuition": "\u0110\u1ECBnh ngh\u0129a v\xE0 tr\u1EF1c gi\xE1c",
    "why it exists": "V\xEC sao n\xF3 t\u1ED3n t\u1EA1i",
    "problem it solves": "V\u1EA5n \u0111\u1EC1 n\xF3 gi\u1EA3i quy\u1EBFt",
    "prerequisites": "Ki\u1EBFn th\u1EE9c ti\xEAn quy\u1EBFt",
    "concrete example": "V\xED d\u1EE5 c\u1EE5 th\u1EC3",
    "relationship to neighboring concepts": "Quan h\u1EC7 v\u1EDBi kh\xE1i ni\u1EC7m l\xE2n c\u1EADn",
    "common misconception": "Hi\u1EC3u l\u1EA7m th\u01B0\u1EDDng g\u1EB7p",
    "definition": "\u0110\u1ECBnh ngh\u0129a",
    "intuition": "Tr\u1EF1c gi\xE1c",
    "symbols and units": "K\xFD hi\u1EC7u v\xE0 \u0111\u01A1n v\u1ECB",
    "assumptions": "Gi\u1EA3 \u0111\u1ECBnh",
    "when the model applies": "Khi m\xF4 h\xECnh \xE1p d\u1EE5ng",
    "simple numerical example": "V\xED d\u1EE5 s\u1ED1 \u0111\u01A1n gi\u1EA3n",
    "what breaks when assumptions fail": "\u0110i\u1EC1u g\xEC h\u1ECFng khi gi\u1EA3 \u0111\u1ECBnh sai",
    "goal": "M\u1EE5c ti\xEAu",
    "when to use it": "Khi n\xE0o d\xF9ng",
    "steps": "C\xE1c b\u01B0\u1EDBc",
    "menu path or shortcut if applicable": "\u0110\u01B0\u1EDDng d\u1EABn menu ho\u1EB7c ph\xEDm t\u1EAFt",
    "expected result": "K\u1EBFt qu\u1EA3 k\u1EF3 v\u1ECDng",
    "how to verify the output": "C\xE1ch x\xE1c minh \u0111\u1EA7u ra",
    "what it measures": "N\xF3 \u0111o \u0111i\u1EC1u g\xEC",
    "why it matters": "V\xEC sao quan tr\u1ECDng",
    "how to compute or test it": "C\xE1ch t\xEDnh ho\u1EB7c ki\u1EC3m th\u1EED",
    "how it fails": "C\xE1ch n\xF3 th\u1EA5t b\u1EA1i",
    "example": "V\xED d\u1EE5",
    "diagnostic check": "Ki\u1EC3m tra ch\u1EA9n \u0111o\xE1n",
    "purpose": "M\u1EE5c \u0111\xEDch",
    "materials or conditions": "V\u1EADt li\u1EC7u ho\u1EB7c \u0111i\u1EC1u ki\u1EC7n",
    "sensory or quality standard": "Chu\u1EA9n c\u1EA3m quan ho\u1EB7c ch\u1EA5t l\u01B0\u1EE3ng",
    "common failure": "L\u1ED7i th\u01B0\u1EDDng g\u1EB7p",
    "fix": "C\xE1ch s\u1EEDa",
    "period or transition": "Giai \u0111o\u1EA1n ho\u1EB7c chuy\u1EC3n \u0111\u1ED5i",
    "what changed": "\u0110i\u1EC1u g\xEC thay \u0111\u1ED5i",
    "why it changed": "V\xEC sao thay \u0111\u1ED5i",
    "key actors or examples": "Nh\xE2n v\u1EADt ho\u1EB7c v\xED d\u1EE5 ch\xEDnh",
    "broader context": "B\u1ED1i c\u1EA3nh r\u1ED9ng h\u01A1n",
    "modern relevance": "\xDD ngh\u0129a hi\u1EC7n \u0111\u1EA1i"
  },
  th: {
    "definition and intuition": "\u0E19\u0E34\u0E22\u0E32\u0E21\u0E41\u0E25\u0E30\u0E2A\u0E31\u0E0D\u0E0A\u0E32\u0E15\u0E0D\u0E32\u0E13",
    "why it exists": "\u0E40\u0E2B\u0E15\u0E38\u0E1C\u0E25\u0E17\u0E35\u0E48\u0E21\u0E35\u0E2D\u0E22\u0E39\u0E48",
    "problem it solves": "\u0E1B\u0E31\u0E0D\u0E2B\u0E32\u0E17\u0E35\u0E48\u0E41\u0E01\u0E49",
    "prerequisites": "\u0E04\u0E27\u0E32\u0E21\u0E23\u0E39\u0E49\u0E1E\u0E37\u0E49\u0E19\u0E10\u0E32\u0E19",
    "concrete example": "\u0E15\u0E31\u0E27\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E17\u0E35\u0E48\u0E40\u0E1B\u0E47\u0E19\u0E23\u0E39\u0E1B\u0E18\u0E23\u0E23\u0E21",
    "relationship to neighboring concepts": "\u0E04\u0E27\u0E32\u0E21\u0E2A\u0E31\u0E21\u0E1E\u0E31\u0E19\u0E18\u0E4C\u0E01\u0E31\u0E1A\u0E41\u0E19\u0E27\u0E04\u0E34\u0E14\u0E43\u0E01\u0E25\u0E49\u0E40\u0E04\u0E35\u0E22\u0E07",
    "common misconception": "\u0E04\u0E27\u0E32\u0E21\u0E40\u0E02\u0E49\u0E32\u0E43\u0E08\u0E1C\u0E34\u0E14\u0E17\u0E35\u0E48\u0E1E\u0E1A\u0E1A\u0E48\u0E2D\u0E22",
    "definition": "\u0E19\u0E34\u0E22\u0E32\u0E21",
    "intuition": "\u0E2A\u0E31\u0E0D\u0E0A\u0E32\u0E15\u0E0D\u0E32\u0E13",
    "symbols and units": "\u0E2A\u0E31\u0E0D\u0E25\u0E31\u0E01\u0E29\u0E13\u0E4C\u0E41\u0E25\u0E30\u0E2B\u0E19\u0E48\u0E27\u0E22",
    "assumptions": "\u0E2A\u0E21\u0E21\u0E15\u0E34\u0E10\u0E32\u0E19",
    "when the model applies": "\u0E40\u0E07\u0E37\u0E48\u0E2D\u0E19\u0E44\u0E02\u0E17\u0E35\u0E48\u0E43\u0E0A\u0E49\u0E42\u0E21\u0E40\u0E14\u0E25\u0E44\u0E14\u0E49",
    "simple numerical example": "\u0E15\u0E31\u0E27\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E15\u0E31\u0E27\u0E40\u0E25\u0E02\u0E07\u0E48\u0E32\u0E22",
    "what breaks when assumptions fail": "\u0E2A\u0E34\u0E48\u0E07\u0E17\u0E35\u0E48\u0E1E\u0E31\u0E07\u0E40\u0E21\u0E37\u0E48\u0E2D\u0E2A\u0E21\u0E21\u0E15\u0E34\u0E10\u0E32\u0E19\u0E1C\u0E34\u0E14",
    "goal": "\u0E40\u0E1B\u0E49\u0E32\u0E2B\u0E21\u0E32\u0E22",
    "when to use it": "\u0E04\u0E27\u0E23\u0E43\u0E0A\u0E49\u0E40\u0E21\u0E37\u0E48\u0E2D\u0E43\u0E14",
    "steps": "\u0E02\u0E31\u0E49\u0E19\u0E15\u0E2D\u0E19",
    "menu path or shortcut if applicable": "\u0E40\u0E2A\u0E49\u0E19\u0E17\u0E32\u0E07\u0E40\u0E21\u0E19\u0E39\u0E2B\u0E23\u0E37\u0E2D\u0E1B\u0E38\u0E48\u0E21\u0E25\u0E31\u0E14",
    "expected result": "\u0E1C\u0E25\u0E25\u0E31\u0E1E\u0E18\u0E4C\u0E17\u0E35\u0E48\u0E04\u0E32\u0E14\u0E2B\u0E27\u0E31\u0E07",
    "how to verify the output": "\u0E27\u0E34\u0E18\u0E35\u0E15\u0E23\u0E27\u0E08\u0E2A\u0E2D\u0E1A\u0E1C\u0E25\u0E25\u0E31\u0E1E\u0E18\u0E4C",
    "what it measures": "\u0E2A\u0E34\u0E48\u0E07\u0E17\u0E35\u0E48\u0E27\u0E31\u0E14",
    "why it matters": "\u0E40\u0E2B\u0E15\u0E38\u0E1C\u0E25\u0E17\u0E35\u0E48\u0E2A\u0E33\u0E04\u0E31\u0E0D",
    "how to compute or test it": "\u0E27\u0E34\u0E18\u0E35\u0E04\u0E33\u0E19\u0E27\u0E13\u0E2B\u0E23\u0E37\u0E2D\u0E17\u0E14\u0E2A\u0E2D\u0E1A",
    "how it fails": "\u0E27\u0E34\u0E18\u0E35\u0E17\u0E35\u0E48\u0E25\u0E49\u0E21\u0E40\u0E2B\u0E25\u0E27",
    "example": "\u0E15\u0E31\u0E27\u0E2D\u0E22\u0E48\u0E32\u0E07",
    "diagnostic check": "\u0E01\u0E32\u0E23\u0E15\u0E23\u0E27\u0E08\u0E27\u0E34\u0E19\u0E34\u0E08\u0E09\u0E31\u0E22",
    "purpose": "\u0E27\u0E31\u0E15\u0E16\u0E38\u0E1B\u0E23\u0E30\u0E2A\u0E07\u0E04\u0E4C",
    "materials or conditions": "\u0E27\u0E31\u0E2A\u0E14\u0E38\u0E2B\u0E23\u0E37\u0E2D\u0E40\u0E07\u0E37\u0E48\u0E2D\u0E19\u0E44\u0E02",
    "sensory or quality standard": "\u0E21\u0E32\u0E15\u0E23\u0E10\u0E32\u0E19\u0E1B\u0E23\u0E30\u0E2A\u0E32\u0E17\u0E2A\u0E31\u0E21\u0E1C\u0E31\u0E2A\u0E2B\u0E23\u0E37\u0E2D\u0E04\u0E38\u0E13\u0E20\u0E32\u0E1E",
    "common failure": "\u0E04\u0E27\u0E32\u0E21\u0E25\u0E49\u0E21\u0E40\u0E2B\u0E25\u0E27\u0E17\u0E35\u0E48\u0E1E\u0E1A\u0E1A\u0E48\u0E2D\u0E22",
    "fix": "\u0E27\u0E34\u0E18\u0E35\u0E41\u0E01\u0E49",
    "period or transition": "\u0E0A\u0E48\u0E27\u0E07\u0E40\u0E27\u0E25\u0E32 \u0E2B\u0E23\u0E37\u0E2D \u0E01\u0E32\u0E23\u0E40\u0E1B\u0E25\u0E35\u0E48\u0E22\u0E19\u0E1C\u0E48\u0E32\u0E19",
    "what changed": "\u0E2A\u0E34\u0E48\u0E07\u0E17\u0E35\u0E48\u0E40\u0E1B\u0E25\u0E35\u0E48\u0E22\u0E19",
    "why it changed": "\u0E40\u0E2B\u0E15\u0E38\u0E1C\u0E25\u0E17\u0E35\u0E48\u0E40\u0E1B\u0E25\u0E35\u0E48\u0E22\u0E19",
    "key actors or examples": "\u0E1C\u0E39\u0E49\u0E40\u0E01\u0E35\u0E48\u0E22\u0E27\u0E02\u0E49\u0E2D\u0E07\u0E2B\u0E25\u0E31\u0E01\u0E2B\u0E23\u0E37\u0E2D\u0E15\u0E31\u0E27\u0E2D\u0E22\u0E48\u0E32\u0E07",
    "broader context": "\u0E1A\u0E23\u0E34\u0E1A\u0E17\u0E17\u0E35\u0E48\u0E01\u0E27\u0E49\u0E32\u0E07\u0E02\u0E36\u0E49\u0E19",
    "modern relevance": "\u0E04\u0E27\u0E32\u0E21\u0E40\u0E01\u0E35\u0E48\u0E22\u0E27\u0E02\u0E49\u0E2D\u0E07\u0E43\u0E19\u0E1B\u0E31\u0E08\u0E08\u0E38\u0E1A\u0E31\u0E19"
  },
  id: {
    "definition and intuition": "Definisi dan intuisi",
    "why it exists": "Mengapa ini ada",
    "problem it solves": "Masalah yang diselesaikan",
    "prerequisites": "Prasyarat",
    "concrete example": "Contoh konkret",
    "relationship to neighboring concepts": "Hubungan dengan konsep terkait",
    "common misconception": "Kesalahpahaman umum",
    "definition": "Definisi",
    "intuition": "Intuisi",
    "symbols and units": "Simbol dan satuan",
    "assumptions": "Asumsi",
    "when the model applies": "Kapan model berlaku",
    "simple numerical example": "Contoh numerik sederhana",
    "what breaks when assumptions fail": "Apa yang rusak saat asumsi gagal",
    "goal": "Tujuan",
    "when to use it": "Kapan menggunakannya",
    "steps": "Langkah",
    "menu path or shortcut if applicable": "Jalur menu atau pintasan",
    "expected result": "Hasil yang diharapkan",
    "how to verify the output": "Cara memverifikasi output",
    "what it measures": "Apa yang diukur",
    "why it matters": "Mengapa penting",
    "how to compute or test it": "Cara menghitung atau menguji",
    "how it fails": "Bagaimana gagal",
    "example": "Contoh",
    "diagnostic check": "Pemeriksaan diagnostik",
    "purpose": "Tujuan",
    "materials or conditions": "Bahan atau kondisi",
    "sensory or quality standard": "Standar sensorik atau kualitas",
    "common failure": "Kegagalan umum",
    "fix": "Perbaikan",
    "period or transition": "Periode atau transisi",
    "what changed": "Apa yang berubah",
    "why it changed": "Mengapa berubah",
    "key actors or examples": "Aktor kunci atau contoh",
    "broader context": "Konteks lebih luas",
    "modern relevance": "Relevansi modern"
  },
  ms: {
    "definition and intuition": "Definisi dan intuisi",
    "why it exists": "Mengapa ia wujud",
    "problem it solves": "Masalah yang diselesaikan",
    "prerequisites": "Prasyarat",
    "concrete example": "Contoh konkrit",
    "relationship to neighboring concepts": "Hubungan dengan konsep berdekatan",
    "common misconception": "Salah faham lazim",
    "definition": "Definisi",
    "intuition": "Intuisi",
    "symbols and units": "Simbol dan unit",
    "assumptions": "Andaian",
    "when the model applies": "Bila model terpakai",
    "simple numerical example": "Contoh angka mudah",
    "what breaks when assumptions fail": "Apa yang rosak apabila andaian gagal",
    "goal": "Matlamat",
    "when to use it": "Bila menggunakannya",
    "steps": "Langkah",
    "menu path or shortcut if applicable": "Laluan menu atau pintasan",
    "expected result": "Hasil dijangka",
    "how to verify the output": "Cara mengesahkan output",
    "what it measures": "Apa yang diukur",
    "why it matters": "Mengapa penting",
    "how to compute or test it": "Cara mengira atau menguji",
    "how it fails": "Bagaimana ia gagal",
    "example": "Contoh",
    "diagnostic check": "Semakan diagnostik",
    "purpose": "Tujuan",
    "materials or conditions": "Bahan atau syarat",
    "sensory or quality standard": "Piawaian deria atau kualiti",
    "common failure": "Kegagalan lazim",
    "fix": "Pembetulan",
    "period or transition": "Tempoh atau peralihan",
    "what changed": "Apa yang berubah",
    "why it changed": "Mengapa ia berubah",
    "key actors or examples": "Tokoh utama atau contoh",
    "broader context": "Konteks lebih luas",
    "modern relevance": "Kerelevanan moden"
  },
  hi: {
    "definition and intuition": "\u092A\u0930\u093F\u092D\u093E\u0937\u093E \u0914\u0930 \u0938\u0939\u091C \u0938\u092E\u091D",
    "why it exists": "\u092F\u0939 \u0915\u094D\u092F\u094B\u0902 \u092E\u094C\u091C\u0942\u0926 \u0939\u0948",
    "problem it solves": "\u092F\u0939 \u0915\u094C\u0928 \u0938\u0940 \u0938\u092E\u0938\u094D\u092F\u093E \u0939\u0932 \u0915\u0930\u0924\u093E \u0939\u0948",
    "prerequisites": "\u092A\u0942\u0930\u094D\u0935\u093E\u092A\u0947\u0915\u094D\u0937\u093E\u090F\u0901",
    "concrete example": "\u0920\u094B\u0938 \u0909\u0926\u093E\u0939\u0930\u0923",
    "relationship to neighboring concepts": "\u092A\u093E\u0938 \u0915\u0940 \u0905\u0935\u0927\u093E\u0930\u0923\u093E\u0913\u0902 \u0938\u0947 \u0938\u0902\u092C\u0902\u0927",
    "common misconception": "\u0938\u093E\u092E\u093E\u0928\u094D\u092F \u092D\u094D\u0930\u093E\u0902\u0924\u093F",
    "definition": "\u092A\u0930\u093F\u092D\u093E\u0937\u093E",
    "intuition": "\u0938\u0939\u091C \u0938\u092E\u091D",
    "symbols and units": "\u092A\u094D\u0930\u0924\u0940\u0915 \u0914\u0930 \u0907\u0915\u093E\u0907\u092F\u093E\u0901",
    "assumptions": "\u092E\u093E\u0928\u094D\u092F\u0924\u093E\u090F\u0901",
    "when the model applies": "\u092E\u0949\u0921\u0932 \u0915\u092C \u0932\u093E\u0917\u0942 \u0939\u094B\u0924\u093E \u0939\u0948",
    "simple numerical example": "\u0938\u0930\u0932 \u0938\u0902\u0916\u094D\u092F\u093E\u0924\u094D\u092E\u0915 \u0909\u0926\u093E\u0939\u0930\u0923",
    "what breaks when assumptions fail": "\u092E\u093E\u0928\u094D\u092F\u0924\u093E\u090F\u0901 \u091F\u0942\u091F\u0928\u0947 \u092A\u0930 \u0915\u094D\u092F\u093E \u092C\u093F\u0917\u0921\u093C\u0924\u093E \u0939\u0948",
    "goal": "\u0932\u0915\u094D\u0937\u094D\u092F",
    "when to use it": "\u0915\u092C \u0909\u092A\u092F\u094B\u0917 \u0915\u0930\u0947\u0902",
    "steps": "\u091A\u0930\u0923",
    "menu path or shortcut if applicable": "\u092E\u0947\u0928\u0942 \u092A\u0925 \u092F\u093E \u0936\u0949\u0930\u094D\u091F\u0915\u091F",
    "expected result": "\u0905\u092A\u0947\u0915\u094D\u0937\u093F\u0924 \u092A\u0930\u093F\u0923\u093E\u092E",
    "how to verify the output": "\u0906\u0909\u091F\u092A\u0941\u091F \u0915\u0948\u0938\u0947 \u0938\u0924\u094D\u092F\u093E\u092A\u093F\u0924 \u0915\u0930\u0947\u0902",
    "what it measures": "\u092F\u0939 \u0915\u094D\u092F\u093E \u092E\u093E\u092A\u0924\u093E \u0939\u0948",
    "why it matters": "\u092F\u0939 \u0915\u094D\u092F\u094B\u0902 \u092E\u0939\u0924\u094D\u0935\u092A\u0942\u0930\u094D\u0923 \u0939\u0948",
    "how to compute or test it": "\u0915\u0948\u0938\u0947 \u0917\u0923\u0928\u093E \u092F\u093E \u092A\u0930\u0940\u0915\u094D\u0937\u0923 \u0915\u0930\u0947\u0902",
    "how it fails": "\u092F\u0939 \u0915\u0948\u0938\u0947 \u0935\u093F\u092B\u0932 \u0939\u094B\u0924\u093E \u0939\u0948",
    "example": "\u0909\u0926\u093E\u0939\u0930\u0923",
    "diagnostic check": "\u0928\u0948\u0926\u093E\u0928\u093F\u0915 \u091C\u093E\u0901\u091A",
    "purpose": "\u0909\u0926\u094D\u0926\u0947\u0936\u094D\u092F",
    "materials or conditions": "\u0938\u093E\u092E\u0917\u094D\u0930\u0940 \u092F\u093E \u0938\u094D\u0925\u093F\u0924\u093F\u092F\u093E\u0901",
    "sensory or quality standard": "\u0938\u0902\u0935\u0947\u0926\u0940 \u092F\u093E \u0917\u0941\u0923\u0935\u0924\u094D\u0924\u093E \u092E\u093E\u0928\u0915",
    "common failure": "\u0938\u093E\u092E\u093E\u0928\u094D\u092F \u0935\u093F\u092B\u0932\u0924\u093E",
    "fix": "\u0938\u0941\u0927\u093E\u0930",
    "period or transition": "\u0915\u093E\u0932 \u092F\u093E \u0938\u0902\u0915\u094D\u0930\u092E\u0923",
    "what changed": "\u0915\u094D\u092F\u093E \u092C\u0926\u0932\u093E",
    "why it changed": "\u0915\u094D\u092F\u094B\u0902 \u092C\u0926\u0932\u093E",
    "key actors or examples": "\u092E\u0941\u0916\u094D\u092F \u092A\u093E\u0924\u094D\u0930 \u092F\u093E \u0909\u0926\u093E\u0939\u0930\u0923",
    "broader context": "\u0935\u094D\u092F\u093E\u092A\u0915 \u0938\u0902\u0926\u0930\u094D\u092D",
    "modern relevance": "\u0906\u0927\u0941\u0928\u093F\u0915 \u092A\u094D\u0930\u093E\u0938\u0902\u0917\u093F\u0915\u0924\u093E"
  },
  ar: {
    "definition and intuition": "\u0627\u0644\u062A\u0639\u0631\u064A\u0641 \u0648\u0627\u0644\u062D\u062F\u0633",
    "why it exists": "\u0644\u0645\u0627\u0630\u0627 \u064A\u0648\u062C\u062F",
    "problem it solves": "\u0627\u0644\u0645\u0634\u0643\u0644\u0629 \u0627\u0644\u062A\u064A \u064A\u062D\u0644\u0647\u0627",
    "prerequisites": "\u0627\u0644\u0645\u062A\u0637\u0644\u0628\u0627\u062A \u0627\u0644\u0633\u0627\u0628\u0642\u0629",
    "concrete example": "\u0645\u062B\u0627\u0644 \u0645\u0644\u0645\u0648\u0633",
    "relationship to neighboring concepts": "\u0627\u0644\u0639\u0644\u0627\u0642\u0629 \u0628\u0627\u0644\u0645\u0641\u0627\u0647\u064A\u0645 \u0627\u0644\u0645\u062C\u0627\u0648\u0631\u0629",
    "common misconception": "\u062A\u0635\u0648\u0631 \u062E\u0627\u0637\u0626 \u0634\u0627\u0626\u0639",
    "definition": "\u0627\u0644\u062A\u0639\u0631\u064A\u0641",
    "intuition": "\u0627\u0644\u062D\u062F\u0633",
    "symbols and units": "\u0627\u0644\u0631\u0645\u0648\u0632 \u0648\u0627\u0644\u0648\u062D\u062F\u0627\u062A",
    "assumptions": "\u0627\u0644\u0627\u0641\u062A\u0631\u0627\u0636\u0627\u062A",
    "when the model applies": "\u0645\u062A\u0649 \u064A\u0646\u0637\u0628\u0642 \u0627\u0644\u0646\u0645\u0648\u0630\u062C",
    "simple numerical example": "\u0645\u062B\u0627\u0644 \u0639\u062F\u062F\u064A \u0628\u0633\u064A\u0637",
    "what breaks when assumptions fail": "\u0645\u0627 \u0627\u0644\u0630\u064A \u064A\u0646\u0647\u0627\u0631 \u0639\u0646\u062F \u0641\u0634\u0644 \u0627\u0644\u0627\u0641\u062A\u0631\u0627\u0636\u0627\u062A",
    "goal": "\u0627\u0644\u0647\u062F\u0641",
    "when to use it": "\u0645\u062A\u0649 \u062A\u0633\u062A\u062E\u062F\u0645\u0647",
    "steps": "\u0627\u0644\u062E\u0637\u0648\u0627\u062A",
    "menu path or shortcut if applicable": "\u0645\u0633\u0627\u0631 \u0627\u0644\u0642\u0627\u0626\u0645\u0629 \u0623\u0648 \u0627\u0644\u0627\u062E\u062A\u0635\u0627\u0631",
    "expected result": "\u0627\u0644\u0646\u062A\u064A\u062C\u0629 \u0627\u0644\u0645\u062A\u0648\u0642\u0639\u0629",
    "how to verify the output": "\u0643\u064A\u0641\u064A\u0629 \u0627\u0644\u062A\u062D\u0642\u0642 \u0645\u0646 \u0627\u0644\u0645\u062E\u0631\u062C\u0627\u062A",
    "what it measures": "\u0645\u0627 \u0627\u0644\u0630\u064A \u064A\u0642\u064A\u0633\u0647",
    "why it matters": "\u0644\u0645\u0627\u0630\u0627 \u0647\u0648 \u0645\u0647\u0645",
    "how to compute or test it": "\u0643\u064A\u0641\u064A\u0629 \u062D\u0633\u0627\u0628\u0647 \u0623\u0648 \u0627\u062E\u062A\u0628\u0627\u0631\u0647",
    "how it fails": "\u0643\u064A\u0641 \u064A\u0641\u0634\u0644",
    "example": "\u0645\u062B\u0627\u0644",
    "diagnostic check": "\u0641\u062D\u0635 \u062A\u0634\u062E\u064A\u0635\u064A",
    "purpose": "\u0627\u0644\u063A\u0631\u0636",
    "materials or conditions": "\u0627\u0644\u0645\u0648\u0627\u062F \u0623\u0648 \u0627\u0644\u0634\u0631\u0648\u0637",
    "sensory or quality standard": "\u0645\u0639\u064A\u0627\u0631 \u062D\u0633\u064A \u0623\u0648 \u062C\u0648\u062F\u0629",
    "common failure": "\u0641\u0634\u0644 \u0634\u0627\u0626\u0639",
    "fix": "\u0625\u0635\u0644\u0627\u062D",
    "period or transition": "\u0641\u062A\u0631\u0629 \u0623\u0648 \u0627\u0646\u062A\u0642\u0627\u0644",
    "what changed": "\u0645\u0627 \u0627\u0644\u0630\u064A \u062A\u063A\u064A\u0631",
    "why it changed": "\u0644\u0645\u0627\u0630\u0627 \u062A\u063A\u064A\u0631",
    "key actors or examples": "\u0641\u0627\u0639\u0644\u0648\u0646 \u0631\u0626\u064A\u0633\u064A\u0648\u0646 \u0623\u0648 \u0623\u0645\u062B\u0644\u0629",
    "broader context": "\u0627\u0644\u0633\u064A\u0627\u0642 \u0627\u0644\u0623\u0648\u0633\u0639",
    "modern relevance": "\u0627\u0644\u0623\u0647\u0645\u064A\u0629 \u0627\u0644\u062D\u062F\u064A\u062B\u0629"
  },
  de: {
    "definition and intuition": "Definition und Intuition",
    "why it exists": "Warum es existiert",
    "problem it solves": "Problem, das es l\xF6st",
    "prerequisites": "Voraussetzungen",
    "concrete example": "Konkretes Beispiel",
    "relationship to neighboring concepts": "Beziehung zu benachbarten Konzepten",
    "common misconception": "H\xE4ufiges Missverst\xE4ndnis",
    "definition": "Definition",
    "intuition": "Intuition",
    "symbols and units": "Symbole und Einheiten",
    "assumptions": "Annahmen",
    "when the model applies": "Wann das Modell gilt",
    "simple numerical example": "Einfaches Zahlenbeispiel",
    "what breaks when assumptions fail": "Was bricht, wenn Annahmen scheitern",
    "goal": "Ziel",
    "when to use it": "Wann man es verwendet",
    "steps": "Schritte",
    "menu path or shortcut if applicable": "Men\xFCpfad oder Tastenk\xFCrzel",
    "expected result": "Erwartetes Ergebnis",
    "how to verify the output": "Wie man die Ausgabe pr\xFCft",
    "what it measures": "Was es misst",
    "why it matters": "Warum es wichtig ist",
    "how to compute or test it": "Wie man es berechnet oder testet",
    "how it fails": "Wie es fehlschl\xE4gt",
    "example": "Beispiel",
    "diagnostic check": "Diagnosepr\xFCfung",
    "purpose": "Zweck",
    "materials or conditions": "Materialien oder Bedingungen",
    "sensory or quality standard": "Sinnes- oder Qualit\xE4tsstandard",
    "common failure": "H\xE4ufiger Fehlschlag",
    "fix": "Korrektur",
    "period or transition": "Periode oder \xDCbergang",
    "what changed": "Was sich ge\xE4ndert hat",
    "why it changed": "Warum es sich ge\xE4ndert hat",
    "key actors or examples": "Schl\xFCsselakteure oder Beispiele",
    "broader context": "Breiterer Kontext",
    "modern relevance": "Heutige Relevanz"
  },
  fr: {
    "definition and intuition": "D\xE9finition et intuition",
    "why it exists": "Pourquoi cela existe",
    "problem it solves": "Probl\xE8me r\xE9solu",
    "prerequisites": "Pr\xE9requis",
    "concrete example": "Exemple concret",
    "relationship to neighboring concepts": "Relation avec les concepts voisins",
    "common misconception": "Id\xE9e re\xE7ue courante",
    "definition": "D\xE9finition",
    "intuition": "Intuition",
    "symbols and units": "Symboles et unit\xE9s",
    "assumptions": "Hypoth\xE8ses",
    "when the model applies": "Quand le mod\xE8le s'applique",
    "simple numerical example": "Exemple num\xE9rique simple",
    "what breaks when assumptions fail": "Ce qui casse quand les hypoth\xE8ses \xE9chouent",
    "goal": "Objectif",
    "when to use it": "Quand l'utiliser",
    "steps": "\xC9tapes",
    "menu path or shortcut if applicable": "Chemin de menu ou raccourci",
    "expected result": "R\xE9sultat attendu",
    "how to verify the output": "Comment v\xE9rifier la sortie",
    "what it measures": "Ce que cela mesure",
    "why it matters": "Pourquoi c'est important",
    "how to compute or test it": "Comment calculer ou tester",
    "how it fails": "Comment cela \xE9choue",
    "example": "Exemple",
    "diagnostic check": "Contr\xF4le diagnostique",
    "purpose": "But",
    "materials or conditions": "Mat\xE9riaux ou conditions",
    "sensory or quality standard": "Norme sensorielle ou de qualit\xE9",
    "common failure": "\xC9chec courant",
    "fix": "Correction",
    "period or transition": "P\xE9riode ou transition",
    "what changed": "Ce qui a chang\xE9",
    "why it changed": "Pourquoi cela a chang\xE9",
    "key actors or examples": "Acteurs cl\xE9s ou exemples",
    "broader context": "Contexte plus large",
    "modern relevance": "Pertinence moderne"
  },
  es: {
    "definition and intuition": "Definici\xF3n e intuici\xF3n",
    "why it exists": "Por qu\xE9 existe",
    "problem it solves": "Problema que resuelve",
    "prerequisites": "Requisitos previos",
    "concrete example": "Ejemplo concreto",
    "relationship to neighboring concepts": "Relaci\xF3n con conceptos vecinos",
    "common misconception": "Malentendido com\xFAn",
    "definition": "Definici\xF3n",
    "intuition": "Intuici\xF3n",
    "symbols and units": "S\xEDmbolos y unidades",
    "assumptions": "Supuestos",
    "when the model applies": "Cu\xE1ndo aplica el modelo",
    "simple numerical example": "Ejemplo num\xE9rico simple",
    "what breaks when assumptions fail": "Qu\xE9 falla cuando fallan los supuestos",
    "goal": "Objetivo",
    "when to use it": "Cu\xE1ndo usarlo",
    "steps": "Pasos",
    "menu path or shortcut if applicable": "Ruta de men\xFA o atajo",
    "expected result": "Resultado esperado",
    "how to verify the output": "C\xF3mo verificar la salida",
    "what it measures": "Qu\xE9 mide",
    "why it matters": "Por qu\xE9 importa",
    "how to compute or test it": "C\xF3mo calcularlo o probarlo",
    "how it fails": "C\xF3mo falla",
    "example": "Ejemplo",
    "diagnostic check": "Comprobaci\xF3n diagn\xF3stica",
    "purpose": "Prop\xF3sito",
    "materials or conditions": "Materiales o condiciones",
    "sensory or quality standard": "Est\xE1ndar sensorial o de calidad",
    "common failure": "Fallo com\xFAn",
    "fix": "Correcci\xF3n",
    "period or transition": "Periodo o transici\xF3n",
    "what changed": "Qu\xE9 cambi\xF3",
    "why it changed": "Por qu\xE9 cambi\xF3",
    "key actors or examples": "Actores clave o ejemplos",
    "broader context": "Contexto m\xE1s amplio",
    "modern relevance": "Relevancia moderna"
  },
  it: {
    "definition and intuition": "Definizione e intuizione",
    "why it exists": "Perch\xE9 esiste",
    "problem it solves": "Problema che risolve",
    "prerequisites": "Prerequisiti",
    "concrete example": "Esempio concreto",
    "relationship to neighboring concepts": "Relazione con concetti vicini",
    "common misconception": "Fraintendimento comune",
    "definition": "Definizione",
    "intuition": "Intuizione",
    "symbols and units": "Simboli e unit\xE0",
    "assumptions": "Assunzioni",
    "when the model applies": "Quando si applica il modello",
    "simple numerical example": "Esempio numerico semplice",
    "what breaks when assumptions fail": "Cosa si rompe quando falliscono le assunzioni",
    "goal": "Obiettivo",
    "when to use it": "Quando usarlo",
    "steps": "Passaggi",
    "menu path or shortcut if applicable": "Percorso menu o scorciatoia",
    "expected result": "Risultato atteso",
    "how to verify the output": "Come verificare l'output",
    "what it measures": "Cosa misura",
    "why it matters": "Perch\xE9 \xE8 importante",
    "how to compute or test it": "Come calcolarlo o testarlo",
    "how it fails": "Come fallisce",
    "example": "Esempio",
    "diagnostic check": "Controllo diagnostico",
    "purpose": "Scopo",
    "materials or conditions": "Materiali o condizioni",
    "sensory or quality standard": "Standard sensoriale o di qualit\xE0",
    "common failure": "Fallimento comune",
    "fix": "Correzione",
    "period or transition": "Periodo o transizione",
    "what changed": "Cosa \xE8 cambiato",
    "why it changed": "Perch\xE9 \xE8 cambiato",
    "key actors or examples": "Attori chiave o esempi",
    "broader context": "Contesto pi\xF9 ampio",
    "modern relevance": "Rilevanza moderna"
  },
  pt: {
    "definition and intuition": "Defini\xE7\xE3o e intui\xE7\xE3o",
    "why it exists": "Por que existe",
    "problem it solves": "Problema que resolve",
    "prerequisites": "Pr\xE9-requisitos",
    "concrete example": "Exemplo concreto",
    "relationship to neighboring concepts": "Rela\xE7\xE3o com conceitos vizinhos",
    "common misconception": "Equ\xEDvoco comum",
    "definition": "Defini\xE7\xE3o",
    "intuition": "Intui\xE7\xE3o",
    "symbols and units": "S\xEDmbolos e unidades",
    "assumptions": "Suposi\xE7\xF5es",
    "when the model applies": "Quando o modelo se aplica",
    "simple numerical example": "Exemplo num\xE9rico simples",
    "what breaks when assumptions fail": "O que quebra quando as suposi\xE7\xF5es falham",
    "goal": "Objetivo",
    "when to use it": "Quando usar",
    "steps": "Etapas",
    "menu path or shortcut if applicable": "Caminho de menu ou atalho",
    "expected result": "Resultado esperado",
    "how to verify the output": "Como verificar a sa\xEDda",
    "what it measures": "O que mede",
    "why it matters": "Por que importa",
    "how to compute or test it": "Como calcular ou testar",
    "how it fails": "Como falha",
    "example": "Exemplo",
    "diagnostic check": "Verifica\xE7\xE3o diagn\xF3stica",
    "purpose": "Prop\xF3sito",
    "materials or conditions": "Materiais ou condi\xE7\xF5es",
    "sensory or quality standard": "Padr\xE3o sensorial ou de qualidade",
    "common failure": "Falha comum",
    "fix": "Corre\xE7\xE3o",
    "period or transition": "Per\xEDodo ou transi\xE7\xE3o",
    "what changed": "O que mudou",
    "why it changed": "Por que mudou",
    "key actors or examples": "Atores-chave ou exemplos",
    "broader context": "Contexto mais amplo",
    "modern relevance": "Relev\xE2ncia moderna"
  },
  nl: {
    "definition and intuition": "Definitie en intu\xEFtie",
    "why it exists": "Waarom het bestaat",
    "problem it solves": "Probleem dat het oplost",
    "prerequisites": "Voorkennis",
    "concrete example": "Concreet voorbeeld",
    "relationship to neighboring concepts": "Relatie met verwante concepten",
    "common misconception": "Veelvoorkomende misvatting",
    "definition": "Definitie",
    "intuition": "Intu\xEFtie",
    "symbols and units": "Symbolen en eenheden",
    "assumptions": "Aannames",
    "when the model applies": "Wanneer het model geldt",
    "simple numerical example": "Eenvoudig numeriek voorbeeld",
    "what breaks when assumptions fail": "Wat misgaat wanneer aannames falen",
    "goal": "Doel",
    "when to use it": "Wanneer te gebruiken",
    "steps": "Stappen",
    "menu path or shortcut if applicable": "Menupad of sneltoets",
    "expected result": "Verwacht resultaat",
    "how to verify the output": "Hoe de uitvoer te verifi\xEBren",
    "what it measures": "Wat het meet",
    "why it matters": "Waarom het belangrijk is",
    "how to compute or test it": "Hoe te berekenen of testen",
    "how it fails": "Hoe het faalt",
    "example": "Voorbeeld",
    "diagnostic check": "Diagnostische controle",
    "purpose": "Doel",
    "materials or conditions": "Materialen of voorwaarden",
    "sensory or quality standard": "Sensorische of kwaliteitsstandaard",
    "common failure": "Veelvoorkomende mislukking",
    "fix": "Oplossing",
    "period or transition": "Periode of overgang",
    "what changed": "Wat veranderde",
    "why it changed": "Waarom het veranderde",
    "key actors or examples": "Belangrijke actoren of voorbeelden",
    "broader context": "Bredere context",
    "modern relevance": "Moderne relevantie"
  },
  sv: {
    "definition and intuition": "Definition och intuition",
    "why it exists": "Varf\xF6r det finns",
    "problem it solves": "Problemet det l\xF6ser",
    "prerequisites": "F\xF6rkunskaper",
    "concrete example": "Konkret exempel",
    "relationship to neighboring concepts": "Relation till n\xE4rliggande begrepp",
    "common misconception": "Vanlig missuppfattning",
    "definition": "Definition",
    "intuition": "Intuition",
    "symbols and units": "Symboler och enheter",
    "assumptions": "Antaganden",
    "when the model applies": "N\xE4r modellen g\xE4ller",
    "simple numerical example": "Enkelt numeriskt exempel",
    "what breaks when assumptions fail": "Vad som g\xE5r s\xF6nder n\xE4r antaganden faller",
    "goal": "M\xE5l",
    "when to use it": "N\xE4r det anv\xE4nds",
    "steps": "Steg",
    "menu path or shortcut if applicable": "Menys\xF6kv\xE4g eller kortkommando",
    "expected result": "F\xF6rv\xE4ntat resultat",
    "how to verify the output": "Hur utdata verifieras",
    "what it measures": "Vad det m\xE4ter",
    "why it matters": "Varf\xF6r det \xE4r viktigt",
    "how to compute or test it": "Hur man ber\xE4knar eller testar",
    "how it fails": "Hur det misslyckas",
    "example": "Exempel",
    "diagnostic check": "Diagnostisk kontroll",
    "purpose": "Syfte",
    "materials or conditions": "Material eller villkor",
    "sensory or quality standard": "Sensorisk eller kvalitetsstandard",
    "common failure": "Vanligt fel",
    "fix": "Korrigering",
    "period or transition": "Period eller \xF6verg\xE5ng",
    "what changed": "Vad som f\xF6r\xE4ndrades",
    "why it changed": "Varf\xF6r det f\xF6r\xE4ndrades",
    "key actors or examples": "Nyckelakt\xF6rer eller exempel",
    "broader context": "Bredare sammanhang",
    "modern relevance": "Modern relevans"
  },
  fi: {
    "definition and intuition": "M\xE4\xE4ritelm\xE4 ja intuitio",
    "why it exists": "Miksi se on olemassa",
    "problem it solves": "Ongelma, jonka se ratkaisee",
    "prerequisites": "Esitiedot",
    "concrete example": "Konkreettinen esimerkki",
    "relationship to neighboring concepts": "Suhde l\xE4heisiin k\xE4sitteisiin",
    "common misconception": "Yleinen v\xE4\xE4rink\xE4sitys",
    "definition": "M\xE4\xE4ritelm\xE4",
    "intuition": "Intuitio",
    "symbols and units": "Symbolit ja yksik\xF6t",
    "assumptions": "Oletukset",
    "when the model applies": "Milloin malli p\xE4tee",
    "simple numerical example": "Yksinkertainen numeerinen esimerkki",
    "what breaks when assumptions fail": "Mik\xE4 rikkoutuu oletusten pett\xE4ess\xE4",
    "goal": "Tavoite",
    "when to use it": "Milloin sit\xE4 k\xE4ytet\xE4\xE4n",
    "steps": "Vaiheet",
    "menu path or shortcut if applicable": "Valikkopolku tai pikan\xE4pp\xE4in",
    "expected result": "Odotettu tulos",
    "how to verify the output": "Miten tulos varmistetaan",
    "what it measures": "Mit\xE4 se mittaa",
    "why it matters": "Miksi sill\xE4 on merkityst\xE4",
    "how to compute or test it": "Miten se lasketaan tai testataan",
    "how it fails": "Miten se ep\xE4onnistuu",
    "example": "Esimerkki",
    "diagnostic check": "Diagnostinen tarkistus",
    "purpose": "Tarkoitus",
    "materials or conditions": "Materiaalit tai olosuhteet",
    "sensory or quality standard": "Aistinvarainen tai laatustandardi",
    "common failure": "Yleinen ep\xE4onnistuminen",
    "fix": "Korjaus",
    "period or transition": "Ajanjakso tai siirtym\xE4",
    "what changed": "Mik\xE4 muuttui",
    "why it changed": "Miksi se muuttui",
    "key actors or examples": "Keskeiset toimijat tai esimerkit",
    "broader context": "Laajempi konteksti",
    "modern relevance": "Nykyinen merkitys"
  },
  pl: {
    "definition and intuition": "Definicja i intuicja",
    "why it exists": "Dlaczego istnieje",
    "problem it solves": "Problem, kt\xF3ry rozwi\u0105zuje",
    "prerequisites": "Wymagania wst\u0119pne",
    "concrete example": "Konkretny przyk\u0142ad",
    "relationship to neighboring concepts": "Relacja z s\u0105siednimi poj\u0119ciami",
    "common misconception": "Cz\u0119ste nieporozumienie",
    "definition": "Definicja",
    "intuition": "Intuicja",
    "symbols and units": "Symbole i jednostki",
    "assumptions": "Za\u0142o\u017Cenia",
    "when the model applies": "Kiedy model ma zastosowanie",
    "simple numerical example": "Prosty przyk\u0142ad liczbowy",
    "what breaks when assumptions fail": "Co si\u0119 psuje, gdy za\u0142o\u017Cenia zawodz\u0105",
    "goal": "Cel",
    "when to use it": "Kiedy tego u\u017Cywa\u0107",
    "steps": "Kroki",
    "menu path or shortcut if applicable": "\u015Acie\u017Cka menu lub skr\xF3t",
    "expected result": "Oczekiwany wynik",
    "how to verify the output": "Jak zweryfikowa\u0107 wynik",
    "what it measures": "Co mierzy",
    "why it matters": "Dlaczego ma znaczenie",
    "how to compute or test it": "Jak obliczy\u0107 lub przetestowa\u0107",
    "how it fails": "Jak zawodzi",
    "example": "Przyk\u0142ad",
    "diagnostic check": "Kontrola diagnostyczna",
    "purpose": "Cel",
    "materials or conditions": "Materia\u0142y lub warunki",
    "sensory or quality standard": "Standard sensoryczny lub jako\u015Bciowy",
    "common failure": "Cz\u0119sta awaria",
    "fix": "Poprawka",
    "period or transition": "Okres lub przej\u015Bcie",
    "what changed": "Co si\u0119 zmieni\u0142o",
    "why it changed": "Dlaczego si\u0119 zmieni\u0142o",
    "key actors or examples": "Kluczowi aktorzy lub przyk\u0142ady",
    "broader context": "Szerszy kontekst",
    "modern relevance": "Wsp\xF3\u0142czesna istotno\u015B\u0107"
  },
  tr: {
    "definition and intuition": "Tan\u0131m ve sezgi",
    "why it exists": "Neden var",
    "problem it solves": "\xC7\xF6zd\xFC\u011F\xFC problem",
    "prerequisites": "\xD6n ko\u015Fullar",
    "concrete example": "Somut \xF6rnek",
    "relationship to neighboring concepts": "Yak\u0131n kavramlarla ili\u015Fkisi",
    "common misconception": "Yayg\u0131n yanl\u0131\u015F anlama",
    "definition": "Tan\u0131m",
    "intuition": "Sezgi",
    "symbols and units": "Semboller ve birimler",
    "assumptions": "Varsay\u0131mlar",
    "when the model applies": "Modelin ge\xE7erli oldu\u011Fu durumlar",
    "simple numerical example": "Basit say\u0131sal \xF6rnek",
    "what breaks when assumptions fail": "Varsay\u0131mlar bozulunca ne bozulur",
    "goal": "Ama\xE7",
    "when to use it": "Ne zaman kullan\u0131l\u0131r",
    "steps": "Ad\u0131mlar",
    "menu path or shortcut if applicable": "Men\xFC yolu veya k\u0131sayol",
    "expected result": "Beklenen sonu\xE7",
    "how to verify the output": "\xC7\u0131kt\u0131 nas\u0131l do\u011Frulan\u0131r",
    "what it measures": "Neyi \xF6l\xE7er",
    "why it matters": "Neden \xF6nemlidir",
    "how to compute or test it": "Nas\u0131l hesaplan\u0131r veya test edilir",
    "how it fails": "Nas\u0131l ba\u015Far\u0131s\u0131z olur",
    "example": "\xD6rnek",
    "diagnostic check": "Tan\u0131sal kontrol",
    "purpose": "Ama\xE7",
    "materials or conditions": "Malzemeler veya ko\u015Fullar",
    "sensory or quality standard": "Duyusal veya kalite standard\u0131",
    "common failure": "Yayg\u0131n ba\u015Far\u0131s\u0131zl\u0131k",
    "fix": "D\xFCzeltme",
    "period or transition": "D\xF6nem veya ge\xE7i\u015F",
    "what changed": "Ne de\u011Fi\u015Fti",
    "why it changed": "Neden de\u011Fi\u015Fti",
    "key actors or examples": "Kilit akt\xF6rler veya \xF6rnekler",
    "broader context": "Daha geni\u015F ba\u011Flam",
    "modern relevance": "Modern ilgililik"
  },
  ru: {
    "definition and intuition": "\u041E\u043F\u0440\u0435\u0434\u0435\u043B\u0435\u043D\u0438\u0435 \u0438 \u0438\u043D\u0442\u0443\u0438\u0446\u0438\u044F",
    "why it exists": "\u041F\u043E\u0447\u0435\u043C\u0443 \u044D\u0442\u043E \u0441\u0443\u0449\u0435\u0441\u0442\u0432\u0443\u0435\u0442",
    "problem it solves": "\u041F\u0440\u043E\u0431\u043B\u0435\u043C\u0430, \u043A\u043E\u0442\u043E\u0440\u0443\u044E \u044D\u0442\u043E \u0440\u0435\u0448\u0430\u0435\u0442",
    "prerequisites": "\u041F\u0440\u0435\u0434\u0432\u0430\u0440\u0438\u0442\u0435\u043B\u044C\u043D\u044B\u0435 \u0437\u043D\u0430\u043D\u0438\u044F",
    "concrete example": "\u041A\u043E\u043D\u043A\u0440\u0435\u0442\u043D\u044B\u0439 \u043F\u0440\u0438\u043C\u0435\u0440",
    "relationship to neighboring concepts": "\u0421\u0432\u044F\u0437\u044C \u0441 \u0441\u043E\u0441\u0435\u0434\u043D\u0438\u043C\u0438 \u043F\u043E\u043D\u044F\u0442\u0438\u044F\u043C\u0438",
    "common misconception": "\u0420\u0430\u0441\u043F\u0440\u043E\u0441\u0442\u0440\u0430\u043D\u0435\u043D\u043D\u043E\u0435 \u0437\u0430\u0431\u043B\u0443\u0436\u0434\u0435\u043D\u0438\u0435",
    "definition": "\u041E\u043F\u0440\u0435\u0434\u0435\u043B\u0435\u043D\u0438\u0435",
    "intuition": "\u0418\u043D\u0442\u0443\u0438\u0446\u0438\u044F",
    "symbols and units": "\u0421\u0438\u043C\u0432\u043E\u043B\u044B \u0438 \u0435\u0434\u0438\u043D\u0438\u0446\u044B",
    "assumptions": "\u041F\u0440\u0435\u0434\u043F\u043E\u043B\u043E\u0436\u0435\u043D\u0438\u044F",
    "when the model applies": "\u041A\u043E\u0433\u0434\u0430 \u043C\u043E\u0434\u0435\u043B\u044C \u043F\u0440\u0438\u043C\u0435\u043D\u0438\u043C\u0430",
    "simple numerical example": "\u041F\u0440\u043E\u0441\u0442\u043E\u0439 \u0447\u0438\u0441\u043B\u043E\u0432\u043E\u0439 \u043F\u0440\u0438\u043C\u0435\u0440",
    "what breaks when assumptions fail": "\u0427\u0442\u043E \u043B\u043E\u043C\u0430\u0435\u0442\u0441\u044F \u043F\u0440\u0438 \u043D\u0430\u0440\u0443\u0448\u0435\u043D\u0438\u0438 \u043F\u0440\u0435\u0434\u043F\u043E\u043B\u043E\u0436\u0435\u043D\u0438\u0439",
    "goal": "\u0426\u0435\u043B\u044C",
    "when to use it": "\u041A\u043E\u0433\u0434\u0430 \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u044C",
    "steps": "\u0428\u0430\u0433\u0438",
    "menu path or shortcut if applicable": "\u041F\u0443\u0442\u044C \u043C\u0435\u043D\u044E \u0438\u043B\u0438 \u0441\u043E\u0447\u0435\u0442\u0430\u043D\u0438\u0435 \u043A\u043B\u0430\u0432\u0438\u0448",
    "expected result": "\u041E\u0436\u0438\u0434\u0430\u0435\u043C\u044B\u0439 \u0440\u0435\u0437\u0443\u043B\u044C\u0442\u0430\u0442",
    "how to verify the output": "\u041A\u0430\u043A \u043F\u0440\u043E\u0432\u0435\u0440\u0438\u0442\u044C \u0440\u0435\u0437\u0443\u043B\u044C\u0442\u0430\u0442",
    "what it measures": "\u0427\u0442\u043E \u0438\u0437\u043C\u0435\u0440\u044F\u0435\u0442",
    "why it matters": "\u041F\u043E\u0447\u0435\u043C\u0443 \u044D\u0442\u043E \u0432\u0430\u0436\u043D\u043E",
    "how to compute or test it": "\u041A\u0430\u043A \u0432\u044B\u0447\u0438\u0441\u043B\u0438\u0442\u044C \u0438\u043B\u0438 \u043F\u0440\u043E\u0432\u0435\u0440\u0438\u0442\u044C",
    "how it fails": "\u041A\u0430\u043A \u044D\u0442\u043E \u0434\u0430\u0435\u0442 \u0441\u0431\u043E\u0439",
    "example": "\u041F\u0440\u0438\u043C\u0435\u0440",
    "diagnostic check": "\u0414\u0438\u0430\u0433\u043D\u043E\u0441\u0442\u0438\u0447\u0435\u0441\u043A\u0430\u044F \u043F\u0440\u043E\u0432\u0435\u0440\u043A\u0430",
    "purpose": "\u041D\u0430\u0437\u043D\u0430\u0447\u0435\u043D\u0438\u0435",
    "materials or conditions": "\u041C\u0430\u0442\u0435\u0440\u0438\u0430\u043B\u044B \u0438\u043B\u0438 \u0443\u0441\u043B\u043E\u0432\u0438\u044F",
    "sensory or quality standard": "\u0421\u0435\u043D\u0441\u043E\u0440\u043D\u044B\u0439 \u0438\u043B\u0438 \u043A\u0430\u0447\u0435\u0441\u0442\u0432\u0435\u043D\u043D\u044B\u0439 \u0441\u0442\u0430\u043D\u0434\u0430\u0440\u0442",
    "common failure": "\u0420\u0430\u0441\u043F\u0440\u043E\u0441\u0442\u0440\u0430\u043D\u0435\u043D\u043D\u044B\u0439 \u0441\u0431\u043E\u0439",
    "fix": "\u0418\u0441\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u0435",
    "period or transition": "\u041F\u0435\u0440\u0438\u043E\u0434 \u0438\u043B\u0438 \u043F\u0435\u0440\u0435\u0445\u043E\u0434",
    "what changed": "\u0427\u0442\u043E \u0438\u0437\u043C\u0435\u043D\u0438\u043B\u043E\u0441\u044C",
    "why it changed": "\u041F\u043E\u0447\u0435\u043C\u0443 \u0438\u0437\u043C\u0435\u043D\u0438\u043B\u043E\u0441\u044C",
    "key actors or examples": "\u041A\u043B\u044E\u0447\u0435\u0432\u044B\u0435 \u0443\u0447\u0430\u0441\u0442\u043D\u0438\u043A\u0438 \u0438\u043B\u0438 \u043F\u0440\u0438\u043C\u0435\u0440\u044B",
    "broader context": "\u0411\u043E\u043B\u0435\u0435 \u0448\u0438\u0440\u043E\u043A\u0438\u0439 \u043A\u043E\u043D\u0442\u0435\u043A\u0441\u0442",
    "modern relevance": "\u0421\u043E\u0432\u0440\u0435\u043C\u0435\u043D\u043D\u0430\u044F \u0437\u043D\u0430\u0447\u0438\u043C\u043E\u0441\u0442\u044C"
  }
};
function getEnglishSectionTitle(section) {
  var _a;
  return (_a = ENGLISH_SECTION_TITLES[section]) != null ? _a : section.split(/\s+/).map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
}
function normalizeHeadingText(text) {
  return text.replace(/\s+#+\s*$/, "").replace(/\s+/g, " ").trim().toLowerCase();
}
var HEADING_KEY_BY_ENGLISH_TITLE = Object.entries(
  ENGLISH_SECTION_TITLES
).reduce((result, [key, englishTitle]) => {
  result[normalizeHeadingText(englishTitle)] = key;
  return result;
}, {});
function getSectionHeading(section, language) {
  var _a, _b, _c, _d;
  const englishTitle = getEnglishSectionTitle(section);
  if (language === "en") {
    return englishTitle;
  }
  const localizedTitle = (_d = (_c = (_a = LOCALIZED_SECTION_TITLES[language]) == null ? void 0 : _a[section]) != null ? _c : (_b = LOCALIZED_UNIT_FIELD_TITLES[language]) == null ? void 0 : _b[section]) != null ? _d : englishTitle;
  return `${localizedTitle} (${englishTitle})`;
}
function buildSectionHeadingContract(sections, language) {
  return sections.map((section) => `## ${getSectionHeading(section, language)}`);
}
function sectionAppearsInText(section, text) {
  const englishTitle = getEnglishSectionTitle(section).toLowerCase();
  return text.toLowerCase().includes(englishTitle);
}
function normalizeKnownMarkdownHeadings(markdown, language) {
  if (language === "en") {
    return markdown;
  }
  return markdown.replace(
    /^(#{1,6}\s+)(.+?)\s*$/gm,
    (line, prefix, title) => {
      const normalizedTitle = normalizeHeadingText(title);
      const key = HEADING_KEY_BY_ENGLISH_TITLE[normalizedTitle];
      if (!key) {
        return line;
      }
      return `${prefix}${getSectionHeading(key, language)}`;
    }
  );
}

// src/chapterQuality.ts
function countLearningChars(text) {
  return text.replace(/```[\s\S]*?```/g, "").replace(/\s/g, "").length;
}
function evaluateChapterQuality(text, density, adapter) {
  var _a, _b, _c, _d, _e, _f;
  const charCount = countLearningChars(text);
  const headingCount = ((_a = text.match(/^#{2,4}\s+/gm)) != null ? _a : []).length;
  const exampleCount = ((_b = text.match(/例子|示例|案例|example|worked example/gi)) != null ? _b : []).length;
  const failureModeCount = ((_c = text.match(
    /誤解|误解|混淆|錯誤|错误|失敗|失败|修正|misconception|mistake|failure|pitfall|troubleshooting/gi
  )) != null ? _c : []).length;
  const questionCount = ((_d = text.match(/[？?]\s*$/gm)) != null ? _d : []).length;
  const formulaCount = ((_e = text.match(/\$\$[\s\S]*?\$\$|\$[^$\n]+\$/g)) != null ? _e : []).length;
  const bulletLines = ((_f = text.match(/^\s*[-*]\s+/gm)) != null ? _f : []).length;
  const paragraphBlocks = text.split(/\n\s*\n/).filter((block) => block.trim().length > 120).length;
  const missingRequiredSections = adapter.requiredSections.filter((section) => {
    return !sectionAppearsInText(section, text);
  });
  return {
    charCount,
    headingCount,
    exampleCount,
    failureModeCount,
    questionCount,
    formulaCount,
    bulletLines,
    paragraphBlocks,
    glossaryInflationRisk: bulletLines > paragraphBlocks * 2,
    likelyTooShort: charCount < density.targetChars.min,
    likelyTooGlossaryLike: bulletLines > 40 && paragraphBlocks < 20,
    missingRequiredSections
  };
}
function shouldRepairChapter(report) {
  return report.likelyTooShort || report.likelyTooGlossaryLike || report.missingRequiredSections.length > 2;
}
function formatQualityReport(report) {
  return [
    `charCount: ${report.charCount}`,
    `headingCount: ${report.headingCount}`,
    `exampleCount: ${report.exampleCount}`,
    `failureModeCount: ${report.failureModeCount}`,
    `questionCount: ${report.questionCount}`,
    `formulaCount: ${report.formulaCount}`,
    `bulletLines: ${report.bulletLines}`,
    `paragraphBlocks: ${report.paragraphBlocks}`,
    `glossaryInflationRisk: ${report.glossaryInflationRisk}`,
    `likelyTooShort: ${report.likelyTooShort}`,
    `likelyTooGlossaryLike: ${report.likelyTooGlossaryLike}`,
    `missingRequiredSections: ${report.missingRequiredSections.join(", ") || "none"}`
  ].join("\n");
}

// src/densityPresets.ts
var KNOWLEDGE_DEPTH_LABELS = {
  scan: "Map only",
  onboarding: "Usable overview",
  learn: "Teach me properly",
  review: "Review mode"
};
var DENSITY_PRESETS = {
  scan: {
    label: "Map only",
    targetChars: { min: 3e3, ideal: 5e3, max: 7e3 },
    coreUnits: { min: 15, max: 30 },
    workedExamples: 0,
    concreteExamples: 2,
    retrievalQuestions: 3,
    failureModes: 2
  },
  onboarding: {
    label: "Usable overview",
    targetChars: { min: 9e3, ideal: 12e3, max: 16e3 },
    coreUnits: { min: 8, max: 15 },
    workedExamples: 1,
    concreteExamples: 4,
    retrievalQuestions: 8,
    failureModes: 5
  },
  learn: {
    label: "Teach me properly",
    targetChars: { min: 16e3, ideal: 22e3, max: 3e4 },
    coreUnits: { min: 5, max: 12 },
    workedExamples: 3,
    concreteExamples: 6,
    retrievalQuestions: 12,
    failureModes: 8
  },
  review: {
    label: "Review mode",
    targetChars: { min: 4e3, ideal: 7e3, max: 1e4 },
    coreUnits: { min: 20, max: 50 },
    workedExamples: 0,
    concreteExamples: 2,
    retrievalQuestions: 10,
    failureModes: 6
  }
};
function applyMinimumChapterChars(density, minChapterChars) {
  const min = Math.max(density.targetChars.min, minChapterChars);
  const ideal = Math.max(density.targetChars.ideal, min);
  const max = Math.max(density.targetChars.max, ideal);
  return {
    ...density,
    targetChars: { min, ideal, max }
  };
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
    autoExpandShortChapters: "Run one repair pass when a chapter is too short or too glossary-like.",
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
    autoExpandShortChapters: "\u5F53\u7AE0\u8282\u8FC7\u77ED\u6216\u592A\u50CF\u672F\u8BED\u8868\u65F6\uFF0C\u81EA\u52A8\u8FD0\u884C\u4E00\u6B21\u4FEE\u590D\u6269\u5199\u3002",
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
    autoExpandShortChapters: "\u7576\u7AE0\u7BC0\u904E\u77ED\u6216\u592A\u50CF\u8853\u8A9E\u8868\u6642\uFF0C\u81EA\u52D5\u57F7\u884C\u4E00\u6B21\u4FEE\u5FA9\u64F4\u5BEB\u3002",
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
    autoExpandShortChapters: "\u7AE0\u304C\u77ED\u3059\u304E\u308B\u3001\u307E\u305F\u306F\u7528\u8A9E\u96C6\u306E\u3088\u3046\u306B\u306A\u3063\u305F\u5834\u5408\u306B\u3001\u4FEE\u5FA9\u62E1\u5F35\u3092 1 \u56DE\u5B9F\u884C\u3057\u307E\u3059\u3002",
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
    autoExpandShortChapters: "\uC7A5\uC774 \uB108\uBB34 \uC9E7\uAC70\uB098 \uC6A9\uC5B4\uC9D1\uCC98\uB7FC \uBCF4\uC774\uBA74 \uD55C \uBC88\uC758 \uC218\uC815 \uD655\uC7A5 \uB2E8\uACC4\uB97C \uC2E4\uD589\uD569\uB2C8\uB2E4.",
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
    autoExpandShortChapters: "Ch\u1EA1y m\u1ED9t b\u01B0\u1EDBc s\u1EEDa m\u1EDF r\u1ED9ng khi ch\u01B0\u01A1ng qu\xE1 ng\u1EAFn ho\u1EB7c gi\u1ED1ng b\u1EA3ng thu\u1EADt ng\u1EEF.",
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
    autoExpandShortChapters: "\u0E23\u0E31\u0E19\u0E01\u0E32\u0E23\u0E0B\u0E48\u0E2D\u0E21\u0E41\u0E0B\u0E21\u0E2B\u0E19\u0E36\u0E48\u0E07\u0E04\u0E23\u0E31\u0E49\u0E07\u0E40\u0E21\u0E37\u0E48\u0E2D\u0E1A\u0E17\u0E2A\u0E31\u0E49\u0E19\u0E40\u0E01\u0E34\u0E19\u0E44\u0E1B\u0E2B\u0E23\u0E37\u0E2D\u0E40\u0E2B\u0E21\u0E37\u0E2D\u0E19\u0E2D\u0E20\u0E34\u0E18\u0E32\u0E19\u0E28\u0E31\u0E1E\u0E17\u0E4C\u0E40\u0E01\u0E34\u0E19\u0E44\u0E1B",
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
    autoExpandShortChapters: "Jalankan satu pass perbaikan saat bab terlalu pendek atau terlalu mirip glosarium.",
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
    autoExpandShortChapters: "Jalankan satu pusingan pembaikan apabila bab terlalu pendek atau terlalu seperti glosari.",
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
    autoExpandShortChapters: "\u091C\u092C \u0905\u0927\u094D\u092F\u093E\u092F \u092C\u0939\u0941\u0924 \u091B\u094B\u091F\u093E \u0939\u094B \u092F\u093E \u0936\u092C\u094D\u0926\u093E\u0935\u0932\u0940-\u0938\u0942\u091A\u0940 \u091C\u0948\u0938\u093E \u0932\u0917\u0947, \u0924\u094B \u090F\u0915 \u0938\u0941\u0927\u093E\u0930 \u0935\u093F\u0938\u094D\u0924\u093E\u0930 \u091A\u0930\u0923 \u091A\u0932\u093E\u090F\u0901\u0964",
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
    autoExpandShortChapters: "\u064A\u0634\u063A\u0651\u0644 \u0645\u0631\u062D\u0644\u0629 \u0625\u0635\u0644\u0627\u062D \u0648\u0627\u062D\u062F\u0629 \u0639\u0646\u062F\u0645\u0627 \u064A\u0643\u0648\u0646 \u0627\u0644\u0641\u0635\u0644 \u0642\u0635\u064A\u0631\u0627 \u062C\u062F\u0627 \u0623\u0648 \u0634\u0628\u064A\u0647\u0627 \u0628\u0627\u0644\u0642\u0627\u0645\u0648\u0633.",
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
    autoExpandShortChapters: "F\xFChrt einen Reparaturdurchlauf aus, wenn ein Kapitel zu kurz oder zu glossarartig ist.",
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
    autoExpandShortChapters: "Ex\xE9cute un passage de r\xE9paration lorsqu'un chapitre est trop court ou trop proche d'un glossaire.",
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
    autoExpandShortChapters: "Ejecuta un paso de reparaci\xF3n cuando un cap\xEDtulo es demasiado corto o parece un glosario.",
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
    autoExpandShortChapters: "Esegue un passaggio di riparazione quando un capitolo \xE8 troppo breve o troppo simile a un glossario.",
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
    autoExpandShortChapters: "Executa uma etapa de reparo quando um cap\xEDtulo \xE9 curto demais ou parece um gloss\xE1rio.",
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
    autoExpandShortChapters: "Voert \xE9\xE9n reparatiestap uit wanneer een hoofdstuk te kort is of te veel op een woordenlijst lijkt.",
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
    autoExpandShortChapters: "K\xF6r ett reparationssteg n\xE4r ett kapitel \xE4r f\xF6r kort eller f\xF6r likt en ordlista.",
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
    autoExpandShortChapters: "Suorittaa yhden korjausvaiheen, kun luku on liian lyhyt tai liian sanastomainen.",
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
    autoExpandShortChapters: "Uruchamia jeden krok naprawy, gdy rozdzia\u0142 jest zbyt kr\xF3tki lub zbyt podobny do glosariusza.",
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
    autoExpandShortChapters: "B\xF6l\xFCm \xE7ok k\u0131sa veya s\xF6zl\xFCk benzeri oldu\u011Funda bir onar\u0131m ge\xE7i\u015Fi \xE7al\u0131\u015Ft\u0131r\u0131r.",
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
    autoExpandShortChapters: "\u0417\u0430\u043F\u0443\u0441\u043A\u0430\u0435\u0442 \u043E\u0434\u0438\u043D \u044D\u0442\u0430\u043F \u0438\u0441\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u044F, \u0435\u0441\u043B\u0438 \u0433\u043B\u0430\u0432\u0430 \u0441\u043B\u0438\u0448\u043A\u043E\u043C \u043A\u043E\u0440\u043E\u0442\u043A\u0430\u044F \u0438\u043B\u0438 \u043F\u043E\u0445\u043E\u0436\u0430 \u043D\u0430 \u0433\u043B\u043E\u0441\u0441\u0430\u0440\u0438\u0439.",
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
function getHeaderText(language) {
  var _a;
  return (_a = HEADER_TEXT[language]) != null ? _a : HEADER_TEXT.en;
}
function getUiText(language) {
  var _a;
  return (_a = UI_TEXT[language]) != null ? _a : UI_TEXT.en;
}
function getSettingDescriptionText(language) {
  var _a;
  return (_a = SETTING_DESCRIPTION_TEXT[language]) != null ? _a : SETTING_DESCRIPTION_TEXT.en;
}
function getDefaultLabel(language) {
  var _a;
  return (_a = DEFAULT_LABEL_TEXT[language]) != null ? _a : DEFAULT_LABEL_TEXT.en;
}
function getKnowledgeDepthDescriptionText(language) {
  var _a;
  return (_a = KNOWLEDGE_DEPTH_DESCRIPTION_TEXT[language]) != null ? _a : KNOWLEDGE_DEPTH_DESCRIPTION_TEXT.en;
}

// src/domainAdapters.ts
var CONCEPTUAL_ADAPTER = {
  knowledgeType: "conceptual",
  coreUnitType: "concept",
  requiredSections: [
    "orientation",
    "prerequisite map",
    "core concept map",
    "concept explanations",
    "relationships and tradeoffs",
    "examples",
    "common misconceptions",
    "retrieval questions",
    "next steps"
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
  failureModeName: "misconceptions and conceptual traps"
};
var MATHEMATICAL_ADAPTER = {
  knowledgeType: "mathematical",
  coreUnitType: "formula_or_model",
  requiredSections: [
    "orientation",
    "prerequisite map",
    "core quantities and models",
    "symbols, units, and dimensions",
    "formula intuition",
    "assumptions and regimes",
    "worked examples",
    "edge cases and limiting cases",
    "common mistakes",
    "retrieval questions",
    "next steps"
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
  failureModeName: "wrong assumptions, unit mistakes, and formula misuse"
};
var PROCEDURAL_ADAPTER = {
  knowledgeType: "procedural",
  coreUnitType: "procedure",
  requiredSections: [
    "orientation",
    "minimal working workflow",
    "prerequisite tools and setup",
    "core tasks",
    "step-by-step workflows",
    "verification checklist",
    "common mistakes and troubleshooting",
    "practice tasks",
    "next steps"
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
  failureModeName: "common mistakes and troubleshooting"
};
var EMPIRICAL_ADAPTER = {
  knowledgeType: "empirical",
  coreUnitType: "evaluation_method",
  requiredSections: [
    "orientation",
    "hypothesis",
    "data and assumptions",
    "evaluation pipeline",
    "metrics",
    "baseline comparison",
    "bias and leakage risks",
    "robustness checks",
    "failure modes",
    "practice tasks",
    "next steps"
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
  failureModeName: "biases, leakage, false edge, and invalid inference"
};
var CRAFT_ADAPTER = {
  knowledgeType: "craft",
  coreUnitType: "technique",
  requiredSections: [
    "orientation",
    "materials and tools",
    "style or quality standards",
    "core techniques",
    "process",
    "representative cases",
    "sensory or output standards",
    "common failures and fixes",
    "practice tasks",
    "next steps"
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
  failureModeName: "bad outputs and fixes"
};
var HISTORICAL_ADAPTER = {
  knowledgeType: "historical",
  coreUnitType: "historical_transition",
  requiredSections: [
    "orientation",
    "timeline",
    "key actors, works, or institutions",
    "causal forces",
    "major transitions",
    "conflicts or debates",
    "representative cases",
    "legacy and modern relevance",
    "common misconceptions",
    "retrieval questions",
    "next steps"
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
  failureModeName: "oversimplified timelines and historical myths"
};
var ADAPTERS = {
  conceptual: CONCEPTUAL_ADAPTER,
  mathematical: MATHEMATICAL_ADAPTER,
  procedural: PROCEDURAL_ADAPTER,
  empirical: EMPIRICAL_ADAPTER,
  craft: CRAFT_ADAPTER,
  historical: HISTORICAL_ADAPTER
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
    failureModeName: primary.failureModeName
  };
}

// src/instructionalPlanner.ts
var KNOWLEDGE_TYPES = [
  "conceptual",
  "mathematical",
  "procedural",
  "empirical",
  "craft",
  "historical",
  "hybrid"
];
var CORE_UNIT_TYPES = [
  "concept",
  "mechanism",
  "formula_or_model",
  "procedure",
  "skill",
  "technique",
  "case",
  "evaluation_method",
  "historical_transition"
];
var KNOWLEDGE_DEPTHS = [
  "scan",
  "onboarding",
  "learn",
  "review"
];
function buildPlanningPrompt(courseName, chapterName, language, depth) {
  const targetLanguage = getLanguageLabel(language);
  return `Given the course and chapter, classify the knowledge type and design the chapter structure.

Course: ${courseName}
Chapter: ${chapterName}
Requested depth: ${depth}
Output language: ${targetLanguage}

Return strict JSON only. Do not wrap the JSON in Markdown.

Schema:
{
  "primaryKnowledgeType": "conceptual | mathematical | procedural | empirical | craft | historical | hybrid",
  "secondaryKnowledgeTypes": ["conceptual | mathematical | procedural | empirical | craft | historical"],
  "coreUnitType": "concept | mechanism | formula_or_model | procedure | skill | technique | case | evaluation_method | historical_transition",
  "elementInteractivity": "low | medium | high",
  "recommendedDepth": "scan | onboarding | learn | review",
  "requiredSections": ["..."],
  "unitFields": ["..."],
  "mustIncludeExamples": ["..."],
  "commonFailureModes": ["..."],
  "densityRisks": ["..."]
}

Rules:
- Do not force every subject into a concept-only structure.
- If the topic is tool-oriented, use procedural.
- If the topic depends on formulas, models, units, or assumptions, include mathematical.
- If the topic depends on data, experiments, backtesting, metrics, or evidence, include empirical.
- If the topic depends on technique, materials, sensory standards, or output quality, include craft.
- If the topic depends on chronology, culture, origin, or evolution, include historical.
- Use hybrid when necessary.`;
}
function parseJsonObject(text) {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch (e) {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error("Planning response did not contain a JSON object");
    }
    return JSON.parse(match[0]);
  }
}
function isKnowledgeType(value) {
  return typeof value === "string" && KNOWLEDGE_TYPES.includes(value);
}
function isCoreUnitType(value) {
  return typeof value === "string" && CORE_UNIT_TYPES.includes(value);
}
function isKnowledgeDepth(value) {
  return typeof value === "string" && KNOWLEDGE_DEPTHS.includes(value);
}
function readStringArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((item) => typeof item === "string");
}
function fallbackPlan(courseName, chapterName, depth = "onboarding") {
  const normalized = `${courseName} ${chapterName}`.toLowerCase();
  const adapter = selectFallbackAdapter(normalized);
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
    densityRisks: [
      "may become too glossary-like",
      "may list terms without explaining relationships"
    ]
  };
}
function selectFallbackAdapter(topic) {
  if (/(musescore|git|obsidian|excel|blender|workflow|tool|操作|工作流)/i.test(topic)) {
    return getAdapterForKnowledgeType("procedural");
  }
  if (/(formula|equation|model|signal|control|aero|physics|greek|option|統計|公式|模型|空氣動力|電路)/i.test(topic)) {
    return getAdapterForKnowledgeType("mathematical");
  }
  if (/(backtest|quant|experiment|metric|evaluation|ab testing|data|回測|量化|實驗|評估)/i.test(topic)) {
    return getAdapterForKnowledgeType("empirical");
  }
  if (/(cooking|cuisine|coffee|photography|notation|orchestration|technique|本幫菜|烹飪|制譜|技法)/i.test(topic)) {
    return getAdapterForKnowledgeType("craft");
  }
  if (/(history|historical|culture|evolution|origin|史|歷史|文化|演化)/i.test(topic)) {
    return getAdapterForKnowledgeType("historical");
  }
  return CONCEPTUAL_ADAPTER;
}
function parsePlanningResponse(text, courseName, chapterName, depth) {
  try {
    const value = parseJsonObject(text);
    if (!value || typeof value !== "object") {
      return fallbackPlan(courseName, chapterName, depth);
    }
    const raw = value;
    const fallback = fallbackPlan(courseName, chapterName, depth);
    const primaryKnowledgeType = isKnowledgeType(raw.primaryKnowledgeType) ? raw.primaryKnowledgeType : fallback.primaryKnowledgeType;
    const secondaryKnowledgeTypes = readStringArray(
      raw.secondaryKnowledgeTypes
    ).filter(
      (item) => isKnowledgeType(item) && item !== "hybrid"
    );
    const coreUnitType = isCoreUnitType(raw.coreUnitType) ? raw.coreUnitType : getAdapterForKnowledgeType(primaryKnowledgeType).coreUnitType;
    const recommendedDepth = isKnowledgeDepth(raw.recommendedDepth) ? raw.recommendedDepth : depth;
    const elementInteractivity = raw.elementInteractivity === "low" || raw.elementInteractivity === "medium" || raw.elementInteractivity === "high" ? raw.elementInteractivity : "medium";
    return {
      primaryKnowledgeType,
      secondaryKnowledgeTypes,
      coreUnitType,
      elementInteractivity,
      recommendedDepth,
      requiredSections: readStringArray(raw.requiredSections).length > 0 ? readStringArray(raw.requiredSections) : fallback.requiredSections,
      unitFields: readStringArray(raw.unitFields).length > 0 ? readStringArray(raw.unitFields) : fallback.unitFields,
      mustIncludeExamples: readStringArray(raw.mustIncludeExamples).length > 0 ? readStringArray(raw.mustIncludeExamples) : fallback.mustIncludeExamples,
      commonFailureModes: readStringArray(raw.commonFailureModes).length > 0 ? readStringArray(raw.commonFailureModes) : fallback.commonFailureModes,
      densityRisks: readStringArray(raw.densityRisks).length > 0 ? readStringArray(raw.densityRisks) : fallback.densityRisks
    };
  } catch (e) {
    return fallbackPlan(courseName, chapterName, depth);
  }
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
function selectAdapter(plan) {
  const primary = plan.primaryKnowledgeType === "hybrid" ? getAdapterForKnowledgeType("conceptual") : getAdapterForKnowledgeType(plan.primaryKnowledgeType);
  const secondary = plan.secondaryKnowledgeTypes.filter((type) => type !== primary.knowledgeType).map((type) => getAdapterForKnowledgeType(type));
  if (plan.primaryKnowledgeType === "hybrid" || secondary.length > 0) {
    return mergeAdapters(primary, secondary);
  }
  return primary;
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
    let selectedDepth = DEFAULT_SETTINGS.knowledgeDepth;
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
function buildOutlinePrompt(courseName, language) {
  const targetLanguage = getLanguageLabel(language);
  return `
\u8ACB\u4F60\u4F5C\u70BA\u5927\u5B78\u8AB2\u7A0B\u52A9\u6559\uFF0C\u70BA\u6307\u5B9A\u8AB2\u7A0B\u6574\u7406\u4E00\u4EFD\u9AD8\u8CEA\u91CF\u8AB2\u7A0B\u63D0\u7DB1\u3002\u9019\u4EFD\u63D0\u7DB1\u7528\u65BC\u5FEB\u901F\u5EFA\u7ACB\u80CC\u666F\u77E5\u8B58\uFF0C\u53EF\u670D\u52D9\u65BC\u79D1\u7814\u5165\u9580\u524D\u7684\u80CC\u666F\u4E86\u89E3\u3001\u8AB2\u7A0B\u8907\u7FD2\u3001\u8DE8\u9818\u57DF\u5B78\u7FD2\u548C\u5C08\u696D\u4EA4\u6D41\u6E96\u5099\u3002\u4F60\u9700\u8981\u8003\u616E\u570B\u969B\u901A\u7528\u6559\u5B78\u4E2D\u9019\u9580\u8AB2\u6700\u4E3B\u8981\u7684\u77E5\u8B58\uFF0C\u5305\u62EC\u7D93\u5178\u5167\u5BB9\u3001\u73FE\u4EE3\u767C\u5C55\u3001\u6838\u5FC3\u6982\u5FF5\u3001\u91CD\u8981\u7406\u8AD6\u548C\u5178\u578B\u61C9\u7528\u3002

\u8F38\u51FA\u8A9E\u8A00\uFF1A${targetLanguage}
\u8853\u8A9E\u8981\u6C42\uFF1A\u4E3B\u8981\u5167\u5BB9\u4F7F\u7528\u300C${targetLanguage}\u300D\u3002\u95DC\u9375\u8853\u8A9E\u8ACB\u7528\u96D9\u8A9E\u5C55\u793A\uFF0C\u683C\u5F0F\u70BA\uFF08English Term, ${targetLanguage} Term\uFF09\u3002

\u8ACB\u6309\u7167\u4EE5\u4E0B\u683C\u5F0F\u8F38\u51FA\uFF1A
1. \u4E00\u7D1A\u7AE0\u7BC0\u6A19\u984C
   - \u5B50\u9805\u76EE\uFF08English Term, ${targetLanguage} Term\uFF09
   - \u5B50\u9805\u76EE\uFF08English Term, ${targetLanguage} Term\uFF09

2. \u4E00\u7D1A\u7AE0\u7BC0\u6A19\u984C
   - \u5B50\u9805\u76EE\uFF08English Term, ${targetLanguage} Term\uFF09
   - \u5B50\u9805\u76EE\uFF08English Term, ${targetLanguage} Term\uFF09

\u8ACB\u78BA\u4FDD\uFF1A
1. \u4E00\u7D1A\u7AE0\u7BC0\u5FC5\u9808\u4F7F\u7528\u6578\u5B57\u7DE8\u865F\uFF081., 2., 3. \u7B49\uFF09
2. \u5B50\u9805\u76EE\u4F7F\u7528\u77ED\u6A6B\u7DDA\uFF08-\uFF09
3. \u8853\u8A9E\u63A1\u7528\u96D9\u8A9E\u5C0D\u7167\u683C\u5F0F\uFF1A\uFF08English Term, ${targetLanguage} Term\uFF09
4. \u5167\u5BB9\u61C9\u8A72\u6DB5\u84CB\u8AB2\u7A0B\u7684\u6838\u5FC3\u6982\u5FF5\u3001\u91CD\u8981\u4E3B\u984C\u3001\u57FA\u790E\u7406\u8AD6\u3001\u5178\u578B\u65B9\u6CD5\u548C\u5BE6\u969B\u61C9\u7528
5. \u63D0\u7DB1\u61C9\u50CF\u6B63\u5F0F\u6559\u6750\u6216\u9AD8\u8CEA\u91CF\u8AB2\u7A0B syllabus\uFF0C\u4E0D\u8981\u5BEB\u6210\u96F6\u6563\u95DC\u9375\u8A5E\u6E05\u55AE
6. \u4E0D\u8981\u5728\u6B63\u6587\u4E2D\u63CF\u8FF0\u4F7F\u7528\u8005\u7684\u500B\u4EBA\u80CC\u666F\u6216\u6E96\u5099\u6D41\u7A0B\uFF1B\u53EA\u8F38\u51FA\u8AB2\u7A0B\u77E5\u8B58\u672C\u8EAB
7. \u8A2D\u8A08\u8AB2\u7A0B\u7AE0\u7BC0\u6642\uFF0C\u8ACB\u6839\u64DA\u9818\u57DF\u8ABF\u6574\u7AE0\u7BC0\u985E\u578B\uFF1A
   - conceptual chapters for theories and mechanisms
   - procedural chapters for tools and workflows
   - mathematical chapters for formulas and models
   - empirical chapters for data, experiments, and evaluation
   - craft chapters for techniques and quality standards
   - historical chapters for evolution and context

\u8ACB\u70BA\u4EE5\u4E0B\u8AB2\u7A0B\u751F\u6210\u5927\u7DB1\uFF0810-20\u500B\u7AE0\u7BC0\u662F\u53EF\u63A5\u53D7\u7BC4\u570D\uFF09\uFF1A

Course: ${courseName}
`;
}
function formatList(values) {
  return values.map((value) => `- ${value}`).join("\n");
}
function buildInstructionalSystemPrompt() {
  return [
    "You are an instructional designer.",
    "Your job is to generate usable learning chapters, not summaries or glossaries.",
    "Always adapt the chapter structure to the knowledge type.",
    "Do not force all topics into a concept-only format.",
    "Prioritize prerequisite bridges, examples, failure modes, and self-check tasks.",
    "Follow explicit length, density, and structure requirements."
  ].join(" ");
}
function buildChapterPrompt(args) {
  const {
    courseName,
    chapterName,
    language,
    depth,
    plan,
    adapter,
    density
  } = args;
  const targetLanguage = getLanguageLabel(language);
  const sectionHeadingContract = buildSectionHeadingContract(
    adapter.requiredSections,
    language
  );
  const unitFieldHeadingContract = buildSectionHeadingContract(
    adapter.unitFields,
    language
  ).map((heading) => heading.replace(/^##\s+/, "### "));
  return `\u4F60\u662F\u4E00\u4F4D\u56B4\u683C\u7684 instructional designer \u8207\u8AB2\u7A0B\u52A9\u6559\u3002

\u4F60\u7684\u4EFB\u52D9\u4E0D\u662F\u5BEB\u6458\u8981\u3001\u8853\u8A9E\u8868\u6216\u767E\u79D1\u689D\u76EE\uFF0C\u800C\u662F\u751F\u6210\u4E00\u4EFD\u53EF\u7528\u65BC\u5FEB\u901F\u4E0A\u624B/\u5B78\u7FD2\u7684 Markdown \u7AE0\u7BC0\u3002

\u8AB2\u7A0B\uFF1A${courseName}
\u7AE0\u7BC0\uFF1A${chapterName}
\u8F38\u51FA\u8A9E\u8A00\uFF1A${targetLanguage}

\u77E5\u8B58\u985E\u578B\uFF1A${plan.primaryKnowledgeType}
\u6B21\u8981\u77E5\u8B58\u985E\u578B\uFF1A${plan.secondaryKnowledgeTypes.join(", ") || "none"}
\u6838\u5FC3\u5B78\u7FD2\u55AE\u5143\u985E\u578B\uFF1A${plan.coreUnitType}
element interactivity\uFF1A${plan.elementInteractivity}
\u5B78\u7FD2\u6DF1\u5EA6\uFF1A${density.label} (${depth})

\u8853\u8A9E\u8981\u6C42\uFF1A\u4E3B\u8981\u5167\u5BB9\u4F7F\u7528\u300C${targetLanguage}\u300D\u3002\u95DC\u9375\u8853\u8A9E\u8ACB\u63D0\u4F9B\uFF08English Term, ${targetLanguage} Term\uFF09\u96D9\u8A9E\u5C0D\u7167\u3002
\u8F38\u51FA\u65B9\u5F0F\uFF1A\u76F4\u63A5\u5F9E\u7AE0\u7BC0\u5167\u5BB9\u958B\u59CB\uFF0C\u4E0D\u8981\u5BD2\u6684\uFF0C\u4E0D\u8981\u7A31\u547C\u8B80\u8005\uFF0C\u4E0D\u8981\u8AAA\u300C\u597D\u7684\u300D\u300C\u540C\u5B78\u300D\u300C\u9019\u4EFD\u7B46\u8A18\u65E8\u5728\u300D\u300C\u6211\u5011\u5C07\u300D\u7B49\u958B\u5834\u767D\uFF0C\u4E5F\u4E0D\u8981\u89E3\u91CB\u4F60\u5C07\u5982\u4F55\u5BEB\u4F5C\u3002

# \u77E5\u8B58\u5BC6\u5EA6\u5951\u7D04

- \u76EE\u6A19\u9577\u5EA6\uFF1A${density.targetChars.min}-${density.targetChars.max} \u500B\u6709\u6548\u5B57\u7B26\uFF0C\u7406\u60F3\u7D04 ${density.targetChars.ideal}\u3002
- \u6838\u5FC3\u5B78\u7FD2\u55AE\u5143\u6578\u91CF\uFF1A${density.coreUnits.min}-${density.coreUnits.max} \u500B\u3002
- Worked examples\uFF1A\u81F3\u5C11 ${density.workedExamples} \u500B\u3002
- Concrete examples\uFF1A\u81F3\u5C11 ${density.concreteExamples} \u500B\u3002
- Retrieval questions / practice tasks\uFF1A\u81F3\u5C11 ${density.retrievalQuestions} \u500B\u3002
- Failure modes\uFF1A\u81F3\u5C11 ${density.failureModes} \u500B\u3002
- \u4E0D\u8981\u70BA\u4E86\u986F\u5F97\u5168\u9762\u800C\u5217\u51FA\u5927\u91CF\u672A\u5C55\u958B\u8853\u8A9E\u3002
- \u5982\u679C\u672C\u7AE0\u592A\u5927\uFF0C\u8ACB\u660E\u78BA\u62C6\u6210\u300C\u672C\u7AE0\u805A\u7126\u300D\u8207\u300C\u5F8C\u7E8C\u7AE0\u7BC0\u300D\uFF0C\u4E0D\u8981\u628A 30 \u500B\u6982\u5FF5\u58D3\u7E2E\u6210\u8584\u6458\u8981\u3002
- \u6BCF\u500B\u6838\u5FC3\u5B78\u7FD2\u55AE\u5143\u81F3\u5C11\u9700\u8981 2-4 \u6BB5\u89E3\u91CB\u3002
- \u5FC5\u9808\u5305\u542B\u5177\u9AD4\u4F8B\u5B50\u3001\u5E38\u898B\u5931\u6557\u6A21\u5F0F\u3001\u81EA\u6211\u6AA2\u67E5\u554F\u984C\u3002

# \u91CD\u8981\u539F\u5247

- \u4E0D\u8981\u5F37\u884C\u628A\u6240\u6709\u4E3B\u984C\u5BEB\u6210\u6982\u5FF5\u578B\u7AE0\u7BC0\u3002
- \u5982\u679C\u662F procedural topic\uFF0C\u5FC5\u9808 task-first\u3002
- \u5982\u679C\u662F mathematical topic\uFF0C\u5FC5\u9808\u89E3\u91CB\u7B26\u865F\u3001\u55AE\u4F4D\u3001\u5047\u8A2D\u3001\u516C\u5F0F\u76F4\u89BA\u3002
- \u5982\u679C\u662F empirical topic\uFF0C\u5FC5\u9808\u89E3\u91CB\u8CC7\u6599\u3001\u5047\u8A2D\u3001bias\u3001metrics\u3001robustness\u3002
- \u5982\u679C\u662F craft topic\uFF0C\u5FC5\u9808\u89E3\u91CB\u6750\u6599\u3001\u6280\u6CD5\u3001\u611F\u5B98/\u54C1\u8CEA\u6A19\u6E96\u3001\u5931\u6557\u4FEE\u6B63\u3002
- \u5982\u679C\u662F historical topic\uFF0C\u4E0D\u8981\u53EA\u5217\u6642\u9593\u7DDA\uFF0C\u5FC5\u9808\u89E3\u91CB\u56E0\u679C\u548C\u6F14\u8B8A\u3002

# \u5FC5\u9808\u5305\u542B\u7684\u7AE0\u7BC0

\u8ACB\u4F7F\u7528\u4E0B\u9762\u9019\u4EFD exact Markdown H2 heading contract\u3002\u4E0D\u8981\u6539\u5927\u5C0F\u5BEB\uFF0C\u4E0D\u8981\u6539\u62EC\u865F\uFF0C\u4E0D\u8981\u6539\u9806\u5E8F\uFF1B\u53EF\u4EE5\u5728\u6BCF\u500B H2 \u4E0B\u9762\u81EA\u884C\u52A0\u5165 H3 \u5C0F\u6A19\u984C\u3002

${sectionHeadingContract.join("\n")}

\u6A19\u984C\u683C\u5F0F\u898F\u5247\uFF1A
- \u7AE0\u7BC0 H2 \u5FC5\u9808\u4F7F\u7528\u300C${targetLanguage} \u6A19\u984C (Title Case English)\u300D\u3002
- \u82F1\u6587\u62EC\u865F\u5167\u5FC5\u9808\u4F7F\u7528 Title Case\uFF0C\u4F8B\u5982 "Orientation"\uFF0C\u4E0D\u8981\u8F38\u51FA "orientation"\u3002
- \u4E0D\u8981\u8F38\u51FA\u7D14\u82F1\u6587 required-section \u6A19\u984C\uFF0C\u9664\u975E\u8F38\u51FA\u8A9E\u8A00\u672C\u8EAB\u5C31\u662F English\u3002
- \u4E0D\u8981\u4F7F\u7528 "orientation / \u5B78\u7FD2\u5B9A\u4F4D" \u9019\u985E\u659C\u7DDA\u683C\u5F0F\u3002
- \u672C\u5730\u54C1\u8CEA\u6AA2\u67E5\u6703\u4F9D\u8CF4\u62EC\u865F\u5167\u7684 English title\u3002

# \u6BCF\u500B\u6838\u5FC3\u5B78\u7FD2\u55AE\u5143\u5FC5\u9808\u5305\u542B

${formatList(adapter.unitFields)}

\u5982\u679C\u4F60\u628A\u4E0A\u8FF0\u6B04\u4F4D\u5BEB\u6210 Markdown \u5C0F\u6A19\u984C\uFF0C\u5FC5\u9808\u4F7F\u7528\u4E0B\u9762\u9019\u4EFD exact Markdown H3 heading contract\u3002\u4E0D\u8981\u8F38\u51FA\u7D14\u82F1\u6587\u5C0F\u6A19\u984C\u3002

${unitFieldHeadingContract.join("\n")}

\u4EFB\u4F55 Markdown heading \u90FD\u5FC5\u9808\u662F\u300C${targetLanguage} \u6A19\u984C (Title Case English)\u300D\u683C\u5F0F\u3002\u5373\u4F7F\u662F H3/H4 \u5C0F\u6A19\u984C\uFF0C\u4E5F\u4E0D\u80FD\u53EA\u8F38\u51FA "Definition and Intuition"\u3001"Why It Exists"\u3001"Problem It Solves" \u9019\u985E\u7D14\u82F1\u6587\u6A19\u984C\u3002

# \u4F8B\u5B50\u8981\u6C42

${formatList(adapter.exampleRequirements)}

# Planning step \u88DC\u5145\u8981\u6C42

Required sections from plan:
${formatList(plan.requiredSections)}

Unit fields from plan:
${formatList(plan.unitFields)}

Must include examples from plan:
${formatList(plan.mustIncludeExamples)}

Common failure modes from plan:
${formatList(plan.commonFailureModes)}

Density risks to avoid:
${formatList(plan.densityRisks)}

# \u5E38\u898B\u5931\u6557\u6A21\u5F0F

\u81F3\u5C11\u5217\u51FA ${density.failureModes} \u500B ${adapter.failureModeName}\u3002
\u6BCF\u500B\u90FD\u8981\u8AAA\u660E\uFF1A
- \u932F\u8AA4\u6216\u5931\u6557\u662F\u4EC0\u9EBC
- \u70BA\u4EC0\u9EBC\u5BB9\u6613\u767C\u751F
- \u5982\u4F55\u8B58\u5225
- \u5982\u4F55\u4FEE\u6B63

# \u81EA\u6211\u6AA2\u67E5

\u81F3\u5C11\u5217\u51FA ${density.retrievalQuestions} \u500B retrieval questions \u6216 practice tasks\u3002
\u554F\u984C\u61C9\u8986\u84CB\uFF1A
- \u5B9A\u7FA9
- \u95DC\u4FC2
- \u61C9\u7528
- \u53CD\u4F8B
- \u9077\u79FB
- \u932F\u8AA4\u8A3A\u65B7

# \u516C\u5F0F\u683C\u5F0F

\u5982\u679C\u6D89\u53CA\u516C\u5F0F\uFF1A
   - \u884C\u5167\u516C\u5F0F\u4F7F\u7528\u55AE\u7F8E\u5143\u7B26\u865F\uFF0C\u4F8B\u5982\uFF1A$E = mc^2$
   - \u7368\u7ACB\u5C55\u793A\u516C\u5F0F\u4F7F\u7528\u96D9\u7F8E\u5143\u7B26\u865F\uFF0C\u4E14 $$ \u5FC5\u9808\u55AE\u7368\u6210\u884C\uFF0C\u4F8B\u5982\uFF1A

$$
f(x) = \\sum_{n=0}^{\\infty} a_n x^n
$$

   - \u4E0D\u8981\u628A\u516C\u5F0F\u653E\u9032\u4EE5\u4E09\u500B\u53CD\u5F15\u865F\u958B\u982D\u7684 latex/math fenced code block
   - \u4E0D\u8981\u4F7F\u7528 Obsidian/KaTeX \u4E0D\u5E38\u652F\u6301\u7684\u5B8F\u5305\u547D\u4EE4\uFF1B\u512A\u5148\u4F7F\u7528\u6A19\u6E96 LaTeX/KaTeX \u8A9E\u6CD5
   - \u6BCF\u500B\u91CD\u8981\u516C\u5F0F\u5F8C\u8981\u89E3\u91CB\u7B26\u865F\u3001\u55AE\u4F4D\u3001\u76F4\u89BA\u3001\u9069\u7528\u689D\u4EF6\u3001\u9650\u5236

# \u7981\u6B62\u4E8B\u9805

- \u4E0D\u8981\u5BEB\u6210 glossary\u3002
- \u4E0D\u8981\u7528\u5927\u91CF bullet \u4EE3\u66FF\u89E3\u91CB\u3002
- \u4E0D\u8981\u53EA\u5217\u540D\u8A5E\u3002
- \u4E0D\u8981\u7528\u300C\u672C\u7AE0\u5C07\u300D\u300C\u6211\u5011\u6703\u300D\u300C\u9019\u4EFD\u7B46\u8A18\u65E8\u5728\u300D\u7B49\u7A7A\u6CDB\u958B\u5834\u767D\u3002
- \u4E0D\u8981\u63CF\u8FF0\u4F7F\u7528\u8005\u80CC\u666F\u3002
- \u4E0D\u8981\u70BA\u4E86\u63A7\u5236\u7BC7\u5E45\u800C\u72A7\u7272\u6982\u5FF5\u6A4B\u6A11\u3002
- \u5982\u679C\u5167\u5BB9\u4F4E\u65BC\u6700\u4F4E\u9577\u5EA6\uFF0C\u5FC5\u9808\u4E3B\u52D5\u5C55\u958B\u6838\u5FC3\u55AE\u5143\u3001\u4F8B\u5B50\u548C\u5931\u6557\u6A21\u5F0F\uFF0C\u800C\u4E0D\u662F\u63D0\u524D\u7D50\u675F\u3002

\u8ACB\u76F4\u63A5\u8F38\u51FA Markdown \u7AE0\u7BC0\u5167\u5BB9\u3002
`;
}
function buildChapterRepairPrompt(args) {
  const {
    courseName,
    chapterName,
    language,
    density,
    plan,
    adapter,
    formattedQualityReport,
    existingChapter
  } = args;
  const targetLanguage = getLanguageLabel(language);
  const sectionHeadingContract = buildSectionHeadingContract(
    adapter.requiredSections,
    language
  );
  const unitFieldHeadingContract = buildSectionHeadingContract(
    adapter.unitFields,
    language
  ).map((heading) => heading.replace(/^##\s+/, "### "));
  return `\u4E0B\u9762\u662F\u4E00\u4EFD\u904E\u77ED\u3001\u904E\u65BC\u8DF3\u8E8D\u6216\u904E\u65BC glossary-like \u7684\u7AE0\u7BC0\u7B46\u8A18\u3002
\u8ACB\u4E0D\u8981\u91CD\u5BEB\u6210\u53E6\u4E00\u4EFD\u6458\u8981\uFF0C\u800C\u662F\u5728\u4FDD\u7559\u539F\u6709\u7D50\u69CB\u7684\u57FA\u790E\u4E0A\u64F4\u5BEB\u6210\u53EF\u5B78\u7FD2\u7684\u6559\u5B78\u7AE0\u7BC0\u3002

\u8AB2\u7A0B\uFF1A${courseName}
\u7AE0\u7BC0\uFF1A${chapterName}
\u8F38\u51FA\u8A9E\u8A00\uFF1A${targetLanguage}
\u77E5\u8B58\u985E\u578B\uFF1A${plan.primaryKnowledgeType}
\u6838\u5FC3\u5B78\u7FD2\u55AE\u5143\u985E\u578B\uFF1A${plan.coreUnitType}
\u6700\u4F4E\u76EE\u6A19\u9577\u5EA6\uFF1A${density.targetChars.min} \u500B\u6709\u6548\u5B57\u7B26

\u9700\u8981\u4FEE\u5FA9\u7684\u554F\u984C\uFF1A
${formattedQualityReport}

\u5FC5\u9808\u88DC\u8DB3\u7684\u7AE0\u7BC0\uFF1A
\u8ACB\u4F7F\u7528\u4E0B\u9762\u9019\u4EFD exact Markdown H2 heading contract\u3002\u4E0D\u8981\u6539\u5927\u5C0F\u5BEB\uFF0C\u4E0D\u8981\u6539\u62EC\u865F\uFF0C\u4E0D\u8981\u6539\u9806\u5E8F\uFF1B\u53EF\u4EE5\u5728\u6BCF\u500B H2 \u4E0B\u9762\u81EA\u884C\u52A0\u5165 H3 \u5C0F\u6A19\u984C\u3002

${sectionHeadingContract.join("\n")}

\u6A19\u984C\u683C\u5F0F\u898F\u5247\uFF1A
- \u7AE0\u7BC0 H2 \u5FC5\u9808\u4F7F\u7528\u300C${targetLanguage} \u6A19\u984C (Title Case English)\u300D\u3002
- \u82F1\u6587\u62EC\u865F\u5167\u5FC5\u9808\u4F7F\u7528 Title Case\uFF0C\u4F8B\u5982 "Orientation"\uFF0C\u4E0D\u8981\u8F38\u51FA "orientation"\u3002
- \u4E0D\u8981\u8F38\u51FA\u7D14\u82F1\u6587 required-section \u6A19\u984C\uFF0C\u9664\u975E\u8F38\u51FA\u8A9E\u8A00\u672C\u8EAB\u5C31\u662F English\u3002
- \u4E0D\u8981\u4F7F\u7528 "orientation / \u5B78\u7FD2\u5B9A\u4F4D" \u9019\u985E\u659C\u7DDA\u683C\u5F0F\u3002

\u6BCF\u500B\u6838\u5FC3\u5B78\u7FD2\u55AE\u5143\u5FC5\u9808\u88DC\u8DB3\uFF1A
${formatList(adapter.unitFields)}

\u5982\u679C\u4F60\u628A\u4E0A\u8FF0\u6B04\u4F4D\u5BEB\u6210 Markdown \u5C0F\u6A19\u984C\uFF0C\u5FC5\u9808\u4F7F\u7528\u4E0B\u9762\u9019\u4EFD exact Markdown H3 heading contract\u3002\u4E0D\u8981\u8F38\u51FA\u7D14\u82F1\u6587\u5C0F\u6A19\u984C\u3002

${unitFieldHeadingContract.join("\n")}

\u4EFB\u4F55 Markdown heading \u90FD\u5FC5\u9808\u662F\u300C${targetLanguage} \u6A19\u984C (Title Case English)\u300D\u683C\u5F0F\u3002\u5373\u4F7F\u662F H3/H4 \u5C0F\u6A19\u984C\uFF0C\u4E5F\u4E0D\u80FD\u53EA\u8F38\u51FA\u7D14\u82F1\u6587\u6A19\u984C\u3002

\u64F4\u5BEB\u8981\u6C42\uFF1A
1. \u4FDD\u7559\u539F\u6709 Markdown \u7D50\u69CB\u3002
2. \u4E0D\u8981\u522A\u9664\u5DF2\u6709\u5167\u5BB9\uFF0C\u9664\u975E\u5B83\u660E\u986F\u932F\u8AA4\u3002
3. \u88DC\u5145\u7F3A\u5931\u7684 required sections\u3002
4. \u70BA\u6BCF\u500B\u6838\u5FC3\u5B78\u7FD2\u55AE\u5143\u88DC\u5145 adapter \u8981\u6C42\u7684 fields\u3002
5. \u88DC\u5145\u5177\u9AD4\u4F8B\u5B50\u3001worked examples\u3001\u5931\u6557\u6A21\u5F0F\u3001\u4FEE\u6B63\u65B9\u6CD5\u3002
6. \u88DC\u5145 retrieval questions \u6216 practice tasks\u3002
7. \u4E0D\u8981\u628A\u5167\u5BB9\u8B8A\u6210\u8853\u8A9E\u8868\u3002
8. \u76F4\u63A5\u8F38\u51FA\u5B8C\u6574\u64F4\u5BEB\u5F8C\u7AE0\u7BC0\uFF0C\u4E0D\u8981\u89E3\u91CB\u4F60\u505A\u4E86\u4EC0\u9EBC\u3002

\u539F\u7AE0\u7BC0\u5982\u4E0B\uFF1A

${existingChapter}`;
}

// src/settings-tab.ts
var import_obsidian3 = require("obsidian");

// src/utils.ts
var KNOWLEDGE_DEPTHS2 = [
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
function sleep(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}
function errorToMessage(error) {
  return error instanceof Error ? error.message : String(error);
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
  return (_a = KNOWLEDGE_DEPTHS2.find((depth) => depth === value)) != null ? _a : null;
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

// src/settings-tab.ts
var KNOWLEDGE_TYPE_OPTIONS = {
  auto: "Auto",
  conceptual: "Conceptual",
  mathematical: "Mathematical",
  procedural: "Procedural",
  empirical: "Empirical / research",
  craft: "Craft / technique",
  historical: "Historical / cultural",
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
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.addClass("knowledge-settings");
    const settingDescriptions = getSettingDescriptionText(
      this.plugin.settings.language
    );
    const defaultLabel = getDefaultLabel(this.plugin.settings.language);
    new import_obsidian3.Setting(containerEl).setName("API key").setDesc(settingDescriptions.apiKey).addText(
      (text) => text.setPlaceholder("API key").setValue(this.plugin.settings.apiKey).onChange(async (value) => {
        this.plugin.settings.apiKey = value;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian3.Setting(containerEl).setName("API base URL").setDesc(
      `${settingDescriptions.apiBaseUrl} ${defaultLabel}: ${DEFAULT_SETTINGS.apiBaseUrl}`
    ).addText(
      (text) => text.setValue(this.plugin.settings.apiBaseUrl).onChange(async (value) => {
        this.plugin.settings.apiBaseUrl = value;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian3.Setting(containerEl).setName("Outline model").setDesc(settingDescriptions.outlineModel).addText(
      (text) => text.setValue(this.plugin.settings.modelOutline).onChange(async (value) => {
        this.plugin.settings.modelOutline = value;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian3.Setting(containerEl).setName("Chapter model").setDesc(settingDescriptions.chapterModel).addText(
      (text) => text.setValue(this.plugin.settings.modelChapter).onChange(async (value) => {
        this.plugin.settings.modelChapter = value;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian3.Setting(containerEl).setName("Knowledge type").setDesc(settingDescriptions.knowledgeType).addDropdown((dropdown) => {
      Object.entries(KNOWLEDGE_TYPE_OPTIONS).forEach(([value, label]) => {
        dropdown.addOption(value, label);
      });
      return dropdown.setValue(this.plugin.settings.knowledgeTypeOverride).onChange(async (value) => {
        this.plugin.settings.knowledgeTypeOverride = value;
        this.plugin.settings.autoDetectKnowledgeType = value === "auto";
        await this.plugin.saveSettings();
      });
    });
    new import_obsidian3.Setting(containerEl).setName("Minimum chapter characters").setDesc(settingDescriptions.minimumChapterCharacters).addText((text) => {
      text.inputEl.type = "number";
      text.inputEl.min = "1";
      text.inputEl.step = "100";
      return text.setPlaceholder(String(DEFAULT_SETTINGS.minChapterChars)).setValue(String(this.plugin.settings.minChapterChars)).onChange(async (value) => {
        var _a;
        this.plugin.settings.minChapterChars = (_a = parseOptionalPositiveInteger(value)) != null ? _a : DEFAULT_SETTINGS.minChapterChars;
        await this.plugin.saveSettings();
      });
    });
    new import_obsidian3.Setting(containerEl).setName("Auto-expand short chapters").setDesc(settingDescriptions.autoExpandShortChapters).addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.autoExpandShortChapters).onChange(async (value) => {
        this.plugin.settings.autoExpandShortChapters = value;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian3.Setting(containerEl).setName("Max completion tokens").setDesc(settingDescriptions.maxCompletionTokens).addText((text) => {
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
    new import_obsidian3.Setting(containerEl).setName("Temperature").setDesc(settingDescriptions.temperature).addText((text) => {
      text.inputEl.type = "number";
      text.inputEl.step = "0.1";
      return text.setPlaceholder("Omit").setValue(
        this.plugin.settings.temperature === null ? "" : String(this.plugin.settings.temperature)
      ).onChange(async (value) => {
        this.plugin.settings.temperature = parseOptionalNumber(value);
        await this.plugin.saveSettings();
      });
    });
    new import_obsidian3.Setting(containerEl).setName("Reasoning effort").setDesc(settingDescriptions.reasoningEffort).addDropdown((dropdown) => {
      var _a;
      dropdown.addOption("", "Unset");
      ["minimal", "low", "medium", "high"].forEach((value) => {
        dropdown.addOption(value, value);
      });
      return dropdown.setValue((_a = this.plugin.settings.reasoningEffort) != null ? _a : "").onChange(async (value) => {
        this.plugin.settings.reasoningEffort = value === "" ? null : value;
        await this.plugin.saveSettings();
      });
    });
    new import_obsidian3.Setting(containerEl).setName("Verbosity").setDesc(settingDescriptions.verbosity).addDropdown((dropdown) => {
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
    new import_obsidian3.Setting(containerEl).setName("Chapter concurrency").setDesc(settingDescriptions.chapterConcurrency).addText((text) => {
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
    new import_obsidian3.Setting(containerEl).setName("Language").setDesc(settingDescriptions.language).addDropdown((dropdown) => {
      Object.entries(LANGUAGE_OPTIONS).forEach(([value, label]) => {
        dropdown.addOption(value, label);
      });
      return dropdown.setValue(this.plugin.settings.language).onChange(async (v) => {
        this.plugin.settings.language = v;
        await this.plugin.saveSettings();
        this.plugin.refreshLocalizedUi();
      });
    });
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
    this.commandsRegistered = true;
  }
  updateRibbonLabel(ribbonIcon, label) {
    if (!ribbonIcon) {
      return;
    }
    (0, import_obsidian4.setTooltip)(ribbonIcon, label, { placement: "right" });
    ribbonIcon.setAttr("aria-label", label);
    ribbonIcon.setAttr("title", label);
  }
  getActiveCourseName() {
    var _a, _b;
    const activeFile = this.app.workspace.getActiveFile();
    return (_b = (_a = activeFile == null ? void 0 : activeFile.parent) == null ? void 0 : _a.path) != null ? _b : "";
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
  showProgress(label, percent) {
    const safePercent = clampInteger(percent, 0, 100);
    const message = `${label} (${safePercent}%)`;
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
  hideProgress() {
    var _a, _b;
    (_a = this.progressStatusEl) == null ? void 0 : _a.addClass("knowledge-progress-hidden");
    if (this.progressFillEl) {
      this.progressFillEl.setCssProps({
        "--knowledge-progress-width": "0%"
      });
    }
    (_b = this.progressNotice) == null ? void 0 : _b.hide();
    this.progressNotice = void 0;
  }
  finishProgress(label) {
    this.showProgress(label, 100);
    window.setTimeout(() => this.hideProgress(), 5e3);
  }
  async callLLM(prompt, model, systemPrompt) {
    let lastError;
    for (let attempt = 0; attempt <= MAX_API_RETRIES; attempt++) {
      try {
        return await callChatCompletion({
          apiKey: this.settings.apiKey,
          apiBaseUrl: this.settings.apiBaseUrl,
          model,
          userPrompt: prompt,
          systemPrompt,
          maxCompletionTokens: this.settings.maxCompletionTokens,
          temperature: this.settings.temperature,
          reasoningEffort: this.settings.reasoningEffort,
          verbosity: this.settings.verbosity
        });
      } catch (error) {
        lastError = error;
        const isLastAttempt = attempt === MAX_API_RETRIES;
        const status = error instanceof ApiError ? error.status : void 0;
        const retryable = status === void 0 || isRetryableStatus(status);
        if (isLastAttempt || !retryable) {
          throw error;
        }
        const delay = RETRY_BASE_DELAY_MS * (attempt + 1);
        this.showProgress(`Retrying API request ${attempt + 1}/${MAX_API_RETRIES}`, 10);
        await sleep(delay);
      }
    }
    throw lastError;
  }
  async fetchOutline(courseName) {
    try {
      const prompt = buildOutlinePrompt(courseName, this.settings.language);
      return await this.callLLM(prompt, this.settings.modelOutline);
    } catch (error) {
      console.error(`Error fetching outline for ${courseName}:`, error);
      throw error;
    }
  }
  async fetchChapterNote(courseName, chapterName, depth) {
    try {
      const density = applyMinimumChapterChars(
        DENSITY_PRESETS[depth],
        this.settings.minChapterChars
      );
      const plan = await this.planChapter(courseName, chapterName, depth);
      const adapter = selectAdapter(plan);
      const systemPrompt = buildInstructionalSystemPrompt();
      const prompt = buildChapterPrompt({
        courseName,
        chapterName,
        language: this.settings.language,
        depth,
        plan,
        adapter,
        density
      });
      let chapter = await this.callLLM(
        prompt,
        this.settings.modelChapter,
        systemPrompt
      );
      chapter = normalizeKnownMarkdownHeadings(
        chapter,
        this.settings.language
      );
      const qualityReport = evaluateChapterQuality(chapter, density, adapter);
      if (this.settings.autoExpandShortChapters && shouldRepairChapter(qualityReport)) {
        const repairPrompt = buildChapterRepairPrompt({
          courseName,
          chapterName,
          language: this.settings.language,
          density,
          plan,
          adapter,
          qualityReport,
          formattedQualityReport: formatQualityReport(qualityReport),
          existingChapter: chapter
        });
        chapter = await this.callLLM(
          repairPrompt,
          this.settings.modelChapter,
          systemPrompt
        );
        chapter = normalizeKnownMarkdownHeadings(
          chapter,
          this.settings.language
        );
      }
      return chapter;
    } catch (error) {
      console.error(`Error fetching chapter note for ${chapterName}:`, error);
      throw error;
    }
  }
  async planChapter(courseName, chapterName, depth) {
    const override = this.settings.knowledgeTypeOverride;
    if (!this.settings.autoDetectKnowledgeType || override !== "auto") {
      return buildManualPlan(override === "auto" ? "conceptual" : override, depth);
    }
    const prompt = buildPlanningPrompt(
      courseName,
      chapterName,
      this.settings.language,
      depth
    );
    const response = await this.callLLM(
      prompt,
      this.settings.modelChapter,
      "You classify learning chapters. Return strict JSON only."
    );
    return parsePlanningResponse(response, courseName, chapterName, depth);
  }
  async generateChapterContent(courseFolder, chapterInfo, courseName, sem, depth, onComplete) {
    const [chapterNum, title] = chapterInfo;
    return await sem.run(async () => {
      let result;
      try {
        const chapterContent = await this.fetchChapterNote(
          courseName,
          title,
          depth
        );
        const numStr = String(parseInt(chapterNum)).padStart(2, "0");
        const slug = slugifyTitle(title);
        const fileName = `${numStr}_${slug}.md`;
        const headerText = getHeaderText(this.settings.language);
        const header = `# ${title}

*${headerText.chapterNumber}: ${chapterNum}*

*${headerText.generated}*

---

`;
        const fullContent = header + chapterContent;
        const filePath = (0, import_obsidian4.normalizePath)(`${courseFolder.path}/${fileName}`);
        const existing = this.app.vault.getAbstractFileByPath(filePath);
        if (existing instanceof import_obsidian4.TFile) {
          await this.app.vault.modify(existing, fullContent);
        } else if (existing) {
          throw new Error(`Path "${filePath}" exists and is not a file`);
        } else {
          await this.app.vault.create(filePath, fullContent);
        }
        new import_obsidian4.Notice(`\u2713 ${fileName}`);
        result = {
          chapterNum,
          title,
          fileName,
          success: true
        };
      } catch (error) {
        const errorMsg = errorToMessage(error);
        new import_obsidian4.Notice(
          `\u2717 Error generating chapter ${chapterNum}: ${errorMsg}`,
          5e3
        );
        console.error(
          `Error generating chapter ${chapterNum} (${title}):`,
          error
        );
        result = {
          chapterNum,
          title,
          success: false,
          error: errorMsg
        };
      } finally {
        onComplete == null ? void 0 : onComplete(result);
      }
      return result;
    });
  }
  async writeFailureReport(courseFolder, courseName, depth, failedChapters) {
    if (failedChapters.length === 0) {
      return;
    }
    const content = [
      "---",
      `knowledgeDepth: ${depth}`,
      "---",
      "",
      `# ${courseName} Failed Chapters`,
      "",
      `Generated at: ${(/* @__PURE__ */ new Date()).toLocaleString()}`,
      "",
      "The plugin retried transient API failures before writing this report.",
      "You can run generation again later after lowering concurrency or switching to a more stable provider.",
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
    const content = [
      `# ${courseName} Failed Chapters`,
      "",
      `Resolved at: ${(/* @__PURE__ */ new Date()).toLocaleString()}`,
      "",
      "All previously failed chapters were generated successfully.",
      ""
    ].join("\n");
    if (existing instanceof import_obsidian4.TFile) {
      await this.app.vault.modify(existing, content);
    }
  }
  async resumeFailedChapters(courseName) {
    var _a;
    if (!this.settings.apiKey) {
      new import_obsidian4.Notice("\u274C API key not set! Please configure it in settings.");
      return;
    }
    const folderPath = (0, import_obsidian4.normalizePath)(courseName.trim());
    if (!folderPath) {
      new import_obsidian4.Notice("Please enter a subject folder name");
      return;
    }
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
    const chapters = parseFailedChapters(report);
    const depth = (_a = parseFailedChapterDepth(report)) != null ? _a : DEFAULT_SETTINGS.knowledgeDepth;
    if (chapters.length === 0) {
      new import_obsidian4.Notice("No failed chapters found to resume");
      this.finishProgress("No failed chapters found");
      return;
    }
    new import_obsidian4.Notice(`\u{1F501} Resuming ${chapters.length} failed chapters`);
    this.showProgress(`Resuming failed chapters: 0/${chapters.length}`, 5);
    try {
      const chapterSem = new Semaphore(this.settings.chapterConcurrency);
      let completedChapters = 0;
      let failedChapters = 0;
      const updateProgress = (result) => {
        completedChapters += 1;
        if (!result.success) {
          failedChapters += 1;
        }
        const percent = 5 + Math.round(completedChapters / chapters.length * 90);
        this.showProgress(
          `Resumed ${completedChapters}/${chapters.length}, ${failedChapters} failed`,
          percent
        );
      };
      const results = await Promise.all(
        chapters.map(
          (chapterInfo) => this.generateChapterContent(
            courseFolder,
            chapterInfo,
            courseFolder.path,
            chapterSem,
            depth,
            updateProgress
          )
        )
      );
      const failedResults = results.filter((result) => !result.success);
      const successCount = results.length - failedResults.length;
      if (failedResults.length > 0) {
        await this.writeFailureReport(
          courseFolder,
          courseFolder.path,
          depth,
          failedResults
        );
        new import_obsidian4.Notice(
          `\u26A0\uFE0F Resume finished: ${successCount}/${chapters.length} chapters generated. See Failed_Chapters.md`,
          1e4
        );
        this.finishProgress(
          `Resume finished: ${successCount}/${chapters.length} generated, ${failedResults.length} failed`
        );
      } else {
        await this.clearFailureReport(courseFolder, courseFolder.path);
        new import_obsidian4.Notice(`\u2705 Resume complete: ${chapters.length} chapters generated`);
        this.finishProgress(`Resume complete: ${chapters.length} chapters generated`);
      }
    } catch (error) {
      const errorMsg = errorToMessage(error);
      new import_obsidian4.Notice(`\u274C Resume failed: ${errorMsg}`, 7e3);
      this.finishProgress(`Resume failed: ${errorMsg}`);
      console.error("Resume generation error:", error);
    }
  }
  async generate(courseName, depth = DEFAULT_SETTINGS.knowledgeDepth) {
    if (!this.settings.apiKey) {
      new import_obsidian4.Notice("\u274C API key not set! Please configure it in settings.");
      return;
    }
    new import_obsidian4.Notice(`\u{1F4DA} Generating: ${courseName}`);
    this.showProgress(`Starting ${courseName}`, 1);
    try {
      this.showProgress(`Generating outline: ${courseName}`, 5);
      new import_obsidian4.Notice("\u23F3 Generating outline...");
      const outline = await this.fetchOutline(courseName);
      const folderPath = (0, import_obsidian4.normalizePath)(courseName);
      let courseFolder;
      const existing = this.app.vault.getAbstractFileByPath(folderPath);
      if (existing instanceof import_obsidian4.TFolder) {
        courseFolder = existing;
        new import_obsidian4.Notice(`\u{1F4C1} Using existing folder: ${courseName}`);
      } else if (existing) {
        const errorMsg = `Path "${folderPath}" exists as a file, not a folder. Please rename or delete it manually.`;
        new import_obsidian4.Notice(`\u274C ${errorMsg}`, 7e3);
        throw new Error(errorMsg);
      } else {
        try {
          courseFolder = await this.app.vault.createFolder(folderPath);
          new import_obsidian4.Notice(`\u{1F4C1} Created folder: ${courseName}`);
        } catch (error) {
          throw new Error(
            `Failed to create folder "${folderPath}": ${errorToMessage(error)}`
          );
        }
      }
      const headerText = getHeaderText(this.settings.language);
      const depthLabel = KNOWLEDGE_DEPTH_LABELS[depth];
      const outlineContent = `# ${courseName} ${headerText.outlineTitle}

*${headerText.generatedAt}: ${(/* @__PURE__ */ new Date()).toLocaleString()}*

*Chapter depth: ${depthLabel} (${depth})*

${outline}`;
      const outlineFilePath = (0, import_obsidian4.normalizePath)(`${courseFolder.path}/Outlines.md`);
      const existingOutline = this.app.vault.getAbstractFileByPath(outlineFilePath);
      if (existingOutline instanceof import_obsidian4.TFile) {
        await this.app.vault.modify(existingOutline, outlineContent);
      } else if (existingOutline) {
        throw new Error(`Path "${outlineFilePath}" exists and is not a file`);
      } else {
        await this.app.vault.create(outlineFilePath, outlineContent);
      }
      this.showProgress(`Outline saved: ${courseName}`, 15);
      new import_obsidian4.Notice("\u2713 Outlines.md created");
      const chapters = parseChapterTitles(outline);
      if (chapters.length === 0) {
        new import_obsidian4.Notice("\u26A0\uFE0F no chapters found in outline");
        this.finishProgress("No chapters found");
        return;
      }
      new import_obsidian4.Notice(`\u{1F4D6} Found ${chapters.length} chapters, generating content...`);
      this.showProgress(`0/${chapters.length} chapters generated`, 15);
      const chapterSem = new Semaphore(this.settings.chapterConcurrency);
      let completedChapters = 0;
      let failedChapters = 0;
      const updateChapterProgress = (result) => {
        completedChapters += 1;
        if (!result.success) {
          failedChapters += 1;
        }
        const percent = 15 + Math.round(completedChapters / chapters.length * 80);
        this.showProgress(
          `${completedChapters}/${chapters.length} chapters done, ${failedChapters} failed`,
          percent
        );
      };
      const tasks = chapters.map(
        (chapterInfo) => this.generateChapterContent(
          courseFolder,
          chapterInfo,
          courseName,
          chapterSem,
          depth,
          updateChapterProgress
        )
      );
      const results = await Promise.all(tasks);
      const failedResults = results.filter((result) => !result.success);
      await this.writeFailureReport(
        courseFolder,
        courseName,
        depth,
        failedResults
      );
      const successCount = results.length - failedResults.length;
      if (failedResults.length > 0) {
        new import_obsidian4.Notice(
          `\u26A0\uFE0F Done with failures: ${successCount}/${chapters.length} chapters generated. See Failed_Chapters.md`,
          1e4
        );
        this.finishProgress(
          `Done: ${successCount}/${chapters.length} chapters generated, ${failedResults.length} failed`
        );
      } else {
        await this.clearFailureReport(courseFolder, courseName);
        new import_obsidian4.Notice(
          `\u2705 Done! Generated ${chapters.length} chapters for ${courseName}`
        );
        this.finishProgress(`Done: ${chapters.length} chapters generated`);
      }
    } catch (error) {
      const errorMsg = errorToMessage(error);
      new import_obsidian4.Notice(`\u274C Error: ${errorMsg}`, 5e3);
      this.finishProgress(`Failed: ${errorMsg}`);
      console.error("Generation error:", error);
    }
  }
};

// main.ts
var main_default = KnowledgePlugin;

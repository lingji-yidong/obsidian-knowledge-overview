import type { KnowledgeDepth, KnowledgeType } from "./instructionalTypes";

export interface MySettings {
  apiKey: string;
  language: string;
  apiBaseUrl: string;
  modelOutline: string;
  modelChapter: string;
  maxCompletionTokens: number | null;
  concurrency: number;
  chapterConcurrency: number;
  knowledgeDepth: KnowledgeDepth;
  autoDetectKnowledgeType: boolean;
  knowledgeTypeOverride: KnowledgeType | "auto";
  minChapterChars: number;
  autoExpandShortChapters: boolean;
  temperature: number | null;
  reasoningEffort: "minimal" | "low" | "medium" | "high" | null;
  verbosity: "low" | "medium" | "high" | null;
}

export const DEFAULT_SETTINGS: MySettings = {
  apiKey: "",
  language: "en",
  apiBaseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
  modelOutline: "gemini-3.5-flash",
  modelChapter: "gemini-3.5-flash",
  maxCompletionTokens: 24000,
  concurrency: 1,
  chapterConcurrency: 1,
  knowledgeDepth: "onboarding",
  autoDetectKnowledgeType: true,
  knowledgeTypeOverride: "auto",
  minChapterChars: 9000,
  autoExpandShortChapters: true,
  temperature: 0.4,
  reasoningEffort: null,
  verbosity: null,
};

export const MIN_CONCURRENCY = 1;
export const MAX_COURSE_CONCURRENCY = 10;
export const MAX_CHAPTER_CONCURRENCY = 20;
export const MAX_API_RETRIES = 2;
export const RETRY_BASE_DELAY_MS = 1500;

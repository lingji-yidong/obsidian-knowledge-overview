import type { KnowledgeDepth, KnowledgeType } from "./instructionalTypes";
import type {
  ReasoningEffort,
  ThinkingMode,
  Verbosity,
} from "./chatCompletion";

export interface MySettings {
  apiKey: string;
  language: string;
  apiBaseUrl: string;
  modelOutline: string;
  modelChapter: string;
  maxCompletionTokens: number | null;
  chapterConcurrency: number;
  knowledgeDepth: KnowledgeDepth;
  autoDetectKnowledgeType: boolean;
  knowledgeTypeOverride: KnowledgeType | "auto";
  minChapterChars: number;
  temperature: number | null;
  reasoningEffort: ReasoningEffort | null;
  verbosity: Verbosity | null;
  thinkingMode: ThinkingMode;
}

export const DEFAULT_SETTINGS: MySettings = {
  apiKey: "",
  language: "en",
  apiBaseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
  modelOutline: "gemini-3.5-flash",
  modelChapter: "gemini-3.5-flash",
  maxCompletionTokens: 16000,
  chapterConcurrency: 1,
  knowledgeDepth: "onboarding",
  autoDetectKnowledgeType: true,
  knowledgeTypeOverride: "auto",
  minChapterChars: 8500,
  temperature: null,
  reasoningEffort: null,
  verbosity: null,
  thinkingMode: "auto",
};

export const MIN_CONCURRENCY = 1;
export const MAX_CHAPTER_CONCURRENCY = 20;

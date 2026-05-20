export interface MySettings {
  apiKey: string;
  language: string;
  apiBaseUrl: string;
  modelOutline: string;
  modelChapter: string;
  maxCompletionTokens: number | null;
  concurrency: number;
  chapterConcurrency: number;
}

export const DEFAULT_SETTINGS: MySettings = {
  apiKey: "",
  language: "en",
  apiBaseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
  modelOutline: "gemini-3.5-flash",
  modelChapter: "gemini-3.5-flash",
  maxCompletionTokens: null,
  concurrency: 1,
  chapterConcurrency: 1,
};

export const MIN_CONCURRENCY = 1;
export const MAX_COURSE_CONCURRENCY = 10;
export const MAX_CHAPTER_CONCURRENCY = 20;
export const MAX_API_RETRIES = 2;
export const RETRY_BASE_DELAY_MS = 1500;


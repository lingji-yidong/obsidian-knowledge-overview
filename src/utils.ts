export interface ChapterGenerationResult {
  chapterNum: string;
  title: string;
  fileName?: string;
  success: boolean;
  error?: string;
}

export function clampInteger(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.min(Math.max(Math.floor(value), min), max);
}

export function parseOptionalPositiveInteger(value: unknown): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return null;
  }

  return Math.floor(parsed);
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export function errorToMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function slugifyTitle(title: string): string {
  const safe = title.replace(/[^\p{L}\p{N}\s-]/gu, "").trim();
  return safe.replace(/\s+/g, "_") || "chapter";
}

export function parseChapterTitles(outline: string): Array<[string, string]> {
  const lines = outline.split("\n");
  const chapters: Array<[string, string]> = [];
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

export function parseFailedChapters(report: string): Array<[string, string]> {
  const chapters: Array<[string, string]> = [];
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

export class Semaphore {
  private permits: number;
  private queue: Array<() => void> = [];

  constructor(permits: number) {
    this.permits = permits;
  }

  async acquire(): Promise<void> {
    if (this.permits > 0) {
      this.permits--;
    } else {
      await new Promise<void>((resolve) => {
        this.queue.push(resolve);
      });
    }
  }

  release(): void {
    if (this.queue.length > 0) {
      const resolve = this.queue.shift();
      resolve?.();
    } else {
      this.permits++;
    }
  }

  async run<T>(fn: () => Promise<T>): Promise<T> {
    await this.acquire();
    try {
      return await fn();
    } finally {
      this.release();
    }
  }
}


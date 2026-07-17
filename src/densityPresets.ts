import type { DensitySpec, KnowledgeDepth } from "./instructionalTypes";

export interface CourseChapterRange {
  minimum: number;
  preferredMin: number;
  preferredMax: number;
}

export const MAX_COURSE_CHAPTERS = 20;

/**
 * Course breadth is independent from per-chapter density. Review modes shorten
 * exposition; they should not collapse a textbook-sized subject into a few
 * oversized chapters.
 */
export const COURSE_CHAPTER_RANGES: Record<
  KnowledgeDepth,
  CourseChapterRange
> = {
  scan: { minimum: 8, preferredMin: 8, preferredMax: 12 },
  onboarding: { minimum: 10, preferredMin: 10, preferredMax: 14 },
  learn: { minimum: 11, preferredMin: 11, preferredMax: 16 },
  review: { minimum: 10, preferredMin: 10, preferredMax: 14 },
};

export const KNOWLEDGE_DEPTH_LABELS: Record<KnowledgeDepth, string> = {
  scan: "Map only",
  onboarding: "Usable overview",
  learn: "Teach me properly",
  review: "Review mode",
};

export const DENSITY_PRESETS: Record<KnowledgeDepth, DensitySpec> = {
  scan: {
    label: "Map only",
    targetChars: { min: 7000, ideal: 8500, max: 10000 },
    coreUnits: { min: 4, max: 7 },
    workedExamples: 0,
    concreteExamples: 2,
    retrievalQuestions: 4,
    failureModes: 2,
  },

  onboarding: {
    label: "Usable overview",
    targetChars: { min: 8500, ideal: 10000, max: 12000 },
    coreUnits: { min: 5, max: 8 },
    workedExamples: 1,
    concreteExamples: 3,
    retrievalQuestions: 6,
    failureModes: 3,
  },

  learn: {
    label: "Teach me properly",
    targetChars: { min: 10000, ideal: 12000, max: 15000 },
    coreUnits: { min: 6, max: 9 },
    workedExamples: 2,
    concreteExamples: 4,
    retrievalQuestions: 8,
    failureModes: 4,
  },

  review: {
    label: "Review mode",
    targetChars: { min: 7000, ideal: 9000, max: 11000 },
    coreUnits: { min: 5, max: 9 },
    workedExamples: 0,
    concreteExamples: 3,
    retrievalQuestions: 8,
    failureModes: 3,
  },
};

export function applyMinimumChapterChars(
  density: DensitySpec,
  minChapterChars: number,
): DensitySpec {
  const min = Math.min(
    Math.max(density.targetChars.min, minChapterChars),
    density.targetChars.max,
  );
  const ideal = Math.max(density.targetChars.ideal, min);

  return {
    ...density,
    targetChars: { min, ideal, max: density.targetChars.max },
  };
}

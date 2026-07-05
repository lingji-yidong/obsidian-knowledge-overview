import type { DensitySpec, KnowledgeDepth } from "./instructionalTypes";

export const KNOWLEDGE_DEPTH_LABELS: Record<KnowledgeDepth, string> = {
  scan: "Map only",
  onboarding: "Usable overview",
  learn: "Teach me properly",
  review: "Review mode",
};

export const DENSITY_PRESETS: Record<KnowledgeDepth, DensitySpec> = {
  scan: {
    label: "Map only",
    targetChars: { min: 3000, ideal: 5000, max: 7000 },
    coreUnits: { min: 15, max: 30 },
    workedExamples: 0,
    concreteExamples: 2,
    retrievalQuestions: 3,
    failureModes: 2,
  },

  onboarding: {
    label: "Usable overview",
    targetChars: { min: 9000, ideal: 12000, max: 16000 },
    coreUnits: { min: 8, max: 15 },
    workedExamples: 1,
    concreteExamples: 4,
    retrievalQuestions: 8,
    failureModes: 5,
  },

  learn: {
    label: "Teach me properly",
    targetChars: { min: 16000, ideal: 22000, max: 30000 },
    coreUnits: { min: 5, max: 12 },
    workedExamples: 3,
    concreteExamples: 6,
    retrievalQuestions: 12,
    failureModes: 8,
  },

  review: {
    label: "Review mode",
    targetChars: { min: 4000, ideal: 7000, max: 10000 },
    coreUnits: { min: 20, max: 50 },
    workedExamples: 0,
    concreteExamples: 2,
    retrievalQuestions: 10,
    failureModes: 6,
  },
};

export function applyMinimumChapterChars(
  density: DensitySpec,
  minChapterChars: number,
): DensitySpec {
  const min = Math.max(density.targetChars.min, minChapterChars);
  const ideal = Math.max(density.targetChars.ideal, min);
  const max = Math.max(density.targetChars.max, ideal);

  return {
    ...density,
    targetChars: { min, ideal, max },
  };
}

import { getLanguageLabel } from "./i18n";
import {
  CONCEPTUAL_ADAPTER,
  getAdapterForKnowledgeType,
  mergeAdapters,
} from "./domainAdapters";
import type {
  ChapterGenerationPlan,
  CoreUnitType,
  DomainAdapter,
  KnowledgeDepth,
  KnowledgeType,
} from "./instructionalTypes";

const KNOWLEDGE_TYPES: KnowledgeType[] = [
  "conceptual",
  "mathematical",
  "procedural",
  "empirical",
  "craft",
  "historical",
  "hybrid",
];

const CORE_UNIT_TYPES: CoreUnitType[] = [
  "concept",
  "mechanism",
  "formula_or_model",
  "procedure",
  "skill",
  "technique",
  "case",
  "evaluation_method",
  "historical_transition",
];

const KNOWLEDGE_DEPTHS: KnowledgeDepth[] = [
  "scan",
  "onboarding",
  "learn",
  "review",
];

export function buildPlanningPrompt(
  courseName: string,
  chapterName: string,
  language: string,
  depth: KnowledgeDepth,
): string {
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

function parseJsonObject(text: string): unknown {
  const trimmed = text.trim();

  try {
    return JSON.parse(trimmed);
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error("Planning response did not contain a JSON object");
    }

    return JSON.parse(match[0]);
  }
}

function isKnowledgeType(value: unknown): value is KnowledgeType {
  return typeof value === "string" && KNOWLEDGE_TYPES.includes(value as KnowledgeType);
}

function isCoreUnitType(value: unknown): value is CoreUnitType {
  return typeof value === "string" && CORE_UNIT_TYPES.includes(value as CoreUnitType);
}

function isKnowledgeDepth(value: unknown): value is KnowledgeDepth {
  return typeof value === "string" && KNOWLEDGE_DEPTHS.includes(value as KnowledgeDepth);
}

function readStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

export function fallbackPlan(
  courseName: string,
  chapterName: string,
  depth: KnowledgeDepth = "onboarding",
): ChapterGenerationPlan {
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
      "may list terms without explaining relationships",
    ],
  };
}

function selectFallbackAdapter(topic: string): DomainAdapter {
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

export function parsePlanningResponse(
  text: string,
  courseName: string,
  chapterName: string,
  depth: KnowledgeDepth,
): ChapterGenerationPlan {
  try {
    const value = parseJsonObject(text);
    if (!value || typeof value !== "object") {
      return fallbackPlan(courseName, chapterName, depth);
    }

    const raw = value as Record<string, unknown>;
    const fallback = fallbackPlan(courseName, chapterName, depth);
    const primaryKnowledgeType = isKnowledgeType(raw.primaryKnowledgeType)
      ? raw.primaryKnowledgeType
      : fallback.primaryKnowledgeType;
    const secondaryKnowledgeTypes = readStringArray(
      raw.secondaryKnowledgeTypes,
    ).filter(
      (item): item is Exclude<KnowledgeType, "hybrid"> =>
        isKnowledgeType(item) && item !== "hybrid",
    );
    const coreUnitType = isCoreUnitType(raw.coreUnitType)
      ? raw.coreUnitType
      : getAdapterForKnowledgeType(primaryKnowledgeType).coreUnitType;
    const recommendedDepth = isKnowledgeDepth(raw.recommendedDepth)
      ? raw.recommendedDepth
      : depth;
    const elementInteractivity =
      raw.elementInteractivity === "low" ||
      raw.elementInteractivity === "medium" ||
      raw.elementInteractivity === "high"
        ? raw.elementInteractivity
        : "medium";

    return {
      primaryKnowledgeType,
      secondaryKnowledgeTypes,
      coreUnitType,
      elementInteractivity,
      recommendedDepth,
      requiredSections:
        readStringArray(raw.requiredSections).length > 0
          ? readStringArray(raw.requiredSections)
          : fallback.requiredSections,
      unitFields:
        readStringArray(raw.unitFields).length > 0
          ? readStringArray(raw.unitFields)
          : fallback.unitFields,
      mustIncludeExamples:
        readStringArray(raw.mustIncludeExamples).length > 0
          ? readStringArray(raw.mustIncludeExamples)
          : fallback.mustIncludeExamples,
      commonFailureModes:
        readStringArray(raw.commonFailureModes).length > 0
          ? readStringArray(raw.commonFailureModes)
          : fallback.commonFailureModes,
      densityRisks:
        readStringArray(raw.densityRisks).length > 0
          ? readStringArray(raw.densityRisks)
          : fallback.densityRisks,
    };
  } catch {
    return fallbackPlan(courseName, chapterName, depth);
  }
}

export function buildManualPlan(
  knowledgeType: KnowledgeType,
  depth: KnowledgeDepth,
): ChapterGenerationPlan {
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
    densityRisks: [],
  };
}

export function selectAdapter(plan: ChapterGenerationPlan): DomainAdapter {
  const primary =
    plan.primaryKnowledgeType === "hybrid"
      ? getAdapterForKnowledgeType("conceptual")
      : getAdapterForKnowledgeType(plan.primaryKnowledgeType);
  const secondary = plan.secondaryKnowledgeTypes
    .filter((type) => type !== primary.knowledgeType)
    .map((type) => getAdapterForKnowledgeType(type));

  if (plan.primaryKnowledgeType === "hybrid" || secondary.length > 0) {
    return mergeAdapters(primary, secondary);
  }

  return primary;
}


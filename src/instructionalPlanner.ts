import {
  CONCEPTUAL_ADAPTER,
  getAdapterForKnowledgeType,
  mergeAdapters,
} from "./domainAdapters";
import type {
  ChapterGenerationPlan,
  DomainAdapter,
  KnowledgeDepth,
  KnowledgeType,
} from "./instructionalTypes";

function selectFallbackAdapter(topic: string): DomainAdapter {
  if (
    /(musescore|git|obsidian|excel|blender|workflow|tool|操作|工作流)/i.test(
      topic,
    )
  ) {
    return getAdapterForKnowledgeType("procedural");
  }

  if (
    /(formula|equation|model|signal|control|aero|physics|greek|option|統計|公式|模型|空氣動力|电路|電路)/i.test(
      topic,
    )
  ) {
    return getAdapterForKnowledgeType("mathematical");
  }

  if (
    /(backtest|quant|experiment|metric|evaluation|ab testing|data|回測|量化|實驗|评估|評估)/i.test(
      topic,
    )
  ) {
    return getAdapterForKnowledgeType("empirical");
  }

  if (
    /(cooking|cuisine|coffee|photography|notation|orchestration|technique|本幫菜|烹飪|制譜|技法)/i.test(
      topic,
    )
  ) {
    return getAdapterForKnowledgeType("craft");
  }

  if (
    /(literature|poetry|novel|narrative|textual|close reading|文學|文学|詩|诗|小說|小说|敘事|叙事|文本)/i.test(
      topic,
    )
  ) {
    return getAdapterForKnowledgeType("interpretive");
  }

  if (
    /(philosophy|ethics|normative|argument|debate|哲學|哲学|倫理|伦理|論證|论证|規範|规范)/i.test(
      topic,
    )
  ) {
    return getAdapterForKnowledgeType("argumentative");
  }

  if (
    /(institution|policy|case study|sociology|political science|制度|政策|案例研究|社會學|社会学|政治學|政治学)/i.test(
      topic,
    )
  ) {
    return getAdapterForKnowledgeType("case_based");
  }

  if (
    /(history|historical|culture|evolution|origin|史|歷史|历史|文化|演化)/i.test(
      topic,
    )
  ) {
    return getAdapterForKnowledgeType("historical");
  }

  return CONCEPTUAL_ADAPTER;
}

export function fallbackPlan(
  courseName: string,
  chapterName: string,
  depth: KnowledgeDepth = "onboarding",
): ChapterGenerationPlan {
  const adapter = selectFallbackAdapter(
    `${courseName} ${chapterName}`.toLocaleLowerCase(),
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
    densityRisks: [],
  };
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

export function buildBlueprintPlan(
  primaryKnowledgeType: KnowledgeType,
  secondaryKnowledgeTypes: KnowledgeType[],
  depth: KnowledgeDepth,
): ChapterGenerationPlan {
  const primary = primaryKnowledgeType;
  const adapter = getAdapterForKnowledgeType(primary);

  return {
    primaryKnowledgeType: primary,
    secondaryKnowledgeTypes: secondaryKnowledgeTypes.filter(
      (type) => type !== primary && type !== "hybrid",
    ),
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
    .filter((type) => type !== "hybrid" && type !== primary.knowledgeType)
    .map((type) => getAdapterForKnowledgeType(type));

  return plan.primaryKnowledgeType === "hybrid" || secondary.length > 0
    ? mergeAdapters(primary, secondary)
    : primary;
}

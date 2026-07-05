export type KnowledgeDepth = "scan" | "onboarding" | "learn" | "review";

export type KnowledgeType =
  | "conceptual"
  | "mathematical"
  | "procedural"
  | "empirical"
  | "craft"
  | "historical"
  | "hybrid";

export type CoreUnitType =
  | "concept"
  | "mechanism"
  | "formula_or_model"
  | "procedure"
  | "skill"
  | "technique"
  | "case"
  | "evaluation_method"
  | "historical_transition";

export interface DensitySpec {
  label: string;
  targetChars: {
    min: number;
    ideal: number;
    max: number;
  };
  coreUnits: {
    min: number;
    max: number;
  };
  workedExamples: number;
  concreteExamples: number;
  retrievalQuestions: number;
  failureModes: number;
}

export interface DomainAdapter {
  knowledgeType: KnowledgeType;
  coreUnitType: CoreUnitType;
  requiredSections: string[];
  unitFields: string[];
  exampleRequirements: string[];
  failureModeName: string;
}

export interface ChapterGenerationPlan {
  primaryKnowledgeType: KnowledgeType;
  secondaryKnowledgeTypes: KnowledgeType[];
  coreUnitType: CoreUnitType;
  elementInteractivity: "low" | "medium" | "high";
  recommendedDepth: KnowledgeDepth;
  requiredSections: string[];
  unitFields: string[];
  mustIncludeExamples: string[];
  commonFailureModes: string[];
  densityRisks: string[];
}

export interface ChapterQualityReport {
  charCount: number;
  headingCount: number;
  exampleCount: number;
  failureModeCount: number;
  questionCount: number;
  formulaCount: number;
  bulletLines: number;
  paragraphBlocks: number;
  glossaryInflationRisk: boolean;
  likelyTooShort: boolean;
  likelyTooGlossaryLike: boolean;
  missingRequiredSections: string[];
}


export type KnowledgeDepth = "scan" | "onboarding" | "learn" | "review";

export type KnowledgeType =
  | "conceptual"
  | "mathematical"
  | "procedural"
  | "empirical"
  | "craft"
  | "historical"
  | "interpretive"
  | "argumentative"
  | "case_based"
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
  | "historical_transition"
  | "textual_evidence"
  | "argument"
  | "case_analysis";

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
  reliabilityRules: string[];
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

export interface ChapterSpec {
  chapterNumber: string;
  title: string;
  focus: string;
  subtopics: string[];
  learningObjectives: string[];
  prerequisites: string[];
  outOfScope: string[];
  knowledgeType: KnowledgeType;
  secondaryKnowledgeTypes: KnowledgeType[];
  canonicalTerms: string[];
}

export interface CourseBlueprint {
  schemaVersion: 1;
  courseName: string;
  courseGoal: string;
  prerequisites: string[];
  canonicalTerms: string[];
  chapters: ChapterSpec[];
}

export interface ChapterContext {
  blueprint: CourseBlueprint;
  chapter: ChapterSpec;
  previousChapter?: ChapterSpec;
  nextChapter?: ChapterSpec;
}

export interface ChapterQualityReport {
  charCount: number;
  headingCount: number;
  h2Count: number;
  exampleCount: number;
  failureModeCount: number;
  questionCount: number;
  qaAnchorCount: number;
  invalidQaAnchorCount: number;
  hasQaSectionBoundary: boolean;
  formulaCount: number;
  bulletLines: number;
  paragraphBlocks: number;
  glossaryInflationRisk: boolean;
  likelyTooShort: boolean;
  likelyTooLong: boolean;
  likelyTooGlossaryLike: boolean;
  insufficientQuestionCount: boolean;
  insufficientH2Count: boolean;
  excessiveHeadingCount: boolean;
  headingDepthJump: boolean;
  hasOverdeepHeading: boolean;
  unexpectedH1: boolean;
}

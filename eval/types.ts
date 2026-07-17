import type {
  ChapterQualityReport,
  ChapterSpec,
  CourseBlueprint,
  KnowledgeDepth,
} from "../src/instructionalTypes";
import type { GenerationProvenance } from "../src/generationProvenance";
import type {
  ReasoningEffort,
  ThinkingMode,
  Verbosity,
} from "../src/chatCompletion";

export interface EvaluationCase {
  id: string;
  discipline: "stem" | "humanities";
  description: string;
  language: string;
  depth: KnowledgeDepth;
  blueprint: CourseBlueprint;
  chapterNumber: string;
  lexicalExpectations: {
    mustCover: string[];
    outOfScope: string[];
  };
}

export interface EvaluationCorpus {
  schemaVersion: 1;
  suiteVersion: string;
  profiles: Record<string, string[]>;
  cases: EvaluationCase[];
}

export interface LocalChapterMetrics {
  schemaVersion: 1;
  caseId: string;
  quality: ChapterQualityReport;
  lengthGate: {
    targetMinimum: number;
    structuralFloor: number;
    meetsTarget: boolean;
    meetsStructuralFloor: boolean;
  };
  headings: {
    h2Titles: string[];
    h3Count: number;
    uniqueH2Ratio: number;
    genericH2Count: number;
    genericH2Ratio: number;
  };
  qa: {
    anchorCoverage: number;
  };
  format: {
    usesUnsupportedMathDelimiters: boolean;
  };
  lexicalScope: {
    coveredMustCoverTerms: string[];
    missingMustCoverTerms: string[];
    outOfScopeHits: string[];
  };
  warnings: string[];
  structuralPass: boolean;
}

export interface EvaluationConfig {
  apiBaseUrl: string;
  apiKey: string;
  model: string;
  profile: string;
  maxLogicalRequests: number;
  maxPhysicalRequests: number;
  maxCompletionTokens: number;
  maxTotalTokens: number;
  concurrency: number;
  requestTimeoutMs: number;
  temperature: number | null;
  reasoningEffort: ReasoningEffort | null;
  verbosity: Verbosity | null;
  thinkingMode: ThinkingMode;
  inputUsdPerMillion?: number;
  outputUsdPerMillion?: number;
  maxUsd?: number;
}

export interface EvaluationCaseResult {
  id: string;
  discipline: EvaluationCase["discipline"];
  description: string;
  status: "success" | "failed" | "skipped";
  chapter: ChapterSpec;
  outputFile?: string;
  metricsFile?: string;
  promptHash?: string;
  responseHash?: string;
  durationMs?: number;
  physicalAttempts: number;
  compatibilityFallbacks?: string[];
  provenance?: GenerationProvenance;
  error?: string;
}

export interface EvaluationRunManifest {
  schemaVersion: 1;
  runId: string;
  planId: string;
  suiteVersion: string;
  startedAt: string;
  completedAt?: string;
  provider: {
    host: string;
    requestedModel: string;
  };
  config: {
    profile: string;
    maxCompletionTokens: number;
    maxLogicalRequests: number;
    maxPhysicalRequests: number;
    maxTotalTokens: number;
    concurrency: number;
    temperature: number | null;
    reasoningEffort: ReasoningEffort | null;
    verbosity: Verbosity | null;
    thinkingMode: ThinkingMode;
  };
  usage: {
    logicalRequests: number;
    physicalRequests: number;
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
    estimatedUsd?: number;
    usageUnavailable: boolean;
  };
  cases: EvaluationCaseResult[];
}

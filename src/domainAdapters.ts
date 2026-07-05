import type {
  DomainAdapter,
  KnowledgeType,
} from "./instructionalTypes";

export const CONCEPTUAL_ADAPTER: DomainAdapter = {
  knowledgeType: "conceptual",
  coreUnitType: "concept",
  requiredSections: [
    "orientation",
    "prerequisite map",
    "core concept map",
    "concept explanations",
    "relationships and tradeoffs",
    "examples",
    "common misconceptions",
    "retrieval questions",
    "next steps",
  ],
  unitFields: [
    "definition and intuition",
    "why it exists",
    "problem it solves",
    "prerequisites",
    "concrete example",
    "relationship to neighboring concepts",
    "common misconception",
  ],
  exampleRequirements: [
    "include concrete examples for abstract concepts",
    "include at least one comparison between easily confused concepts",
  ],
  failureModeName: "misconceptions and conceptual traps",
};

export const MATHEMATICAL_ADAPTER: DomainAdapter = {
  knowledgeType: "mathematical",
  coreUnitType: "formula_or_model",
  requiredSections: [
    "orientation",
    "prerequisite map",
    "core quantities and models",
    "symbols, units, and dimensions",
    "formula intuition",
    "assumptions and regimes",
    "worked examples",
    "edge cases and limiting cases",
    "common mistakes",
    "retrieval questions",
    "next steps",
  ],
  unitFields: [
    "definition",
    "intuition",
    "symbols and units",
    "assumptions",
    "when the model applies",
    "simple numerical example",
    "what breaks when assumptions fail",
  ],
  exampleRequirements: [
    "define every symbol in important formulas",
    "explain units and dimensions",
    "include at least one numerical example",
    "include one limiting-case or edge-case explanation",
  ],
  failureModeName: "wrong assumptions, unit mistakes, and formula misuse",
};

export const PROCEDURAL_ADAPTER: DomainAdapter = {
  knowledgeType: "procedural",
  coreUnitType: "procedure",
  requiredSections: [
    "orientation",
    "minimal working workflow",
    "prerequisite tools and setup",
    "core tasks",
    "step-by-step workflows",
    "verification checklist",
    "common mistakes and troubleshooting",
    "practice tasks",
    "next steps",
  ],
  unitFields: [
    "goal",
    "when to use it",
    "steps",
    "menu path or shortcut if applicable",
    "expected result",
    "common mistakes",
    "how to verify the output",
  ],
  exampleRequirements: [
    "include at least one complete beginner workflow",
    "include realistic mistakes and fixes",
    "include verification steps after each major workflow",
  ],
  failureModeName: "common mistakes and troubleshooting",
};

export const EMPIRICAL_ADAPTER: DomainAdapter = {
  knowledgeType: "empirical",
  coreUnitType: "evaluation_method",
  requiredSections: [
    "orientation",
    "hypothesis",
    "data and assumptions",
    "evaluation pipeline",
    "metrics",
    "baseline comparison",
    "bias and leakage risks",
    "robustness checks",
    "failure modes",
    "practice tasks",
    "next steps",
  ],
  unitFields: [
    "what it measures",
    "why it matters",
    "assumptions",
    "how to compute or test it",
    "how it fails",
    "example",
    "diagnostic check",
  ],
  exampleRequirements: [
    "include a toy empirical or backtest example",
    "include at least one biased example and explain the flaw",
    "include what evidence would change the conclusion",
  ],
  failureModeName: "biases, leakage, false edge, and invalid inference",
};

export const CRAFT_ADAPTER: DomainAdapter = {
  knowledgeType: "craft",
  coreUnitType: "technique",
  requiredSections: [
    "orientation",
    "materials and tools",
    "style or quality standards",
    "core techniques",
    "process",
    "representative cases",
    "sensory or output standards",
    "common failures and fixes",
    "practice tasks",
    "next steps",
  ],
  unitFields: [
    "purpose",
    "materials or conditions",
    "steps",
    "sensory or quality standard",
    "common failure",
    "fix",
  ],
  exampleRequirements: [
    "include concrete finished-output standards",
    "include failure correction examples",
    "explain what good output looks, sounds, tastes, or feels like",
  ],
  failureModeName: "bad outputs and fixes",
};

export const HISTORICAL_ADAPTER: DomainAdapter = {
  knowledgeType: "historical",
  coreUnitType: "historical_transition",
  requiredSections: [
    "orientation",
    "timeline",
    "key actors, works, or institutions",
    "causal forces",
    "major transitions",
    "conflicts or debates",
    "representative cases",
    "legacy and modern relevance",
    "common misconceptions",
    "retrieval questions",
    "next steps",
  ],
  unitFields: [
    "period or transition",
    "what changed",
    "why it changed",
    "key actors or examples",
    "broader context",
    "modern relevance",
    "common misconception",
  ],
  exampleRequirements: [
    "avoid pure timeline listing",
    "explain causal forces behind transitions",
    "include representative cases",
  ],
  failureModeName: "oversimplified timelines and historical myths",
};

const ADAPTERS: Record<Exclude<KnowledgeType, "hybrid">, DomainAdapter> = {
  conceptual: CONCEPTUAL_ADAPTER,
  mathematical: MATHEMATICAL_ADAPTER,
  procedural: PROCEDURAL_ADAPTER,
  empirical: EMPIRICAL_ADAPTER,
  craft: CRAFT_ADAPTER,
  historical: HISTORICAL_ADAPTER,
};

function dedupe(values: string[]): string[] {
  return Array.from(new Set(values));
}

function collectSecondaryFields(
  secondary: DomainAdapter[],
  selector: (adapter: DomainAdapter) => string[],
): string[] {
  return secondary.reduce<string[]>((values, adapter) => {
    values.push(...selector(adapter));
    return values;
  }, []);
}

export function getAdapterForKnowledgeType(
  knowledgeType: KnowledgeType,
): DomainAdapter {
  if (knowledgeType === "hybrid") {
    return CONCEPTUAL_ADAPTER;
  }

  return ADAPTERS[knowledgeType];
}

export function mergeAdapters(
  primary: DomainAdapter,
  secondary: DomainAdapter[],
): DomainAdapter {
  return {
    knowledgeType: "hybrid",
    coreUnitType: primary.coreUnitType,
    requiredSections: dedupe([
      ...primary.requiredSections,
      ...collectSecondaryFields(secondary, (adapter) =>
        adapter.requiredSections.slice(0, 3),
      ),
    ]),
    unitFields: dedupe([
      ...primary.unitFields,
      ...collectSecondaryFields(secondary, (adapter) =>
        adapter.unitFields.slice(0, 3),
      ),
    ]),
    exampleRequirements: dedupe([
      ...primary.exampleRequirements,
      ...collectSecondaryFields(
        secondary,
        (adapter) => adapter.exampleRequirements,
      ),
    ]),
    failureModeName: primary.failureModeName,
  };
}

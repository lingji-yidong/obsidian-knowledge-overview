import type {
  DomainAdapter,
  KnowledgeType,
} from "./instructionalTypes";

export const CONCEPTUAL_ADAPTER: DomainAdapter = {
  knowledgeType: "conceptual",
  coreUnitType: "concept",
  requiredSections: [
    "a concise prerequisite bridge",
    "the core concepts and how they relate",
    "concrete examples and tradeoffs",
    "important misconceptions",
    "grounded review questions",
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
  reliabilityRules: [
    "distinguish definitions, examples, mechanisms, and consequences instead of treating them as interchangeable",
    "state whether a relationship is necessary, sufficient, typical, or merely associated when that distinction matters",
  ],
  failureModeName: "misconceptions and conceptual traps",
};

export const MATHEMATICAL_ADAPTER: DomainAdapter = {
  knowledgeType: "mathematical",
  coreUnitType: "formula_or_model",
  requiredSections: [
    "the problem and required quantities",
    "symbols, units, assumptions, and formula intuition",
    "worked numerical reasoning",
    "applicability and limiting cases",
    "common modeling mistakes",
    "grounded review questions",
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
  reliabilityRules: [
    "keep ideal mathematical guarantees separate from quantization, noise, jitter, numerical error, and other implementation limits",
    "state the assumptions, units, and specifications that justify any numerical design recommendation",
    "for every named law, approximation, equilibrium, stationary condition, or transformed measure, state its precise claim, validity domain, observability limits, and any extra assumptions required for stronger or across-step conclusions",
    "do not treat a stationary point as necessarily a minimum, a one-step equilibrium identity as across-step invariance, or a transformed pricing probability as a physical belief or an investor preference unless the chapter explicitly proves that interpretation",
  ],
  failureModeName: "wrong assumptions, unit mistakes, and formula misuse",
};

export const PROCEDURAL_ADAPTER: DomainAdapter = {
  knowledgeType: "procedural",
  coreUnitType: "procedure",
  requiredSections: [
    "the goal, setup, and expected result",
    "a minimal complete workflow",
    "verification after major steps",
    "realistic mistakes and troubleshooting",
    "practice tasks grounded in the workflow",
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
  reliabilityRules: [
    "do not invent a menu path, command, version-specific behavior, or successful result when the chapter context does not establish it",
    "separate required steps from optional alternatives and pair consequential actions with a concrete verification result",
  ],
  failureModeName: "common mistakes and troubleshooting",
};

export const EMPIRICAL_ADAPTER: DomainAdapter = {
  knowledgeType: "empirical",
  coreUnitType: "evaluation_method",
  requiredSections: [
    "the hypothesis, data, and assumptions",
    "the evaluation pipeline and metrics",
    "baseline comparison",
    "bias, leakage, and invalid inference",
    "robustness and evidence limits",
    "grounded practice questions",
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
  reliabilityRules: [
    "keep assignment failure, noncompliance, observed behavioral outcomes, missing outcomes or attrition, interference, post-treatment selection or adjustment, and prediction or target leakage conceptually distinct",
    "intention-to-treat preserves comparison by original assignment; it does not recover missing outcomes. Do not call an observed outcome such as churn or non-login missing unless its measurement is actually unavailable",
    "do not claim that post-hoc aggregation or exclusion restores the original randomization. When interference changes the required randomization unit, treat cluster assignment and its estimand as design-time choices",
    "separate legitimate treatment-responsive prediction features from future-information or target leakage and invalid causal adjustment. No single diagnostic result or invented threshold proves validity",
    "when randomized online experiments or A/A tests are in scope, name sample ratio mismatch (SRM) and separate its allocation-count check from outcome-metric calibration. Compare observed variant counts with the configured allocation using a prespecified conservative gate; assess false-positive behavior across repeated A/A runs or simulated null assignments rather than diagnosing the system from one p-value",
  ],
  failureModeName: "biases, leakage, false edge, and invalid inference",
};

export const CRAFT_ADAPTER: DomainAdapter = {
  knowledgeType: "craft",
  coreUnitType: "technique",
  requiredSections: [
    "materials, tools, and quality standards",
    "the core process and techniques",
    "representative finished-output examples",
    "failure diagnosis and correction",
    "grounded practice tasks",
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
  reliabilityRules: [
    "label subjective quality judgments and distinguish them from safety requirements or measurable tolerances",
    "state when material, tool, or environmental differences make a technique non-transferable",
  ],
  failureModeName: "bad outputs and fixes",
};

export const HISTORICAL_ADAPTER: DomainAdapter = {
  knowledgeType: "historical",
  coreUnitType: "historical_transition",
  requiredSections: [
    "a selective chronology serving the explanation",
    "actors, institutions, and causal forces",
    "major transitions and competing interpretations",
    "representative cases and evidence limits",
    "legacy without presentist oversimplification",
    "grounded review questions",
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
  reliabilityRules: [
    "when an exact date, quantity, officeholder, policy exception, or event sequence matters, include it only when confident; otherwise use a bounded qualifier rather than manufactured precision",
    "track actors, offices or institutions, policies, events, and chronology as separate facts; do not compress a succession or concession when the order changes the explanation",
    "separate documented policy and institutions from public perception or outcomes, and distinguish causal contribution from necessity or sufficiency",
    "present historiographical labels as contested analytical lenses rather than tidy camps or a forced final synthesis",
  ],
  failureModeName: "oversimplified timelines and historical myths",
};

export const INTERPRETIVE_ADAPTER: DomainAdapter = {
  knowledgeType: "interpretive",
  coreUnitType: "textual_evidence",
  requiredSections: [
    "text and context",
    "central interpretive questions",
    "close reading and evidence",
    "competing interpretations",
    "limits of the reading",
    "retrieval questions",
  ],
  unitFields: [
    "claim",
    "textual evidence",
    "context",
    "interpretation",
    "alternative reading",
    "limits",
  ],
  exampleRequirements: [
    "connect every major interpretation to concrete textual evidence",
    "compare at least two plausible readings where the material supports them",
    "distinguish what the text states from what the reader infers",
  ],
  reliabilityRules: [
    "apply the same interpretive criterion to competing readings and state what evidence would weaken the preferred reading",
    "do not call evidence independent when it reaches the reader through the same contested narrator, witness, editor, or source",
  ],
  failureModeName: "unsupported readings, anachronism, and context loss",
};

export const ARGUMENTATIVE_ADAPTER: DomainAdapter = {
  knowledgeType: "argumentative",
  coreUnitType: "argument",
  requiredSections: [
    "question and stakes",
    "key positions",
    "argument chains",
    "objections and replies",
    "evaluation standards",
    "retrieval questions",
  ],
  unitFields: [
    "claim",
    "premises",
    "inference",
    "support",
    "objection",
    "reply",
    "remaining uncertainty",
  ],
  exampleRequirements: [
    "reconstruct at least one argument premise by premise",
    "include a serious objection rather than a weak straw man",
    "separate descriptive claims from normative judgments",
  ],
  reliabilityRules: [
    "do not promote a premise, analogy, or value judgment into a demonstrated conclusion without naming the inference",
    "evaluate objections against the strongest defensible version of the position and preserve unresolved tradeoffs",
  ],
  failureModeName: "hidden premises, weak objections, and invalid inference",
};

export const CASE_BASED_ADAPTER: DomainAdapter = {
  knowledgeType: "case_based",
  coreUnitType: "case_analysis",
  requiredSections: [
    "analytical frame",
    "institutions and actors",
    "representative cases",
    "causal claims and alternatives",
    "evidence limits",
    "retrieval questions",
  ],
  unitFields: [
    "case context",
    "actors and institutions",
    "mechanism or claim",
    "evidence",
    "alternative explanation",
    "transfer limits",
  ],
  exampleRequirements: [
    "use cases to test concepts rather than decorate the chapter",
    "compare at least one alternative explanation",
    "state what cannot be generalized from the case",
  ],
  reliabilityRules: [
    "separate evidence within a case from the mechanism inferred from it and from claims transferred to other settings",
    "do not treat a selected success or failure case as representative without explaining the selection and comparison limits",
  ],
  failureModeName: "single-cause stories, selection bias, and overgeneralization",
};

const ADAPTERS: Record<Exclude<KnowledgeType, "hybrid">, DomainAdapter> = {
  conceptual: CONCEPTUAL_ADAPTER,
  mathematical: MATHEMATICAL_ADAPTER,
  procedural: PROCEDURAL_ADAPTER,
  empirical: EMPIRICAL_ADAPTER,
  craft: CRAFT_ADAPTER,
  historical: HISTORICAL_ADAPTER,
  interpretive: INTERPRETIVE_ADAPTER,
  argumentative: ARGUMENTATIVE_ADAPTER,
  case_based: CASE_BASED_ADAPTER,
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
    reliabilityRules: dedupe([
      ...primary.reliabilityRules,
      ...collectSecondaryFields(secondary, (adapter) =>
        adapter.reliabilityRules.slice(0, 2),
      ),
    ]),
    failureModeName: primary.failureModeName,
  };
}

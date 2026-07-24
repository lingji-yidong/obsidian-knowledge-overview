import assert from "node:assert/strict";
import test from "node:test";
import {
  COURSE_CHAPTER_RANGES,
  DENSITY_PRESETS,
  applyMinimumChapterChars,
} from "../src/densityPresets";
import {
  buildBlueprintPlan,
  selectAdapter,
} from "../src/instructionalPlanner";
import type { ChapterContext } from "../src/instructionalTypes";
import { buildChapterPrompt, buildOutlinePrompt } from "../src/prompts";

const CONTEXT: ChapterContext = {
  blueprint: {
    schemaVersion: 1,
    courseName: "Narrative theory",
    courseGoal: "Learn to analyze how narrative form shapes interpretation.",
    prerequisites: ["basic literary terminology"],
    canonicalTerms: ["focalization"],
    chapters: [],
  },
  chapter: {
    chapterNumber: "2",
    title: "Unreliable narrators and reader judgment",
    focus: "Use textual evidence to distinguish unreliability from limited knowledge.",
    subtopics: ["signals of unreliability", "competing readings"],
    learningObjectives: ["support an interpretation with textual evidence"],
    prerequisites: ["narrator and point of view"],
    outOfScope: ["film adaptation"],
    knowledgeType: "interpretive",
    secondaryKnowledgeTypes: ["argumentative"],
    canonicalTerms: ["unreliable narrator"],
  },
};

void test("outline prompt produces one bounded cross-domain blueprint", () => {
  const prompt = buildOutlinePrompt("Narrative theory", "en", "onboarding");
  assert.match(prompt, /Return strict JSON only/);
  assert.match(prompt, /Prefer 10-14 chapters/);
  assert.match(prompt, /Never return fewer than 10 usable chapters/);
  assert.match(prompt, /textbook-like subject coverage/);
  assert.match(prompt, /interpretive/);
  assert.match(prompt, /argumentative/);
  assert.match(prompt, /case_based/);
  assert.match(prompt, /Use standard English wording for every canonical term/);
});

void test("outline prompt preserves bilingual terminology in non-English blueprints", () => {
  const prompt = buildOutlinePrompt("敘事學", "zh_tw", "onboarding");

  assert.match(
    prompt,
    /Write every canonical term as "繁體中文 term \(English term\)"/,
  );
  assert.match(prompt, /standard subject-specific equivalent, not a transliteration/);
  assert.match(prompt, /do not defer terminology selection to chapter generation/);
});

void test("density presets stay near the chapter budget and keep a real upper bound", () => {
  assert.equal(DENSITY_PRESETS.onboarding.targetChars.ideal, 10000);
  for (const density of Object.values(DENSITY_PRESETS)) {
    assert.ok(density.targetChars.max <= 15000);
    assert.ok(density.coreUnits.max <= 9);
  }
  assert.deepEqual(COURSE_CHAPTER_RANGES.review, {
    minimum: 10,
    preferredMin: 10,
    preferredMax: 14,
  });

  const adjusted = applyMinimumChapterChars(DENSITY_PRESETS.scan, 50000);
  assert.equal(adjusted.targetChars.max, 10000);
  assert.equal(adjusted.targetChars.min, 10000);
});

void test("chapter prompt uses semantic headings and body-grounded QA", () => {
  const plan = buildBlueprintPlan(
    CONTEXT.chapter.knowledgeType,
    CONTEXT.chapter.secondaryKnowledgeTypes,
    "onboarding",
  );
  const prompt = buildChapterPrompt({
    context: CONTEXT,
    language: "en",
    depth: "onboarding",
    plan,
    adapter: selectAdapter(plan),
    density: DENSITY_PRESETS.onboarding,
  });

  assert.match(prompt, /Use 4-9 topic-specific teaching H2 headings/);
  assert.match(prompt, /the chapter must have 6-11 H2 headings in total/);
  assert.match(prompt, /at most one H3 under any teaching H2/);
  assert.match(prompt, /at most six H3 headings in the whole chapter/);
  assert.match(prompt, /Never use H4 or deeper headings/);
  assert.match(prompt, /worked-example steps, definitions, cases, and short contrasts/);
  assert.match(prompt, /normally stay below 40 bullet lines/);
  assert.match(prompt, /Treat this as planning guidance, not a quota/);
  assert.match(prompt, /Treat explicitly out-of-scope items as prohibited/);
  assert.match(prompt, /same contested narrator, witness, editor, or source/);
  assert.doesNotMatch(prompt, /intention-to-treat preserves comparison/);
  assert.doesNotMatch(prompt, /track actors, offices or institutions/);
  assert.match(prompt, /body contains no H1 or H4\/deeper headings, has 4-9 teaching H2 sections/);
  assert.match(prompt, /Inline formulas must use one dollar sign/);
  assert.match(prompt, /Never use `\\\(\.\.\.\\\)` or `\\\[\.\.\.\\\]`/);
  assert.match(prompt, /valid Mermaid syntax/);
  assert.match(prompt, /Mermaid is optional/);
  assert.doesNotMatch(prompt, /exact Markdown H2 heading contract/i);
  assert.match(prompt, /Every review question must be answerable from the chapter body/);
  assert.match(prompt, /<!-- source: Exact H2 Title -->/);
  assert.match(prompt, /## Review and interview questions <!-- qa-section -->/);
  assert.match(prompt, /## Key terminology <!-- terminology-section -->/);
  assert.match(prompt, /\| English term \| Concise meaning \|/);
  assert.match(prompt, /film adaptation/);
  assert.match(prompt, /textual evidence/);

  const traditionalChinesePrompt = buildChapterPrompt({
    context: CONTEXT,
    language: "zh_tw",
    depth: "onboarding",
    plan,
    adapter: selectAdapter(plan),
    density: DENSITY_PRESETS.onboarding,
  });
  assert.match(
    traditionalChinesePrompt,
    /## 複習與面試問題 <!-- qa-section -->/,
  );
  assert.match(
    traditionalChinesePrompt,
    /## 關鍵術語對照 <!-- terminology-section -->/,
  );
  assert.match(
    traditionalChinesePrompt,
    /繁體中文 term followed immediately by its standard English equivalent/,
  );
  assert.match(
    traditionalChinesePrompt,
    /\| 繁體中文 \| English \|/,
  );
  assert.match(
    traditionalChinesePrompt,
    /Do not reserve all English terminology for the final table/,
  );
  assert.match(
    traditionalChinesePrompt,
    /At least 5 distinct terms from the final terminology table/,
  );
  assert.match(
    traditionalChinesePrompt,
    /applies equally to STEM, humanities, history, literature, and social science/,
  );
  assert.match(
    traditionalChinesePrompt,
    /English equivalents only in the final table is invalid/,
  );
  assert.match(
    traditionalChinesePrompt,
    /terminology table must be the final content in the chapter/,
  );
});

void test("chapter prompt injects only the selected domain reliability rules", () => {
  const empiricalContext: ChapterContext = {
    ...CONTEXT,
    chapter: {
      ...CONTEXT.chapter,
      title: "Experiment validity",
      knowledgeType: "empirical",
      secondaryKnowledgeTypes: [],
    },
  };
  const empiricalPlan = buildBlueprintPlan("empirical", [], "onboarding");
  const empiricalPrompt = buildChapterPrompt({
    context: empiricalContext,
    language: "en",
    depth: "onboarding",
    plan: empiricalPlan,
    adapter: selectAdapter(empiricalPlan),
    density: DENSITY_PRESETS.onboarding,
  });

  assert.match(empiricalPrompt, /intention-to-treat preserves comparison/);
  assert.match(empiricalPrompt, /post-hoc aggregation or exclusion/);
  assert.match(empiricalPrompt, /sample ratio mismatch \(SRM\)/);
  assert.match(empiricalPrompt, /repeated A\/A runs or simulated null assignments/);
  assert.doesNotMatch(empiricalPrompt, /contested narrator, witness/);
  assert.doesNotMatch(empiricalPrompt, /historiographical labels/);
});

void test("mathematical reliability rules guard interpretation boundaries", () => {
  const mathematicalContext: ChapterContext = {
    ...CONTEXT,
    chapter: {
      ...CONTEXT.chapter,
      title: "A mathematical model",
      knowledgeType: "mathematical",
      secondaryKnowledgeTypes: [],
    },
  };
  const mathematicalPlan = buildBlueprintPlan("mathematical", [], "onboarding");
  const mathematicalPrompt = buildChapterPrompt({
    context: mathematicalContext,
    language: "en",
    depth: "onboarding",
    plan: mathematicalPlan,
    adapter: selectAdapter(mathematicalPlan),
    density: DENSITY_PRESETS.onboarding,
  });

  assert.match(mathematicalPrompt, /validity domain, observability limits/);
  assert.match(mathematicalPrompt, /stationary point as necessarily a minimum/);
  assert.match(mathematicalPrompt, /one-step equilibrium identity as across-step invariance/);
  assert.match(mathematicalPrompt, /transformed pricing probability as a physical belief/);
});

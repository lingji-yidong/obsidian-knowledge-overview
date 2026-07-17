import assert from "node:assert/strict";
import test from "node:test";
import {
  MAX_BLUEPRINT_CHAPTERS,
  MAX_BLUEPRINT_COMPLETION_TOKENS,
  parseBlueprintComment,
  parseCourseBlueprint,
  renderCourseOutline,
  resolveBlueprintMaxCompletionTokens,
  serializeBlueprintComment,
} from "../src/courseBlueprint";

void test("blueprint output budget uses a larger bounded cap", () => {
  assert.equal(
    resolveBlueprintMaxCompletionTokens(null),
    MAX_BLUEPRINT_COMPLETION_TOKENS,
  );
  assert.equal(resolveBlueprintMaxCompletionTokens(16000), 16000);
  assert.equal(resolveBlueprintMaxCompletionTokens(24000), 16000);
  assert.equal(resolveBlueprintMaxCompletionTokens(4000), 4000);
});

void test("parses structured course blueprint and preserves chapter context", () => {
  const blueprint = parseCourseBlueprint(
    JSON.stringify({
      schemaVersion: 1,
      courseName: "訊號處理",
      courseGoal: "建立取樣與頻域分析的實用理解",
      prerequisites: ["基礎代數"],
      canonicalTerms: ["取樣率 (sampling rate)"],
      chapters: [
        {
          chapterNumber: "7",
          title: "取樣如何限制可見頻率",
          focus: "從時間取樣理解混疊",
          subtopics: ["離散取樣", "奈奎斯特條件"],
          learningObjectives: ["辨識混疊"],
          prerequisites: ["正弦波"],
          outOfScope: ["濾波器設計"],
          knowledgeType: "mathematical",
          secondaryKnowledgeTypes: ["conceptual"],
          canonicalTerms: ["混疊 (aliasing)"],
        },
        {
          chapterNumber: "8",
          title: "頻譜是怎樣形成的",
          focus: "連接時域訊號與頻域表示",
          knowledgeType: "conceptual",
        },
      ],
    }),
    "訊號處理",
    "onboarding",
  );

  assert.equal(blueprint.chapters.length, 2);
  assert.equal(blueprint.chapters[0].chapterNumber, "1");
  assert.deepEqual(blueprint.chapters[0].outOfScope, ["濾波器設計"]);
  assert.equal(blueprint.chapters[0].knowledgeType, "mathematical");
  assert.match(renderCourseOutline(blueprint), /1\. 取樣如何限制可見頻率/);

  const recovered = parseBlueprintComment(serializeBlueprintComment(blueprint));
  assert.deepEqual(recovered, blueprint);
});

void test("falls back to numbered Markdown without adding a planning request", () => {
  const blueprint = parseCourseBlueprint(
    "1. Foundations\n   - Basic ideas\n\n2. Applications\n   - Cases",
    "Fallback course",
    "review",
  );

  assert.deepEqual(
    blueprint.chapters.map((chapter) => chapter.title),
    ["Foundations", "Applications"],
  );
});

void test("deduplicates chapters and enforces the hard chapter cap", () => {
  const chapters = Array.from({ length: MAX_BLUEPRINT_CHAPTERS + 5 }, (_, index) => ({
    title: `Chapter ${index + 1}`,
    focus: `Focus ${index + 1}`,
    knowledgeType: "conceptual",
  }));
  chapters.splice(1, 0, { ...chapters[0] });

  const blueprint = parseCourseBlueprint(
    JSON.stringify({ chapters }),
    "Large course",
    "onboarding",
  );

  assert.equal(blueprint.chapters.length, MAX_BLUEPRINT_CHAPTERS);
  assert.equal(new Set(blueprint.chapters.map((chapter) => chapter.title)).size, 20);
});

void test("production parsing rejects an undersized overview before chapter calls", () => {
  assert.throws(
    () =>
      parseCourseBlueprint(
        JSON.stringify({
          chapters: Array.from({ length: 7 }, (_, index) => ({
            title: `Chapter ${index + 1}`,
            knowledgeType: "conceptual",
          })),
        }),
        "Small course",
        "review",
        { enforceMinimumChapters: true },
      ),
    /returned 7 usable chapters; review requires at least 10/,
  );
});

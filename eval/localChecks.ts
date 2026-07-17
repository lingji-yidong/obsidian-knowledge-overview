import {
  evaluateChapterQuality,
  getChapterQualityWarnings,
  stripFencedCodeBlocks,
} from "../src/chapterQuality";
import { stripChapterSectionNumber } from "../src/chapter-numbering";
import { normalizeObsidianMathDelimiters } from "../src/chapter-markdown";
import { DENSITY_PRESETS } from "../src/densityPresets";
import type { EvaluationCase, LocalChapterMetrics } from "./types";

export const STRUCTURAL_LENGTH_FLOOR_RATIO = 0.8;

const GENERIC_H2_TITLES = new Set(
  [
    "introduction",
    "overview",
    "background",
    "core concepts",
    "basic concepts",
    "important principles",
    "examples",
    "applications",
    "common mistakes",
    "summary",
    "review questions",
    "interview questions",
    "導論",
    "概述",
    "背景",
    "基本概念",
    "核心概念",
    "重要原理",
    "例子",
    "案例",
    "實際應用",
    "常見錯誤",
    "常見誤區",
    "總結",
    "複習問題",
    "面試問題",
    "自我檢查",
    "导论",
    "概述",
    "背景",
    "基本概念",
    "核心概念",
    "重要原理",
    "例子",
    "案例",
    "实际应用",
    "常见错误",
    "常见误区",
    "总结",
    "复习问题",
    "面试问题",
    "自我检查",
  ].map((title) => title.toLocaleLowerCase()),
);

interface H2Entry {
  title: string;
  isQaSection: boolean;
}

function collectH2Entries(content: string): H2Entry[] {
  return Array.from(content.matchAll(/^##\s+(.+?)\s*$/gm)).map((match) => ({
    title: match[1].replace(/<!--[^>]*-->/g, "").trim(),
    isQaSection: /<!--\s*qa-section\s*-->/i.test(match[1]),
  }));
}

function includesCaseInsensitive(content: string, term: string): boolean {
  const normalize = (value: string): string =>
    value.toLocaleLowerCase().replace(/[\s/／-]+/g, "");
  return normalize(content).includes(normalize(term));
}

/**
 * Calculate zero-API structural checks. Lexical scope checks are warnings only;
 * semantic scope fidelity and QA answerability belong to the Codex review.
 */
export function evaluateLocalChapter(
  evaluationCase: EvaluationCase,
  content: string,
): LocalChapterMetrics {
  const density = DENSITY_PRESETS[evaluationCase.depth];
  const quality = evaluateChapterQuality(content, density);
  const structuralLengthFloor = Math.floor(
    density.targetChars.min * STRUCTURAL_LENGTH_FLOOR_RATIO,
  );
  const meetsStructuralLengthFloor =
    quality.charCount >= structuralLengthFloor;
  const structureContent = stripFencedCodeBlocks(content);
  const h2Entries = collectH2Entries(structureContent);
  const h2Titles = h2Entries.map(({ title }) => title);
  const normalizedH2 = h2Entries
    .filter(({ isQaSection }) => !isQaSection)
    .map(({ title }) =>
      stripChapterSectionNumber(title).toLocaleLowerCase(),
    );
  const uniqueH2Ratio =
    normalizedH2.length === 0
      ? 0
      : new Set(normalizedH2).size / normalizedH2.length;
  const genericH2Count = normalizedH2.filter((title) =>
    GENERIC_H2_TITLES.has(title),
  ).length;
  const genericH2Ratio =
    normalizedH2.length === 0 ? 0 : genericH2Count / normalizedH2.length;
  const coveredMustCoverTerms = evaluationCase.lexicalExpectations.mustCover.filter(
    (term) => includesCaseInsensitive(content, term),
  );
  const missingMustCoverTerms =
    evaluationCase.lexicalExpectations.mustCover.filter(
      (term) => !includesCaseInsensitive(content, term),
    );
  const outOfScopeHits = evaluationCase.lexicalExpectations.outOfScope.filter(
    (term) => includesCaseInsensitive(content, term),
  );
  const qaAnchorCoverage =
    quality.questionCount === 0
      ? 0
      : Math.min(1, quality.qaAnchorCount / quality.questionCount);
  const usesUnsupportedMathDelimiters =
    normalizeObsidianMathDelimiters(content) !== content;
  const warnings = getChapterQualityWarnings(quality);

  if (genericH2Ratio > 0.35) {
    warnings.push("too many generic H2 headings");
  }
  if (uniqueH2Ratio < 1) {
    warnings.push("duplicate H2 headings");
  }
  if (missingMustCoverTerms.length > 0) {
    warnings.push(
      `lexical coverage needs agent review: ${missingMustCoverTerms.join(", ")}`,
    );
  }
  if (outOfScopeHits.length > 0) {
    warnings.push(
      `possible out-of-scope content needs agent review: ${outOfScopeHits.join(", ")}`,
    );
  }
  if (!meetsStructuralLengthFloor) {
    warnings.push("far below the structural length floor");
  }
  if (usesUnsupportedMathDelimiters) {
    warnings.push("uses math delimiters that Obsidian does not render");
  }

  const structuralPass = !(
    !meetsStructuralLengthFloor ||
    quality.likelyTooLong ||
    quality.insufficientQuestionCount ||
    quality.insufficientH2Count ||
    quality.excessiveHeadingCount ||
    quality.headingDepthJump ||
    quality.hasOverdeepHeading ||
    quality.unexpectedH1 ||
    !quality.hasQaSectionBoundary ||
    quality.questionCount !== quality.qaAnchorCount ||
    quality.invalidQaAnchorCount > 0 ||
    genericH2Ratio > 0.35 ||
    uniqueH2Ratio < 1 ||
    usesUnsupportedMathDelimiters
  );

  return {
    schemaVersion: 1,
    caseId: evaluationCase.id,
    quality,
    lengthGate: {
      targetMinimum: density.targetChars.min,
      structuralFloor: structuralLengthFloor,
      meetsTarget: !quality.likelyTooShort,
      meetsStructuralFloor: meetsStructuralLengthFloor,
    },
    headings: {
      h2Titles,
      h3Count: (structureContent.match(/^###\s+/gm) ?? []).length,
      uniqueH2Ratio,
      genericH2Count,
      genericH2Ratio,
    },
    qa: { anchorCoverage: qaAnchorCoverage },
    format: { usesUnsupportedMathDelimiters },
    lexicalScope: {
      coveredMustCoverTerms,
      missingMustCoverTerms,
      outOfScopeHits,
    },
    warnings,
    structuralPass,
  };
}

/** Find literal H2 skeletons repeated across multiple generated cases. */
export function findRepeatedHeadingSkeletons(
  metrics: LocalChapterMetrics[],
): Array<{ heading: string; caseCount: number }> {
  const headingCases = new Map<string, Set<string>>();

  for (const metric of metrics) {
    const headings = metric.quality.hasQaSectionBoundary
      ? metric.headings.h2Titles.slice(0, -1)
      : metric.headings.h2Titles;
    for (const heading of headings) {
      const normalized = heading.trim().toLocaleLowerCase();
      const caseIds = headingCases.get(normalized) ?? new Set<string>();
      caseIds.add(metric.caseId);
      headingCases.set(normalized, caseIds);
    }
  }

  return Array.from(headingCases.entries())
    .filter(([, caseIds]) => caseIds.size > 1)
    .map(([heading, caseIds]) => ({ heading, caseCount: caseIds.size }))
    .sort((left, right) => right.caseCount - left.caseCount);
}
